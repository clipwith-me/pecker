import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assignIncidentSchema } from "@/lib/validations";

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
  const parsed = assignIncidentSchema.safeParse(body);

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

  const updated = await prisma.incident.update({
    where: { id },
    data: {
      assignedToId: parsed.data.assignedToId,
      events: {
        create: {
          action: "ASSIGNED",
          actorId: session.user.id,
          note: parsed.data.note || `Assigned to team member`,
        },
      },
    },
    select: { id: true, assignedToId: true },
  });

  if (parsed.data.assignedToId) {
    await prisma.notification.create({
      data: {
        userId: parsed.data.assignedToId,
        incidentId: id,
        type: "INCIDENT_ASSIGNED",
        message: `You have been assigned to incident: ${incident.title}`,
      },
    });
  }

  return NextResponse.json({ success: true, data: updated });
}
