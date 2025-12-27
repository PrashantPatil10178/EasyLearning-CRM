import { z } from "zod";
import {
  createTRPCRouter,
  protectedWorkspaceProcedure,
} from "@/server/api/trpc";

export const webhookRouter = createTRPCRouter({
  // Get recent webhook logs
  getRecentLogs: protectedWorkspaceProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit || 20;
      const offset = input?.offset || 0;

      // Get total count
      const total = await ctx.db.activity.count({
        where: {
          workspaceId: ctx.workspaceId,
          type: "SYSTEM",
          subject: {
            in: ["Lead Created via Webhook", "Lead Updated via Webhook"],
          },
        },
      });

      // Get recent activities from webhook sources
      const logs = await ctx.db.activity.findMany({
        where: {
          workspaceId: ctx.workspaceId,
          type: "SYSTEM",
          subject: {
            in: ["Lead Created via Webhook", "Lead Updated via Webhook"],
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
              source: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });

      return {
        logs,
        total,
      };
    }),

  // Get webhook assignment rules
  getAssignmentRules: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const rules = await ctx.db.webhookAssignmentRule.findMany({
      where: {
        workspaceId: ctx.workspaceId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { priority: "asc" },
    });

    return rules;
  }),

  // Create or update assignment rule
  upsertAssignmentRule: protectedWorkspaceProcedure
    .input(
      z.object({
        id: z.string().optional(),
        source: z.string().optional(), // Can be enum (WEBSITE, FACEBOOK) or custom string
        status: z.string().optional(), // NEW, CONTACTED, etc.
        assignmentType: z
          .enum(["SPECIFIC", "ROUND_ROBIN", "PERCENTAGE"])
          .default("SPECIFIC"),
        percentage: z.number().min(0).max(100).optional(),
        assigneeId: z.string(),
        isEnabled: z.boolean().default(true),
        rulePriority: z.number().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, rulePriority, ...data } = input;

      if (id) {
        // Update existing rule
        return await ctx.db.webhookAssignmentRule.update({
          where: { id },
          data: {
            ...data,
            priority: rulePriority,
          },
        });
      }

      // Create new rule
      return await ctx.db.webhookAssignmentRule.create({
        data: {
          ...data,
          priority: rulePriority,
          workspaceId: ctx.workspaceId,
        },
      });
    }),

  // Delete assignment rule
  deleteAssignmentRule: protectedWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.webhookAssignmentRule.delete({
        where: {
          id: input.id,
        },
      });
    }),

  // Toggle rule enabled/disabled
  toggleAssignmentRule: protectedWorkspaceProcedure
    .input(
      z.object({
        id: z.string(),
        isEnabled: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.webhookAssignmentRule.update({
        where: { id: input.id },
        data: { isEnabled: input.isEnabled },
      });
    }),
});
