import { z } from "zod";
import {
  createTRPCRouter,
  protectedWorkspaceProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const activityRouter = createTRPCRouter({
  getByLeadId: protectedWorkspaceProcedure
    .input(z.object({ leadId: z.string() }))
    .query(async ({ ctx, input }) => {
      const activities = await ctx.db.activity.findMany({
        where: {
          leadId: input.leadId,
          workspaceId: ctx.workspaceId,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return activities;
    }),

  addNote: protectedWorkspaceProcedure
    .input(
      z.object({
        leadId: z.string(),
        message: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.findFirst({
        where: {
          id: input.leadId,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found or you don't have access",
        });
      }

      // Create note activity
      const activity = await ctx.db.activity.create({
        data: {
          leadId: input.leadId,
          userId: ctx.session.user.id,
          type: "NOTE",
          message: input.message,
          subject: "Note added",
          workspaceId: ctx.workspaceId,
        },
      });

      return activity;
    }),

  create: protectedWorkspaceProcedure
    .input(
      z.object({
        leadId: z.string(),
        type: z.enum([
          "CALL",
          "EMAIL",
          "MEETING",
          "SMS",
          "WHATSAPP",
          "NOTE",
          "STATUS_CHANGE",
          "TASK_COMPLETED",
          "LEAD_ASSIGNED",
          "FOLLOW_UP_SCHEDULED",
          "EDIT",
          "SYSTEM",
        ]),
        subject: z.string().optional(),
        message: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.findFirst({
        where: {
          id: input.leadId,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found or you don't have access",
        });
      }

      const activity = await ctx.db.activity.create({
        data: {
          leadId: input.leadId,
          userId: ctx.session.user.id,
          type: input.type,
          subject: input.subject,
          message: input.message,
          workspaceId: ctx.workspaceId,
        },
      });

      return activity;
    }),
});
