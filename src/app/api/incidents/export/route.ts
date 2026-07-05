import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "RESPONDER")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const incidents = await prisma.incident.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      severity: true,
      status: true,
      locationText: true,
      locationLat: true,
      locationLng: true,
      isAnonymous: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
      closedAt: true,
      reportedBy: { select: { name: true, email: true } },
      assignedTo: { select: { name: true, email: true } },
      _count: { select: { votes: true, events: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "ID", "Title", "Category", "Severity", "Status",
    "Location", "Lat", "Lng", "Reporter", "Reporter Email",
    "Assigned To", "Votes", "Updates", "Anonymous",
    "Created", "Updated", "Resolved", "Closed",
  ].join(",");

  const escape = (v: unknown) => {
    const s = String(v ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = incidents.map((i) =>
    [
      i.id,
      i.title,
      i.category,
      i.severity,
      i.status,
      i.locationText ?? "",
      i.locationLat ?? "",
      i.locationLng ?? "",
      i.isAnonymous ? "Anonymous" : i.reportedBy.name,
      i.isAnonymous ? "" : i.reportedBy.email,
      i.assignedTo?.name ?? "",
      i._count.votes,
      i._count.events,
      i.isAnonymous ? "Yes" : "No",
      i.createdAt.toISOString(),
      i.updatedAt.toISOString(),
      i.resolvedAt?.toISOString() ?? "",
      i.closedAt?.toISOString() ?? "",
    ]
      .map(escape)
      .join(",")
  );

  const csv = [header, ...rows].join("\n");
  const filename = `pecker-incidents-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
