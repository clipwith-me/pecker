import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { editIncidentSchema } from "@/lib/validations";

const FULL_INCIDENT_SELECT = {
  id: true,
  title: true,
  description: true,
  category: true,
  severity: true,
  status: true,
  locationText: true,
  locationLat: true,
  locationLng: true,
  flagged: true,
  isAnonymous: true,
  guestName: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  closedAt: true,
  reportedById: true,
  assignedToId: true,
  reportedBy: { select: { id: true, name: true, email: true, phone: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
  images: true,
  votes: { select: { userId: true, type: true } },
  events: {
    select: {
      id: true,
      action: true,
      note: true,
      fromStatus: true,
      toStatus: true,
      createdAt: true,
      actor: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
  _count: { select: { events: true, votes: true } },
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const incident = await prisma.incident.findUnique({
    where: { id },
    select: FULL_INCIDENT_SELECT,
  });

  if (!incident) {
    return NextResponse.json({ success: false, error: "Incident not found" }, { status: 404 });
  }

  if (session.user.role === "RESIDENT" && incident.reportedById !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const voteCount = incident._count?.votes ?? 0;
  const userVoted = session ? incident.votes.some((v: { userId: string }) => v.userId === session.user.id) : false;
  const confirmCount = incident.votes.filter((v: { type: string }) => v.type === "CONFIRM").length;
  const disputeCount = incident.votes.filter((v: { type: string }) => v.type === "DISPUTE").length;
  const userVoteRecord = session ? incident.votes.find((v: { userId: string }) => v.userId === session.user.id) : null;
  const userVote = userVoteRecord ? (userVoteRecord as { type: string }).type : null;

  return NextResponse.json({ success: true, data: { ...incident, voteCount, userVoted, confirmCount, disputeCount, userVote } });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const incident = await prisma.incident.findUnique({ where: { id } });
  if (!incident) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  // Only reporter (or admin) can edit; only while status is NEW
  const isOwner = incident.reportedById === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  if (!isAdmin && incident.status !== "NEW") {
    return NextResponse.json({ success: false, error: "Can only edit incidents that are still NEW" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = editIncidentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
  }

  const updated = await prisma.incident.update({
    where: { id },
    data: parsed.data,
  });

  await prisma.incidentEvent.create({
    data: { incidentId: id, actorId: session.user.id, action: "EDITED", note: "Report details updated" },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.incident.delete({ where: { id } });
  return NextResponse.json({ success: true, message: "Incident deleted" });
}
