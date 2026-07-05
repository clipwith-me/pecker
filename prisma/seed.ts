import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminHash = await bcrypt.hash("Admin@1234", 12);
  const responderHash = await bcrypt.hash("Resp@1234", 12);
  const userHash = await bcrypt.hash("User@1234", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@pecker.com" },
    update: {},
    create: {
      email: "admin@pecker.com",
      name: "System Admin",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  const responder = await prisma.user.upsert({
    where: { email: "responder@pecker.com" },
    update: {},
    create: {
      email: "responder@pecker.com",
      name: "Field Responder",
      passwordHash: responderHash,
      role: "RESPONDER",
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: "jane@example.com" },
    update: {},
    create: {
      email: "jane@example.com",
      name: "Jane Doe",
      passwordHash: userHash,
      role: "RESIDENT",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      email: "john@example.com",
      name: "John Smith",
      passwordHash: userHash,
      role: "RESIDENT",
    },
  });

  const incidents = [
    {
      title: "Broken streetlight on Oak Avenue",
      description: "The streetlight at the corner of Oak Ave and 3rd St has been out for 3 days, creating a safety hazard.",
      category: "BROKEN_STREETLIGHT",
      severity: "HIGH",
      status: "IN_PROGRESS",
      locationText: "Oak Ave & 3rd Street",
      locationLat: 6.5244,
      locationLng: 3.3792,
      reportedById: user1.id,
      assignedToId: responder.id,
    },
    {
      title: "Flooding near central market",
      description: "Heavy rainfall has caused flooding around the central market area. Water level is approximately 30cm deep.",
      category: "FLOODING",
      severity: "CRITICAL",
      status: "ACKNOWLEDGED",
      locationText: "Central Market, Main Street",
      reportedById: user2.id,
    },
    {
      title: "Garbage overflow at block 5",
      description: "The waste bins at Block 5 have not been emptied for over a week and are overflowing.",
      category: "GARBAGE_OVERFLOW",
      severity: "MEDIUM",
      status: "NEW",
      locationText: "Block 5, Residential Area",
      reportedById: user1.id,
    },
    {
      title: "Large pothole on Highway junction",
      description: "A large pothole approximately 50cm deep has formed at the highway junction causing vehicle damage.",
      category: "ROAD_DAMAGE",
      severity: "HIGH",
      status: "RESOLVED",
      locationText: "Highway Junction, East Gate",
      reportedById: user2.id,
      assignedToId: responder.id,
    },
    {
      title: "Vandalism at park entrance",
      category: "VANDALISM",
      severity: "LOW",
      status: "CLOSED",
      locationText: "Community Park, North Entrance",
      reportedById: user1.id,
    },
    {
      title: "Blocked drainage causing water stagnation",
      description: "Storm drain blocked with debris, stagnant water attracting mosquitoes.",
      category: "DRAINAGE_ISSUE",
      severity: "MEDIUM",
      status: "NEW",
      locationText: "Residential Zone B, Street 12",
      reportedById: user2.id,
    },
  ];

  for (const inc of incidents) {
    const created = await prisma.incident.create({
      data: {
        ...inc,
        events: {
          create: {
            action: "CREATED",
            actorId: inc.reportedById,
            toStatus: "NEW",
          },
        },
      },
    });

    if (inc.status !== "NEW") {
      await prisma.incidentEvent.create({
        data: {
          incidentId: created.id,
          actorId: admin.id,
          action: "STATUS_CHANGED",
          fromStatus: "NEW",
          toStatus: inc.status,
          note: "Status updated by admin",
        },
      });
    }
  }

  console.log("✅ Database seeded successfully");
  console.log("\nTest accounts:");
  console.log("  Admin: admin@pecker.com / Admin@1234");
  console.log("  Responder: responder@pecker.com / Resp@1234");
  console.log("  Resident: jane@example.com / User@1234");
  console.log("  Resident: john@example.com / User@1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
