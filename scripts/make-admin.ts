import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function makeAdmin() {
  try {
    const phone = "7620170904";
    const name = "Prashant Patil";

    // Find user by phone
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      console.log(
        `User with phone ${phone} not found. Creating new admin user...`,
      );

      // Create new admin user
      user = await prisma.user.create({
        data: {
          phone,
          name,
          role: "SUPER_ADMIN",
        },
      });

      console.log(`✅ Created new SUPER_ADMIN user: ${name} (${phone})`);
    } else {
      // Update existing user to SUPER_ADMIN
      user = await prisma.user.update({
        where: { phone },
        data: {
          role: "SUPER_ADMIN",
          name, // Update name if needed
        },
      });

      console.log(`✅ Updated ${name} (${phone}) to SUPER_ADMIN role`);
    }

    console.log("\nUser Details:");
    console.log(`ID: ${user.id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Phone: ${user.phone}`);
    console.log(`Email: ${user.email || "Not set"}`);
    console.log(`Role: ${user.role}`);
  } catch (error) {
    console.error("❌ Error making admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
