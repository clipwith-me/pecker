import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const incident = await prisma.incident.findUnique({ where: { id }, select: { id: true } });
  if (!incident) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  // Toggle: if vote exists remove it, otherwise add it
  const existing = await prisma.incidentVote.findUnique({
    where: { incidentId_userId: { incidentId: id, userId: session.user.id } },
  });

  if (existing) {
    await prisma.incidentVote.delete({ where: { id: existing.id } });
  } else {
    await prisma.incidentVote.create({ data: { incidentId: id, userId: session.user.id } });
  }

  const voteCount = await prisma.incidentVote.count({ where: { incidentId: id } });
  return NextResponse.json({ success: true, data: { voted: !existing, voteCount } });
}
