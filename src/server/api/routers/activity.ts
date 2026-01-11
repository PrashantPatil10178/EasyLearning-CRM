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
      const [activities, calls] = await Promise.all([
        ctx.db.activity.findMany({
          where: {
            leadId: input.leadId,
            workspaceId: ctx.workspaceId,
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        ctx.db.call.findMany({
          where: {
            leadId: input.leadId,
            workspaceId: ctx.workspaceId,
          },
          orderBy: { startedAt: "desc" },
          select: {
            id: true,
            recordingUrl: true,
            startedAt: true,
            duration: true,
            status: true,
            outcome: true,
            notes: true,
          },
        }),
      ]);

      // Enrich CALL activities with recording URLs
      const enrichedActivities = activities.map((activity) => {
        if (activity.type === "CALL") {
          // Find the matching call by timestamp (within 5 seconds)
          const matchingCall = calls.find((call) => {
            const activityTime = new Date(
              activity.performedAt || activity.createdAt,
            ).getTime();
            const callTime = new Date(call.startedAt).getTime();
            return Math.abs(activityTime - callTime) < 5000; // 5 second tolerance
          });

          if (matchingCall) {
            console.log(
              "[Activity] Matched call to activity:",
              activity.id,
              "recordingUrl:",
              matchingCall.recordingUrl,
            );
            return {
              ...activity,
              callData: matchingCall,
            };
          } else {
            console.log(
              "[Activity] No matching call found for activity:",
              activity.id,
              "activityTime:",
              activity.performedAt || activity.createdAt,
            );
          }
        }
        return activity;
      });

      console.log(
        "[Activity] Total activities:",
        enrichedActivities.length,
        "CALL activities with recordings:",
        enrichedActivities.filter(
          (a) => a.type === "CALL" && (a as any).callData?.recordingUrl,
        ).length,
      );

      return enrichedActivities;
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
