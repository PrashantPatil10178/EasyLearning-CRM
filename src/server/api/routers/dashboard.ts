import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const dashboardRouter = createTRPCRouter({
  // Get dashboard stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const userRole = ctx.session.user.role;

    // For admin/manager, get all stats; for agents, get their own
    const ownedFilter =
      userRole === "ADMIN" || userRole === "MANAGER"
        ? {}
        : { ownerId: userId };
    const userFilter =
      userRole === "ADMIN" || userRole === "MANAGER"
        ? {}
        : { userId };

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

      // Deal stats
      totalDeals,
      pipelineValue,
      closedWonThisMonth,
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
          assigneeId: userId,
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
      }),
      ctx.db.task.count({
        where: {
          assigneeId: userId,
          status: { not: "COMPLETED" },
          dueDate: { lt: today },
        },
      }),

      // Calls
      ctx.db.call.count({
        where: { ...userFilter, startedAt: { gte: today } },
      }),

      // Deals
      ctx.db.deal.count({ where: ownedFilter }),
      ctx.db.deal.aggregate({
        where: {
          ...ownedFilter,
          stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] },
        },
        _sum: { amount: true },
      }),
      ctx.db.deal.aggregate({
        where: {
          ...ownedFilter,
          stage: "CLOSED_WON",
          actualCloseDate: { gte: thisMonth },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      leads: {
        total: totalLeads,
        newToday: newLeadsToday,
        newThisMonth: newLeadsThisMonth,
        followUpsToday,
      },
      tasks: {
        pending: pendingTasks,
        overdue: overdueTasks,
      },
      calls: {
        today: callsToday,
      },
      deals: {
        total: totalDeals,
        pipelineValue: pipelineValue._sum.amount ?? 0,
        closedWonThisMonth: closedWonThisMonth._sum.amount ?? 0,
      },
    };
  }),

  // Get recent activities
  getRecentActivities: protectedProcedure.query(async ({ ctx }) => {
    const activities = await ctx.db.activity.findMany({
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
  getLeadStatusDistribution: protectedProcedure.query(async ({ ctx }) => {
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
          where: { status: status as never },
        });
        return { status, count };
      }),
    );

    return distribution;
  }),

  // Get deal stage distribution
  getDealStageDistribution: protectedProcedure.query(async ({ ctx }) => {
    const stages = [
      "QUALIFICATION",
      "NEEDS_ANALYSIS",
      "PROPOSAL",
      "NEGOTIATION",
      "CLOSED_WON",
      "CLOSED_LOST",
    ];

    const distribution = await Promise.all(
      stages.map(async (stage) => {
        const result = await ctx.db.deal.aggregate({
          where: { stage: stage as never },
          _count: true,
          _sum: { amount: true },
        });
        return {
          stage,
          count: result._count,
          value: result._sum.amount ?? 0,
        };
      }),
    );

    return distribution;
  }),

  // Get lead source distribution
  getLeadSourceDistribution: protectedProcedure.query(async ({ ctx }) => {
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
          where: { source: source as never },
        });
        return { source, count };
      }),
    );

    // Filter out sources with 0 count
    return distribution.filter((d) => d.count > 0);
  }),

  // Get top performers (admin/manager only)
  getTopPerformers: protectedProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      where: { role: { in: ["AGENT", "MANAGER"] } },
      select: {
        id: true,
        name: true,
        image: true,
        _count: {
          select: {
            ownedLeads: { where: { status: "CONVERTED" } },
            deals: { where: { stage: "CLOSED_WON" } },
            calls: true,
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
        wonDeals: user._count.deals,
        calls: user._count.calls,
      }))
      .sort((a, b) => b.conversions - a.conversions);

    return sorted.slice(0, 5);
  }),

  // Get upcoming follow-ups
  getUpcomingFollowUps: protectedProcedure.query(async ({ ctx }) => {
    const leads = await ctx.db.lead.findMany({
      where: {
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
