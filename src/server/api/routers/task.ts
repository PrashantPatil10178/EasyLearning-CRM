import { z } from "zod";
import {
  createTRPCRouter,
  protectedWorkspaceProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const taskRouter = createTRPCRouter({
  // Get all tasks
  getAll: protectedWorkspaceProcedure
    .input(
      z.object({
        status: z.string().optional(),
        assigneeId: z.string().optional(),
        priority: z.string().optional(),
        leadId: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { status, assigneeId, priority, leadId, page, limit } = input;
      const skip = (page - 1) * limit;

      const where = {
        workspaceId: ctx.workspaceId,
        ...(status && { status: status as never }),
        ...(assigneeId && { assigneeId }),
        ...(priority && { priority: priority as never }),
        ...(leadId && { leadId }),
      };

      const [tasks, total] = await Promise.all([
        ctx.db.task.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ status: "asc" }, { dueDate: "asc" }],
          include: {
            assignee: {
              select: { id: true, name: true, email: true, image: true },
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
        ctx.db.task.count({ where }),
      ]);

      return {
        tasks,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  // Get my tasks
  getMyTasks: protectedWorkspaceProcedure
    .input(
      z.object({
        status: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tasks = await ctx.db.task.findMany({
        where: {
          workspaceId: ctx.workspaceId,
          assigneeId: ctx.session.user.id,
          ...(input.status && { status: input.status as never }),
        },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
        include: {
          lead: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
        },
      });

      return tasks;
    }),

  // Get tasks by lead ID
  getByLeadId: protectedWorkspaceProcedure
    .input(z.object({ leadId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tasks = await ctx.db.task.findMany({
        where: {
          leadId: input.leadId,
          workspaceId: ctx.workspaceId,
        },
        orderBy: { dueDate: "desc" },
        take: 20,
      });
      return tasks;
    }),

  // Get overdue tasks
  getOverdue: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const tasks = await ctx.db.task.findMany({
      where: {
        workspaceId: ctx.workspaceId,
        status: { not: "COMPLETED" },
        dueDate: { lt: new Date() },
      },
      orderBy: { dueDate: "asc" },
      include: {
        assignee: {
          select: { id: true, name: true, image: true },
        },
        lead: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return tasks;
  }),

  // Create task
  create: protectedWorkspaceProcedure
    .input(
      z.object({
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        note: z.string().optional(),
        dueDate: z.date().optional(),
        dueAt: z.date().optional(),
        priority: z.string().default("MEDIUM"),
        assigneeId: z.string().optional(),
        leadId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.create({
        data: {
          title: input.title ?? "Follow-up task",
          description: input.description,
          note: input.note,
          dueDate: input.dueDate ?? input.dueAt,
          priority: input.priority as never,
          assigneeId: input.assigneeId ?? ctx.session.user.id,
          leadId: input.leadId,
          createdById: ctx.session.user.id,
          status: "UPCOMING",
          workspaceId: ctx.workspaceId,
        },
      });

      // Log activity if leadId is provided
      if (input.leadId) {
        await ctx.db.activity.create({
          data: {
            leadId: input.leadId,
            userId: ctx.session.user.id,
            type: "FOLLOW_UP_SCHEDULED",
            subject: "Follow-up created",
            message: `Follow-up created for ${(input.dueAt ?? input.dueDate)?.toLocaleString()}`,
            workspaceId: ctx.workspaceId,
          },
        });
      }

      return task;
    }),

  // Update task
  update: protectedWorkspaceProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        priority: z.string().optional(),
        status: z.string().optional(),
        assigneeId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const task = await ctx.db.task.findFirst({
        where: {
          id,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found or you don't have access",
        });
      }

      const updatedTask = await ctx.db.task.update({
        where: { id },
        data: {
          ...data,
          priority: data.priority as never,
          status: data.status as never,
          ...(data.status === "COMPLETED" && { completedAt: new Date() }),
        },
      });

      // If task is related to a lead, create activity
      if (updatedTask.leadId && data.status === "COMPLETED") {
        await ctx.db.activity.create({
          data: {
            type: "TASK_COMPLETED",
            subject: "Task completed",
            description: `Task "${updatedTask.title}" was completed`,
            leadId: updatedTask.leadId,
            userId: ctx.session.user.id,
            workspaceId: ctx.workspaceId,
          },
        });
      }

      return updatedTask;
    }),

  // Complete task
  complete: protectedWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: {
          id: input.id,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found or you don't have access",
        });
      }

      const updatedTask = await ctx.db.task.update({
        where: { id: input.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      if (updatedTask.leadId) {
        await ctx.db.activity.create({
          data: {
            type: "TASK_COMPLETED",
            subject: "Task completed",
            description: `Task "${updatedTask.title}" was completed`,
            leadId: updatedTask.leadId,
            userId: ctx.session.user.id,
            workspaceId: ctx.workspaceId,
          },
        });
      }

      return updatedTask;
    }),

  // Delete task
  delete: protectedWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findFirst({
        where: {
          id: input.id,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found or you don't have access",
        });
      }

      await ctx.db.task.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Get task stats
  getStats: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const workspaceId = ctx.workspaceId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, pending, inProgress, completed, overdue, dueToday] =
      await Promise.all([
        ctx.db.task.count({ where: { assigneeId: userId, workspaceId } }),
        ctx.db.task.count({
          where: { assigneeId: userId, status: "PENDING", workspaceId },
        }),
        ctx.db.task.count({
          where: { assigneeId: userId, status: "IN_PROGRESS", workspaceId },
        }),
        ctx.db.task.count({
          where: { assigneeId: userId, status: "COMPLETED", workspaceId },
        }),
        ctx.db.task.count({
          where: {
            assigneeId: userId,
            status: { not: "COMPLETED" },
            dueDate: { lt: new Date() },
            workspaceId,
          },
        }),
        ctx.db.task.count({
          where: {
            assigneeId: userId,
            status: { not: "COMPLETED" },
            dueDate: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            },
            workspaceId,
          },
        }),
      ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      dueToday,
    };
  }),
});
