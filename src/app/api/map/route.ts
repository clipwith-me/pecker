import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public endpoint — no auth required. Returns only active incidents with location.
export async function GET() {
  const incidents = await prisma.incident.findMany({
    where: {
      status: { notIn: ["CLOSED", "REJECTED"] },
      locationLat: { not: null },
      locationLng: { not: null },
    },
    select: {
      id: true,
      title: true,
      category: true,
      severity: true,
      status: true,
      locationLat: true,
      locationLng: true,
      locationText: true,
      createdAt: true,
      isAnonymous: true,
      guestName: true,
      reportedBy: { select: { name: true } },
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ success: true, data: incidents });
}
