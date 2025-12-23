import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const workspaceRouter = createTRPCRouter({
  // Get all workspaces for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const members = await ctx.db.workspaceMember.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        workspace: true,
      },
    });

    return members.map((member) => ({
      id: member.workspace.id,
      name: member.workspace.name,
      slug: member.workspace.slug,
      logo: member.workspace.logo,
      role: member.role,
    }));
  }),

  // Create a new workspace
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z
          .string()
          .min(1)
          .regex(
            /^[a-z0-9-]+$/,
            "Slug must be lowercase alphanumeric with hyphens",
          ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Only ADMIN and SUPER_ADMIN can create workspaces
      const userRole = ctx.session.user.role;
      if (!["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can create workspaces",
        });
      }

      // Check if slug exists
      const existing = await ctx.db.workspace.findUnique({
        where: { slug: input.slug },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Workspace URL already taken",
        });
      }

      // Create workspace and add creator as ADMIN
      const workspace = await ctx.db.workspace.create({
        data: {
          name: input.name,
          slug: input.slug,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: "ADMIN",
            },
          },
        },
      });

      return workspace;
    }),
});
