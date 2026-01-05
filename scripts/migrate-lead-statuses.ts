import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mapping of old enum values to new status names
const STATUS_MAPPING: Record<string, string> = {
  // Old enum values -> New status names
  NEW_LEAD: "New Lead",
  INTERESTED: "Interested",
  JUST_CURIOUS: "Just Curious",
  FOLLOW_UP: "Follow Up",
  CONTACTED: "Follow Up", // Map Contacted to Follow Up
  QUALIFIED: "Interested", // Map Qualified to Interested
  NEGOTIATION: "Interested", // Map Negotiation to Interested
  NO_RESPONSE: "No Response",
  NOT_INTERESTED: "Not Interested",
  CONVERTED: "Won", // Map Converted to Won
  LOST: "Lost",
  DO_NOT_CONTACT: "Do Not Contact",
  WON: "Won",
  DONE: "Won", // Map Done to Won
};

async function migrateLeadStatuses() {
  console.log("🔄 Starting lead status migration...\n");

  // Get all leads
  const leads = await prisma.lead.findMany({
    select: {
      id: true,
      status: true,
      firstName: true,
      lastName: true,
    },
  });

  console.log(`📊 Found ${leads.length} leads to process\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const lead of leads) {
    const currentStatus = lead.status;
    const newStatus = STATUS_MAPPING[currentStatus] || currentStatus;

    if (newStatus !== currentStatus) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: newStatus },
      });

      console.log(
        `✅ Updated: ${lead.firstName} ${lead.lastName} | "${currentStatus}" → "${newStatus}"`,
      );
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log("\n📈 Migration Summary:");
  console.log(`   ✅ Updated: ${updatedCount} leads`);
  console.log(
    `   ⏭️  Skipped: ${skippedCount} leads (already using new format)`,
  );
  console.log(`   📊 Total: ${leads.length} leads`);

  await prisma.$disconnect();
  console.log("\n✨ Migration complete!");
}

migrateLeadStatuses().catch((error) => {
  console.error("❌ Error during migration:", error);
  process.exit(1);
});
