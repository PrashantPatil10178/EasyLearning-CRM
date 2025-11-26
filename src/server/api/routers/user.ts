import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";
import { hash } from "bcryptjs";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  // Get current user
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        team: {
          select: { id: true, name: true },
        },
      },
    });

    return user;
  }),

  // Get all users (admin only)
  getAll: adminProcedure
    .input(
      z.object({
        role: z.string().optional(),
        teamId: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { role, teamId, search } = input;

      const where = {
        ...(role && { role: role as never }),
        ...(teamId && { teamId }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }),
      };

      const users = await ctx.db.user.findMany({
        where,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          phone: true,
          createdAt: true,
          team: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              ownedLeads: true,
              deals: true,
              tasks: true,
            },
          },
        },
      });

      return users;
    }),

  // Get agents for assignment dropdown
  getAgents: protectedProcedure.query(async ({ ctx }) => {
    const agents = await ctx.db.user.findMany({
      where: {
        role: { in: ["AGENT", "MANAGER", "ADMIN"] },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    return agents;
  }),

  // Get user by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        include: {
          team: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              ownedLeads: true,
              deals: true,
              tasks: true,
              calls: true,
            },
          },
        },
      });

      return user;
    }),

  // Create user (admin only)
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.string().default("AGENT"),
        phone: z.string().optional(),
        teamId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if email exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already exists",
        });
      }

      const hashedPassword = await hash(input.password, 12);

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: input.role as never,
          phone: input.phone,
          teamId: input.teamId,
        },
      });

      return user;
    }),

  // Update user
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        phone: z.string().optional(),
        image: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Only allow users to update their own profile unless admin
      if (id !== ctx.session.user.id && ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized",
        });
      }

      const user = await ctx.db.user.update({
        where: { id },
        data,
      });

      return user;
    }),

  // Update user role (admin only)
  updateRole: adminProcedure
    .input(
      z.object({
        id: z.string(),
        role: z.string(),
        teamId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: input.id },
        data: {
          role: input.role as never,
          teamId: input.teamId,
        },
      });

      return user;
    }),

  // Delete user (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Get user performance stats
  getPerformance: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session.user.id;

      const [totalLeads, convertedLeads, totalCalls, totalDeals, wonDeals] =
        await Promise.all([
          ctx.db.lead.count({ where: { ownerId: userId } }),
          ctx.db.lead.count({ where: { ownerId: userId, status: "CONVERTED" } }),
          ctx.db.call.count({ where: { userId } }),
          ctx.db.deal.count({ where: { ownerId: userId } }),
          ctx.db.deal.count({ where: { ownerId: userId, stage: "CLOSED_WON" } }),
        ]);

      // Get deal value
      const dealValue = await ctx.db.deal.aggregate({
        where: { ownerId: userId, stage: "CLOSED_WON" },
        _sum: { amount: true },
      });

      return {
        totalLeads,
        convertedLeads,
        conversionRate:
          totalLeads > 0
            ? ((convertedLeads / totalLeads) * 100).toFixed(1)
            : "0",
        totalCalls,
        totalDeals,
        wonDeals,
        winRate:
          totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(1) : "0",
        totalRevenue: dealValue._sum.amount ?? 0,
      };
    }),
});
