import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { decrypt, isEncrypted } from "@/lib/encryption";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get workspace ID from cookie
    const cookieStore = await cookies();
    const workspaceId = cookieStore.get("workspace-id")?.value;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace not selected" },
        { status: 400 },
      );
    }

    // Fetch CallerDesk integration from database
    const integration = await db.integration.findUnique({
      where: {
        workspaceId_provider: {
          workspaceId: workspaceId,
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

    // Parse and decrypt API key
    let authCode: string | undefined;
    try {
      const config = JSON.parse(integration.config);
      authCode = config.apiKey;

      if (!authCode) {
        return NextResponse.json(
          { error: "CallerDesk API key not configured" },
          { status: 500 },
        );
      }

      // Decrypt if encrypted
      if (isEncrypted(authCode)) {
        authCode = decrypt(authCode);
      }
    } catch (e) {
      console.error("Failed to parse integration config:", e);
      return NextResponse.json(
        { error: "Invalid integration configuration" },
        { status: 500 },
      );
    }

    // Fetch live calls from CallerDesk
    const response = await fetch(
      `https://app.callerdesk.io/api/live_call_v2?authcode=${authCode}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store", // Disable caching for real-time data
      },
    );

    if (!response.ok) {
      throw new Error(`CallerDesk API error: ${response.status}`);
    }

    const data = await response.json();

    // Return the live calls data
    return NextResponse.json({
      totalLiveCalls: parseInt(data.total_live_calls || "0"),
      liveCalls: data.live_calls || [],
      type: data.type,
    });
  } catch (error) {
    console.error("Error fetching live calls:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch live calls",
        totalLiveCalls: 0,
        liveCalls: [],
      },
      { status: 500 },
    );
  }
}
