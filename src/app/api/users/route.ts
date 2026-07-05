import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.role === "RESIDENT") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  const users = await prisma.user.findMany({
    where: role ? { role } : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      city: true,
      community: true,
      state: true,
      country: true,
      createdAt: true,
      _count: {
        select: {
          reportedIncidents: true,
          assignedIncidents: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ success: true, data: users });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, role, city, community, state, country } = body;

  if (!id) {
    return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
  }

  if (role && !["RESIDENT", "RESPONDER", "ADMIN"].includes(role)) {
    return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (role) data.role = role;
  if (city !== undefined) data.city = city || null;
  if (community !== undefined) data.community = community || null;
  if (state !== undefined) data.state = state || null;
  if (country !== undefined) data.country = country || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ success: false, error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, city: true, community: true, state: true, country: true },
  });

  return NextResponse.json({ success: true, data: updated });
}
