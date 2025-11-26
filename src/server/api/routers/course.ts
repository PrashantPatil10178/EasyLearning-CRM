import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";

export const courseRouter = createTRPCRouter({
  // Get all courses
  getAll: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        mode: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { category, mode, isActive } = input;

      const where = {
        ...(category && { category }),
        ...(mode && { mode: mode as never }),
        ...(isActive !== undefined && { isActive }),
      };

      const courses = await ctx.db.course.findMany({
        where,
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { batches: true },
          },
        },
      });

      return courses;
    }),

  // Get single course with batches
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({
        where: { id: input.id },
        include: {
          batches: {
            orderBy: { startDate: "asc" },
          },
        },
      });

      return course;
    }),

  // Create course
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        price: z.number(),
        discountPrice: z.number().optional(),
        durationDays: z.number().optional(),
        durationHours: z.number().optional(),
        mode: z.string().default("ONLINE"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.course.create({
        data: {
          name: input.name,
          code: input.code,
          description: input.description,
          category: input.category,
          price: input.price,
          discountPrice: input.discountPrice,
          durationDays: input.durationDays,
          durationHours: input.durationHours,
          mode: input.mode as never,
        },
      });

      return course;
    }),

  // Update course
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        price: z.number().optional(),
        discountPrice: z.number().optional(),
        durationDays: z.number().optional(),
        durationHours: z.number().optional(),
        mode: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const course = await ctx.db.course.update({
        where: { id },
        data: {
          ...data,
          mode: data.mode as never,
        },
      });

      return course;
    }),

  // Delete course
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.course.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // ==================
  // BATCH MANAGEMENT
  // ==================

  // Get batches for a course
  getBatches: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const batches = await ctx.db.batch.findMany({
        where: { courseId: input.courseId },
        orderBy: { startDate: "asc" },
        include: {
          course: {
            select: { name: true, code: true },
          },
        },
      });

      return batches;
    }),

  // Get upcoming batches
  getUpcomingBatches: protectedProcedure.query(async ({ ctx }) => {
    const batches = await ctx.db.batch.findMany({
      where: {
        status: "UPCOMING",
        startDate: { gte: new Date() },
      },
      orderBy: { startDate: "asc" },
      take: 10,
      include: {
        course: {
          select: { name: true, code: true, price: true },
        },
      },
    });

    return batches;
  }),

  // Create batch
  createBatch: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        courseId: z.string(),
        startDate: z.date(),
        endDate: z.date().optional(),
        timing: z.string().optional(),
        days: z.string().optional(),
        maxStudents: z.number().default(30),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const batch = await ctx.db.batch.create({
        data: {
          name: input.name,
          courseId: input.courseId,
          startDate: input.startDate,
          endDate: input.endDate,
          timing: input.timing,
          days: input.days,
          maxStudents: input.maxStudents,
        },
      });

      return batch;
    }),

  // Update batch
  updateBatch: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        timing: z.string().optional(),
        days: z.string().optional(),
        maxStudents: z.number().optional(),
        status: z.string().optional(),
        enrolledCount: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const batch = await ctx.db.batch.update({
        where: { id },
        data: {
          ...data,
          status: data.status as never,
        },
      });

      return batch;
    }),

  // Delete batch
  deleteBatch: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.batch.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
