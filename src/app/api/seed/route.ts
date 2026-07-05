import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// One-time seed endpoint — protected by secret token
// Call: POST /api/seed  with header  Authorization: Bearer <SEED_SECRET>
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.SEED_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existingAdmin = await prisma.user.findUnique({ where: { email: "admin@pecker.com" } });
  if (existingAdmin) {
    return NextResponse.json({ message: "Already seeded" });
  }

  const adminHash = await bcrypt.hash("Admin@1234", 12);
  const responderHash = await bcrypt.hash("Resp@1234", 12);
  const userHash = await bcrypt.hash("User@1234", 12);

  await prisma.user.createMany({
    data: [
      { email: "admin@pecker.com", name: "System Admin", passwordHash: adminHash, role: "ADMIN" },
      { email: "responder@pecker.com", name: "Field Responder", passwordHash: responderHash, role: "RESPONDER" },
      { email: "jane@example.com", name: "Jane Doe", passwordHash: userHash, role: "RESIDENT" },
      { email: "john@example.com", name: "John Smith", passwordHash: userHash, role: "RESIDENT" },
    ],
  });

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@pecker.com" } });
  const responder = await prisma.user.findUniqueOrThrow({ where: { email: "responder@pecker.com" } });
  const jane = await prisma.user.findUniqueOrThrow({ where: { email: "jane@example.com" } });
  const john = await prisma.user.findUniqueOrThrow({ where: { email: "john@example.com" } });

  const incidents = [
    { title: "Broken streetlight on Oak Avenue", description: "Out for 3 days, safety hazard.", category: "BROKEN_STREETLIGHT", severity: "HIGH", status: "IN_PROGRESS", locationText: "Oak Ave & 3rd Street", locationLat: 6.5244, locationLng: 3.3792, reportedById: jane.id, assignedToId: responder.id },
    { title: "Flooding near central market", description: "Heavy rainfall, ~30cm deep.", category: "FLOODING", severity: "CRITICAL", status: "ACKNOWLEDGED", locationText: "Central Market, Main Street", reportedById: john.id },
    { title: "Garbage overflow at block 5", description: "Not emptied for over a week.", category: "GARBAGE_OVERFLOW", severity: "MEDIUM", status: "NEW", locationText: "Block 5, Residential Area", reportedById: jane.id },
    { title: "Large pothole on Highway junction", description: "~50cm deep, causing vehicle damage.", category: "ROAD_DAMAGE", severity: "HIGH", status: "RESOLVED", locationText: "Highway Junction, East Gate", reportedById: john.id, assignedToId: responder.id, resolvedAt: new Date() },
    { title: "Vandalism at park entrance", category: "VANDALISM", severity: "LOW", status: "CLOSED", locationText: "Community Park, North Entrance", reportedById: jane.id, closedAt: new Date() },
    { title: "Blocked drainage causing water stagnation", description: "Storm drain blocked, attracting mosquitoes.", category: "DRAINAGE_ISSUE", severity: "MEDIUM", status: "NEW", locationText: "Residential Zone B, Street 12", reportedById: john.id },
  ];

  for (const inc of incidents) {
    const created = await prisma.incident.create({
      data: { ...inc, events: { create: { action: "CREATED", actorId: inc.reportedById, toStatus: "NEW" } } },
    });
    if (inc.status !== "NEW") {
      await prisma.incidentEvent.create({
        data: { incidentId: created.id, actorId: admin.id, action: "STATUS_CHANGED", fromStatus: "NEW", toStatus: inc.status, note: "Status updated by admin" },
      });
    }
  }

  return NextResponse.json({ success: true, message: "Database seeded with demo data" });
}
