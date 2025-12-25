import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function makeAdmin() {
  try {
    const phone = "7620170904";
    const name = "Shubham Jha";
    const email = "shubham@easylearning.live";
    const password = "admin123";

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

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
          email,
          password: hashedPassword,
          role: "SUPER_ADMIN",
        },
      });

      console.log(`✅ Created new SUPER_ADMIN user: ${name} (${phone})`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
    } else {
      // Update existing user to SUPER_ADMIN
      user = await prisma.user.update({
        where: { phone },
        data: {
          role: "SUPER_ADMIN",
          name, // Update name if needed
          email, // Update email
          password: hashedPassword, // Update password
        },
      });

      console.log(`✅ Updated ${name} (${phone}) to SUPER_ADMIN role`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
      console.log("\n🔐 Demo Credentials for Login:");
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
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
