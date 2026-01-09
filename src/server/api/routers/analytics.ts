import { z } from "zod";
import {
  createTRPCRouter,
  protectedWorkspaceProcedure,
} from "@/server/api/trpc";
import {
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  format,
  subDays,
} from "date-fns";

export const analyticsRouter = createTRPCRouter({
  // Get time series data for line charts
  getTimeSeriesData: protectedWorkspaceProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      // Generate all dates in the range
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

      // Fetch leads grouped by day
      const leads = await ctx.db.lead.groupBy({
        by: ["createdAt"],
        where: {
          workspaceId: ctx.workspaceId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
      });

      // Fetch conversions (leads with status CONVERTED or WON)
      const conversions = await ctx.db.lead.groupBy({
        by: ["updatedAt"],
        where: {
          workspaceId: ctx.workspaceId,
          status: {
            in: ["CONVERTED", "WON"],
          },
          updatedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
      });

      // Create a map for quick lookup
      const leadsMap = new Map<string, number>();
      const conversionsMap = new Map<string, number>();

      leads.forEach((lead) => {
        const dateKey = format(startOfDay(lead.createdAt), "yyyy-MM-dd");
        leadsMap.set(dateKey, (leadsMap.get(dateKey) || 0) + lead._count);
      });

      conversions.forEach((conversion) => {
        const dateKey = format(startOfDay(conversion.updatedAt), "yyyy-MM-dd");
        conversionsMap.set(
          dateKey,
          (conversionsMap.get(dateKey) || 0) + conversion._count,
        );
      });

      // Build the time series data
      const timeSeriesData = dateRange.map((date) => {
        const dateKey = format(date, "yyyy-MM-dd");
        return {
          date: dateKey,
          leads: leadsMap.get(dateKey) || 0,
          conversions: conversionsMap.get(dateKey) || 0,
        };
      });

      return timeSeriesData;
    }),

  // Get key metrics with comparison
  getKeyMetrics: protectedWorkspaceProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      // Calculate previous period for comparison
      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const previousStartDate = subDays(startDate, daysDiff);
      const previousEndDate = subDays(endDate, daysDiff);

      // Current period metrics
      const [
        totalLeads,
        totalConversions,
        activeLeads,
        revenueData,
        previousLeads,
        previousConversions,
        previousActiveLeads,
        previousRevenue,
      ] = await Promise.all([
        // Current period
        ctx.db.lead.count({
          where: {
            workspaceId: ctx.workspaceId,
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        ctx.db.lead.count({
          where: {
            workspaceId: ctx.workspaceId,
            status: { in: ["CONVERTED", "WON"] },
            updatedAt: { gte: startDate, lte: endDate },
          },
        }),
        ctx.db.lead.count({
          where: {
            workspaceId: ctx.workspaceId,
            category: "ACTIVE",
          },
        }),
        ctx.db.lead.aggregate({
          where: {
            workspaceId: ctx.workspaceId,
            createdAt: { gte: startDate, lte: endDate },
          },
          _sum: { revenue: true },
        }),
        // Previous period
        ctx.db.lead.count({
          where: {
            workspaceId: ctx.workspaceId,
            createdAt: { gte: previousStartDate, lte: previousEndDate },
          },
        }),
        ctx.db.lead.count({
          where: {
            workspaceId: ctx.workspaceId,
            status: { in: ["CONVERTED", "WON"] },
            updatedAt: { gte: previousStartDate, lte: previousEndDate },
          },
        }),
        ctx.db.lead.count({
          where: {
            workspaceId: ctx.workspaceId,
            category: "ACTIVE",
            createdAt: { gte: previousStartDate, lte: previousEndDate },
          },
        }),
        ctx.db.lead.aggregate({
          where: {
            workspaceId: ctx.workspaceId,
            createdAt: { gte: previousStartDate, lte: previousEndDate },
          },
          _sum: { revenue: true },
        }),
      ]);

      const estimatedRevenue = revenueData._sum.revenue || 0;
      const previousRevenueAmount = previousRevenue._sum.revenue || 0;

      // Calculate changes
      const leadsChange = totalLeads - previousLeads;
      const leadsChangePercent =
        previousLeads > 0 ? (leadsChange / previousLeads) * 100 : 0;

      const conversionsChange = totalConversions - previousConversions;
      const conversionsChangePercent =
        previousConversions > 0
          ? (conversionsChange / previousConversions) * 100
          : 0;

      const activeLeadsChange = activeLeads - previousActiveLeads;
      const activeLeadsChangePercent =
        previousActiveLeads > 0
          ? (activeLeadsChange / previousActiveLeads) * 100
          : 0;

      const revenueChange = estimatedRevenue - previousRevenueAmount;
      const revenueChangePercent =
        previousRevenueAmount > 0
          ? (revenueChange / previousRevenueAmount) * 100
          : 0;

      // Generate growth message
      let growthMessage = "Keep it up!";
      if (leadsChangePercent > 20) {
        growthMessage = `Outstanding! Your CRM got ${Math.round(leadsChangePercent)}% more leads than usual in the last ${daysDiff} days.`;
      } else if (leadsChangePercent > 0) {
        growthMessage = `Keep it up! Your CRM got ${Math.round(leadsChangePercent)}% more leads than usual in the last ${daysDiff} days.`;
      } else if (leadsChangePercent < -10) {
        growthMessage = `Your CRM got ${Math.abs(Math.round(leadsChangePercent))}% fewer leads than usual in the last ${daysDiff} days.`;
      }

      // Get real-time active leads
      const activeLeadsNow = await ctx.db.lead.count({
        where: {
          workspaceId: ctx.workspaceId,
          category: "ACTIVE",
        },
      });

      // Get 48h views (activities)
      const views48h = await ctx.db.activity.count({
        where: {
          workspaceId: ctx.workspaceId,
          createdAt: {
            gte: subDays(new Date(), 2),
          },
        },
      });

      return {
        totalLeads,
        totalConversions,
        activeLeads,
        estimatedRevenue: Number(estimatedRevenue),
        previousLeads,
        expectedLeads: Math.round((previousLeads + totalLeads) / 2),
        leadsChange,
        leadsChangePercent: Math.abs(leadsChangePercent),
        conversionsChange,
        conversionsChangePercent:
          totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0,
        activeLeadsChange,
        activeLeadsChangePercent: Math.abs(activeLeadsChangePercent),
        revenueChange: Number(revenueChange),
        revenueChangeAmount: Number(Math.abs(revenueChange)),
        revenueChangePercent: Math.abs(revenueChangePercent),
        growthMessage,
        activeLeadsNow,
        views48h,
      };
    }),

  // Get top performing content (campaigns/lead sources)
  getTopContent: protectedWorkspaceProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        limit: z.number().default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate, limit } = input;

      // Get top campaigns by lead count
      const campaigns = await ctx.db.campaign.findMany({
        where: {
          workspaceId: ctx.workspaceId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          totalLeads: "desc",
        },
        take: limit,
        select: {
          id: true,
          name: true,
          totalLeads: true,
        },
      });

      return campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        leads: campaign.totalLeads,
      }));
    }),

  // Get lead source breakdown
  getLeadSourceBreakdown: protectedWorkspaceProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      const sources = await ctx.db.lead.groupBy({
        by: ["source"],
        where: {
          workspaceId: ctx.workspaceId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
      });

      const total = sources.reduce((sum, s) => sum + s._count, 0);

      return sources.map((source) => ({
        source: source.source || "Unknown",
        count: source._count,
        percentage: total > 0 ? (source._count / total) * 100 : 0,
      }));
    }),

  // Get comparison data for advanced analytics
  getComparisonData: protectedWorkspaceProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        breakdownType: z.enum(["campaigns", "sources", "owners", "statuses"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate, breakdownType } = input;

      if (breakdownType === "campaigns") {
        // Get campaign data
        const campaigns = await ctx.db.campaign.findMany({
          where: {
            workspaceId: ctx.workspaceId,
          },
          select: {
            id: true,
            name: true,
            totalLeads: true,
            convertedLeads: true,
            _count: {
              select: { leads: true },
            },
          },
        });

        // Get leads per campaign over time
        const campaignLeadsTimeline = await ctx.db.campaignLead.groupBy({
          by: ["campaignId", "createdAt"],
          where: {
            campaign: {
              workspaceId: ctx.workspaceId,
            },
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          _count: true,
        });

        const totalLeads = campaigns.reduce((sum, c) => sum + c.totalLeads, 0);
        const totalRevenue = await ctx.db.lead.aggregate({
          where: {
            workspaceId: ctx.workspaceId,
            createdAt: { gte: startDate, lte: endDate },
          },
          _sum: { revenue: true },
        });

        return campaigns.map((campaign) => {
          const timeline = eachDayOfInterval({
            start: startDate,
            end: endDate,
          }).map((date) => {
            const dateKey = format(date, "yyyy-MM-dd");
            const dayLeads = campaignLeadsTimeline.filter(
              (cl) =>
                cl.campaignId === campaign.id &&
                format(startOfDay(cl.createdAt), "yyyy-MM-dd") === dateKey,
            );
            return {
              date: dateKey,
              value: dayLeads.reduce((sum, dl) => sum + dl._count, 0),
            };
          });

          return {
            id: campaign.id,
            name: campaign.name,
            leads: campaign.totalLeads,
            leadsPercentage:
              totalLeads > 0 ? (campaign.totalLeads / totalLeads) * 100 : 0,
            conversions: campaign.convertedLeads,
            conversionRate:
              campaign.totalLeads > 0
                ? (campaign.convertedLeads / campaign.totalLeads) * 100
                : 0,
            revenue: 0, // Can be calculated if needed
            revenuePercentage: 0,
            calls: 0,
            timeline,
          };
        });
      }

      if (breakdownType === "sources") {
        // Get lead source data
        const sources = await ctx.db.lead.groupBy({
          by: ["source"],
          where: {
            workspaceId: ctx.workspaceId,
            createdAt: { gte: startDate, lte: endDate },
          },
          _count: true,
        });

        const totalLeads = sources.reduce((sum, s) => sum + s._count, 0);

        // Get timeline for each source
        const sourceTimeline = await ctx.db.lead.groupBy({
          by: ["source", "createdAt"],
          where: {
            workspaceId: ctx.workspaceId,
            createdAt: { gte: startDate, lte: endDate },
          },
          _count: true,
        });

        return sources.map((source, index) => {
          const sourceName = source.source || "Unknown";
          const timeline = eachDayOfInterval({
            start: startDate,
            end: endDate,
          }).map((date) => {
            const dateKey = format(date, "yyyy-MM-dd");
            const dayLeads = sourceTimeline.filter(
              (st) =>
                (st.source || "Unknown") === sourceName &&
                format(startOfDay(st.createdAt), "yyyy-MM-dd") === dateKey,
            );
            return {
              date: dateKey,
              value: dayLeads.reduce((sum, dl) => sum + dl._count, 0),
            };
          });

          return {
            id: `source-${index}`,
            name: sourceName,
            leads: source._count,
            leadsPercentage:
              totalLeads > 0 ? (source._count / totalLeads) * 100 : 0,
            conversions: 0,
            conversionRate: 0,
            revenue: 0,
            revenuePercentage: 0,
            calls: 0,
            timeline,
          };
        });
      }

      if (breakdownType === "owners") {
        // Get owner/team member data
        const owners = await ctx.db.lead.groupBy({
          by: ["ownerId"],
          where: {
            workspaceId: ctx.workspaceId,
            createdAt: { gte: startDate, lte: endDate },
          },
          _count: true,
        });

        const totalLeads = owners.reduce((sum, o) => sum + o._count, 0);

        // Get user names
        const ownerIds = owners
          .map((o) => o.ownerId)
          .filter(Boolean) as string[];
        const users = await ctx.db.user.findMany({
          where: { id: { in: ownerIds } },
          select: { id: true, name: true },
        });

        // Get timeline for each owner
        const ownerTimeline = await ctx.db.lead.groupBy({
          by: ["ownerId", "createdAt"],
          where: {
            workspaceId: ctx.workspaceId,
            createdAt: { gte: startDate, lte: endDate },
          },
          _count: true,
        });

        return owners.map((owner) => {
          const user = users.find((u) => u.id === owner.ownerId);
          const timeline = eachDayOfInterval({
            start: startDate,
            end: endDate,
          }).map((date) => {
            const dateKey = format(date, "yyyy-MM-dd");
            const dayLeads = ownerTimeline.filter(
              (ot) =>
                ot.ownerId === owner.ownerId &&
                format(startOfDay(ot.createdAt), "yyyy-MM-dd") === dateKey,
            );
            return {
              date: dateKey,
              value: dayLeads.reduce((sum, dl) => sum + dl._count, 0),
            };
          });

          return {
            id: owner.ownerId || "unassigned",
            name: user?.name || "Unassigned",
            leads: owner._count,
            leadsPercentage:
              totalLeads > 0 ? (owner._count / totalLeads) * 100 : 0,
            conversions: 0,
            conversionRate: 0,
            revenue: 0,
            revenuePercentage: 0,
            calls: 0,
            timeline,
          };
        });
      }

      if (breakdownType === "statuses") {
        // Get status data
        const statuses = await ctx.db.lead.groupBy({
          by: ["status"],
          where: {
            workspaceId: ctx.workspaceId,
            createdAt: { gte: startDate, lte: endDate },
          },
          _count: true,
        });

        const totalLeads = statuses.reduce((sum, s) => sum + s._count, 0);

        // Get timeline for each status
        const statusTimeline = await ctx.db.lead.groupBy({
          by: ["status", "createdAt"],
          where: {
            workspaceId: ctx.workspaceId,
            createdAt: { gte: startDate, lte: endDate },
          },
          _count: true,
        });

        return statuses.map((status, index) => {
          const timeline = eachDayOfInterval({
            start: startDate,
            end: endDate,
          }).map((date) => {
            const dateKey = format(date, "yyyy-MM-dd");
            const dayLeads = statusTimeline.filter(
              (st) =>
                st.status === status.status &&
                format(startOfDay(st.createdAt), "yyyy-MM-dd") === dateKey,
            );
            return {
              date: dateKey,
              value: dayLeads.reduce((sum, dl) => sum + dl._count, 0),
            };
          });

          return {
            id: `status-${index}`,
            name: status.status,
            leads: status._count,
            leadsPercentage:
              totalLeads > 0 ? (status._count / totalLeads) * 100 : 0,
            conversions: 0,
            conversionRate: 0,
            revenue: 0,
            revenuePercentage: 0,
            calls: 0,
            timeline,
          };
        });
      }

      return [];
    }),

  // Get agent call analytics
  getAgentCallAnalytics: protectedWorkspaceProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      // 1. Fetch actual Calls
      const calls = await ctx.db.call.findMany({
        where: {
          workspaceId: ctx.workspaceId,
          startedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          user: {
            select: { name: true },
          },
          lead: {
            select: {
              campaign: true,
            },
          },
        },
        orderBy: {
          startedAt: "asc",
        },
      });

      // 2. Build Timeline Data
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const timeline = dateRange.map((date) => {
        const dateKey = format(date, "yyyy-MM-dd");

        // Filter calls for this day
        const dayCalls = calls.filter(
          (c) => format(startOfDay(c.startedAt), "yyyy-MM-dd") === dateKey,
        );

        const totalCalls = dayCalls.length;
        const activeAgents = new Set(dayCalls.map((c) => c.userId)).size;
        const answered = dayCalls.filter(
          (c) => c.status === "COMPLETED",
        ).length;
        const missed = totalCalls - answered;
        const avgCallsPerAgent =
          activeAgents > 0 ? Math.round(totalCalls / activeAgents) : 0;

        return {
          date: dateKey,
          activeAgents,
          totalCalls,
          avgCallsPerAgent,
          answered,
          missed,
        };
      });

      // 3. Overall Stats
      const uniqueAgents = new Set(calls.map((c) => c.userId));
      const totalCalls = calls.length;
      const totalAnswered = calls.filter(
        (c) => c.status === "COMPLETED",
      ).length;
      const answerRate =
        totalCalls > 0
          ? ((totalAnswered / totalCalls) * 100).toFixed(1)
          : "0.0";

      const avgCallsPerAgent =
        uniqueAgents.size > 0 ? Math.round(totalCalls / uniqueAgents.size) : 0;

      // 4. Agent Stats
      const agentStatsMap = new Map<
        string,
        {
          name: string;
          calls: number;
          answered: number;
          conversions: number;
        }
      >();

      calls.forEach((c) => {
        const existing = agentStatsMap.get(c.userId) || {
          name: c.user?.name || "Unknown",
          calls: 0,
          answered: 0,
          conversions: 0,
        };

        existing.calls++;
        if (c.status === "COMPLETED") existing.answered++;
        if (c.outcome === "CONVERTED" || c.outcome === "INTERESTED")
          existing.conversions++;

        agentStatsMap.set(c.userId, existing);
      });

      const topAgents = Array.from(agentStatsMap.values())
        .sort((a, b) => b.calls - a.calls)
        .slice(0, 5)
        .map((a) => ({
          ...a,
          answerRate:
            a.calls > 0 ? ((a.answered / a.calls) * 100).toFixed(1) : "0.0",
        }));

      // 5. Campaign Stats
      // Grouping by lead.campaign string field
      const campaignStatsMap = new Map<
        string,
        {
          name: string;
          agents: Set<string>;
          totalCalls: number;
          answered: number;
          conversions: number;
          convertedLeads: number; // To track unique lead conversions if needed, but simplified here
        }
      >();

      calls.forEach((c) => {
        const campaignName = c.lead?.campaign || "Direct / Other";
        const existing = campaignStatsMap.get(campaignName) || {
          name: campaignName,
          agents: new Set(),
          totalCalls: 0,
          answered: 0,
          conversions: 0,
          convertedLeads: 0,
        };

        existing.totalCalls++;
        existing.agents.add(c.userId);
        if (c.status === "COMPLETED") existing.answered++;
        if (c.outcome === "CONVERTED" || c.outcome === "INTERESTED")
          existing.conversions++;

        campaignStatsMap.set(campaignName, existing);
      });

      const campaignStats = Array.from(campaignStatsMap.values()).map((c) => ({
        name: c.name,
        agents: c.agents.size,
        totalCalls: c.totalCalls,
        callsPerAgent:
          c.agents.size > 0 ? Math.round(c.totalCalls / c.agents.size) : 0,
        answered: c.answered,
        conversion:
          c.totalCalls > 0
            ? ((c.conversions / c.totalCalls) * 100).toFixed(1)
            : "0.0",
      }));

      return {
        overall: {
          totalAgents: uniqueAgents.size,
          activeAgents: timeline[timeline.length - 1]?.activeAgents || 0,
          totalCalls,
          avgCallsPerAgent,
          topPerformer: topAgents[0]?.name || "N/A",
          answeredCalls: totalAnswered,
          missedCalls: totalCalls - totalAnswered,
          answerRate: parseFloat(answerRate),
        },
        timeline,
        campaignStats,
        topAgents,
      };
    }),

  // Get revenue analytics
  getRevenueAnalytics: protectedWorkspaceProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      // Calculate previous period
      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const previousStartDate = subDays(startDate, daysDiff);
      const previousEndDate = subDays(endDate, daysDiff);

      const [currentRevenue, previousRevenue, revenueByCampaign, dailyRevenue] =
        await Promise.all([
          // Current period revenue
          ctx.db.lead.aggregate({
            where: {
              workspaceId: ctx.workspaceId,
              createdAt: { gte: startDate, lte: endDate },
            },
            _sum: { revenue: true },
          }),
          // Previous period revenue
          ctx.db.lead.aggregate({
            where: {
              workspaceId: ctx.workspaceId,
              createdAt: { gte: previousStartDate, lte: previousEndDate },
            },
            _sum: { revenue: true },
          }),
          // Revenue by campaign
          ctx.db.lead.groupBy({
            by: ["campaign"],
            where: {
              workspaceId: ctx.workspaceId,
              createdAt: { gte: startDate, lte: endDate },
              revenue: { gt: 0 },
            },
            _sum: { revenue: true },
          }),
          // Daily revenue for chart
          ctx.db.lead.groupBy({
            by: ["createdAt"],
            where: {
              workspaceId: ctx.workspaceId,
              createdAt: { gte: startDate, lte: endDate },
              revenue: { gt: 0 },
            },
            _sum: { revenue: true },
          }),
        ]);

      const totalRevenue = currentRevenue._sum.revenue || 0;
      const prevRevenue = previousRevenue._sum.revenue || 0;
      const change = totalRevenue - prevRevenue;
      const changePercent = prevRevenue > 0 ? (change / prevRevenue) * 100 : 0;

      // Process daily revenue
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const chartData = dateRange.map((date) => {
        const dateKey = format(date, "yyyy-MM-dd");
        const dayRevenue = dailyRevenue
          .filter(
            (r) => format(startOfDay(r.createdAt), "yyyy-MM-dd") === dateKey,
          )
          .reduce((sum, r) => sum + (r._sum.revenue || 0), 0);

        return {
          date: dateKey,
          revenue: dayRevenue,
        };
      });

      return {
        totalRevenue: Number(totalRevenue),
        change: Number(change),
        changePercent: Number(changePercent),
        chartData,
        byCampaign: revenueByCampaign
          .map((r) => ({
            name: r.campaign || "Direct / Other",
            value: Number(r._sum.revenue || 0),
          }))
          .sort((a, b) => b.value - a.value),
      };
    }),

  // Get task analytics
  getTaskAnalytics: protectedWorkspaceProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      const tasks = await ctx.db.task.findMany({
        where: {
          workspaceId: ctx.workspaceId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          assignee: {
            select: { name: true },
          },
        },
      });

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(
        (t) => t.status === "COMPLETED",
      ).length;
      const completionRate =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Group by status
      const byStatus = tasks.reduce(
        (acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Group by priority
      const byPriority = tasks.reduce(
        (acc, task) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Top assignees
      const assigneeMap = new Map<string, number>();
      tasks.forEach((task) => {
        const name = task.assignee.name || "Unknown";
        assigneeMap.set(name, (assigneeMap.get(name) || 0) + 1);
      });

      const topAssignees = Array.from(assigneeMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalTasks,
        completedTasks,
        completionRate,
        byStatus: Object.entries(byStatus).map(([status, count]) => ({
          status,
          count,
        })),
        byPriority: Object.entries(byPriority).map(([priority, count]) => ({
          priority,
          count,
        })),
        topAssignees,
      };
    }),
});
