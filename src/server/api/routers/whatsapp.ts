import { z } from "zod";
import { createTRPCRouter, adminWorkspaceProcedure } from "@/server/api/trpc";

export const whatsappRouter = createTRPCRouter({
  getTriggers: adminWorkspaceProcedure.query(async ({ ctx }) => {
    return ctx.db.whatsAppTrigger.findMany({
      where: {
        workspaceId: ctx.workspaceId,
      },
    });
  }),

  upsertTrigger: adminWorkspaceProcedure
    .input(
      z.object({
        status: z.string(),
        isEnabled: z.boolean(),
        campaignName: z.string().optional(),
        source: z.string().optional(),
        templateParamsJson: z.string().optional(),
        paramsFallbackJson: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.whatsAppTrigger.upsert({
        where: {
          workspaceId_status: {
            workspaceId: ctx.workspaceId,
            status: input.status,
          },
        },
        update: {
          isEnabled: input.isEnabled,
          campaignName: input.campaignName,
          source: input.source,
          templateParamsJson: input.templateParamsJson,
          paramsFallbackJson: input.paramsFallbackJson,
        },
        create: {
          workspaceId: ctx.workspaceId,
          status: input.status,
          isEnabled: input.isEnabled,
          campaignName: input.campaignName,
          source: input.source,
          templateParamsJson: input.templateParamsJson,
          paramsFallbackJson: input.paramsFallbackJson,
        },
      });
    }),
});
