import { NextResponse } from "next/server";
import { auth } from "@/server/auth";

const CALLERDESK_API_KEY = process.env.CALLERDESK_API_KEY;

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!CALLERDESK_API_KEY) {
      console.error("CallerDesk API key not configured");
      return NextResponse.json(
        { error: "CallerDesk API key not configured" },
        { status: 500 },
      );
    }

    // Fetch live calls from CallerDesk
    const response = await fetch(
      `https://app.callerdesk.io/api/live_call_v2?authcode=${CALLERDESK_API_KEY}`,
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
