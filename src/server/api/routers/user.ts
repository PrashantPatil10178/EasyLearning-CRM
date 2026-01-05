import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  protectedWorkspaceProcedure,
  adminWorkspaceProcedure,
} from "@/server/api/trpc";
import { hash } from "bcryptjs";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  // Get current user
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        teamMemberships: {
          include: {
            team: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return user;
  }),

  // Get all users (accessible to all authenticated users for assignment/filtering)
  getAll: protectedWorkspaceProcedure
    .input(
      z
        .object({
          role: z.string().optional(),
          teamId: z.string().optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { role, teamId, search } = input || {};

      const where = {
        workspaces: {
          some: {
            workspaceId: ctx.workspaceId,
          },
        },
        ...(role && { role: role as never }),
        ...(teamId && {
          teamMemberships: {
            some: {
              teamId: teamId,
            },
          },
        }),
        ...(search && {
          OR: [{ name: { contains: search } }, { email: { contains: search } }],
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
          callerDeskPhone: true,
          createdAt: true,
          teamMemberships: {
            include: {
              team: {
                select: { id: true, name: true },
              },
            },
          },
          _count: {
            select: {
              ownedLeads: true,
              tasks: true,
            },
          },
        },
      });

      return users;
    }),

  // Get agents for assignment dropdown
  getAgents: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const agents = await ctx.db.user.findMany({
      where: {
        workspaces: {
          some: {
            workspaceId: ctx.workspaceId,
          },
        },
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
  getById: protectedWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findFirst({
        where: {
          id: input.id,
          workspaces: {
            some: {
              workspaceId: ctx.workspaceId,
            },
          },
        },
        include: {
          teamMemberships: {
            include: {
              team: {
                select: { id: true, name: true },
              },
            },
          },
          _count: {
            select: {
              ownedLeads: true,
              tasks: true,
              calls: true,
            },
          },
        },
      });

      return user;
    }),

  // Create user (admin only)
  create: adminWorkspaceProcedure
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
      // Check if email exists globally
      let user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (user) {
        // Check if already in workspace
        const member = await ctx.db.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: ctx.workspaceId,
              userId: user.id,
            },
          },
        });

        if (member) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User already in this workspace",
          });
        }
      } else {
        // Create new user
        const hashedPassword = await hash(input.password, 12);
        user = await ctx.db.user.create({
          data: {
            name: input.name,
            email: input.email,
            password: hashedPassword,
            role: input.role as never, // Keep global role for now
            phone: input.phone,
            teamId: input.teamId,
          },
        });
      }

      // Map UserRole to WorkspaceRole
      let workspaceRole: "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER" = "MEMBER";
      if (input.role === "ADMIN") workspaceRole = "ADMIN";
      if (input.role === "MANAGER") workspaceRole = "MANAGER";
      if (input.role === "VIEWER") workspaceRole = "VIEWER";

      // Add to workspace
      await ctx.db.workspaceMember.create({
        data: {
          workspaceId: ctx.workspaceId,
          userId: user.id,
          role: workspaceRole,
        },
      });

      return user;
    }),

  // Update user
  update: protectedWorkspaceProcedure
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

      // Check if target user is in workspace
      const targetMember = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: ctx.workspaceId,
            userId: id,
          },
        },
      });

      if (!targetMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found in this workspace",
        });
      }

      // Only allow users to update their own profile unless admin
      const isSelf = id === ctx.session.user.id;
      const isAdmin = ["ADMIN", "MANAGER"].includes(
        ctx.workspaceMember?.role ?? "",
      );

      if (!isSelf && !isAdmin) {
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
  updateRole: adminWorkspaceProcedure
    .input(
      z.object({
        id: z.string(),
        role: z.string(),
        teamId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Update WorkspaceMember role
      let workspaceRole: "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER" = "MEMBER";
      if (input.role === "ADMIN") workspaceRole = "ADMIN";
      if (input.role === "MANAGER") workspaceRole = "MANAGER";
      if (input.role === "VIEWER") workspaceRole = "VIEWER";

      await ctx.db.workspaceMember.update({
        where: {
          workspaceId_userId: {
            workspaceId: ctx.workspaceId,
            userId: input.id,
          },
        },
        data: {
          role: workspaceRole,
        },
      });

      // Also update global user role/team if needed (legacy support)
      const user = await ctx.db.user.update({
        where: { id: input.id },
        data: {
          role: input.role as never,
          teamId: input.teamId,
        },
      });

      return user;
    }),

  // Update user credentials (admin only) - for setting passwords on imported users
  updateCredentials: adminWorkspaceProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().email().optional(),
        password: z.string().min(6).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if target user is in workspace
      const targetMember = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: ctx.workspaceId,
            userId: input.id,
          },
        },
      });

      if (!targetMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found in this workspace",
        });
      }

      const updateData: any = {};

      if (input.email) {
        // Check if email is already taken by another user
        const existingUser = await ctx.db.user.findUnique({
          where: { email: input.email },
        });

        if (existingUser && existingUser.id !== input.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already in use by another user",
          });
        }

        updateData.email = input.email;
      }

      // Update password if provided
      if (input.password) {
        const hashedPassword = await hash(input.password, 12);
        updateData.password = hashedPassword;
      }

      const user = await ctx.db.user.update({
        where: { id: input.id },
        data: updateData,
      });

      return user;
    }),

  // Update user details (admin only) - comprehensive update
  updateUserDetails: adminWorkspaceProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        password: z.string().min(6).optional(),
        role: z.string().optional(),
        teamId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, role, teamId, password, ...otherData } = input;

      // Check if target user is in workspace
      const targetMember = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: ctx.workspaceId,
            userId: id,
          },
        },
      });

      if (!targetMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found in this workspace",
        });
      }

      // Check email uniqueness if provided
      if (input.email) {
        const existingUser = await ctx.db.user.findUnique({
          where: { email: input.email },
        });

        if (existingUser && existingUser.id !== id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already in use by another user",
          });
        }
      }

      // Prepare update data
      const updateData: any = { ...otherData };

      if (password) {
        const hashedPassword = await hash(password, 12);
        updateData.password = hashedPassword;
      }

      if (role) {
        updateData.role = role as never;

        // Update workspace role too
        let workspaceRole: "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER" = "MEMBER";
        if (role === "ADMIN") workspaceRole = "ADMIN";
        if (role === "MANAGER") workspaceRole = "MANAGER";
        if (role === "VIEWER") workspaceRole = "VIEWER";

        await ctx.db.workspaceMember.update({
          where: {
            workspaceId_userId: {
              workspaceId: ctx.workspaceId,
              userId: id,
            },
          },
          data: { role: workspaceRole },
        });
      }

      if (teamId !== undefined) {
        updateData.teamId = teamId;
      }

      const user = await ctx.db.user.update({
        where: { id },
        data: updateData,
      });

      return user;
    }),

  // Delete user (remove from workspace)
  delete: adminWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Remove from workspace
      await ctx.db.workspaceMember.delete({
        where: {
          workspaceId_userId: {
            workspaceId: ctx.workspaceId,
            userId: input.id,
          },
        },
      });

      return { success: true };
    }),

  // Get user performance stats
  getPerformance: protectedWorkspaceProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = input.userId ?? ctx.session.user.id;

      // Ensure target user is in workspace
      const member = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: ctx.workspaceId,
            userId: userId,
          },
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found in this workspace",
        });
      }

      const [totalLeads, convertedLeads, totalCalls] = await Promise.all([
        ctx.db.lead.count({
          where: { ownerId: userId, workspaceId: ctx.workspaceId },
        }),
        ctx.db.lead.count({
          where: {
            ownerId: userId,
            status: "CONVERTED",
            workspaceId: ctx.workspaceId,
          },
        }),
        ctx.db.call.count({ where: { userId, workspaceId: ctx.workspaceId } }),
      ]);

      // Get revenue from converted leads
      const revenue = await ctx.db.lead.aggregate({
        where: {
          ownerId: userId,
          status: "CONVERTED",
          workspaceId: ctx.workspaceId,
        },
        _sum: { revenue: true },
      });

      return {
        totalLeads,
        convertedLeads,
        conversionRate:
          totalLeads > 0
            ? ((convertedLeads / totalLeads) * 100).toFixed(1)
            : "0",
        totalCalls,
        totalRevenue: revenue._sum.revenue ?? 0,
      };
    }),

  // Update user deskphone
  updateDeskphone: protectedWorkspaceProcedure
    .input(
      z.object({
        userId: z.string(),
        deskphone: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if target user is in workspace
      const targetMember = await ctx.db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: ctx.workspaceId,
            userId: input.userId,
          },
        },
      });

      if (!targetMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found in this workspace",
        });
      }

      // Only allow admins/managers to update deskphone
      const isAdmin = ["ADMIN", "MANAGER", "SUPER_ADMIN"].includes(
        ctx.workspaceMember?.role ?? "",
      );

      if (!isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can assign deskphones",
        });
      }

      const user = await ctx.db.user.update({
        where: { id: input.userId },
        data: { callerDeskPhone: input.deskphone },
      });

      return user;
    }),
});
