import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_FIELDS = [
  {
    name: "LEAD TYPE",
    key: "lead_type",
    type: "SELECT",
    options: JSON.stringify(["value1"]),
  },
  {
    name: "Class",
    key: "class",
    type: "SELECT",
    options: JSON.stringify(["value1"]),
  },
  {
    name: "Medium",
    key: "medium",
    type: "SELECT",
    options: JSON.stringify(["value1"]),
  },
  {
    name: "Batch",
    key: "batch",
    type: "SELECT",
    options: JSON.stringify(["value1"]),
  },
  { name: "Interested In", key: "interested_in", type: "TEXT" },
  { name: "Course Purchased", key: "course_purchased", type: "TEXT" },
  { name: "City", key: "city", type: "TEXT" },
  { name: "Email Id", key: "email_id", type: "EMAIL" },
  { name: "Amount Paid", key: "amount_paid", type: "NUMBER" },
  { name: "Your message", key: "your_message", type: "TEXT" },
  { name: "Opt out", key: "opt_out", type: "BOOLEAN" },
  { name: "Purchase Date", key: "purchase_date", type: "DATE" },
];

async function main() {
  // Find the workspace
  const workspace = await prisma.workspace.findFirst({
    where: {
      name: "TeleCRM Test",
    },
  });

  if (!workspace) {
    console.log("Workspace 'TeleCRM Test' not found. Creating it...");
    // Create if not exists (for testing)
    const newWorkspace = await prisma.workspace.create({
      data: {
        name: "TeleCRM Test",
        slug: "telecrm-test",
      },
    });
    await seedFields(newWorkspace.id);
  } else {
    console.log(`Found workspace: ${workspace.name} (${workspace.id})`);
    await seedFields(workspace.id);
  }
}

async function seedFields(workspaceId: string) {
  console.log("Seeding fields...");
  let order = 0;
  for (const field of DEFAULT_FIELDS) {
    try {
      await prisma.leadField.upsert({
        where: {
          workspaceId_key: {
            workspaceId,
            key: field.key,
          },
        },
        update: {
          ...field,
          order: order++,
        },
        create: {
          ...field,
          workspaceId,
          order: order++,
        },
      });
      console.log(`Upserted field: ${field.name}`);
    } catch (e) {
      console.error(`Error upserting field ${field.name}:`, e);
    }
  }
  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
