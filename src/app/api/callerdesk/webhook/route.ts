import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { callEventEmitter } from "@/lib/call-events";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      type,
      SourceNumber,
      DestinationNumber,
      DialWhomNumber,
      CallDuration,
      Status,
      CallRecordingUrl,
      Direction,
      StartTime,
      EndTime,
      call_group,
      receiver_name,
    } = body;

    console.log("[CallerDesk Webhook] Received:", body);

    // Helper function to clean phone numbers
    const cleanPhone = (p: string) => {
      if (!p) return "";
      const cleaned = p.replace(/\D/g, "");
      return cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
    };

    // Handle live_call events (call in progress)
    if (type === "live_call") {
      // Emit real-time event for live call
      const lead = await db.lead.findFirst({
        where: {
          phone: {
            endsWith: cleanPhone(SourceNumber || DestinationNumber),
          },
        },
      });

      if (lead && lead.workspaceId) {
        callEventEmitter.emitCallEvent({
          type: "live_call",
          workspaceId: lead.workspaceId,
          call: {
            toNumber: DestinationNumber,
            fromNumber: SourceNumber,
            status: Status,
          },
        });
      }

      return NextResponse.json({ message: "Live call event processed" });
    }

    // We only care about call reports for actual logging
    if (type !== "call_report" && !SourceNumber) {
      // Sometimes type might be missing or different, but SourceNumber is key
      return NextResponse.json({ message: "Ignored" });
    }

    // Determine Lead Phone and Agent Phone
    let leadPhone = "";
    let agentPhone = "";

    if (Direction === "IVR") {
      // Incoming call: Source is Lead, Destination/DialWhom is Agent
      leadPhone = SourceNumber;
      agentPhone = DialWhomNumber;
    } else if (Direction === "WEBOBD") {
      // Outgoing call: Source is Agent (or System), Destination is Lead
      // Wait, in WEBOBD (Web Outbound), DestinationNumber is usually the customer
      leadPhone = DestinationNumber;
      agentPhone = SourceNumber; // Or DialWhomNumber?
      // In the sample: SourceNumber: "0888..." (Caller), DestinationNumber: "0806..." (VN), DialWhomNumber: "0765..." (Agent)
      // Actually for Click to Call:
      // SourceNumber is usually the bridge number or agent?
      // Let's assume DestinationNumber is the Lead for Outbound.
    } else {
      // Fallback
      leadPhone = DestinationNumber;
    }

    const leadPhoneClean = cleanPhone(leadPhone);
    const agentPhoneClean = cleanPhone(agentPhone);

    if (!leadPhoneClean) {
      return NextResponse.json({ message: "No lead phone found" });
    }

    // Find Lead
    // We search by phone ending with the 10 digits
    const lead = await db.lead.findFirst({
      where: {
        phone: {
          endsWith: leadPhoneClean,
        },
      },
      include: {
        workspace: {
          include: {
            integrations: {
              where: { provider: "CALLERDESK" },
            },
          },
        },
      },
    });

    if (!lead) {
      console.log(
        `[CallerDesk Webhook] Lead not found for phone ${leadPhoneClean}`,
      );
      return NextResponse.json({ message: "Lead not found" });
    }

    // Check if integration is enabled
    const integration = lead.workspace?.integrations?.[0];
    if (integration && !integration.isEnabled) {
      console.log(
        `[CallerDesk Webhook] Integration disabled for workspace ${lead.workspaceId}`,
      );
      return NextResponse.json({ message: "Integration disabled" });
    }

    // Find User (Agent)
    let userId = "";
    if (agentPhoneClean) {
      const user = await db.user.findFirst({
        where: {
          phone: {
            endsWith: agentPhoneClean,
          },
        },
      });
      if (user) {
        userId = user.id;
      }
    }

    // If no user found by phone, try to find by receiver_name or default to the lead owner
    if (!userId && receiver_name) {
      const user = await db.user.findFirst({
        where: {
          name: {
            contains: receiver_name,
          },
        },
      });
      if (user) userId = user.id;
    }

    if (!userId) {
      // Fallback to Lead Owner
      userId = lead.ownerId || ""; // ownerId might be null? Schema says ownerId String (required) ?
      // Let's check schema for Lead
    }

    // If still no userId, we can't create a Call (userId is required)
    // We'll fetch the first admin or just fail
    if (!userId) {
      const admin = await db.user.findFirst();
      if (admin) userId = admin.id;
    }

    if (!userId) {
      return NextResponse.json({ message: "No user found to assign call" });
    }

    // Map CallerDesk status to Prisma CallStatus
    let callStatus: "COMPLETED" | "NO_ANSWER" | "BUSY" | "FAILED" = "COMPLETED";
    const s = Status?.toUpperCase();
    if (s === "ANSWER") callStatus = "COMPLETED";
    else if (s === "BUSY") callStatus = "BUSY";
    else if (s === "NOANSWER" || s === "CANCEL") callStatus = "NO_ANSWER";
    else callStatus = "FAILED";

    // Parse dates
    const startedAt = StartTime ? new Date(StartTime) : new Date();
    const endedAt = EndTime ? new Date(EndTime) : new Date();

    // Create Call Record
    const callRecord = await db.call.create({
      data: {
        leadId: lead.id,
        userId: userId,
        workspaceId: lead.workspaceId,
        type: Direction === "IVR" ? "INBOUND" : "OUTBOUND",
        status: callStatus,
        duration: parseInt(CallDuration || "0"),
        fromNumber: SourceNumber,
        toNumber: DestinationNumber,
        recordingUrl: CallRecordingUrl,
        notes: `CallerDesk Call. Status: ${Status}. Group: ${call_group}`,
        startedAt: startedAt,
        endedAt: endedAt,
      },
    });

    // Create Activity
    await db.activity.create({
      data: {
        leadId: lead.id,
        workspaceId: lead.workspaceId,
        userId: userId,
        type: "CALL",
        subject: Direction === "IVR" ? "Incoming Call" : "Outgoing Call",
        description: `Call with ${lead.firstName} ${lead.lastName}. Duration: ${CallDuration}s. Status: ${Status}.`,
        performedAt: startedAt,
      },
    });

    // Emit call completed event for real-time updates
    console.log(
      "[CallerDesk Webhook] Emitting call_completed event for workspace:",
      lead.workspaceId,
    );
    console.log("[CallerDesk Webhook] Call data:", callRecord);
    console.log("[CallerDesk Webhook] Lead data:", {
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
    });

    callEventEmitter.emitCallEvent({
      type: "call_completed",
      workspaceId: lead.workspaceId!,
      call: {
        ...callRecord,
        lead: {
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          phone: lead.phone,
          email: lead.email,
          status: lead.status,
          category: lead.category,
          priority: lead.priority,
          city: lead.city,
          state: lead.state,
          courseInterested: lead.courseInterested,
          revenue: lead.revenue,
          customFields: lead.customFields,
        },
      } as any,
    });

    console.log("[CallerDesk Webhook] Event emitted successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CallerDesk Webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
