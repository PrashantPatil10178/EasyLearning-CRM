import { z } from "zod";
import {
  createTRPCRouter,
  protectedWorkspaceProcedure,
} from "@/server/api/trpc";

export const reportsRouter = createTRPCRouter({
  // Get Lead Report
  getLeadReport: protectedWorkspaceProcedure
    .input(
      z
        .object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const where = {
        workspaceId: ctx.workspaceId,
        createdAt: {
          gte: input?.startDate,
          lte: input?.endDate,
        },
      };

      const [byStatus, bySource, byOwner] = await Promise.all([
        ctx.db.lead.groupBy({
          by: ["status"],
          where,
          _count: true,
        }),
        ctx.db.lead.groupBy({
          by: ["source"],
          where,
          _count: true,
        }),
        ctx.db.lead.groupBy({
          by: ["ownerId"],
          where,
          _count: true,
        }),
      ]);

      // Enrich owner names
      const ownerIds = byOwner
        .map((o) => o.ownerId)
        .filter(Boolean) as string[];
      const owners = await ctx.db.user.findMany({
        where: { id: { in: ownerIds } },
        select: { id: true, name: true },
      });

      const byOwnerNamed = byOwner.map((o) => ({
        ownerId: o.ownerId,
        name: owners.find((u) => u.id === o.ownerId)?.name || "Unassigned",
        count: o._count,
      }));

      return {
        byStatus: byStatus.map((s) => ({ ...s, _count: s._count })),
        bySource: bySource.map((s) => ({ ...s, _count: s._count })),
        byOwner: byOwnerNamed,
      };
    }),

  // Get Campaign Report
  getCampaignReport: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const campaigns = await ctx.db.campaign.findMany({
      where: { workspaceId: ctx.workspaceId },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    // Calculate conversion rates manually or fetch from CampaignLead if needed
    // For now, returning basic stats
    return campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      type: c.type,
      totalLeads: c.totalLeads,
      convertedLeads: c.convertedLeads,
      conversionRate:
        c.totalLeads > 0 ? (c.convertedLeads / c.totalLeads) * 100 : 0,
    }));
  }),

  // Get Call Report
  getCallReport: protectedWorkspaceProcedure
    .input(
      z
        .object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const where = {
        workspaceId: ctx.workspaceId,
        startedAt: {
          gte: input?.startDate,
          lte: input?.endDate,
        },
      };

      const calls = await ctx.db.call.findMany({
        where,
        include: {
          user: { select: { name: true } },
          lead: { select: { firstName: true, lastName: true } },
        },
        orderBy: { startedAt: "desc" },
        take: 100, // Limit for now
      });

      const totalCalls = await ctx.db.call.count({ where });
      const totalDuration = await ctx.db.call.aggregate({
        where,
        _sum: { duration: true },
      });

      return {
        calls,
        summary: {
          totalCalls,
          totalDuration: totalDuration._sum.duration || 0,
        },
      };
    }),

  // Get Audit Log (System Changes)
  getAuditLog: protectedWorkspaceProcedure
    .input(
      z
        .object({
          limit: z.number().default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const logs = await ctx.db.activity.findMany({
        where: { workspaceId: ctx.workspaceId },
        orderBy: { createdAt: "desc" },
        take: input?.limit,
        include: {
          user: { select: { name: true, image: true } },
        },
      });

      return logs;
    }),
});
