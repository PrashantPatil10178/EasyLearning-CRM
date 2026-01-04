import {
  createTRPCRouter,
  protectedWorkspaceProcedure,
} from "@/server/api/trpc";

export const dashboardRouter = createTRPCRouter({
  // Get dashboard stats
  getStats: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const workspaceId = ctx.workspaceId;
    const workspaceMember = ctx.workspaceMember;
    const isSuperAdmin = ctx.session.user.role === "SUPER_ADMIN";

    const isAdminOrManager =
      isSuperAdmin ||
      (workspaceMember && ["ADMIN", "MANAGER"].includes(workspaceMember.role));

    // For admin/manager, get all stats; for agents, get their own
    const ownedFilter = isAdminOrManager
      ? { workspaceId }
      : { ownerId: userId, workspaceId };
    const userFilter = isAdminOrManager
      ? { workspaceId }
      : { userId, workspaceId };
    const taskFilter = { assigneeId: userId, workspaceId }; // Tasks are always personal? Or admins see all? Original code was personal.

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const [
      // Lead stats
      totalLeads,
      newLeadsToday,
      newLeadsThisMonth,
      followUpsToday,

      // Task stats
      pendingTasks,
      overdueTasks,

      // Call stats
      callsToday,

      // Converted leads this month
      convertedLeadsThisMonth,

      // Active campaigns
      activeCampaigns,
    ] = await Promise.all([
      ctx.db.lead.count({ where: ownedFilter }),
      ctx.db.lead.count({
        where: { ...ownedFilter, createdAt: { gte: today } },
      }),
      ctx.db.lead.count({
        where: { ...ownedFilter, createdAt: { gte: thisMonth } },
      }),
      ctx.db.lead.count({
        where: {
          ...ownedFilter,
          nextFollowUp: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Tasks
      ctx.db.task.count({
        where: {
          ...taskFilter,
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
      }),
      ctx.db.task.count({
        where: {
          ...taskFilter,
          status: { not: "COMPLETED" },
          dueDate: { lt: today },
        },
      }),

      // Calls
      ctx.db.call.count({
        where: { ...userFilter, startedAt: { gte: today } },
      }),

      // Converted Leads
      ctx.db.lead.count({
        where: {
          ...ownedFilter,
          status: "CONVERTED",
          convertedAt: { gte: thisMonth },
        },
      }),

      // Total Campaigns (Active)
      ctx.db.campaign.count({
        where: {
          workspaceId,
          status: "ACTIVE",
        },
      }),
    ]);

    return {
      leads: {
        total: totalLeads,
        newToday: newLeadsToday,
        newThisMonth: newLeadsThisMonth,
        followUpsToday,
        convertedThisMonth: convertedLeadsThisMonth,
      },
      campaigns: {
        active: activeCampaigns,
      },
      tasks: {
        pending: pendingTasks,
        overdue: overdueTasks,
      },
      calls: {
        today: callsToday,
      },
    };
  }),

  // Get recent activities
  getRecentActivities: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const activities = await ctx.db.activity.findMany({
      where: { workspaceId: ctx.workspaceId },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        lead: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return activities;
  }),

  // Get lead status distribution
  getLeadStatusDistribution: protectedWorkspaceProcedure.query(
    async ({ ctx }) => {
      const statuses = [
        "NEW",
        "CONTACTED",
        "INTERESTED",
        "QUALIFIED",
        "NEGOTIATION",
        "CONVERTED",
        "LOST",
      ];

      const distribution = await Promise.all(
        statuses.map(async (status) => {
          const count = await ctx.db.lead.count({
            where: { status: status as never, workspaceId: ctx.workspaceId },
          });
          return { status, count };
        }),
      );

      return distribution;
    },
  ),

  // Get lead source distribution
  getLeadSourceDistribution: protectedWorkspaceProcedure.query(
    async ({ ctx }) => {
      const sources = [
        "WEBSITE",
        "FACEBOOK",
        "INSTAGRAM",
        "GOOGLE_ADS",
        "LINKEDIN",
        "REFERRAL",
        "WALK_IN",
        "PHONE_INQUIRY",
        "WHATSAPP",
        "OTHER",
      ];

      const distribution = await Promise.all(
        sources.map(async (source) => {
          const count = await ctx.db.lead.count({
            where: { source: source as never, workspaceId: ctx.workspaceId },
          });
          return { source, count };
        }),
      );

      // Filter out sources with 0 count
      return distribution.filter((d) => d.count > 0);
    },
  ),

  // Get top performers (admin/manager only)
  getTopPerformers: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      where: {
        role: { in: ["AGENT", "MANAGER"] },
        workspaces: { some: { workspaceId: ctx.workspaceId } },
      },
      select: {
        id: true,
        name: true,
        image: true,
        _count: {
          select: {
            ownedLeads: {
              where: { status: "CONVERTED", workspaceId: ctx.workspaceId },
            },
            calls: { where: { workspaceId: ctx.workspaceId } },
          },
        },
      },
    });

    // Sort by conversions
    const sorted = users
      .map((user) => ({
        id: user.id,
        name: user.name,
        image: user.image,
        conversions: user._count.ownedLeads,
        calls: user._count.calls,
      }))
      .sort((a, b) => b.conversions - a.conversions);

    return sorted.slice(0, 5);
  }),

  // Get upcoming follow-ups
  getUpcomingFollowUps: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const leads = await ctx.db.lead.findMany({
      where: {
        workspaceId: ctx.workspaceId,
        nextFollowUp: { gte: new Date() },
        status: { notIn: ["CONVERTED", "LOST", "DO_NOT_CONTACT"] },
      },
      orderBy: { nextFollowUp: "asc" },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        nextFollowUp: true,
        status: true,
        owner: {
          select: { name: true, image: true },
        },
      },
    });

    return leads;
  }),
});
