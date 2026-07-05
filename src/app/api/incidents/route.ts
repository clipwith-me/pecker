import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createIncidentSchema } from "@/lib/validations";
import type { IncidentFilters } from "@/lib/types";

const INCIDENT_LIST_SELECT = {
  id: true,
  title: true,
  category: true,
  severity: true,
  status: true,
  locationText: true,
  locationLat: true,
  locationLng: true,
  city: true,
  community: true,
  state: true,
  country: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  closedAt: true,
  description: true,
  reportedById: true,
  assignedToId: true,
  isAnonymous: true,
  guestName: true,
  reportedBy: { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
  images: { select: { id: true, url: true }, take: 1 },
  _count: { select: { events: true, votes: true } },
};

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filters: IncidentFilters = {
    status: (searchParams.get("status") as IncidentFilters["status"]) || undefined,
    category: (searchParams.get("category") as IncidentFilters["category"]) || undefined,
    severity: (searchParams.get("severity") as IncidentFilters["severity"]) || undefined,
    search: searchParams.get("search") || undefined,
    page: parseInt(searchParams.get("page") || "1"),
    pageSize: parseInt(searchParams.get("pageSize") || "20"),
  };

  const where: Record<string, unknown> = {};

  if (session.user.role === "RESIDENT") {
    where.reportedById = session.user.id;
  }

  // Geo-scoping for responders: only see incidents in their city/community
  // Old incidents (no city set) remain visible to all responders per policy
  if (session.user.role === "RESPONDER" && session.user.city) {
    const geoOr: Record<string, unknown>[] = [{ city: null }];
    geoOr.push({ city: { equals: session.user.city, mode: "insensitive" } });
    if (session.user.community) {
      // Must match both city and community (or have neither)
      where.AND = [
        { OR: [{ city: null }, { city: { equals: session.user.city, mode: "insensitive" } }] },
        { OR: [{ community: null }, { community: { equals: session.user.community, mode: "insensitive" } }] },
      ];
    } else {
      where.OR = geoOr;
    }
  }

  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.severity) where.severity = filters.severity;
  if (filters.search) {
    const searchOr = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { locationText: { contains: filters.search, mode: "insensitive" } },
    ];
    // Merge with existing AND/OR so geo-filter isn't lost
    if (where.AND) {
      (where.AND as unknown[]).push({ OR: searchOr });
    } else if (where.OR) {
      where.AND = [{ OR: where.OR as unknown[] }, { OR: searchOr }];
      delete where.OR;
    } else {
      where.OR = searchOr;
    }
  }

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.incident.findMany({
      where,
      select: INCIDENT_LIST_SELECT,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.incident.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function POST(req: Request) {
  const session = await auth();

  try {
    const body = await req.json();
    const parsed = createIncidentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { isAnonymous, guestName, ...incidentData } = parsed.data;

    // Anonymous reports allowed without login, but need a guest name
    if (!session && (!isAnonymous || !guestName?.trim())) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use a system user ID for anonymous reports if no session
    // For anonymous with session, use the session user as reporter but hide name
    const reporterId = session?.user.id ?? await getOrCreateAnonymousUser();

    const incident = await prisma.incident.create({
      data: {
        ...incidentData,
        isAnonymous: isAnonymous ?? false,
        guestName: isAnonymous ? (guestName ?? "Anonymous") : undefined,
        reportedById: reporterId,
        events: {
          create: {
            action: "CREATED",
            actorId: session?.user.id ?? null,
            toStatus: "NEW",
          },
        },
      },
      select: INCIDENT_LIST_SELECT,
    });

    await notifyAdmins(incident.id, isAnonymous ? "Anonymous" : (session?.user.name ?? "Guest"));

    return NextResponse.json({ success: true, data: incident }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

async function getOrCreateAnonymousUser(): Promise<string> {
  const anonEmail = "anonymous@pecker.system";
  const existing = await prisma.user.findUnique({ where: { email: anonEmail } });
  if (existing) return existing.id;
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash(Math.random().toString(36), 10);
  const created = await prisma.user.create({
    data: { email: anonEmail, name: "Anonymous", passwordHash: hash, role: "RESIDENT" },
  });
  return created.id;
}

async function notifyAdmins(incidentId: string, reporterName: string) {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "RESPONDER"] } },
    select: { id: true },
  });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      incidentId,
      type: "STATUS_CHANGED",
      message: `New incident reported by ${reporterName}`,
    })),
  });
}
