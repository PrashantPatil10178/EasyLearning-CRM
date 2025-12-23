import { z } from "zod";
import {
  createTRPCRouter,
  protectedWorkspaceProcedure,
} from "@/server/api/trpc";

export const dealRouter = createTRPCRouter({
  // Get deals by stage for Kanban board
  getByStage: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const deals = await ctx.db.deal.findMany({
      where: {
        workspaceId: ctx.workspaceId,
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Group by stage
    const grouped = deals.reduce(
      (acc, deal) => {
        const stage = deal.stage;
        if (!acc[stage]) {
          acc[stage] = [];
        }
        acc[stage].push(deal);
        return acc;
      },
      {} as Record<string, typeof deals>,
    );

    return grouped;
  }),

  // Get deal stats
  getStats: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const stats = await ctx.db.deal.groupBy({
      by: ["stage"],
      where: {
        workspaceId: ctx.workspaceId,
      },
      _count: true,
      _sum: {
        value: true,
      },
    });

    const totalValue = stats.reduce(
      (acc, curr) => acc + (curr._sum.value || 0),
      0,
    );
    const totalCount = stats.reduce((acc, curr) => acc + curr._count, 0);

    return {
      byStage: stats,
      totalValue,
      totalCount,
    };
  }),

  // Create deal
  create: protectedWorkspaceProcedure
    .input(
      z.object({
        title: z.string().min(1),
        value: z.number().min(0),
        stage: z.enum([
          "PROSPECT",
          "QUALIFIED",
          "PROPOSAL",
          "NEGOTIATION",
          "CLOSED_WON",
          "CLOSED_LOST",
        ]),
        leadId: z.string().optional(),
        assigneeId: z.string().optional(),
        expectedCloseDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.deal.create({
        data: {
          ...input,
          workspaceId: ctx.workspaceId,
        },
      });
    }),

  // Update deal stage (drag and drop)
  updateStage: protectedWorkspaceProcedure
    .input(
      z.object({
        id: z.string(),
        stage: z.enum([
          "PROSPECT",
          "QUALIFIED",
          "PROPOSAL",
          "NEGOTIATION",
          "CLOSED_WON",
          "CLOSED_LOST",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.deal.update({
        where: {
          id: input.id,
          workspaceId: ctx.workspaceId,
        },
        data: {
          stage: input.stage,
        },
      });
    }),
});
