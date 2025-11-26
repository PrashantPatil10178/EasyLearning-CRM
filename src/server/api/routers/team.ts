import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";

export const teamRouter = createTRPCRouter({
  // Get all teams
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const teams = await ctx.db.team.findMany({
      include: {
        manager: {
          select: { id: true, name: true, email: true, image: true },
        },
        members: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return teams;
  }),

  // Get single team
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const team = await ctx.db.team.findUnique({
        where: { id: input.id },
        include: {
          manager: {
            select: { id: true, name: true, email: true, image: true },
          },
          members: {
            select: { id: true, name: true, email: true, image: true, role: true },
          },
        },
      });

      return team;
    }),

  // Create team
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        managerId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.team.create({
        data: {
          name: input.name,
          description: input.description,
          managerId: input.managerId,
        },
      });

      return team;
    }),

  // Update team
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        managerId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const team = await ctx.db.team.update({
        where: { id },
        data,
      });

      return team;
    }),

  // Add member to team
  addMember: adminProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { teamId: input.teamId },
      });

      return { success: true };
    }),

  // Remove member from team
  removeMember: adminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { teamId: null },
      });

      return { success: true };
    }),

  // Delete team
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Remove all members from team first
      await ctx.db.user.updateMany({
        where: { teamId: input.id },
        data: { teamId: null },
      });

      await ctx.db.team.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Get my team
  getMyTeam: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        team: {
          include: {
            manager: {
              select: { id: true, name: true, email: true, image: true },
            },
            members: {
              select: { id: true, name: true, email: true, image: true, role: true },
            },
          },
        },
      },
    });

    return user?.team ?? null;
  }),
});
