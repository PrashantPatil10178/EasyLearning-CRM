import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const callRouter = createTRPCRouter({
  // Get all calls
  getAll: protectedProcedure
    .input(
      z.object({
        leadId: z.string().optional(),
        userId: z.string().optional(),
        outcome: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { leadId, userId, outcome, page, limit } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(leadId && { leadId }),
        ...(userId && { userId }),
        ...(outcome && { outcome: outcome as never }),
      };

      const [calls, total] = await Promise.all([
        ctx.db.call.findMany({
          where,
          skip,
          take: limit,
          orderBy: { startedAt: "desc" },
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
            lead: {
              select: { id: true, firstName: true, lastName: true, phone: true },
            },
          },
        }),
        ctx.db.call.count({ where }),
      ]);

      return {
        calls,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  // Get my recent calls
  getMyRecent: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const calls = await ctx.db.call.findMany({
        where: { userId: ctx.session.user.id },
        take: input.limit,
        orderBy: { startedAt: "desc" },
        include: {
          lead: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
        },
      });

      return calls;
    }),

  // Log a call
  create: protectedProcedure
    .input(
      z.object({
        leadId: z.string(),
        type: z.enum(["INBOUND", "OUTBOUND"]).default("OUTBOUND"),
        status: z.string().default("COMPLETED"),
        duration: z.number().optional(),
        toNumber: z.string(),
        fromNumber: z.string().optional(),
        notes: z.string().optional(),
        outcome: z.string().optional(),
        nextFollowUp: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const call = await ctx.db.call.create({
        data: {
          leadId: input.leadId,
          userId: ctx.session.user.id,
          type: input.type,
          status: input.status as never,
          duration: input.duration,
          toNumber: input.toNumber,
          fromNumber: input.fromNumber,
          notes: input.notes,
          outcome: input.outcome as never,
          nextFollowUp: input.nextFollowUp,
          endedAt: input.duration ? new Date() : null,
        },
      });

      // Create activity
      await ctx.db.activity.create({
        data: {
          type: "CALL",
          subject: `${input.type} call`,
          description: input.notes ?? `${input.type} call to ${input.toNumber}`,
          leadId: input.leadId,
          userId: ctx.session.user.id,
        },
      });

      // Update lead's last contact
      await ctx.db.lead.update({
        where: { id: input.leadId },
        data: {
          lastContactAt: new Date(),
          ...(input.nextFollowUp && { nextFollowUp: input.nextFollowUp }),
        },
      });

      return call;
    }),

  // Update call
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        notes: z.string().optional(),
        outcome: z.string().optional(),
        duration: z.number().optional(),
        nextFollowUp: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const call = await ctx.db.call.update({
        where: { id },
        data: {
          ...data,
          outcome: data.outcome as never,
        },
      });

      return call;
    }),

  // Get call stats
  getStats: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;
      
      const dateFilter = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };

      const where = {
        userId: ctx.session.user.id,
        ...(Object.keys(dateFilter).length > 0 && { startedAt: dateFilter }),
      };

      const [total, completed, noAnswer, interested, converted] =
        await Promise.all([
          ctx.db.call.count({ where }),
          ctx.db.call.count({ where: { ...where, status: "COMPLETED" } }),
          ctx.db.call.count({ where: { ...where, status: "NO_ANSWER" } }),
          ctx.db.call.count({ where: { ...where, outcome: "INTERESTED" } }),
          ctx.db.call.count({ where: { ...where, outcome: "CONVERTED" } }),
        ]);

      // Get average call duration
      const avgDuration = await ctx.db.call.aggregate({
        where: { ...where, duration: { not: null } },
        _avg: { duration: true },
      });

      return {
        total,
        completed,
        noAnswer,
        interested,
        converted,
        avgDuration: Math.round(avgDuration._avg.duration ?? 0),
        connectRate: total > 0 ? ((completed / total) * 100).toFixed(1) : "0",
      };
    }),

  // Get today's call stats for dashboard
  getTodayStats: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalToday, completedToday] = await Promise.all([
      ctx.db.call.count({
        where: {
          userId: ctx.session.user.id,
          startedAt: { gte: today },
        },
      }),
      ctx.db.call.count({
        where: {
          userId: ctx.session.user.id,
          startedAt: { gte: today },
          status: "COMPLETED",
        },
      }),
    ]);

    return {
      totalToday,
      completedToday,
    };
  }),
});
