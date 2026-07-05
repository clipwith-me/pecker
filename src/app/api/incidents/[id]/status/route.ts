import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateIncidentStatusSchema } from "@/lib/validations";
import { VALID_STATUS_TRANSITIONS } from "@/lib/types";
import type { IncidentStatus } from "@/lib/types";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role === "RESIDENT") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateIncidentStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const incident = await prisma.incident.findUnique({ where: { id } });
  if (!incident) {
    return NextResponse.json({ success: false, error: "Incident not found" }, { status: 404 });
  }

  const currentStatus = incident.status as IncidentStatus;
  const newStatus = parsed.data.status as IncidentStatus;
  const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];

  if (!validTransitions.includes(newStatus)) {
    return NextResponse.json(
      { success: false, error: `Cannot transition from ${currentStatus} to ${newStatus}` },
      { status: 422 }
    );
  }

  const updates: Record<string, unknown> = { status: newStatus };
  if (newStatus === "RESOLVED") updates.resolvedAt = new Date();
  if (newStatus === "CLOSED") updates.closedAt = new Date();

  const updated = await prisma.incident.update({
    where: { id },
    data: {
      ...updates,
      events: {
        create: {
          action: "STATUS_CHANGED",
          actorId: session.user.id,
          fromStatus: currentStatus,
          toStatus: newStatus,
          note: parsed.data.note,
        },
      },
    },
    select: { id: true, status: true, resolvedAt: true },
  });

  await prisma.notification.create({
    data: {
      userId: incident.reportedById,
      incidentId: id,
      type: "STATUS_CHANGED",
      message: `Your incident status has been updated to ${newStatus.replace(/_/g, " ")}`,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
