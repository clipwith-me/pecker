import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;  // 50MB

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/3gpp"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const incidentId = formData.get("incidentId") as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { success: false, error: "File type not allowed. Images: JPEG/PNG/WebP/GIF. Videos: MP4/WebM/MOV." },
        { status: 400 }
      );
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File too large. Max ${isVideo ? "50MB for video" : "5MB for images"}.` },
        { status: 400 }
      );
    }

    const mediaType = isVideo ? "video" : "image";
    const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    let url: string;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`incidents/${mediaType}s/${filename}`, file, {
        access: "public",
        contentType: file.type,
      });
      url = blob.url;
    } else {
      const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
      }
      const filepath = path.join(UPLOAD_DIR, filename);
      const bytes = await file.arrayBuffer();
      await writeFile(filepath, Buffer.from(bytes));
      url = `/uploads/${filename}`;
    }

    if (incidentId) {
      const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
      if (incident) {
        await prisma.incidentImage.create({
          data: { incidentId, url, filename, size: file.size, mediaType },
        });
      }
    }

    return NextResponse.json({ success: true, data: { url, filename, size: file.size, mediaType } });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
