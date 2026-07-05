import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addNoteSchema } from "@/lib/validations";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = addNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const incident = await prisma.incident.findUnique({ where: { id } });
  if (!incident) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  if (session.user.role === "RESIDENT" && incident.reportedById !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const event = await prisma.incidentEvent.create({
    data: {
      incidentId: id,
      actorId: session.user.id,
      action: "NOTE_ADDED",
      note: parsed.data.note,
    },
    select: {
      id: true,
      action: true,
      note: true,
      createdAt: true,
      actor: { select: { id: true, name: true, role: true } },
    },
  });

  return NextResponse.json({ success: true, data: event }, { status: 201 });
}
