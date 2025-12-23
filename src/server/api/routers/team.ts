import { z } from "zod";
import {
  createTRPCRouter,
  protectedWorkspaceProcedure,
  adminWorkspaceProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const teamRouter = createTRPCRouter({
  // Get all teams
  getAll: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const teams = await ctx.db.team.findMany({
      where: { workspaceId: ctx.workspaceId },
      include: {
        manager: {
          select: { id: true, name: true, email: true, image: true },
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
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
  getById: protectedWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const team = await ctx.db.team.findUnique({
        where: {
          id: input.id,
          workspaceId: ctx.workspaceId,
        },
        include: {
          manager: {
            select: { id: true, name: true, email: true, image: true },
          },
          members: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
        },
      });

      return team;
    }),

  // Create team
  create: adminWorkspaceProcedure
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
          workspaceId: ctx.workspaceId,
        },
      });

      return team;
    }),

  // Update team
  update: adminWorkspaceProcedure
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

      const team = await ctx.db.team.findFirst({
        where: {
          id,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found or you don't have access",
        });
      }

      const updatedTeam = await ctx.db.team.update({
        where: { id },
        data,
      });

      return updatedTeam;
    }),

  // Add member to team
  addMember: adminWorkspaceProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.team.findFirst({
        where: {
          id: input.teamId,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found or you don't have access",
        });
      }

      await ctx.db.user.update({
        where: { id: input.userId },
        data: { teamId: input.teamId },
      });

      return { success: true };
    }),

  // Remove member from team
  removeMember: adminWorkspaceProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        include: { team: true },
      });

      if (!user || !user.teamId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found or not in a team",
        });
      }

      if (user.team?.workspaceId !== ctx.workspaceId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot manage users from other workspaces",
        });
      }

      await ctx.db.user.update({
        where: { id: input.userId },
        data: { teamId: null },
      });

      return { success: true };
    }),

  // Delete team
  delete: adminWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.team.findFirst({
        where: {
          id: input.id,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found or you don't have access",
        });
      }

      await ctx.db.team.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Get my team
  getMyTeam: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        team: {
          where: { workspaceId: ctx.workspaceId },
          include: {
            manager: {
              select: { id: true, name: true, email: true, image: true },
            },
            members: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return user?.team ?? null;
  }),
});
