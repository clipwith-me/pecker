import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const VALID_CATEGORIES = [
  "BROKEN_STREETLIGHT",
  "FLOODING",
  "GARBAGE_OVERFLOW",
  "DRAINAGE_ISSUE",
  "ROAD_DAMAGE",
  "SAFETY_SECURITY",
  "VANDALISM",
  "OTHER",
];

const VALID_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

interface BotIncident {
  title: string;
  description?: string;
  category: string;
  severity: string;
  locationText?: string;
}

export async function POST(req: Request) {
  // Verify bot secret
  const auth = req.headers.get("authorization") ?? "";
  const secret = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const storedSecret = (process.env.BOT_SECRET ?? "").trim();
  if (!secret || !storedSecret || secret !== storedSecret) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { incidents?: BotIncident[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const incidents: BotIncident[] = body.incidents ?? [];
  if (!Array.isArray(incidents) || incidents.length === 0) {
    return NextResponse.json({ success: false, error: "No incidents provided" }, { status: 400 });
  }

  // Get or create the bot user
  const botUser = await getOrCreateBotUser();

  const results: { title: string; id: string; status: "created" | "skipped" | "error"; reason?: string }[] = [];

  for (const inc of incidents) {
    // Basic validation
    if (!inc.title?.trim()) {
      results.push({ title: inc.title ?? "(no title)", id: "", status: "error", reason: "Missing title" });
      continue;
    }
    if (!VALID_CATEGORIES.includes(inc.category)) {
      results.push({ title: inc.title, id: "", status: "error", reason: `Invalid category: ${inc.category}` });
      continue;
    }
    if (!VALID_SEVERITIES.includes(inc.severity)) {
      results.push({ title: inc.title, id: "", status: "error", reason: `Invalid severity: ${inc.severity}` });
      continue;
    }

    // Duplicate check — skip if same title posted in last 48h
    const existing = await prisma.incident.findFirst({
      where: {
        title: { equals: inc.title.trim(), mode: "insensitive" },
        reportedById: botUser.id,
        createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      },
      select: { id: true },
    });

    if (existing) {
      results.push({ title: inc.title, id: existing.id, status: "skipped", reason: "Duplicate (posted in last 48h)" });
      continue;
    }

    try {
      const created = await prisma.incident.create({
        data: {
          title: inc.title.trim().slice(0, 120),
          description: inc.description?.trim() ?? null,
          category: inc.category,
          severity: inc.severity,
          status: "NEW",
          locationText: inc.locationText?.trim() ?? null,
          isAnonymous: true,
          guestName: "Pecker News Bot",
          reportedById: botUser.id,
          events: {
            create: {
              action: "CREATED",
              actorId: botUser.id,
              toStatus: "NEW",
            },
          },
        },
        select: { id: true },
      });

      // Notify admins
      const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "RESPONDER"] } },
        select: { id: true },
      });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            incidentId: created.id,
            type: "STATUS_CHANGED",
            message: `New incident reported by Pecker News Bot: ${inc.title}`,
          })),
        });
      }

      results.push({ title: inc.title, id: created.id, status: "created" });
    } catch (e) {
      results.push({ title: inc.title, id: "", status: "error", reason: String(e) });
    }
  }

  const created = results.filter((r) => r.status === "created").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    success: true,
    summary: { received: incidents.length, created, skipped, errors },
    results,
  });
}

async function getOrCreateBotUser() {
  const botEmail = "newsbot@pecker.system";
  const existing = await prisma.user.findUnique({ where: { email: botEmail } });
  if (existing) return existing;
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
  return prisma.user.create({
    data: {
      email: botEmail,
      name: "Pecker News Bot",
      passwordHash: hash,
      role: "RESPONDER",
    },
  });
}
