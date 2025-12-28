/**
 * WhatsApp Trigger Service
 * Automatically sends WhatsApp messages via AISensy when lead status changes
 * Based on configured triggers in WhatsAppTrigger model
 */

import { type PrismaClient } from "@prisma/client";
import { env } from "@/env";

interface Lead {
  id: string;
  firstName: string;
  lastName?: string | null;
  phone: string;
  email?: string | null;
  source?: string | null;
  status?: string | null;
  courseInterested?: string | null;
}

/**
 * Normalize phone number - add 91 prefix for 10-digit Indian numbers
 * Matches PHP: if (strlen($phone) == 10) { $phone = "91" . $phone; }
 */
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, ""); // Remove non-digits

  if (cleaned.length === 10) {
    return "91" + cleaned; // Add India country code
  }

  return cleaned;
}

/**
 * Replace template parameters with actual lead data
 * Example: "{{FirstName}}" → "John"
 */
function replaceTemplateParams(
  params: string[],
  lead: Lead,
  fallbacks: Record<string, string>,
): string[] {
  return params.map((param) => {
    // Remove {{ }} from template
    const key = param.replace(/{{|}}/g, "");

    // Map to lead fields
    switch (key) {
      case "FirstName":
        return lead.firstName || fallbacks.FirstName || "User";
      case "Phone":
        return lead.phone || fallbacks.Phone || "";
      case "Email":
        return lead.email || fallbacks.Email || "N/A";
      case "Source":
        return lead.source || fallbacks.Source || "";
      case "CourseInterested":
        return lead.courseInterested || fallbacks.CourseInterested || "";
      case "FeedbackLink":
        return fallbacks.FeedbackLink || "";
      case "Amount":
        return fallbacks.Amount || "";
      case "Date":
        return fallbacks.Date || new Date().toLocaleDateString();
      default:
        return param; // Return as-is if not recognized
    }
  });
}

/**
 * Send WhatsApp message via AISensy API
 * Matches PHP: aisensy_send($phone, $campaignName, $source, $templateParams)
 */
async function sendAISensyMessage(
  phone: string,
  campaignName: string,
  source: string,
  templateParams: string[],
): Promise<{ success: boolean; message: string }> {
  const AISENSY_API_URL = env.AISENSY_API_URL;
  const AISENSY_API_KEY = env.AISENSY_API_KEY;

  if (!AISENSY_API_URL || !AISENSY_API_KEY) {
    console.warn("AISensy credentials not configured");
    return { success: false, message: "AISensy not configured" };
  }

  try {
    const payload = {
      apiKey: AISENSY_API_KEY,
      campaignName: campaignName,
      destination: phone,
      userName: source,
      templateParams: templateParams,
      source: source,
      media: {},
      buttons: [],
      carouselCards: [],
      location: {},
    };

    const response = await fetch(AISENSY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    // AISensy returns "Success." on success
    if (response.ok && responseText.includes("Success")) {
      return { success: true, message: "WhatsApp sent successfully" };
    } else {
      console.error("AISensy error:", responseText);
      return { success: false, message: responseText };
    }
  } catch (error) {
    console.error("AISensy API error:", error);
    return { success: false, message: String(error) };
  }
}

/**
 * Trigger WhatsApp on status change
 * Main function that checks if trigger exists and sends WhatsApp
 * Matches PHP: trigger_whatsapp_on_status($pdo, $leadId, $userId, $status, $lead)
 */
export async function triggerWhatsAppOnStatus(
  db: PrismaClient,
  leadId: string,
  userId: string,
  status: string,
  workspaceId: string,
): Promise<void> {
  try {
    // Check if trigger exists for this status
    const trigger = await db.whatsAppTrigger.findFirst({
      where: {
        workspaceId: workspaceId,
        status: status,
        isEnabled: true,
      },
    });

    if (!trigger) {
      console.log(`No active WhatsApp trigger for status: ${status}`);
      return;
    }

    // Get lead details
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        source: true,
        status: true,
        courseInterested: true,
      },
    });

    if (!lead) {
      console.error(`Lead not found: ${leadId}`);
      return;
    }

    // Normalize phone
    const normalizedPhone = normalizePhone(lead.phone);

    if (!normalizedPhone) {
      console.error(`Invalid phone number for lead: ${leadId}`);
      return;
    }

    // Parse template parameters
    let templateParams: string[] = [];
    try {
      templateParams = JSON.parse(trigger.templateParamsJson || "[]");
    } catch (e) {
      console.error("Invalid templateParamsJson:", e);
      templateParams = [];
    }

    // Parse fallback parameters
    let fallbackParams: Record<string, string> = {};
    try {
      fallbackParams = JSON.parse(trigger.paramsFallbackJson || "{}");
    } catch (e) {
      console.error("Invalid paramsFallbackJson:", e);
      fallbackParams = {};
    }

    // Replace template parameters with actual data
    const replacedParams = replaceTemplateParams(
      templateParams,
      lead as Lead,
      fallbackParams,
    );

    // Send WhatsApp via AISensy
    const result = await sendAISensyMessage(
      normalizedPhone,
      trigger.campaignName || "",
      trigger.source || "EasyLearning CRM",
      replacedParams,
    );

    // Log activity
    await db.activity.create({
      data: {
        type: "WHATSAPP",
        subject: `WhatsApp sent via ${trigger.campaignName}`,
        description: result.success
          ? `WhatsApp message sent successfully to ${normalizedPhone}`
          : `Failed to send WhatsApp: ${result.message}`,
        leadId: leadId,
        userId: userId,
        workspaceId: workspaceId,
      },
    });

    if (result.success) {
      console.log(
        `✅ WhatsApp sent to ${normalizedPhone} for status ${status} via campaign ${trigger.campaignName}`,
      );
    } else {
      console.error(`❌ WhatsApp failed for lead ${leadId}: ${result.message}`);
    }
  } catch (error) {
    console.error("Error triggering WhatsApp:", error);
  }
}
