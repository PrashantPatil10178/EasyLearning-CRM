import { z } from "zod";
import {
  createTRPCRouter,
  protectedWorkspaceProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { callEventEmitter } from "@/lib/call-events";

export const callLogRouter = createTRPCRouter({
  // Get all calls
  getAll: protectedWorkspaceProcedure
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
        workspaceId: ctx.workspaceId,
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
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
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
  getMyRecent: protectedWorkspaceProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const calls = await ctx.db.call.findMany({
        where: {
          userId: ctx.session.user.id,
          workspaceId: ctx.workspaceId,
        },
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
  create: protectedWorkspaceProcedure
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
          workspaceId: ctx.workspaceId,
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
          workspaceId: ctx.workspaceId,
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

  // Get call stats
  getStats: protectedWorkspaceProcedure
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
        workspaceId: ctx.workspaceId,
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
  getTodayStats: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalToday, completedToday] = await Promise.all([
      ctx.db.call.count({
        where: {
          userId: ctx.session.user.id,
          workspaceId: ctx.workspaceId,
          startedAt: { gte: today },
        },
      }),
      ctx.db.call.count({
        where: {
          userId: ctx.session.user.id,
          workspaceId: ctx.workspaceId,
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

  // Complete a call and log activities
  complete: protectedWorkspaceProcedure
    .input(
      z.object({
        leadId: z.string(),
        outcome: z.enum([
          "ANSWERED",
          "NO_ANSWER",
          "BUSY",
          "VOICEMAIL",
          "FAILED",
        ]),
        notes: z.string(),
        duration: z.number().optional(),
        newStatus: z.string().optional(),
        nextFollowUp: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify lead belongs to workspace
      const lead = await ctx.db.lead.findUnique({
        where: { id: input.leadId },
        select: {
          id: true,
          workspaceId: true,
          firstName: true,
          lastName: true,
          status: true,
          phone: true,
        },
      });

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found",
        });
      }

      if (lead.workspaceId !== ctx.workspaceId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Lead does not belong to your workspace",
        });
      }

      // Get user details
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { name: true, phone: true },
      });

      // Map the outcome to CallStatus
      const statusMap: Record<string, string> = {
        ANSWERED: "COMPLETED",
        NO_ANSWER: "NO_ANSWER",
        BUSY: "BUSY",
        VOICEMAIL: "VOICEMAIL",
        FAILED: "FAILED",
      };

      const callStatus = statusMap[input.outcome] || "COMPLETED";

      // Create call record
      const call = await ctx.db.call.create({
        data: {
          leadId: input.leadId,
          userId: ctx.session.user.id,
          workspaceId: ctx.workspaceId,
          type: "OUTBOUND",
          status: callStatus as any,
          outcome: null, // outcome is for customer interest level, not call connection status
          notes: input.notes,
          duration: input.duration,
          toNumber: lead.phone || "",
          fromNumber: user?.phone || "",
          nextFollowUp: input.nextFollowUp,
        },
      });

      // Create call activity
      await ctx.db.activity.create({
        data: {
          type: "CALL",
          subject: `${input.outcome === "ANSWERED" ? "Call Answered" : "Call Attempted"}`,
          description: input.notes,
          message: `Call ${input.outcome.toLowerCase().replace("_", " ")}${input.duration ? ` - Duration: ${Math.floor(input.duration / 60)}m ${input.duration % 60}s` : ""}`,
          leadId: input.leadId,
          userId: ctx.session.user.id,
          workspaceId: ctx.workspaceId,
          performedAt: new Date(),
        },
      });

      // Update lead status if changed
      if (input.newStatus && input.newStatus !== lead.status) {
        await ctx.db.lead.update({
          where: { id: input.leadId },
          data: { status: input.newStatus as any },
        });

        // Log status change activity
        await ctx.db.activity.create({
          data: {
            type: "STATUS_CHANGE",
            subject: "Status changed",
            description: `Status changed from ${lead.status} to ${input.newStatus}`,
            message: `${user?.name || "User"} changed status from ${lead.status} to ${input.newStatus}`,
            leadId: input.leadId,
            userId: ctx.session.user.id,
            workspaceId: ctx.workspaceId,
            performedAt: new Date(),
          },
        });
      }

      // Create follow-up task if scheduled
      if (input.nextFollowUp) {
        await ctx.db.task.create({
          data: {
            title:
              `Follow up call with ${lead.firstName} ${lead.lastName || ""}`.trim(),
            description: `Scheduled follow-up from call on ${new Date().toLocaleDateString()}`,
            status: "PENDING",
            priority: "MEDIUM",
            dueDate: input.nextFollowUp,
            leadId: input.leadId,
            assigneeId: ctx.session.user.id,
            createdById: ctx.session.user.id,
            workspaceId: ctx.workspaceId,
          },
        });

        // Log follow-up scheduled activity
        await ctx.db.activity.create({
          data: {
            type: "FOLLOW_UP_SCHEDULED",
            subject: "Follow-up scheduled",
            description: `Follow-up call scheduled for ${input.nextFollowUp.toLocaleString()}`,
            message: `${user?.name || "User"} scheduled a follow-up call`,
            leadId: input.leadId,
            userId: ctx.session.user.id,
            workspaceId: ctx.workspaceId,
            performedAt: new Date(),
          },
        });
      }

      return { success: true, callId: call.id };
    }),

  // Update call details (notes, outcome) and optional lead status
  update: protectedWorkspaceProcedure
    .input(
      z.object({
        id: z.string(),
        notes: z.string().optional(),
        outcome: z.string().optional(),
        leadStatus: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const call = await ctx.db.call.findUnique({
        where: { id: input.id },
      });

      if (!call) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Call not found",
        });
      }

      if (call.workspaceId !== ctx.workspaceId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this call",
        });
      }

      const updatedCall = await ctx.db.call.update({
        where: { id: input.id },
        data: {
          notes: input.notes,
          outcome: input.outcome as any,
        },
      });

      // Update Lead Status if provided
      if (input.leadStatus) {
        await ctx.db.lead.update({
          where: { id: call.leadId },
          data: { status: input.leadStatus },
        });

        // Log status change activity
        await ctx.db.activity.create({
          data: {
            type: "STATUS_CHANGE",
            subject: "Status Updated",
            description: `Status updated to ${input.leadStatus} from call popup`,
            leadId: call.leadId,
            userId: ctx.session.user.id,
            workspaceId: ctx.workspaceId,
            performedAt: new Date(),
          },
        });
      }

      return updatedCall;
    }),

  // Real-time subscription for call events
  onCallEvent: protectedWorkspaceProcedure.subscription(({ ctx }) => {
    console.log(
      "[onCallEvent Subscription] Client connected for workspace:",
      ctx.workspaceId,
    );
    return observable((emit) => {
      console.log("[onCallEvent Subscription] Observable function called");
      const onEvent = (event: any) => {
        console.log(
          "[onCallEvent Subscription] Event received:",
          event.type,
          "for workspace:",
          event.workspaceId,
        );
        console.log(
          "[onCallEvent Subscription] Current user workspace:",
          ctx.workspaceId,
        );
        // Only emit events for the current workspace
        if (event.workspaceId === ctx.workspaceId) {
          console.log("[onCallEvent Subscription] Emitting event to client");
          emit.next(event);
        } else {
          console.log(
            "[onCallEvent Subscription] Workspace mismatch, not emitting",
          );
        }
      };

      // Subscribe to call events
      callEventEmitter.on("call-event", onEvent);
      console.log(
        "[onCallEvent Subscription] Listener registered, total listeners:",
        callEventEmitter.listenerCount("call-event"),
      );

      // Cleanup on unsubscribe
      return () => {
        console.log("[onCallEvent Subscription] Client disconnected");
        callEventEmitter.off("call-event", onEvent);
        console.log(
          "[onCallEvent Subscription] Listener removed, remaining:",
          callEventEmitter.listenerCount("call-event"),
        );
      };
    });
  }),
});
