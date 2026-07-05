import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role === "RESIDENT") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const [
    totalOpen,
    resolvedToday,
    byStatus,
    byCategory,
    bySeverity,
    recentIncidents,
    resolvedIncidents,
  ] = await Promise.all([
    prisma.incident.count({
      where: { status: { in: ["NEW", "ACKNOWLEDGED", "IN_PROGRESS"] } },
    }),
    prisma.incident.count({
      where: { status: "RESOLVED", resolvedAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.incident.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.incident.groupBy({ by: ["category"], _count: { id: true } }),
    prisma.incident.groupBy({ by: ["severity"], _count: { id: true } }),
    prisma.incident.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        category: true,
        severity: true,
        status: true,
        locationText: true,
        locationLat: true,
        locationLng: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
        closedAt: true,
        reportedById: true,
        assignedToId: true,
        reportedBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        images: { select: { id: true, url: true }, take: 1 },
        _count: { select: { events: true } },
      },
    }),
    prisma.incident.findMany({
      where: { resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    }),
  ]);

  let averageResolutionHours = 0;
  if (resolvedIncidents.length > 0) {
    const totalMs = resolvedIncidents.reduce((sum, inc) => {
      return sum + (inc.resolvedAt!.getTime() - inc.createdAt.getTime());
    }, 0);
    averageResolutionHours = totalMs / resolvedIncidents.length / (1000 * 60 * 60);
  }

  return NextResponse.json({
    success: true,
    data: {
      totalOpen,
      resolvedToday,
      averageResolutionHours: Math.round(averageResolutionHours * 10) / 10,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count.id })),
      bySeverity: bySeverity.map((s) => ({ severity: s.severity, count: s._count.id })),
      recentIncidents,
    },
  });
}
