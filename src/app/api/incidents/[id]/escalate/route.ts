import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role === "RESIDENT") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const incident = await prisma.incident.findUnique({ where: { id } });
  if (!incident) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  if (["RESOLVED", "CLOSED", "REJECTED"].includes(incident.status)) {
    return NextResponse.json(
      { success: false, error: "Cannot escalate a resolved/closed incident" },
      { status: 422 }
    );
  }

  // Bump severity to CRITICAL if not already
  const newSeverity = "CRITICAL";
  const note = body.note || `Escalated by ${session.user.name} — requires immediate attention`;

  await prisma.incident.update({
    where: { id },
    data: {
      severity: newSeverity,
      events: {
        create: {
          action: "ESCALATED",
          actorId: session.user.id,
          note,
          fromStatus: incident.status,
          toStatus: incident.status,
        },
      },
    },
  });

  // Notify all admins
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "RESPONDER"] } },
    select: { id: true },
  });

  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      incidentId: id,
      type: "INCIDENT_ESCALATED",
      message: `⚠️ Incident escalated: ${incident.title}`,
    })),
  });

  // Notify reporter
  await prisma.notification.create({
    data: {
      userId: incident.reportedById,
      incidentId: id,
      type: "INCIDENT_ESCALATED",
      message: `Your incident has been escalated and marked Critical: ${incident.title}`,
    },
  });

  return NextResponse.json({ success: true, message: "Incident escalated to CRITICAL" });
}
