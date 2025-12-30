import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedWorkspaceProcedure,
  adminWorkspaceProcedure,
} from "@/server/api/trpc";

export const campaignRouter = createTRPCRouter({
  // Get campaigns for current user's teams
  getMyTeamCampaigns: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    // Get user's team memberships
    const userTeams = await ctx.db.teamMember.findMany({
      where: { userId: ctx.session.user.id },
      select: { teamId: true },
    });

    const teamIds = userTeams.map((tm) => tm.teamId);

    // Get campaigns assigned to user's teams
    const campaigns = await ctx.db.campaign.findMany({
      where: {
        workspaceId: ctx.workspaceId,
        teamId: { in: teamIds },
      },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, name: true, image: true },
        },
        team: {
          select: { id: true, name: true },
        },
        _count: {
          select: { leads: true, members: true },
        },
      },
    });

    return campaigns;
  }),

  // Get all campaigns
  getAll: protectedWorkspaceProcedure
    .input(
      z.object({
        status: z.string().optional(),
        type: z.string().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { status, type, search, page, limit } = input;
      const skip = (page - 1) * limit;

      const where = {
        workspaceId: ctx.workspaceId,
        ...(status && { status: status as never }),
        ...(type && { type: type as never }),
        ...(search && {
          name: { contains: search },
        }),
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
            team: {
              select: { id: true, name: true },
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
  getById: protectedWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findUnique({
        where: {
          id: input.id,
          workspaceId: ctx.workspaceId,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, image: true },
          },
          team: {
            select: {
              id: true,
              name: true,
              description: true,
              members: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true, image: true },
                  },
                },
              },
            },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          leads: {
            where:
              ctx.session.user.role === "AGENT"
                ? { lead: { ownerId: ctx.session.user.id } }
                : {},
            orderBy: {
              lead: {
                createdAt: "desc",
              },
            },
            include: {
              lead: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                  status: true,
                  category: true,
                  priority: true,
                  city: true,
                  state: true,
                  courseInterested: true,
                  source: true,
                  createdAt: true,
                  revenue: true,
                  ownerId: true,
                  owner: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return campaign;
    }),

  // Create campaign
  create: protectedWorkspaceProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.string().default("EMAIL"),
        timelineFilter: z
          .enum(["30_DAYS", "60_DAYS", "90_DAYS", "CUSTOM"])
          .optional(),
        customStartDate: z.date().optional(),
        customEndDate: z.date().optional(),
        sourceFilter: z.string().optional(),
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
          status: "ACTIVE",
          timelineFilter: input.timelineFilter,
          customStartDate: input.customStartDate,
          customEndDate: input.customEndDate,
          sourceFilter: input.sourceFilter,
          startDate: input.startDate,
          endDate: input.endDate,
          budget: input.budget,
          targetAudience: input.targetAudience,
          createdById: ctx.session.user.id,
          workspaceId: ctx.workspaceId,
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
  update: protectedWorkspaceProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        teamId: z.string().nullable().optional(),
        timelineFilter: z
          .enum(["30_DAYS", "60_DAYS", "90_DAYS", "CUSTOM"])
          .optional(),
        customStartDate: z.date().optional(),
        customEndDate: z.date().optional(),
        sourceFilter: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        budget: z.number().optional(),
        actualSpend: z.number().optional(),
        targetAudience: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const campaign = await ctx.db.campaign.findFirst({
        where: {
          id,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found or you don't have access",
        });
      }

      const updatedCampaign = await ctx.db.campaign.update({
        where: { id },
        data: {
          ...data,
          type: data.type as never,
          status: data.status as never,
        },
      });

      return updatedCampaign;
    }),

  addLeads: protectedWorkspaceProcedure
    .input(
      z.object({
        campaignId: z.string(),
        leadIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { campaignId, leadIds } = input;

      const campaign = await ctx.db.campaign.findFirst({
        where: {
          id: campaignId,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found or you don't have access",
        });
      }

      // Use upsert to handle duplicates (SQLite doesn't support skipDuplicates)
      let addedCount = 0;
      for (const leadId of leadIds) {
        try {
          await ctx.db.campaignLead.upsert({
            where: {
              campaignId_leadId: { campaignId, leadId },
            },
            create: { campaignId, leadId },
            update: {}, // No update needed, just skip if exists
          });
          addedCount++;
        } catch {
          // Ignore errors for duplicates
        }
      }

      // Update campaign lead count
      const totalLeads = await ctx.db.campaignLead.count({
        where: { campaignId },
      });

      await ctx.db.campaign.update({
        where: { id: campaignId },
        data: { totalLeads },
      });

      return { success: true, added: addedCount };
    }),

  // Remove lead from campaign
  removeLead: protectedWorkspaceProcedure
    .input(
      z.object({
        campaignId: z.string(),
        leadId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findFirst({
        where: {
          id: input.campaignId,
          workspaceId: ctx.workspaceId,
        },
        select: {
          id: true,
          timelineFilter: true,
          customStartDate: true,
          customEndDate: true,
          sourceFilter: true,
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found or you don't have access",
        });
      }

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

  // Add member to campaign (Admin only)
  addMember: adminWorkspaceProcedure
    .input(
      z.object({
        campaignId: z.string(),
        userId: z.string(),
        role: z.string().default("member"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findFirst({
        where: {
          id: input.campaignId,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found or you don't have access",
        });
      }

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
  delete: adminWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findFirst({
        where: {
          id: input.id,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found or you don't have access",
        });
      }

      await ctx.db.campaign.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Get campaign stats
  getStats: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const workspaceId = ctx.workspaceId;
    const [total, active, completed] = await Promise.all([
      ctx.db.campaign.count({ where: { workspaceId } }),
      ctx.db.campaign.count({ where: { status: "ACTIVE", workspaceId } }),
      ctx.db.campaign.count({ where: { status: "COMPLETED", workspaceId } }),
    ]);

    // Get total leads in campaigns
    const totalCampaignLeads = await ctx.db.campaignLead.count({
      where: { campaign: { workspaceId } },
    });

    // Get converted leads
    const convertedLeads = await ctx.db.campaignLead.count({
      where: { status: "converted", campaign: { workspaceId } },
    });

    return {
      total,
      active,
      completed,
      totalLeads: totalCampaignLeads,
      convertedLeads,
      conversionRate:
        totalCampaignLeads > 0
          ? ((convertedLeads / totalCampaignLeads) * 100).toFixed(1)
          : "0",
    };
  }),

  // Get filtered leads based on campaign criteria
  getFilteredLeads: protectedWorkspaceProcedure
    .input(
      z.object({
        campaignId: z.string(),
        page: z.number().default(1),
        limit: z.number().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findFirst({
        where: {
          id: input.campaignId,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

      const skip = (input.page - 1) * input.limit;

      // Build date filter based on timeline
      let dateFilter = {};
      const now = new Date();

      if (campaign.timelineFilter === "30_DAYS") {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        dateFilter = { createdAt: { gte: thirtyDaysAgo } };
      } else if (campaign.timelineFilter === "60_DAYS") {
        const sixtyDaysAgo = new Date(now);
        sixtyDaysAgo.setDate(now.getDate() - 60);
        dateFilter = { createdAt: { gte: sixtyDaysAgo } };
      } else if (campaign.timelineFilter === "90_DAYS") {
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 90);
        dateFilter = { createdAt: { gte: ninetyDaysAgo } };
      } else if (
        campaign.timelineFilter === "CUSTOM" &&
        campaign.customStartDate &&
        campaign.customEndDate
      ) {
        dateFilter = {
          createdAt: {
            gte: campaign.customStartDate,
            lte: campaign.customEndDate,
          },
        };
      }

      // Build source filter
      const sourceFilter = campaign.sourceFilter
        ? { source: campaign.sourceFilter }
        : {};

      // For agents, only show their assigned leads
      const ownerFilter =
        ctx.session.user.role === "AGENT"
          ? { ownerId: ctx.session.user.id }
          : {};

      const where = {
        workspaceId: ctx.workspaceId,
        ...dateFilter,
        ...sourceFilter,
        ...ownerFilter,
      };

      const [leads, total] = await Promise.all([
        ctx.db.lead.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            status: true,
            priority: true,
            city: true,
            state: true,
            courseInterested: true,
            source: true,
            createdAt: true,
            revenue: true,
          },
        }),
        ctx.db.lead.count({ where }),
      ]);

      return {
        leads,
        total,
        pages: Math.ceil(total / input.limit),
        currentPage: input.page,
      };
    }),
});
