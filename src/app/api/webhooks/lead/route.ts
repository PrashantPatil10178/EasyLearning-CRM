import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

/**
 * Universal Lead Webhook Endpoint
 * Accepts leads from various sources like Pabbly, Zapier, Make.com, etc.
 *
 * Usage:
 * POST to: {YOUR_DOMAIN}/api/webhooks/lead
 *
 * Headers:
 * - x-webhook-token: Your workspace webhook token (required for security)
 * - x-workspace-id: Your workspace ID (required)
 *
 * Body (JSON):
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "email": "john@example.com",
 *   "phone": "1234567890",
 *   "source": "Website", // Optional: WEBSITE, FACEBOOK, GOOGLE, REFERRAL, etc.
 *   "status": "NEW", // Optional: NEW, CONTACTED, QUALIFIED, etc.
 *   "priority": "MEDIUM", // Optional: LOW, MEDIUM, HIGH
 *   "city": "Mumbai",
 *   "state": "Maharashtra",
 *   "country": "India",
 *   "courseInterested": "Web Development",
 *   "tags": "Premium,Urgent", // Comma-separated
 *   "campaign": "Summer Campaign 2025",
 *   "customFields": { // Optional: any additional fields
 *     "company": "Acme Corp",
 *     "budget": "50000"
 *   }
 * }
 */

export async function POST(request: NextRequest) {
  try {
    // Get workspace ID from headers
    const workspaceId = request.headers.get("x-workspace-id");

    if (!workspaceId) {
      return NextResponse.json(
        {
          error: "Missing workspace ID",
          message: "Please provide x-workspace-id in headers",
        },
        { status: 400 },
      );
    }

    // Verify workspace exists
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Invalid workspace ID" },
        { status: 404 },
      );
    }

    // Verify webhook token for security
    const webhookToken = request.headers.get("x-webhook-token");

    if (!webhookToken) {
      return NextResponse.json(
        {
          error: "Missing webhook token",
          message: "Please provide x-webhook-token in headers",
        },
        { status: 401 },
      );
    }

    if (workspace.webhookToken !== webhookToken) {
      console.warn("[Webhook] Invalid webhook token provided");
      return NextResponse.json(
        { error: "Invalid webhook token" },
        { status: 401 },
      );
    }

    const body = await request.json();
    console.log("[Lead Webhook] Received:", body);

    // Helper function to map source to valid LeadSource enum
    const mapSourceToEnum = (sourceValue: string): string => {
      const normalizedSource = sourceValue
        .toUpperCase()
        .replace(/[^A-Z]/g, "_");

      // Direct mapping for common variations
      const sourceMap: Record<string, string> = {
        FACEBOOK: "FACEBOOK",
        FB: "FACEBOOK",
        FACEBOOK_AD: "FACEBOOK",
        FACEBOOK_LEAD_AD: "FACEBOOK",
        FACEBOOK_ADS: "FACEBOOK",
        INSTAGRAM: "INSTAGRAM",
        IG: "INSTAGRAM",
        GOOGLE: "GOOGLE_ADS",
        GOOGLE_AD: "GOOGLE_ADS",
        GOOGLE_ADS: "GOOGLE_ADS",
        ADWORDS: "GOOGLE_ADS",
        LINKEDIN: "LINKEDIN",
        REFERRAL: "REFERRAL",
        REFERENCE: "REFERRAL",
        WEBSITE: "WEBSITE",
        WEB: "WEBSITE",
        SITE: "WEBSITE",
        WALK_IN: "WALK_IN",
        WALKIN: "WALK_IN",
        PHONE: "PHONE_INQUIRY",
        PHONE_INQUIRY: "PHONE_INQUIRY",
        CALL: "PHONE_INQUIRY",
        WHATSAPP: "WHATSAPP",
        WA: "WHATSAPP",
        EMAIL: "EMAIL_CAMPAIGN",
        EMAIL_CAMPAIGN: "EMAIL_CAMPAIGN",
        EXHIBITION: "EXHIBITION",
        EXPO: "EXHIBITION",
        TRADE_SHOW: "EXHIBITION",
        PARTNER: "PARTNER",
        WEBHOOK: "WEBHOOK",
        OTHER: "OTHER",
      };

      return sourceMap[normalizedSource] || "OTHER";
    };

    // Extract lead data with flexible field mapping
    const {
      firstName,
      first_name,
      fname,
      lastName,
      last_name,
      lname,
      email,
      phone,
      mobile,
      phone_number,
      source = "WEBHOOK",
      status = "NEW_LEAD",
      priority = "MEDIUM",
      city,
      state,
      country,
      pincode,
      address,
      courseInterested,
      course_interested,
      course,
      courseLevel,
      preferredBatch,
      budget,
      tags,
      campaign,
      notes,
      customFields,
      ...rest
    } = body;

    // Map flexible field names
    const leadFirstName = firstName || first_name || fname;
    const leadLastName = lastName || last_name || lname;
    const leadPhone = phone || mobile || phone_number;
    const leadCourseInterested =
      courseInterested || course_interested || course;

    // Map source to valid enum value
    const mappedSource = mapSourceToEnum(source);

    // Validate required fields
    if (!leadFirstName) {
      return NextResponse.json(
        {
          error: "Missing required field: firstName",
          message: "Please provide firstName, first_name, or fname",
        },
        { status: 400 },
      );
    }

    if (!leadPhone) {
      return NextResponse.json(
        {
          error: "Missing required field: phone",
          message: "Please provide phone, mobile, or phone_number",
        },
        { status: 400 },
      );
    }

    // Check for duplicate lead by phone in this workspace
    const existingLead = await db.lead.findFirst({
      where: {
        phone: leadPhone,
        workspaceId,
      },
    });

    if (existingLead) {
      console.log(`[Lead Webhook] Duplicate lead found: ${leadPhone}`);

      // Update existing lead instead of creating duplicate
      const updatedLead = await db.lead.update({
        where: { id: existingLead.id },
        data: {
          firstName: leadFirstName,
          lastName: leadLastName,
          email: email || existingLead.email,
          city: city || existingLead.city,
          state: state || existingLead.state,
          country: country || existingLead.country,
          pincode: pincode || existingLead.pincode,
          address: address || existingLead.address,
          courseInterested:
            leadCourseInterested || existingLead.courseInterested,
          courseLevel: courseLevel || existingLead.courseLevel,
          preferredBatch: preferredBatch || existingLead.preferredBatch,
          budget: budget || existingLead.budget,
          tags: tags || existingLead.tags,
          campaign: campaign || existingLead.campaign,
          customFields: customFields
            ? JSON.stringify({
                ...JSON.parse(existingLead.customFields || "{}"),
                ...customFields,
              })
            : existingLead.customFields,
        },
      });

      // Log activity
      await db.activity.create({
        data: {
          leadId: updatedLead.id,
          type: "SYSTEM",
          subject: "Lead Updated via Webhook",
          message: `Lead information updated from ${source}`,
          workspaceId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Lead updated successfully",
        lead: updatedLead,
        action: "updated",
      });
    }

    // Get a workspace member to use as creator (required field)
    // First, try to find the workspace owner
    const workspaceWithOwner = await db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { role: "ADMIN" },
          take: 1,
          include: { user: true },
        },
      },
    });

    let creatorUserId = workspaceWithOwner?.members[0]?.userId;

    // If no admin found, get any workspace member
    if (!creatorUserId) {
      const anyMember = await db.workspaceMember.findFirst({
        where: { workspaceId },
      });
      creatorUserId = anyMember?.userId;
    }

    if (!creatorUserId) {
      return NextResponse.json(
        {
          error: "No users found in workspace",
          message: "Workspace has no members to assign lead to",
        },
        { status: 400 },
      );
    }

    // Auto-assign lead based on rules with advanced strategies
    let assignedUserId: string | undefined;
    let assignmentStrategy = "NONE";

    // Fetch matching rules (source match or wildcard)
    const matchingRules = await db.webhookAssignmentRule.findMany({
      where: {
        workspaceId,
        isEnabled: true,
        OR: [{ source: mappedSource }, { source: source }, { source: null }],
      },
      orderBy: { priority: "asc" },
    });

    if (matchingRules.length > 0) {
      // Separate rules by type
      const specificRules = matchingRules.filter(
        (r) => r.assignmentType === "SPECIFIC",
      );
      const roundRobinRules = matchingRules.filter(
        (r) => r.assignmentType === "ROUND_ROBIN",
      );
      const percentageRules = matchingRules.filter(
        (r) => r.assignmentType === "PERCENTAGE",
      );

      // Priority: SPECIFIC > ROUND_ROBIN > PERCENTAGE
      if (specificRules.length > 0) {
        assignedUserId = specificRules[0]!.assigneeId;
        assignmentStrategy = "SPECIFIC";
      } else if (roundRobinRules.length > 0) {
        // Round Robin: Pick least recently assigned
        const nextRule = roundRobinRules.reduce((prev, curr) =>
          !prev.lastAssignedAt ||
          (curr.lastAssignedAt && curr.lastAssignedAt < prev.lastAssignedAt)
            ? curr
            : prev,
        );

        assignedUserId = nextRule.assigneeId;
        assignmentStrategy = "ROUND_ROBIN";

        await db.webhookAssignmentRule.update({
          where: { id: nextRule.id },
          data: {
            lastAssignedAt: new Date(),
            assignmentCount: { increment: 1 },
          },
        });
      } else if (percentageRules.length > 0) {
        // Percentage: Weighted random selection
        const totalPercentage = percentageRules.reduce(
          (sum, r) => sum + (r.percentage || 0),
          0,
        );
        const random = Math.random() * 100; // Random 0-100

        let cumulative = 0;
        for (const rule of percentageRules) {
          cumulative += rule.percentage || 0;
          if (random <= cumulative) {
            assignedUserId = rule.assigneeId;
            assignmentStrategy = "PERCENTAGE";

            await db.webhookAssignmentRule.update({
              where: { id: rule.id },
              data: {
                lastAssignedAt: new Date(),
                assignmentCount: { increment: 1 },
              },
            });
            break;
          }
        }
      }

      console.log(
        `[Lead Webhook] Assigned via ${assignmentStrategy} to: ${assignedUserId || "none"}`,
      );
    }

    // Create new lead
    const newLead = await db.lead.create({
      data: {
        firstName: leadFirstName,
        lastName: leadLastName,
        email: email || null,
        phone: leadPhone,
        source: mappedSource as any,
        category: "FRESH" as any, // New leads always start in FRESH category
        status: status as any,
        priority: priority as any,
        city,
        state,
        country,
        pincode,
        address,
        courseInterested: leadCourseInterested,
        courseLevel,
        preferredBatch,
        budget: budget ? parseFloat(budget) : null,
        tags,
        campaign,
        customFields: customFields ? JSON.stringify(customFields) : null,
        workspaceId,
        createdById: creatorUserId, // Required: system/webhook creator
        ownerId: assignedUserId, // Auto-assign
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        leadId: newLead.id,
        type: "SYSTEM",
        subject: "Lead Created via Webhook",
        message: `New lead received from ${mappedSource} (original: ${source})${notes ? `: ${notes}` : ""}${assignedUserId ? ` (Auto-assigned via ${assignmentStrategy})` : ""}`,
        workspaceId,
      },
    });

    console.log(`[Lead Webhook] Created new lead: ${newLead.id}`);

    return NextResponse.json({
      success: true,
      message: "Lead created successfully",
      lead: {
        id: newLead.id,
        firstName: newLead.firstName,
        lastName: newLead.lastName,
        phone: newLead.phone,
        email: newLead.email,
        source: mappedSource,
        originalSource: source,
        assignedTo: assignedUserId,
        assignmentStrategy: assignmentStrategy,
      },
      action: "created",
    });
  } catch (error) {
    console.error("[Lead Webhook] Error:", error);

    // Better error messages for common issues
    let errorMessage = "Unknown error occurred";
    let errorDetails = "";

    if (error instanceof Error) {
      errorMessage = error.message;

      // Provide helpful error messages
      if (errorMessage.includes("Unique constraint")) {
        errorMessage = "Duplicate lead detected";
        errorDetails =
          "A lead with this phone number already exists in this workspace";
      } else if (errorMessage.includes("Foreign key constraint")) {
        errorMessage = "Invalid reference";
        errorDetails = "One of the provided IDs does not exist";
      } else if (errorMessage.includes("Invalid value for argument")) {
        errorMessage = "Invalid field value";
        errorDetails = "One or more field values are not in the correct format";
      }
    }

    return NextResponse.json(
      {
        error: "Failed to process webhook",
        message: errorMessage,
        details: errorDetails || undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// GET endpoint to test webhook is accessible
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Lead webhook endpoint is active",
    endpoint: "/api/webhooks/lead",
    method: "POST",
    requiredHeaders: {
      "x-workspace-id": "Your workspace ID (required)",
      "x-webhook-token": "Your workspace webhook token (required)",
      "Content-Type": "application/json",
    },
    requiredFields: {
      firstName: "string (required)",
      phone: "string (required)",
    },
    optionalFields: {
      lastName: "string",
      email: "string",
      source: "WEBSITE | FACEBOOK | GOOGLE | REFERRAL | etc.",
      status: "NEW | CONTACTED | QUALIFIED | etc.",
      priority: "LOW | MEDIUM | HIGH",
      city: "string",
      state: "string",
      country: "string",
      courseInterested: "string",
      customFields: "object",
    },
  });
}
