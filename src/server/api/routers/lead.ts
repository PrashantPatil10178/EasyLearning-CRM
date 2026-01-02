import { z } from "zod";
import {
  createTRPCRouter,
  protectedWorkspaceProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const leadRouter = createTRPCRouter({
  // Get all leads with filters
  getAll: protectedWorkspaceProcedure
    .input(
      z.object({
        category: z.string().optional(),
        status: z.string().optional(),
        source: z.string().optional(),
        ownerId: z.string().optional(),
        priority: z.string().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        category,
        status,
        source,
        ownerId,
        priority,
        search,
        page,
        limit,
      } = input;
      const skip = (page - 1) * limit;

      // Check user role - AGENT and VIEWER can only see their own leads
      const userRole = ctx.session.user.role;
      const isRestrictedUser = ["AGENT", "VIEWER"].includes(userRole);

      const where = {
        workspaceId: ctx.workspaceId,
        // If user is AGENT or VIEWER, only show leads assigned to them
        ...(isRestrictedUser && { ownerId: ctx.session.user.id }),
        // If ownerId filter is provided and user is admin/manager, apply it
        ...(!isRestrictedUser && ownerId && { ownerId }),
        ...(category && { category: category as never }),
        ...(status && { status: status as never }),
        ...(source && { source: source as never }),
        ...(priority && { priority: priority as never }),
        ...(search && {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }),
      };

      const [leads, total] = await Promise.all([
        ctx.db.lead.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            owner: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        }),
        ctx.db.lead.count({ where }),
      ]);

      return {
        leads,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      };
    }),

  // Get single lead by ID
  getById: protectedWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.findUnique({
        where: {
          id: input.id,
          workspaceId: ctx.workspaceId,
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true, image: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          activities: {
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
              user: { select: { name: true, image: true } },
            },
          },
          notes: {
            orderBy: { createdAt: "desc" },
            include: {
              user: { select: { name: true, image: true } },
            },
          },
          tasks: {
            orderBy: { dueDate: "asc" },
            include: {
              assignee: { select: { name: true, image: true } },
            },
          },
          calls: {
            orderBy: { startedAt: "desc" },
            take: 10,
          },
          campaignLeads: {
            include: {
              campaign: true,
            },
          },
        },
      });

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found",
        });
      }

      // Check access - AGENT and VIEWER can only view their own leads
      const userRole = ctx.session.user.role;
      const isRestrictedUser = ["AGENT", "VIEWER"].includes(userRole);

      if (isRestrictedUser && lead.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to access this lead",
        });
      }

      return lead;
    }),

  // Create new lead
  create: protectedWorkspaceProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().min(10),
        altPhone: z.string().optional(),
        source: z.string().default("WEBSITE"),
        status: z.string().default("NEW_LEAD"),
        priority: z.string().default("MEDIUM"),
        ownerId: z.string().optional(),
        nextFollowUp: z.string().optional(),
        campaign: z.string().optional(),
        customFields: z.string().optional(), // JSON string for dynamic fields
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Calculate category based on status
      const category =
        input.status === "NEW_LEAD"
          ? "FRESH"
          : [
                "INTERESTED",
                "JUST_CURIOUS",
                "FOLLOW_UP",
                "CONTACTED",
                "QUALIFIED",
                "NEGOTIATION",
              ].includes(input.status)
            ? "ACTIVE"
            : "CLOSED";

      const lead = await ctx.db.lead.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email || null,
          phone: input.phone,
          altPhone: input.altPhone,
          source: input.source as never,
          category: category as never,
          status: input.status as never,
          priority: input.priority as never,
          ownerId: input.ownerId || null,
          nextFollowUp: input.nextFollowUp
            ? new Date(input.nextFollowUp)
            : null,
          campaign: input.campaign || null,
          customFields: input.customFields,
          workspaceId: ctx.workspaceId,
          createdById: ctx.session.user.id,
        },
      });

      // Create activity for lead creation
      await ctx.db.activity.create({
        data: {
          type: "LEAD_ASSIGNED",
          subject: "Lead created",
          description: `Lead ${input.firstName} ${input.lastName ?? ""} was created`,
          leadId: lead.id,
          userId: ctx.session.user.id,
        },
      });

      return lead;
    }),

  // Update lead
  update: protectedWorkspaceProcedure
    .input(
      z.object({
        id: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        altPhone: z.string().optional(),
        source: z.string().optional(),
        category: z.string().optional(), // Added for manual category change
        status: z.string().optional(),
        priority: z.string().optional(),
        courseInterested: z.string().optional(),
        courseLevel: z.string().optional(),
        preferredBatch: z.string().optional(),
        budget: z.number().optional(),
        revenue: z.number().optional(), // Added revenue field
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),
        address: z.string().optional(),
        ownerId: z.string().optional(),
        nextFollowUp: z.date().optional(),
        tags: z.string().optional(),
        campaign: z.string().optional(),
        customFields: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, category: inputCategory, ...data } = input;

      // Get current lead to check for status change and workspace access
      const currentLead = await ctx.db.lead.findFirst({
        where: {
          id,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!currentLead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found or you don't have access",
        });
      }

      // Check access - AGENT and VIEWER can only update their own leads
      const userRole = ctx.session.user.role;
      const isRestrictedUser = ["AGENT", "VIEWER"].includes(userRole);

      if (isRestrictedUser && currentLead.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this lead",
        });
      }

      // Track field changes for activity log
      const changes: string[] = [];
      const fieldLabels: Record<string, string> = {
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email",
        phone: "Phone",
        altPhone: "Alternate Phone",
        source: "Source",
        status: "Status",
        priority: "Priority",
        courseInterested: "Course Interested",
        courseLevel: "Course Level",
        preferredBatch: "Preferred Batch",
        budget: "Budget",
        revenue: "Revenue",
        city: "City",
        state: "State",
        country: "Country",
        pincode: "Pincode",
        address: "Address",
        ownerId: "Owner",
        nextFollowUp: "Next Follow-up",
        campaign: "Campaign",
      };

      // Check each field for changes
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && key in currentLead) {
          const oldValue = (currentLead as any)[key];
          const newValue = value;

          // Skip if values are the same
          if (oldValue === newValue) continue;

          // Handle empty strings as null for comparison
          if (
            (oldValue === null || oldValue === "") &&
            (newValue === "" || newValue === null)
          )
            continue;

          // Format change message
          const label = fieldLabels[key] || key;
          const oldDisplay = oldValue?.toString() || "(empty)";
          const newDisplay = newValue?.toString() || "(empty)";

          if (key === "nextFollowUp") {
            const oldDate = oldValue
              ? new Date(oldValue).toLocaleDateString()
              : "(not set)";
            const newDate = newValue
              ? new Date(newValue as Date).toLocaleDateString()
              : "(not set)";
            changes.push(`${label}: ${oldDate} → ${newDate}`);
          } else {
            changes.push(`${label}: ${oldDisplay} → ${newDisplay}`);
          }
        }
      }

      // Calculate category if status is being updated
      const category = data.status
        ? data.status === "NEW_LEAD"
          ? "FRESH"
          : [
                "INTERESTED",
                "JUST_CURIOUS",
                "FOLLOW_UP",
                "CONTACTED",
                "QUALIFIED",
                "NEGOTIATION",
              ].includes(data.status)
            ? "ACTIVE"
            : "CLOSED"
        : inputCategory || undefined; // Use provided category if no status change

      const lead = await ctx.db.lead.update({
        where: { id },
        data: {
          ...data,
          ...(category && { category: category as never }),
          email: data.email || null,
          source: data.source as never,
          status: data.status as never,
          priority: data.priority as never,
          lastContactAt: new Date(),
        },
      });

      // Create activity for status change (separate from general edit)
      if (currentLead && data.status && currentLead.status !== data.status) {
        await ctx.db.activity.create({
          data: {
            type: "STATUS_CHANGE",
            subject: "Status changed",
            description: `Status changed from ${currentLead.status} to ${data.status}`,
            leadId: lead.id,
            userId: ctx.session.user.id,
            workspaceId: ctx.workspaceId,
          },
        });
      }

      // Create activity for general field edits (if there are non-status changes)
      const nonStatusChanges = changes.filter(
        (change) => !change.startsWith("Status:"),
      );
      if (nonStatusChanges.length > 0) {
        await ctx.db.activity.create({
          data: {
            type: "EDIT",
            subject: "Lead information updated",
            description: nonStatusChanges.join(", "),
            leadId: lead.id,
            userId: ctx.session.user.id,
            workspaceId: ctx.workspaceId,
          },
        });
      }

      return lead;
    }),

  // Delete lead
  delete: protectedWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.findFirst({
        where: { id: input.id, workspaceId: ctx.workspaceId },
      });

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found or you don't have access",
        });
      }

      // Check access - AGENT and VIEWER can only delete their own leads
      const userRole = ctx.session.user.role;
      const isRestrictedUser = ["AGENT", "VIEWER"].includes(userRole);

      if (isRestrictedUser && lead.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this lead",
        });
      }

      await ctx.db.lead.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Assign lead to user
  assign: protectedWorkspaceProcedure
    .input(
      z.object({
        leadId: z.string(),
        ownerId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.findFirst({
        where: {
          id: input.leadId,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found or you don't have access",
        });
      }

      const updatedLead = await ctx.db.lead.update({
        where: { id: input.leadId },
        data: { ownerId: input.ownerId },
      });

      await ctx.db.activity.create({
        data: {
          type: "LEAD_ASSIGNED",
          subject: "Lead assigned",
          description: `Lead assigned to new owner`,
          leadId: updatedLead.id,
          userId: ctx.session.user.id,
          workspaceId: ctx.workspaceId,
        },
      });

      return updatedLead;
    }),

  // Bulk assign leads
  bulkAssign: protectedWorkspaceProcedure
    .input(
      z.object({
        leadIds: z.array(z.string()),
        ownerId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { leadIds, ownerId } = input;

      // Verify owner exists
      const owner = await ctx.db.user.findUnique({
        where: { id: ownerId },
      });

      if (!owner) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Owner not found",
        });
      }

      // Update leads
      await ctx.db.lead.updateMany({
        where: {
          id: { in: leadIds },
          workspaceId: ctx.workspaceId,
        },
        data: { ownerId },
      });

      // Create activities
      await ctx.db.activity.createMany({
        data: leadIds.map((leadId) => ({
          type: "LEAD_ASSIGNED",
          subject: "Lead assigned",
          description: `Lead assigned to ${owner.name}`,
          leadId,
          userId: ctx.session.user.id,
          workspaceId: ctx.workspaceId,
        })),
      });

      return { success: true };
    }),

  // Bulk update leads
  bulkUpdate: protectedWorkspaceProcedure
    .input(
      z.object({
        leadIds: z.array(z.string()),
        data: z.object({
          status: z.string().optional(),
          priority: z.string().optional(),
          source: z.string().optional(),
          tags: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { leadIds, data } = input;

      await ctx.db.lead.updateMany({
        where: {
          id: { in: leadIds },
          workspaceId: ctx.workspaceId,
        },
        data: data as never,
      });

      return { success: true, count: leadIds.length };
    }),

  // Bulk delete leads
  bulkDelete: protectedWorkspaceProcedure
    .input(z.object({ leadIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const { leadIds } = input;

      await ctx.db.lead.deleteMany({
        where: {
          id: { in: leadIds },
          workspaceId: ctx.workspaceId,
        },
      });

      return { success: true, count: leadIds.length };
    }),

  // Import leads from CSV
  importFromCSV: protectedWorkspaceProcedure
    .input(
      z.object({
        leads: z.array(
          z.object({
            firstName: z.string(),
            lastName: z.string().optional(),
            email: z.string().email().optional(),
            phone: z.string(),
            altPhone: z.string().optional(),
            source: z.string().optional(),
            status: z.string().optional(),
            priority: z.string().optional(),
            courseInterested: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            tags: z.string().optional(),
            campaign: z.string().optional(),
            nextFollowUp: z.string().optional(),
            customFields: z.string().optional(),
            ownerId: z.string().optional(), // Add ownerId support
          }),
        ),
        assignToMe: z.boolean().default(false),
        autoAssign: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { leads, assignToMe, autoAssign } = input;
      const userId = ctx.session.user.id;

      const createdLeads = await Promise.all(
        leads.map((lead) => {
          // Determine the owner ID
          let ownerId = null;

          // Priority: 1. lead.ownerId (from CSV "Assign To" column)
          //           2. assignToMe flag
          //           3. autoAssign flag (future feature)
          if (lead.ownerId) {
            ownerId = lead.ownerId;
          } else if (assignToMe) {
            ownerId = userId;
          }

          return ctx.db.lead.create({
            data: {
              firstName: lead.firstName,
              lastName: lead.lastName || null,
              email: lead.email || null,
              phone: lead.phone,
              altPhone: lead.altPhone || null,
              source: (lead.source?.toUpperCase().replace(/\s+/g, "_") ||
                "OTHER") as never,
              status: (lead.status?.toUpperCase().replace(/\s+/g, "_") === "NEW"
                ? "NEW_LEAD"
                : lead.status?.toUpperCase().replace(/\s+/g, "_") ||
                  "NEW_LEAD") as never,
              priority: (lead.priority?.toUpperCase().replace(/\s+/g, "_") ||
                "MEDIUM") as never,
              courseInterested: lead.courseInterested || null,
              city: lead.city || null,
              state: lead.state || null,
              tags: lead.tags || null,
              campaign: lead.campaign || null,
              nextFollowUp: lead.nextFollowUp
                ? new Date(lead.nextFollowUp)
                : null,
              customFields: lead.customFields || null,
              createdById: userId,
              workspaceId: ctx.workspaceId,
              ...(ownerId && {
                ownerId: ownerId,
                assignedAt: new Date(),
                assignedBy: userId,
              }),
            },
          });
        }),
      );

      return { success: true, count: createdLeads.length };
    }),

  // Export leads to CSV
  exportToCSV: protectedWorkspaceProcedure
    .input(
      z.object({
        status: z.string().optional(),
        source: z.string().optional(),
        ownerId: z.string().optional(),
        priority: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { status, source, ownerId, priority, search } = input;

      const where = {
        workspaceId: ctx.workspaceId,
        ...(status && { status: status as never }),
        ...(source && { source: source as never }),
        ...(ownerId && { ownerId }),
        ...(priority && { priority: priority as never }),
        ...(search && {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }),
      };

      const leads = await ctx.db.lead.findMany({
        where,
        include: {
          owner: {
            select: { name: true, email: true },
          },
        },
      });

      return leads.map((lead) => ({
        firstName: lead.firstName,
        lastName: lead.lastName || "",
        email: lead.email || "",
        phone: lead.phone,
        altPhone: lead.altPhone || "",
        source: lead.source,
        status: lead.status,
        priority: lead.priority,
        courseInterested: lead.courseInterested || "",
        city: lead.city || "",
        state: lead.state || "",
        country: lead.country || "",
        tags: lead.tags || "",
        owner: lead.owner?.name || "",
        ownerEmail: lead.owner?.email || "",
        createdAt: lead.createdAt.toISOString(),
      }));
    }),

  // Get lead stats
  getStats: protectedWorkspaceProcedure.query(async ({ ctx }) => {
    const workspaceId = ctx.workspaceId;

    // Check user role - AGENT and VIEWER can only see their own lead stats
    const userRole = ctx.session.user.role;
    const isRestrictedUser = ["AGENT", "VIEWER"].includes(userRole);

    const whereCondition = {
      workspaceId,
      ...(isRestrictedUser && { ownerId: ctx.session.user.id }),
    };

    const [total, newLeads, contacted, qualified, converted, todayFollowUps] =
      await Promise.all([
        ctx.db.lead.count({ where: whereCondition }),
        ctx.db.lead.count({ where: { ...whereCondition, status: "NEW_LEAD" } }),
        ctx.db.lead.count({
          where: { ...whereCondition, status: "CONTACTED" },
        }),
        ctx.db.lead.count({
          where: { ...whereCondition, status: "QUALIFIED" },
        }),
        ctx.db.lead.count({
          where: { ...whereCondition, status: "CONVERTED" },
        }),
        ctx.db.lead.count({
          where: {
            ...whereCondition,
            nextFollowUp: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),
      ]);

    return {
      total,
      newLeads,
      contacted,
      qualified,
      converted,
      todayFollowUps,
      conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : "0",
    };
  }),

  // Update lead status
  updateStatus: protectedWorkspaceProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentLead = await ctx.db.lead.findFirst({
        where: { id: input.id, workspaceId: ctx.workspaceId },
      });

      if (!currentLead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found or you don't have access",
        });
      }

      // Calculate category based on new status
      const category =
        input.status === "NEW_LEAD"
          ? "FRESH"
          : [
                "INTERESTED",
                "JUST_CURIOUS",
                "FOLLOW_UP",
                "CONTACTED",
                "QUALIFIED",
                "NEGOTIATION",
              ].includes(input.status)
            ? "ACTIVE"
            : "CLOSED";

      const lead = await ctx.db.lead.update({
        where: { id: input.id },
        data: {
          category: category as never,
          status: input.status as never,
          ...(input.status === "CONVERTED" && { convertedAt: new Date() }),
        },
      });

      // Log activity
      await ctx.db.activity.create({
        data: {
          type: "STATUS_CHANGE",
          subject: "Status updated",
          description: `Status changed from ${currentLead.status} to ${input.status}`,
          leadId: input.id,
          userId: ctx.session.user.id,
          workspaceId: ctx.workspaceId,
        },
      });

      // 🔥 Trigger WhatsApp on status change (matches PHP implementation)
      const { triggerWhatsAppOnStatus } = await import(
        "@/server/services/whatsapp-trigger"
      );
      await triggerWhatsAppOnStatus(
        ctx.db,
        input.id,
        ctx.session.user.id,
        input.status,
        ctx.workspaceId,
      );

      return lead;
    }),

  // Quick save revenue and feedback
  quickSave: protectedWorkspaceProcedure
    .input(
      z.object({
        id: z.string(),
        revenue: z.number().optional(),
        feedbackNeeded: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existingLead = await ctx.db.lead.findFirst({
        where: { id, workspaceId: ctx.workspaceId },
      });

      if (!existingLead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found or you don't have access",
        });
      }

      // Track changes
      const changes: string[] = [];
      if (data.revenue !== undefined && existingLead.revenue !== data.revenue) {
        changes.push(`Revenue: ${existingLead.revenue || 0} → ${data.revenue}`);
      }
      if (
        data.feedbackNeeded !== undefined &&
        existingLead.feedbackNeeded !== data.feedbackNeeded
      ) {
        changes.push(
          `Feedback Needed: ${existingLead.feedbackNeeded ? "Yes" : "No"} → ${data.feedbackNeeded ? "Yes" : "No"}`,
        );
      }

      const lead = await ctx.db.lead.update({
        where: { id },
        data,
      });

      // Log activity only if there are actual changes
      if (changes.length > 0) {
        await ctx.db.activity.create({
          data: {
            leadId: id,
            userId: ctx.session.user.id,
            type: "EDIT",
            subject: "Lead updated",
            description: changes.join(", "),
            workspaceId: ctx.workspaceId,
          },
        });
      }

      return lead;
    }),
});
