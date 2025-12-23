import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

// Generate random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, name } = body;

    // Validate input
    if (!phone || !name) {
      return NextResponse.json(
        { error: "Phone and name are required" },
        { status: 400 },
      );
    }

    // Validate phone number format (10 digits)
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number" },
        { status: 400 },
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Store OTP in database using Prisma
    await db.otp.create({
      data: {
        phone: cleanPhone,
        otp,
        expiresAt,
      },
    });

    // TODO: Send OTP via WhatsApp using AISensy or similar service
    // For now, we'll just log it (in production, integrate with WhatsApp API)
    console.log(`OTP for ${cleanPhone}: ${otp}`);
    console.log(`Name: ${name}`);

    // In development, you can return the OTP for testing
    // Remove this in production!
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
        // Only for development/testing
        dev_otp: otp,
      });
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again." },
      { status: 500 },
    );
  }
}
