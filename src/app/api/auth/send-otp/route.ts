import { type NextRequest, NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { db } from "@/server/db";

// Rate limiter: 3 OTP requests per 15 minutes per IP
const rateLimiter = new RateLimiterMemory({
  keyPrefix: "otp_send",
  points: 3,
  duration: 60 * 15, // 15 minutes
});

// Generate random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via AISensy WhatsApp
const sendOTPViaAisensy = async (
  phone: string,
  otp: string,
  userName: string,
) => {
  const AISENSY_API_URL = process.env.AISENSY_API_URL;
  const AISENSY_API_KEY = process.env.AISENSY_API_KEY;

  if (!AISENSY_API_URL || !AISENSY_API_KEY) {
    console.warn("AISensy credentials not configured. Skipping OTP send.");
    console.log(`🔑 DEMO OTP for ${phone}: ${otp}`);
    return { success: "true" }; // Allow when credentials missing
  }

  const payload = {
    apiKey: AISENSY_API_KEY,
    campaignName: "Verify OTP",
    destination: phone,
    userName: userName || "User",
    templateParams: [otp],
    buttons: [
      {
        type: "button",
        sub_type: "url",
        index: 0,
        parameters: [
          {
            type: "text",
            text: otp,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(AISENSY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // AISensy returns plain text "Success." on success
    const responseText = await response.text();

    if (
      response.ok &&
      (responseText.includes("Success") || responseText.includes("success"))
    ) {
      return { success: "true" };
    }

    // Try to parse as JSON for error responses
    try {
      const jsonResponse = JSON.parse(responseText);
      return jsonResponse;
    } catch {
      // If not JSON and not success, return the text
      console.error("AISensy response:", responseText);
      return { success: "false", error: responseText };
    }
  } catch (error) {
    console.error("AISensy API error:", error);
    throw new Error("Failed to send OTP via AISensy");
  }
};

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip =
      (request.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Apply rate limiting
    try {
      await rateLimiter.consume(ip);
    } catch {
      return NextResponse.json(
        { error: "Too many OTP requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { phone, name } = body;

    // Validate input
    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    // Clean and format phone number
    const cleanedPhone = phone.replace(/\D/g, "");
    let formattedPhone = cleanedPhone;

    // Add country code if not present
    if (cleanedPhone.length === 10) {
      formattedPhone = `+91${cleanedPhone}`;
    } else if (cleanedPhone.length > 10 && !cleanedPhone.startsWith("+")) {
      formattedPhone = `+${cleanedPhone}`;
    }

    // Validate phone number format
    if (!/^\+\d{10,15}$/.test(formattedPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 },
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in database using Prisma
    await db.otp.create({
      data: {
        phone: formattedPhone,
        otp,
        expiresAt,
      },
    });

    // Send OTP via AISensy WhatsApp
    const aisensyResponse = await sendOTPViaAisensy(
      formattedPhone,
      otp,
      name || "User",
    );

    if (aisensyResponse.success === "true") {
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully via WhatsApp",
        phone: formattedPhone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3"),
        // Include OTP in dev mode for testing
        ...(process.env.NODE_ENV !== "production" && { demoOTP: otp }),
      });
    } else {
      console.error("AISensy API error:", aisensyResponse);
      return NextResponse.json(
        { error: "Failed to send OTP. Please try again." },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
