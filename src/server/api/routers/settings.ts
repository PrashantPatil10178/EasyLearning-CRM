import { z } from "zod";
import {
  createTRPCRouter,
  protectedWorkspaceProcedure,
} from "@/server/api/trpc";

export const settingsRouter = createTRPCRouter({
  getLeadFields: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    return ctx.db.leadField.findMany({
      where: {
        workspaceId: ctx.workspaceId,
      },
      orderBy: {
        order: "asc",
      },
    });
  }),

  upsertLeadField: protectedWorkspaceProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        key: z.string(),
        type: z.enum([
          "TEXT",
          "NUMBER",
          "SELECT",
          "DATE",
          "BOOLEAN",
          "EMAIL",
          "PHONE",
        ]),
        options: z.string().optional(), // JSON string
        isVisible: z.boolean().default(true),
        isRequired: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.id) {
        return ctx.db.leadField.update({
          where: { id: input.id },
          data: {
            name: input.name,
            key: input.key,
            type: input.type,
            options: input.options,
            isVisible: input.isVisible,
            isRequired: input.isRequired,
          },
        });
      } else {
        // Get max order
        const maxOrder = await ctx.db.leadField.findFirst({
          where: { workspaceId: ctx.workspaceId },
          orderBy: { order: "desc" },
        });
        const newOrder = (maxOrder?.order ?? -1) + 1;

        return ctx.db.leadField.create({
          data: {
            workspaceId: ctx.workspaceId,
            name: input.name,
            key: input.key,
            type: input.type,
            options: input.options,
            order: newOrder,
            isVisible: input.isVisible,
            isRequired: input.isRequired,
          },
        });
      }
    }),

  deleteLeadField: protectedWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.leadField.delete({
        where: { id: input.id },
      });
    }),

  toggleLeadFieldVisibility: protectedWorkspaceProcedure
    .input(z.object({ id: z.string(), isVisible: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.leadField.update({
        where: { id: input.id },
        data: { isVisible: input.isVisible },
      });
    }),
});
