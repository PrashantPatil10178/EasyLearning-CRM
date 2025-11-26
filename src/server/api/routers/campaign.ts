import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";

export const campaignRouter = createTRPCRouter({
  // Get all campaigns
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        type: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { status, type, page, limit } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(status && { status: status as never }),
        ...(type && { type: type as never }),
      };

      const [campaigns, total] = await Promise.all([
        ctx.db.campaign.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, name: true, image: true },
            },
            _count: {
              select: { leads: true, members: true },
            },
          },
        }),
        ctx.db.campaign.count({ where }),
      ]);

      return {
        campaigns,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  // Get single campaign
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.id },
        include: {
          createdBy: {
            select: { id: true, name: true, image: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          leads: {
            include: {
              lead: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      return campaign;
    }),

  // Create campaign
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.string().default("EMAIL"),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        budget: z.number().optional(),
        targetAudience: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.create({
        data: {
          name: input.name,
          description: input.description,
          type: input.type as never,
          startDate: input.startDate,
          endDate: input.endDate,
          budget: input.budget,
          targetAudience: input.targetAudience,
          createdById: ctx.session.user.id,
        },
      });

      // Add creator as a member
      await ctx.db.campaignMember.create({
        data: {
          campaignId: campaign.id,
          userId: ctx.session.user.id,
          role: "owner",
        },
      });

      return campaign;
    }),

  // Update campaign
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        budget: z.number().optional(),
        actualSpend: z.number().optional(),
        targetAudience: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const campaign = await ctx.db.campaign.update({
        where: { id },
        data: {
          ...data,
          type: data.type as never,
          status: data.status as never,
        },
      });

      return campaign;
    }),

  // Add leads to campaign
  addLeads: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        leadIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { campaignId, leadIds } = input;

      await ctx.db.campaignLead.createMany({
        data: leadIds.map((leadId) => ({
          campaignId,
          leadId,
        })),
        skipDuplicates: true,
      });

      // Update campaign lead count
      const totalLeads = await ctx.db.campaignLead.count({
        where: { campaignId },
      });

      await ctx.db.campaign.update({
        where: { id: campaignId },
        data: { totalLeads },
      });

      return { success: true, added: leadIds.length };
    }),

  // Remove lead from campaign
  removeLead: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        leadId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.campaignLead.delete({
        where: {
          campaignId_leadId: {
            campaignId: input.campaignId,
            leadId: input.leadId,
          },
        },
      });

      return { success: true };
    }),

  // Add member to campaign
  addMember: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        userId: z.string(),
        role: z.string().default("member"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.campaignMember.create({
        data: {
          campaignId: input.campaignId,
          userId: input.userId,
          role: input.role,
        },
      });

      return member;
    }),

  // Delete campaign
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.campaign.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Get campaign stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, active, draft, completed] = await Promise.all([
      ctx.db.campaign.count(),
      ctx.db.campaign.count({ where: { status: "ACTIVE" } }),
      ctx.db.campaign.count({ where: { status: "DRAFT" } }),
      ctx.db.campaign.count({ where: { status: "COMPLETED" } }),
    ]);

    // Get total leads in campaigns
    const totalCampaignLeads = await ctx.db.campaignLead.count();

    // Get converted leads
    const convertedLeads = await ctx.db.campaignLead.count({
      where: { status: "converted" },
    });

    return {
      total,
      active,
      draft,
      completed,
      totalLeads: totalCampaignLeads,
      convertedLeads,
      conversionRate:
        totalCampaignLeads > 0
          ? ((convertedLeads / totalCampaignLeads) * 100).toFixed(1)
          : "0",
    };
  }),
});
