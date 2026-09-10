import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const FLAG_DISPUTE_THRESHOLD = 3;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const incident = await prisma.incident.findUnique({ where: { id }, select: { id: true, reportedById: true, flagged: true } });
  if (!incident) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  // Reporter cannot vote on their own incident
  if (incident.reportedById === session.user.id) {
    return NextResponse.json({ success: false, error: "You cannot verify your own report" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const type: "CONFIRM" | "DISPUTE" = body.type === "DISPUTE" ? "DISPUTE" : "CONFIRM";

  const existing = await prisma.incidentVote.findUnique({
    where: { incidentId_userId: { incidentId: id, userId: session.user.id } },
  });

  if (existing) {
    if (existing.type === type) {
      // Same type — toggle off (remove)
      await prisma.incidentVote.delete({ where: { id: existing.id } });
    } else {
      // Different type — switch
      await prisma.incidentVote.update({ where: { id: existing.id }, data: { type } });
    }
  } else {
    await prisma.incidentVote.create({ data: { incidentId: id, userId: session.user.id, type } });
  }

  const [confirms, disputes] = await Promise.all([
    prisma.incidentVote.count({ where: { incidentId: id, type: "CONFIRM" } }),
    prisma.incidentVote.count({ where: { incidentId: id, type: "DISPUTE" } }),
  ]);

  // Auto-flag when disputes >= threshold and confirms === 0
  if (disputes >= FLAG_DISPUTE_THRESHOLD && confirms === 0 && !incident.flagged) {
    await prisma.incident.update({ where: { id }, data: { flagged: true } });

    // Notify all admins
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          incidentId: id,
          type: "INCIDENT_FLAGGED",
          message: `Incident INC-${id.slice(-6).toUpperCase()} has been flagged as a potential false report (${disputes} disputes, 0 confirmations).`,
        })),
      });
    }
  }

  // Unflag if confirms rebound past disputes
  if (confirms > disputes && incident.flagged) {
    await prisma.incident.update({ where: { id }, data: { flagged: false } });
  }

  return NextResponse.json({ success: true, data: { confirms, disputes, userVote: existing?.type === type ? null : type } });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [confirms, disputes, userVote] = await Promise.all([
    prisma.incidentVote.count({ where: { incidentId: id, type: "CONFIRM" } }),
    prisma.incidentVote.count({ where: { incidentId: id, type: "DISPUTE" } }),
    prisma.incidentVote.findUnique({
      where: { incidentId_userId: { incidentId: id, userId: session.user.id } },
      select: { type: true },
    }),
  ]);

  return NextResponse.json({ success: true, data: { confirms, disputes, userVote: userVote?.type ?? null } });
}
