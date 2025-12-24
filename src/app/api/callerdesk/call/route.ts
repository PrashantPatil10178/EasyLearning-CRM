import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { decrypt, isEncrypted } from "@/lib/encryption";
import axios from "axios";
import https from "https";

// CallerDesk API Configuration
// Add these to your .env file:
// CALLERDESK_API_KEY=your_api_key
// CALLERDESK_DESKPHONE=your_deskphone_number (VN/Tollfree)

// Create an HTTPS agent that accepts self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Allow self-signed certificates
});

function cleanPhone(phone: string): string {
  if (!phone) return "";
  // Remove non-digits
  let p = phone.replace(/\D/g, "");

  // If 12 digits and starts with 91, remove 91 (as per PHP script logic)
  if (p.length === 12 && p.startsWith("91")) {
    p = p.substring(2);
  }

  return p;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch full user details to get phone number
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.phone) {
      return NextResponse.json(
        { error: "Agent phone number not found. Please update your profile." },
        { status: 400 },
      );
    }

    // Check if user has an assigned deskphone
    if (!user.callerDeskPhone) {
      return NextResponse.json(
        {
          error:
            "No CallerDesk deskphone assigned to you. Please contact your administrator.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { leadId, phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Lead phone number is required" },
        { status: 400 },
      );
    }

    // Get workspace ID from lead
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      select: { workspaceId: true },
    });

    if (!lead?.workspaceId) {
      return NextResponse.json(
        { error: "Lead not found or missing workspace" },
        { status: 404 },
      );
    }

    // Fetch CallerDesk integration config
    const integration = await db.integration.findUnique({
      where: {
        workspaceId_provider: {
          workspaceId: lead.workspaceId,
          provider: "CALLERDESK",
        },
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "CallerDesk integration not configured for this workspace" },
        { status: 400 },
      );
    }

    if (!integration.isEnabled) {
      return NextResponse.json(
        { error: "CallerDesk integration is disabled for this workspace" },
        { status: 400 },
      );
    }

    let authCode: string | undefined;

    try {
      const config = JSON.parse(integration.config);

      // Decrypt API key if encrypted
      authCode = config.apiKey;
      if (authCode && isEncrypted(authCode)) {
        console.log("[CallerDesk] Decrypting API key");
        authCode = decrypt(authCode);
      } else {
        console.log("[CallerDesk] Using plain API key");
      }

      // Decrypt secret key if encrypted (though we use API key for auth)
      if (config.secretKey && isEncrypted(config.secretKey)) {
        config.secretKey = decrypt(config.secretKey);
      }

      console.log("[CallerDesk] Auth code length:", authCode?.length);
    } catch (e) {
      console.error("Failed to parse integration config", e);
      return NextResponse.json(
        { error: "Invalid integration configuration" },
        { status: 500 },
      );
    }

    if (!authCode) {
      return NextResponse.json(
        {
          error:
            "CallerDesk configuration incomplete. Please setup API Key in Integration settings.",
        },
        { status: 400 },
      );
    }

    // Use user's assigned deskphone
    const deskPhone = user.callerDeskPhone;

    console.log("[CallerDesk] Lead phone:", phone);

    // Prepare parameters
    const agentPhone = cleanPhone(user.phone);
    const customerPhone = cleanPhone(phone);
    const callFromDid = "1";

    console.log(
      `[CallerDesk] Agent: ${agentPhone}, Customer: ${customerPhone}`,
    );
    console.log(
      `[CallerDesk] Auth Code (first 8 chars): ${authCode.substring(0, 8)}...`,
    );
    console.log(`[CallerDesk] User Assigned Desk Phone: ${deskPhone}`);

    // Construct CallerDesk API request
    // Endpoint: https://app.callerdesk.io/api/click_to_call_v2
    // CallerDesk expects GET request with query parameters
    const params = new URLSearchParams({
      calling_party_a: agentPhone,
      calling_party_b: customerPhone,
      deskphone: deskPhone,
      call_from_did: callFromDid,
      authcode: authCode,
    });

    const apiUrl = `https://app.callerdesk.io/api/click_to_call_v2?${params.toString()}`;

    console.log(
      `[CallerDesk] Initiating call - Agent: ${agentPhone}, Customer: ${customerPhone}, Desk: ${deskPhone}`,
    );

    console.log({ apiUrl });

    // Execute GET Request using axios with SSL verification disabled
    const response = await axios.get(apiUrl, {
      httpsAgent,
      timeout: 30000, // 30 second timeout
    });

    const responseText =
      typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data);
    console.log("[CallerDesk Response]:", responseText);

    let responseData: any = {};
    if (typeof response.data === "object") {
      responseData = response.data;
    } else {
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error("[CallerDesk] Response is not JSON:", responseText);
        responseData = { message: responseText };
      }
    }

    // Check HTTP status AND response body for errors
    // CallerDesk returns {"type": "success"} or {"type": "error"}
    const isSuccess = response.ok && responseData?.type === "success";

    // If CallerDesk returned an error, provide a helpful message
    if (responseData?.type === "error") {
      console.error("[CallerDesk] API Error:", responseData.message);

      // Provide specific error messages based on the response
      let errorMessage = responseData.message;
      if (errorMessage.includes("Invalid Deskphone")) {
        errorMessage = `Invalid Deskphone: The deskphone number (${deskPhone}) is not registered in your CallerDesk account. Please update your CallerDesk integration settings with the correct Virtual Number (VN) or Tollfree number.`;
      } else if (errorMessage.includes("Invalid Authcode")) {
        errorMessage =
          "Invalid API Key: Please check your CallerDesk API key in the integration settings.";
      }

      return NextResponse.json(
        { error: errorMessage, details: responseData },
        { status: 400 },
      );
    }

    // Log activity and call record
    if (leadId) {
      await db.activity.create({
        data: {
          leadId,
          userId: session.user.id,
          type: "CALL",
          subject: "CallerDesk Call Initiated",
          description: isSuccess
            ? `Call initiated to ${customerPhone} via CallerDesk`
            : `Call failed: ${responseData?.message || "Unknown error"}`,
        },
      });

      await db.call.create({
        data: {
          leadId,
          userId: session.user.id,
          type: "OUTBOUND",
          status: isSuccess ? "INITIATED" : "FAILED",
          toNumber: customerPhone,
          fromNumber: agentPhone,
          notes: isSuccess
            ? `CallerDesk call initiated successfully`
            : `Error: ${responseData?.message || responseText.substring(0, 200)}`,
        },
      });
    }

    if (!isSuccess) {
      return NextResponse.json(
        {
          error: responseData?.message || "Failed to initiate call",
          details: responseData,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Call initiated successfully via CallerDesk",
      callDetails: {
        agent: agentPhone,
        customer: customerPhone,
        deskphone: deskPhone,
      },
      callerDeskResponse: responseData,
    });
  } catch (error) {
    console.error("CallerDesk API error:", error);
    return NextResponse.json(
      { error: "Failed to initiate call" },
      { status: 500 },
    );
  }
}
