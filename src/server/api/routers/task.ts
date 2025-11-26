import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const taskRouter = createTRPCRouter({
  // Get all tasks
  getAll: protectedProcedure
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
              select: { id: true, firstName: true, lastName: true, phone: true },
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
  getMyTasks: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tasks = await ctx.db.task.findMany({
        where: {
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

  // Get overdue tasks
  getOverdue: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await ctx.db.task.findMany({
      where: {
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
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        priority: z.string().default("MEDIUM"),
        assigneeId: z.string(),
        leadId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.create({
        data: {
          title: input.title,
          description: input.description,
          dueDate: input.dueDate,
          priority: input.priority as never,
          assigneeId: input.assigneeId,
          leadId: input.leadId,
          createdById: ctx.session.user.id,
        },
      });

      return task;
    }),

  // Update task
  update: protectedProcedure
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

      const task = await ctx.db.task.update({
        where: { id },
        data: {
          ...data,
          priority: data.priority as never,
          status: data.status as never,
          ...(data.status === "COMPLETED" && { completedAt: new Date() }),
        },
      });

      // If task is related to a lead, create activity
      if (task.leadId && data.status === "COMPLETED") {
        await ctx.db.activity.create({
          data: {
            type: "TASK_COMPLETED",
            subject: "Task completed",
            description: `Task "${task.title}" was completed`,
            leadId: task.leadId,
            userId: ctx.session.user.id,
          },
        });
      }

      return task;
    }),

  // Complete task
  complete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.update({
        where: { id: input.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      if (task.leadId) {
        await ctx.db.activity.create({
          data: {
            type: "TASK_COMPLETED",
            subject: "Task completed",
            description: `Task "${task.title}" was completed`,
            leadId: task.leadId,
            userId: ctx.session.user.id,
          },
        });
      }

      return task;
    }),

  // Delete task
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.task.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Get task stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, pending, inProgress, completed, overdue, dueToday] =
      await Promise.all([
        ctx.db.task.count({ where: { assigneeId: userId } }),
        ctx.db.task.count({ where: { assigneeId: userId, status: "PENDING" } }),
        ctx.db.task.count({ where: { assigneeId: userId, status: "IN_PROGRESS" } }),
        ctx.db.task.count({ where: { assigneeId: userId, status: "COMPLETED" } }),
        ctx.db.task.count({
          where: {
            assigneeId: userId,
            status: { not: "COMPLETED" },
            dueDate: { lt: today },
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
