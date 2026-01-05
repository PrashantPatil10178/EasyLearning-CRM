import { z } from "zod";
import {
  createTRPCRouter,
  protectedWorkspaceProcedure,
  adminWorkspaceProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const leadStatusRouter = createTRPCRouter({
  // Get all status configurations for a workspace
  getAll: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const statuses = await ctx.db.leadStatusConfig.findMany({
      where: {
        workspaceId: ctx.workspaceId,
        isDeleted: false,
      },
      orderBy: [{ stage: "asc" }, { order: "asc" }],
    });

    // If no statuses exist, create default ones
    if (statuses.length === 0) {
      await createDefaultStatuses(ctx.db, ctx.workspaceId);
      return ctx.db.leadStatusConfig.findMany({
        where: {
          workspaceId: ctx.workspaceId,
          isDeleted: false,
        },
        orderBy: [{ stage: "asc" }, { order: "asc" }],
      });
    }

    return statuses;
  }),

  // Get statuses grouped by stage
  getByStage: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const statuses = await ctx.db.leadStatusConfig.findMany({
      where: {
        workspaceId: ctx.workspaceId,
        isDeleted: false,
      },
      orderBy: [{ stage: "asc" }, { order: "asc" }],
    });

    // Group by stage
    const grouped = {
      INITIAL: statuses.filter((s) => s.stage === "INITIAL"),
      ACTIVE: statuses.filter((s) => s.stage === "ACTIVE"),
      CLOSED: statuses.filter((s) => s.stage === "CLOSED"),
    };

    return grouped;
  }),

  // Create new status
  create: adminWorkspaceProcedure
    .input(
      z.object({
        name: z.string().min(1),
        stage: z.enum(["INITIAL", "ACTIVE", "CLOSED"]),
        color: z.string().optional(),
        isDefault: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if status with same name exists
      const existing = await ctx.db.leadStatusConfig.findUnique({
        where: {
          workspaceId_name: {
            workspaceId: ctx.workspaceId,
            name: input.name,
          },
        },
      });

      if (existing && !existing.isDeleted) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Status with this name already exists",
        });
      }

      // If setting as default, unset other defaults
      if (input.isDefault) {
        await ctx.db.leadStatusConfig.updateMany({
          where: {
            workspaceId: ctx.workspaceId,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      // Get max order for stage
      const maxOrder = await ctx.db.leadStatusConfig.findFirst({
        where: {
          workspaceId: ctx.workspaceId,
          stage: input.stage,
          isDeleted: false,
        },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const status = await ctx.db.leadStatusConfig.create({
        data: {
          workspaceId: ctx.workspaceId,
          name: input.name,
          stage: input.stage,
          color: input.color,
          isDefault: input.isDefault,
          order: (maxOrder?.order ?? 0) + 1,
        },
      });

      return status;
    }),

  // Update status
  update: adminWorkspaceProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        color: z.string().optional(),
        isDefault: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Check if status exists and belongs to workspace
      const existing = await ctx.db.leadStatusConfig.findFirst({
        where: {
          id,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Status not found",
        });
      }

      // If updating name, check for duplicates
      if (data.name && data.name !== existing.name) {
        const duplicate = await ctx.db.leadStatusConfig.findUnique({
          where: {
            workspaceId_name: {
              workspaceId: ctx.workspaceId,
              name: data.name,
            },
          },
        });

        if (duplicate && !duplicate.isDeleted) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Status with this name already exists",
          });
        }
      }

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await ctx.db.leadStatusConfig.updateMany({
          where: {
            workspaceId: ctx.workspaceId,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }

      const status = await ctx.db.leadStatusConfig.update({
        where: { id },
        data,
      });

      return status;
    }),

  // Delete status (soft delete)
  delete: adminWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const status = await ctx.db.leadStatusConfig.findFirst({
        where: {
          id: input.id,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!status) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Status not found",
        });
      }

      // Check if any leads are using this status
      const leadsCount = await ctx.db.lead.count({
        where: {
          workspaceId: ctx.workspaceId,
          status: status.name as any,
        },
      });

      if (leadsCount > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete status. ${leadsCount} leads are using this status.`,
        });
      }

      await ctx.db.leadStatusConfig.update({
        where: { id: input.id },
        data: { isDeleted: true },
      });

      return { success: true };
    }),

  // Reorder statuses
  reorder: adminWorkspaceProcedure
    .input(
      z.object({
        statusIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updates = input.statusIds.map((id, index) =>
        ctx.db.leadStatusConfig.update({
          where: { id },
          data: { order: index },
        }),
      );

      await Promise.all(updates);
      return { success: true };
    }),

  // Get all lost lead reasons
  getLostReasons: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const reasons = await ctx.db.lostLeadReason.findMany({
      where: {
        workspaceId: ctx.workspaceId,
        isDeleted: false,
      },
      orderBy: { order: "asc" },
    });

    // If no reasons exist, create default ones
    if (reasons.length === 0) {
      await createDefaultLostReasons(ctx.db, ctx.workspaceId);
      return ctx.db.lostLeadReason.findMany({
        where: {
          workspaceId: ctx.workspaceId,
          isDeleted: false,
        },
        orderBy: { order: "asc" },
      });
    }

    return reasons;
  }),

  // Create lost reason
  createLostReason: adminWorkspaceProcedure
    .input(
      z.object({
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.lostLeadReason.findUnique({
        where: {
          workspaceId_name: {
            workspaceId: ctx.workspaceId,
            name: input.name,
          },
        },
      });

      if (existing && !existing.isDeleted) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Reason with this name already exists",
        });
      }

      const maxOrder = await ctx.db.lostLeadReason.findFirst({
        where: {
          workspaceId: ctx.workspaceId,
          isDeleted: false,
        },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const reason = await ctx.db.lostLeadReason.create({
        data: {
          workspaceId: ctx.workspaceId,
          name: input.name,
          order: (maxOrder?.order ?? 0) + 1,
        },
      });

      return reason;
    }),

  // Update lost reason
  updateLostReason: adminWorkspaceProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.lostLeadReason.findFirst({
        where: {
          id: input.id,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reason not found",
        });
      }

      const duplicate = await ctx.db.lostLeadReason.findUnique({
        where: {
          workspaceId_name: {
            workspaceId: ctx.workspaceId,
            name: input.name,
          },
        },
      });

      if (duplicate && duplicate.id !== input.id && !duplicate.isDeleted) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Reason with this name already exists",
        });
      }

      const reason = await ctx.db.lostLeadReason.update({
        where: { id: input.id },
        data: { name: input.name },
      });

      return reason;
    }),

  // Delete lost reason
  deleteLostReason: adminWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.lostLeadReason.update({
        where: { id: input.id },
        data: { isDeleted: true },
      });

      return { success: true };
    }),
});

// Helper function to create default statuses
async function createDefaultStatuses(db: any, workspaceId: string) {
  const defaultStatuses = [
    // Initial Stage (Fresh)
    {
      name: "New Lead",
      stage: "INITIAL",
      color: "#3B82F6", // Blue
      isDefault: true,
      order: 0,
    },

    // Active Stage
    {
      name: "Worked",
      stage: "ACTIVE",
      color: "#8B5CF6", // Purple
      isDefault: false,
      order: 1,
    },
    {
      name: "Interested",
      stage: "ACTIVE",
      color: "#10B981", // Green
      isDefault: false,
      order: 2,
    },
    {
      name: "Just Curious",
      stage: "ACTIVE",
      color: "#F59E0B", // Amber
      isDefault: false,
      order: 3,
    },
    {
      name: "Follow Up",
      stage: "ACTIVE",
      color: "#06B6D4", // Cyan
      isDefault: false,
      order: 4,
    },

    // Closed Stage
    {
      name: "No Response",
      stage: "CLOSED",
      color: "#6B7280", // Gray
      isDefault: false,
      order: 5,
    },
    {
      name: "Not Interested",
      stage: "CLOSED",
      color: "#EF4444", // Red
      isDefault: false,
      order: 6,
    },
    {
      name: "Won",
      stage: "CLOSED",
      color: "#22C55E", // Bright Green
      isDefault: false,
      order: 7,
    },
    {
      name: "Lost",
      stage: "CLOSED",
      color: "#DC2626", // Dark Red
      isDefault: false,
      order: 8,
    },
    {
      name: "Do Not Contact",
      stage: "CLOSED",
      color: "#991B1B", // Very Dark Red
      isDefault: false,
      order: 9,
    },
  ];

  await db.leadStatusConfig.createMany({
    data: defaultStatuses.map((status) => ({
      ...status,
      workspaceId,
    })),
  });
}

// Helper function to create default lost reasons
async function createDefaultLostReasons(db: any, workspaceId: string) {
  const defaultReasons = [
    { name: "No Need", order: 0 },
    { name: "Free Materials", order: 1 },
    { name: "Budget Issues", order: 2 },
    { name: "Product does not fit need", order: 3 },
    { name: "Lost to competitor", order: 4 },
    { name: "Not Interested", order: 5 },
    { name: "Unknown Reason", order: 6 },
  ];

  await db.lostLeadReason.createMany({
    data: defaultReasons.map((reason) => ({
      ...reason,
      workspaceId,
    })),
  });
}
