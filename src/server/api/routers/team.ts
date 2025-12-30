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
          include: {
            user: {
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
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Transform the response to match the old structure
    return teams.map((team) => ({
      ...team,
      members: team.members.map((m) => m.user),
    }));
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
            include: {
              user: {
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

      if (!team) return null;

      // Transform to match old structure
      return {
        ...team,
        members: team.members.map((m) => m.user),
      };
    }),

  // Create team
  create: adminWorkspaceProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        managerId: z.string().optional(), // Optional now
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Use provided managerId or default to current user
      const managerId = input.managerId || ctx.session.user.id;

      const team = await ctx.db.team.create({
        data: {
          name: input.name,
          description: input.description,
          managerId: managerId,
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

      // Create team membership (many-to-many)
      await ctx.db.teamMember.create({
        data: {
          teamId: input.teamId,
          userId: input.userId,
        },
      });

      return { success: true };
    }),

  // Remove member from team
  removeMember: adminWorkspaceProcedure
    .input(
      z.object({
        userId: z.string(),
        teamId: z.string(), // Now we need to specify which team to remove from
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.teamMember.findFirst({
        where: {
          userId: input.userId,
          teamId: input.teamId,
        },
        include: {
          team: true,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found in this team",
        });
      }

      if (membership.team.workspaceId !== ctx.workspaceId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot manage users from other workspaces",
        });
      }

      await ctx.db.teamMember.delete({
        where: { id: membership.id },
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

  // Get my teams (now returns array since user can be in multiple teams)
  getMyTeams: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.teamMember.findMany({
      where: {
        userId: ctx.session.user.id,
        team: {
          workspaceId: ctx.workspaceId,
        },
      },
      include: {
        team: {
          include: {
            manager: {
              select: { id: true, name: true, email: true, image: true },
            },
            members: {
              include: {
                user: {
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
        },
      },
    });

    return memberships.map((m) => ({
      ...m.team,
      members: m.team.members.map((tm) => tm.user),
    }));
  }),
});
