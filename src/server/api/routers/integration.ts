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

        // Try to decrypt if encrypted, but handle failures gracefully
        if (config.apiKey && isEncrypted(config.apiKey)) {
          try {
            config.apiKey = decrypt(config.apiKey);
          } catch (decryptError) {
            // Decryption failed - likely encrypted with different AUTH_SECRET
            // Clear the corrupted value and let user re-enter
            console.warn(
              `Integration ${integration.provider}: apiKey decryption failed. Please re-enter credentials.`,
            );
            config.apiKey = "";
          }
        }
        if (config.secretKey && isEncrypted(config.secretKey)) {
          try {
            config.secretKey = decrypt(config.secretKey);
          } catch (decryptError) {
            // Decryption failed - likely encrypted with different AUTH_SECRET
            // Clear the corrupted value and let user re-enter
            console.warn(
              `Integration ${integration.provider}: secretKey decryption failed. Please re-enter credentials.`,
            );
            config.secretKey = "";
          }
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

  // Get CallerDesk IVR Numbers
  getCallerDeskIVRNumbers: protectedWorkspaceProcedure.mutation(
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
          "https://app.callerdesk.io/api/getdeskphone_v2",
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
        console.error("Failed to fetch CallerDesk IVR numbers:", error);
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to fetch CallerDesk IVR numbers",
        );
      }
    },
  ),

  // Get CallerDesk Call Logs
  getCallerDeskCallLogs: protectedWorkspaceProcedure
    .input(
      z.object({
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        current_page: z.number().default(1),
        per_page: z.number().default(25),
        deskphone: z.string().optional(),
        member_num: z.string().optional(),
        callresult: z.string().optional(),
        caller_num: z.string().optional(),
        Flow_type: z.string().optional(),
        contact_id: z.string().optional(),
        block: z.string().optional(),
        Member_type: z.string().optional(),
        callstatus: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
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
        const config = JSON.parse(integration.config);
        let authCode = config.apiKey;

        if (!authCode) {
          throw new Error("API Key not configured");
        }

        // Decrypt if encrypted
        if (isEncrypted(authCode)) {
          authCode = decrypt(authCode);
        }

        // Prepare form data with all filters
        const formData = new URLSearchParams();
        formData.append("authcode", authCode);
        formData.append("current_page", input.current_page.toString());
        formData.append("per_page", input.per_page.toString());

        if (input.start_date) formData.append("start_date", input.start_date);
        if (input.end_date) formData.append("end_date", input.end_date);
        if (input.deskphone) formData.append("deskphone", input.deskphone);
        if (input.member_num) formData.append("member_num", input.member_num);
        if (input.callresult) formData.append("callresult", input.callresult);
        if (input.caller_num) formData.append("caller_num", input.caller_num);
        if (input.Flow_type) formData.append("Flow_type", input.Flow_type);
        if (input.contact_id) formData.append("contact_id", input.contact_id);
        if (input.block) formData.append("block", input.block);
        if (input.Member_type)
          formData.append("Member_type", input.Member_type);
        if (input.callstatus) formData.append("callstatus", input.callstatus);

        // Use axios for better SSL handling
        const axios = (await import("axios")).default;
        const https = await import("https");

        const httpsAgent = new https.Agent({
          rejectUnauthorized: false,
        });

        const response = await axios.post(
          "https://app.callerdesk.io/api/call_list_v2",
          formData.toString(),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            httpsAgent,
          },
        );

        return response.data;
      } catch (error) {
        console.error("Failed to fetch CallerDesk call logs:", error);
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to fetch CallerDesk call logs",
        );
      }
    }),

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
