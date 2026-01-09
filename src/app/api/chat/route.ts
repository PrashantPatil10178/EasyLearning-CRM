import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { google } from "@ai-sdk/google";

// Mock database function to simulate lead analytics
async function fetchLeadAnalytics() {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    sources: [
      { source: "Website", count: 520, percentage: 45 },
      { source: "Referrals", count: 322, percentage: 28 },
      { source: "Social Media", count: 207, percentage: 18 },
      { source: "Paid Ads", count: 104, percentage: 9 },
    ],
    totalLeads: 1153,
    periodComparison: {
      current: 1153,
      previous: 861,
      change: 34,
    },
  };
}

// Mock database function to simulate revenue stats
async function fetchRevenueStats() {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  return {
    totalRevenue: 4215550,
    revenueGrowth: 45,
    topCampaigns: [
      { name: "Summer Promo", revenue: 987500, leads: 234, conversions: 32 },
      { name: "Winter Sale", revenue: 856300, leads: 189, conversions: 28 },
      { name: "Spring Launch", revenue: 745200, leads: 176, conversions: 24 },
    ],
    monthlyBreakdown: [
      { month: "December", revenue: 1124300 },
      { month: "November", revenue: 1087200 },
      { month: "October", revenue: 1004050 },
    ],
    conversionRate: 13.5,
  };
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return new Response(
      "Missing Google API Key. Please add GOOGLE_GENERATIVE_AI_API_KEY to your .env file",
      { status: 500 },
    );
  }

  // Get the last user message to check what analytics data to fetch
  const modelMessages = await convertToModelMessages(messages);
  const lastUserMessage = modelMessages[modelMessages.length - 1];
  const content =
    typeof lastUserMessage.content === "string"
      ? lastUserMessage.content.toLowerCase()
      : "";

  let analyticsData = "";

  // Fetch analytics data based on user query
  if (content.includes("lead") && !content.includes("revenue")) {
    const data = await fetchLeadAnalytics();
    analyticsData = `\n\n📊 **Lead Analytics Data:**\n- Total Leads: ${data.totalLeads}\n- Growth: +${data.periodComparison.change}%\n- Top Sources:\n${data.sources.map((s) => `  • ${s.source}: ${s.count} leads (${s.percentage}%)`).join("\n")}`;
  } else if (content.includes("revenue") || content.includes("campaign")) {
    const data = await fetchRevenueStats();
    analyticsData = `\n\n💰 **Revenue Analytics Data:**\n- Total Revenue: ₹${(data.totalRevenue / 1000000).toFixed(2)}M\n- Growth: +${data.revenueGrowth}%\n- Conversion Rate: ${data.conversionRate}%\n- Top Campaigns:\n${data.topCampaigns.map((c) => `  • ${c.name}: ₹${(c.revenue / 1000).toFixed(0)}K (${c.conversions} conversions)`).join("\n")}`;
  } else if (
    content.includes("summary") ||
    content.includes("overview") ||
    content.includes("performance")
  ) {
    const [leadData, revenueData] = await Promise.all([
      fetchLeadAnalytics(),
      fetchRevenueStats(),
    ]);
    analyticsData = `\n\n📊 **Complete Performance Summary:**\n\n**Leads:**\n- Total: ${leadData.totalLeads}\n- Growth: +${leadData.periodComparison.change}%\n- Top Source: ${leadData.sources[0]?.source} (${leadData.sources[0]?.percentage}%)\n\n**Revenue:**\n- Total: ₹${(revenueData.totalRevenue / 1000000).toFixed(2)}M\n- Growth: +${revenueData.revenueGrowth}%\n- Conversion Rate: ${revenueData.conversionRate}%\n- Top Campaign: ${revenueData.topCampaigns[0]?.name}`;
  }

  // Add analytics data to the last message if available
  const messagesWithAnalytics = analyticsData
    ? [
        ...modelMessages.slice(0, -1),
        {
          ...lastUserMessage,
          content:
            (typeof lastUserMessage.content === "string"
              ? lastUserMessage.content
              : "") + analyticsData,
        },
      ]
    : modelMessages;

  const result = streamText({
    model: google("gemma-3-27b-it"),
    system: `You are a Senior Data Analyst for Easylearning CRM. Your role is to provide accurate, concise, and professional analytics insights.

CRITICAL RULES:
1. NEVER hallucinate or make up numbers
2. If data is unavailable, explicitly state "I don't have that data available"
3. Be concise and professional in your responses
4. When presenting data, use clear formatting with bullet points or tables
5. Always provide context and actionable insights
6. Use emojis sparingly and professionally (📊, 📈, 💰, 🎯)`,
    messages: messagesWithAnalytics,
  });

  return result.toUIMessageStreamResponse();
}
