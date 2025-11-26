import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const dealRouter = createTRPCRouter({
  // Get all deals with filters
  getAll: protectedProcedure
    .input(
      z.object({
        stage: z.string().optional(),
        ownerId: z.string().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { stage, ownerId, search, page, limit } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...(stage && { stage: stage as never }),
        ...(ownerId && { ownerId }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { lead: { firstName: { contains: search } } },
            { lead: { lastName: { contains: search } } },
          ],
        }),
      };

      const [deals, total] = await Promise.all([
        ctx.db.deal.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            owner: {
              select: { id: true, name: true, email: true, image: true },
            },
            lead: {
              select: { id: true, firstName: true, lastName: true, phone: true, email: true },
            },
          },
        }),
        ctx.db.deal.count({ where }),
      ]);

      return {
        deals,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  // Get single deal by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const deal = await ctx.db.deal.findUnique({
        where: { id: input.id },
        include: {
          owner: {
            select: { id: true, name: true, email: true, image: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          lead: {
            include: {
              activities: {
                orderBy: { createdAt: "desc" },
                take: 10,
              },
              notes: {
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      });

      if (!deal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      return deal;
    }),

  // Update deal
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        amount: z.number().optional(),
        stage: z.string().optional(),
        probability: z.number().optional(),
        courseName: z.string().optional(),
        courseDuration: z.string().optional(),
        batchStartDate: z.date().optional(),
        expectedCloseDate: z.date().optional(),
        notes: z.string().optional(),
        ownerId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const deal = await ctx.db.deal.update({
        where: { id },
        data: {
          ...data,
          stage: data.stage as never,
        },
      });

      return deal;
    }),

  // Update deal stage (for Kanban)
  updateStage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        stage: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const deal = await ctx.db.deal.update({
        where: { id: input.id },
        data: {
          stage: input.stage as never,
          ...(input.stage === "CLOSED_WON" && { actualCloseDate: new Date() }),
          ...(input.stage === "CLOSED_LOST" && { actualCloseDate: new Date() }),
        },
      });

      return deal;
    }),

  // Delete deal
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.deal.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Get deal stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [
      total,
      qualification,
      needsAnalysis,
      proposal,
      negotiation,
      closedWon,
      closedLost,
    ] = await Promise.all([
      ctx.db.deal.count(),
      ctx.db.deal.count({ where: { stage: "QUALIFICATION" } }),
      ctx.db.deal.count({ where: { stage: "NEEDS_ANALYSIS" } }),
      ctx.db.deal.count({ where: { stage: "PROPOSAL" } }),
      ctx.db.deal.count({ where: { stage: "NEGOTIATION" } }),
      ctx.db.deal.count({ where: { stage: "CLOSED_WON" } }),
      ctx.db.deal.count({ where: { stage: "CLOSED_LOST" } }),
    ]);

    // Calculate total pipeline value
    const pipelineValue = await ctx.db.deal.aggregate({
      where: {
        stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] },
      },
      _sum: { amount: true },
    });

    // Calculate won value this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const wonThisMonth = await ctx.db.deal.aggregate({
      where: {
        stage: "CLOSED_WON",
        actualCloseDate: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    return {
      total,
      stages: {
        qualification,
        needsAnalysis,
        proposal,
        negotiation,
        closedWon,
        closedLost,
      },
      pipelineValue: pipelineValue._sum.amount ?? 0,
      wonThisMonth: wonThisMonth._sum.amount ?? 0,
      winRate: total > 0 ? ((closedWon / (closedWon + closedLost)) * 100).toFixed(1) : "0",
    };
  }),

  // Get deals by stage (for Kanban view)
  getByStage: protectedProcedure.query(async ({ ctx }) => {
    const stages = ["QUALIFICATION", "NEEDS_ANALYSIS", "PROPOSAL", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"];
    
    const dealsByStage = await Promise.all(
      stages.map(async (stage) => {
        const deals = await ctx.db.deal.findMany({
          where: { stage: stage as never },
          orderBy: { updatedAt: "desc" },
          include: {
            owner: {
              select: { id: true, name: true, image: true },
            },
            lead: {
              select: { firstName: true, lastName: true, phone: true },
            },
          },
        });
        return { stage, deals };
      }),
    );

    return dealsByStage;
  }),
});
