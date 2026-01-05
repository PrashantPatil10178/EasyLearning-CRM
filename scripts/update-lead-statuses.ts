import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateStatuses() {
  const workspaces = await prisma.workspace.findMany();

  for (const workspace of workspaces) {
    console.log("Updating statuses for workspace:", workspace.id);

    // Delete old statuses
    await prisma.leadStatusConfig.deleteMany({
      where: { workspaceId: workspace.id },
    });

    // Create new statuses
    const statuses = [
      {
        name: "New Lead",
        stage: "INITIAL",
        color: "#3B82F6",
        isDefault: true,
        order: 0,
      },
      {
        name: "Worked",
        stage: "ACTIVE",
        color: "#8B5CF6",
        isDefault: false,
        order: 1,
      },
      {
        name: "Interested",
        stage: "ACTIVE",
        color: "#10B981",
        isDefault: false,
        order: 2,
      },
      {
        name: "Just Curious",
        stage: "ACTIVE",
        color: "#F59E0B",
        isDefault: false,
        order: 3,
      },
      {
        name: "Follow Up",
        stage: "ACTIVE",
        color: "#06B6D4",
        isDefault: false,
        order: 4,
      },
      {
        name: "No Response",
        stage: "CLOSED",
        color: "#6B7280",
        isDefault: false,
        order: 5,
      },
      {
        name: "Not Interested",
        stage: "CLOSED",
        color: "#EF4444",
        isDefault: false,
        order: 6,
      },
      {
        name: "Won",
        stage: "CLOSED",
        color: "#22C55E",
        isDefault: false,
        order: 7,
      },
      {
        name: "Lost",
        stage: "CLOSED",
        color: "#DC2626",
        isDefault: false,
        order: 8,
      },
      {
        name: "Do Not Contact",
        stage: "CLOSED",
        color: "#991B1B",
        isDefault: false,
        order: 9,
      },
    ];

    for (const status of statuses) {
      await prisma.leadStatusConfig.create({
        data: {
          ...status,
          workspaceId: workspace.id,
        },
      });
    }

    console.log("✅ Updated", statuses.length, "statuses");
  }

  await prisma.$disconnect();
  console.log("Done!");
}

updateStatuses().catch(console.error);
