import { z } from "zod";
import {
  createTRPCRouter,
  protectedWorkspaceProcedure,
} from "@/server/api/trpc";
import { encrypt, decrypt, maskString, isEncrypted } from "@/lib/encryption";

export const integrationRouter = createTRPCRouter({
  // Get all integrations for the workspace
  getAll: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const integrations = await ctx.db.integration.findMany({
      where: {
        workspaceId: ctx.workspaceId,
      },
    });
    return integrations;
  }),

  // Get specific integration
  get: protectedWorkspaceProcedure
    .input(z.object({ provider: z.string() }))
    .query(async ({ ctx, input }) => {
      const integration = await ctx.db.integration.findUnique({
        where: {
          workspaceId_provider: {
            workspaceId: ctx.workspaceId,
            provider: input.provider,
          },
        },
      });

      if (!integration) {
        return null;
      }

      // Decrypt and mask sensitive data before sending to frontend
      try {
        const config = JSON.parse(integration.config);

        // Decrypt if encrypted
        if (config.apiKey && isEncrypted(config.apiKey)) {
          config.apiKey = decrypt(config.apiKey);
        }
        if (config.secretKey && isEncrypted(config.secretKey)) {
          config.secretKey = decrypt(config.secretKey);
        }

        // Mask sensitive fields for frontend
        const maskedConfig = {
          ...config,
          apiKey: config.apiKey ? maskString(config.apiKey) : "",
          secretKey: config.secretKey ? maskString(config.secretKey) : "",
        };

        return {
          ...integration,
          config: JSON.stringify(maskedConfig),
        };
      } catch (e) {
        console.error("Failed to process integration config", e);
        return integration;
      }
    }),

  // Update integration
  update: protectedWorkspaceProcedure
    .input(
      z.object({
        provider: z.string(),
        config: z.string(), // JSON string
        isEnabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Parse config and encrypt sensitive fields
      const config = JSON.parse(input.config);

      // Get existing integration to preserve masked values
      const existing = await ctx.db.integration.findUnique({
        where: {
          workspaceId_provider: {
            workspaceId: ctx.workspaceId,
            provider: input.provider,
          },
        },
      });

      let existingConfig: any = {};
      if (existing) {
        try {
          existingConfig = JSON.parse(existing.config);
        } catch (e) {
          // Ignore parse errors
        }
      }

      // Only encrypt/update fields that are not masked (i.e., actually changed)
      if (config.apiKey && !config.apiKey.startsWith("*")) {
        config.apiKey = encrypt(config.apiKey);
      } else if (config.apiKey?.startsWith("*") && existingConfig.apiKey) {
        // Keep existing encrypted value if masked
        config.apiKey = existingConfig.apiKey;
      }

      if (config.secretKey && !config.secretKey.startsWith("*")) {
        config.secretKey = encrypt(config.secretKey);
      } else if (
        config.secretKey?.startsWith("*") &&
        existingConfig.secretKey
      ) {
        // Keep existing encrypted value if masked
        config.secretKey = existingConfig.secretKey;
      }

      const integration = await ctx.db.integration.upsert({
        where: {
          workspaceId_provider: {
            workspaceId: ctx.workspaceId,
            provider: input.provider,
          },
        },
        update: {
          config: JSON.stringify(config),
          isEnabled: input.isEnabled,
        },
        create: {
          workspaceId: ctx.workspaceId,
          provider: input.provider,
          config: JSON.stringify(config),
          isEnabled: input.isEnabled ?? true,
        },
      });

      return integration;
    }),

  // Get CallerDesk members
  getCallerDeskMembers: protectedWorkspaceProcedure.mutation(
    async ({ ctx }) => {
      try {
        // Fetch integration from database using workspace context
        const integration = await ctx.db.integration.findUnique({
          where: {
            workspaceId_provider: {
              workspaceId: ctx.workspaceId,
              provider: "CALLERDESK",
            },
          },
        });

        if (!integration) {
          throw new Error("CallerDesk integration not configured");
        }

        if (!integration.isEnabled) {
          throw new Error("CallerDesk integration is disabled");
        }

        // Parse and decrypt API key from database
        console.log(integration, {
          ctx,
        });
        const config = JSON.parse(integration.config);
        let authCode = config.apiKey;

        if (!authCode) {
          throw new Error("API Key not configured");
        }

        // Decrypt if encrypted
        if (isEncrypted(authCode)) {
          authCode = decrypt(authCode);
        }

        const formData = new FormData();
        formData.append("authcode", authCode);

        const response = await fetch(
          "https://app.callerdesk.io/api/getmemberlist_V2?current_page=1",
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          throw new Error(`CallerDesk API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Failed to fetch CallerDesk members:", error);
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to fetch CallerDesk members",
        );
      }
    },
  ),

  // Get decrypted integration config (server-side only, for API calls)
  getDecryptedConfig: protectedWorkspaceProcedure
    .input(z.object({ provider: z.string() }))
    .query(async ({ ctx, input }) => {
      const integration = await ctx.db.integration.findUnique({
        where: {
          workspaceId_provider: {
            workspaceId: ctx.workspaceId,
            provider: input.provider,
          },
        },
      });

      if (!integration) {
        return null;
      }

      try {
        const config = JSON.parse(integration.config);

        // Decrypt sensitive fields
        if (config.apiKey && isEncrypted(config.apiKey)) {
          config.apiKey = decrypt(config.apiKey);
        }
        if (config.secretKey && isEncrypted(config.secretKey)) {
          config.secretKey = decrypt(config.secretKey);
        }

        return {
          ...integration,
          config: JSON.stringify(config),
        };
      } catch (e) {
        console.error("Failed to decrypt integration config", e);
        throw new Error("Failed to decrypt integration config");
      }
    }),
});
