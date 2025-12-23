import {
  PrismaClient,
  LeadSource,
  LeadStatus,
  Priority,
  DealStage,
  CourseMode,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding CRM data...");

  // Create sample courses
  const course1 = await prisma.course.upsert({
    where: { code: "JEE-MAIN-2025" },
    update: {},
    create: {
      code: "JEE-MAIN-2025",
      name: "JEE Main 2025 Complete Course",
      description: "Comprehensive preparation for JEE Main 2025",
      category: "Engineering",
      mode: CourseMode.HYBRID,
      price: 45000,
      discountPrice: 39999,
      durationDays: 180,
      isActive: true,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { code: "NEET-2025" },
    update: {},
    create: {
      code: "NEET-2025",
      name: "NEET 2025 Complete Course",
      description: "Complete preparation for NEET 2025",
      category: "Medical",
      mode: CourseMode.ONLINE,
      price: 55000,
      discountPrice: 49999,
      durationDays: 240,
      isActive: true,
    },
  });

  const course3 = await prisma.course.upsert({
    where: { code: "MHT-CET-2025" },
    update: {},
    create: {
      code: "MHT-CET-2025",
      name: "MHT CET 2025 Crash Course",
      description: "Intensive crash course for MHT CET",
      category: "Engineering",
      mode: CourseMode.OFFLINE,
      price: 25000,
      discountPrice: 22000,
      durationDays: 90,
      isActive: true,
    },
  });

  console.log("Courses created/verified.");

  // Create sample batches
  const batch1 = await prisma.batch.upsert({
    where: {
      courseId_name: { courseId: course1.id, name: "JEE Main Morning Batch" },
    },
    update: {},
    create: {
      courseId: course1.id,
      name: "JEE Main Morning Batch",
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-07-31"),
      maxStudents: 50,
      enrolledCount: 32,
      timing: "9:00 AM - 12:00 PM",
      isActive: true,
    },
  });

  const batch2 = await prisma.batch.upsert({
    where: {
      courseId_name: { courseId: course2.id, name: "NEET Evening Batch" },
    },
    update: {},
    create: {
      courseId: course2.id,
      name: "NEET Evening Batch",
      startDate: new Date("2025-02-15"),
      endDate: new Date("2025-10-15"),
      maxStudents: 40,
      enrolledCount: 28,
      timing: "4:00 PM - 7:00 PM",
      isActive: true,
    },
  });

  console.log("Batches created/verified.");

  console.log("CRM seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
