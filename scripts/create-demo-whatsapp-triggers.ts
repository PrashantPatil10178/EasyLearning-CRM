/**
 * Demo WhatsApp Triggers
 * Creates 2 example triggers for CONVERTED status
 *
 * Run this manually in your database or via Prisma Studio to create demo triggers:
 *
 * 1. Trigger: Congratulations Message
 *    - Status: CONVERTED
 *    - Campaign: "Congratulations on Enrollment"
 *    - Parameters: FirstName, CourseInterested
 *
 * 2. Trigger: Welcome Package
 *    - Status: CONVERTED
 *    - Campaign: "Welcome Package and Next Steps"
 *    - Parameters: FirstName, CourseInterested, Amount
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createDemoWhatsAppTriggers() {
  try {
    // Get the first workspace (you should replace this with your actual workspace ID)
    const workspace = await prisma.workspace.findFirst();

    if (!workspace) {
      console.error("No workspace found. Please create a workspace first.");
      return;
    }

    console.log(`Creating demo triggers for workspace: ${workspace.name}`);

    // Demo Trigger 1: Congratulations Message
    const trigger1 = await prisma.whatsAppTrigger.upsert({
      where: {
        workspaceId_status: {
          workspaceId: workspace.id,
          status: "CONVERTED",
        },
      },
      update: {},
      create: {
        workspaceId: workspace.id,
        status: "CONVERTED",
        isEnabled: true,
        campaignName: "Congratulations on Enrollment",
        source: "EasyLearning CRM",
        templateParamsJson: JSON.stringify([
          "{{FirstName}}",
          "{{CourseInterested}}",
        ]),
        paramsFallbackJson: JSON.stringify({
          FirstName: "Student",
          CourseInterested: "our program",
        }),
      },
    });

    console.log("✅ Created Trigger 1: Congratulations Message");
    console.log({
      status: trigger1.status,
      campaign: trigger1.campaignName,
      enabled: trigger1.isEnabled,
    });

    // Demo Trigger 2: Welcome Package (commented out - can only have 1 trigger per status)
    // To use this, either:
    // 1. Use a different status like "ENROLLED"
    // 2. Or update the existing CONVERTED trigger

    /*
    const trigger2 = await prisma.whatsAppTrigger.upsert({
      where: {
        workspaceId_status: {
          workspaceId: workspace.id,
          status: "ENROLLED", // Different status
        },
      },
      update: {},
      create: {
        workspaceId: workspace.id,
        status: "ENROLLED",
        isEnabled: true,
        campaignName: "Welcome Package and Next Steps",
        source: "EasyLearning CRM",
        templateParamsJson: JSON.stringify([
          "{{FirstName}}",
          "{{CourseInterested}}",
          "{{Amount}}",
        ]),
        paramsFallbackJson: JSON.stringify({
          FirstName: "Student",
          CourseInterested: "the course",
          Amount: "10,000",
        }),
      },
    });

    console.log("✅ Created Trigger 2: Welcome Package");
    console.log({
      status: trigger2.status,
      campaign: trigger2.campaignName,
      enabled: trigger2.isEnabled,
    });
    */

    console.log("\n🎉 Demo WhatsApp triggers created successfully!");
    console.log("\n📝 How it works:");
    console.log("1. When a lead's status changes to CONVERTED");
    console.log("2. System checks for active WhatsApp trigger");
    console.log(
      "3. Sends WhatsApp via AISensy with campaign name and parameters",
    );
    console.log("4. Logs activity in lead's timeline");
    console.log("\n⚠️  Make sure to:");
    console.log("- Create the campaign in AISensy dashboard");
    console.log(
      "- Campaign name must match exactly: 'Congratulations on Enrollment'",
    );
    console.log("- Set up template with 2 parameters in AISensy");
    console.log("- Configure AISensy credentials in environment variables");
  } catch (error) {
    console.error("Error creating demo triggers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  createDemoWhatsAppTriggers();
}

export { createDemoWhatsAppTriggers };
