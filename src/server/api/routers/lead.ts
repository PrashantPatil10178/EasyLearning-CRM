import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const leadRouter = createTRPCRouter({
  // Get all leads with filters
  getAll: protectedProcedure
    .input(
      z.object({
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
      const { status, source, ownerId, priority, search, page, limit } = input;
      const skip = (page - 1) * limit;

      const where = {
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
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.findUnique({
        where: { id: input.id },
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
        },
      });

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found",
        });
      }

      return lead;
    }),

  // Create new lead
  create: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().min(10),
        altPhone: z.string().optional(),
        source: z.string().default("WEBSITE"),
        status: z.string().default("NEW"),
        priority: z.string().default("MEDIUM"),
        courseInterested: z.string().optional(),
        courseLevel: z.string().optional(),
        preferredBatch: z.string().optional(),
        budget: z.number().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),
        address: z.string().optional(),
        ownerId: z.string().optional(),
        nextFollowUp: z.date().optional(),
        tags: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.create({
        data: {
          ...input,
          email: input.email || null,
          source: input.source as never,
          status: input.status as never,
          priority: input.priority as never,
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
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        altPhone: z.string().optional(),
        source: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        courseInterested: z.string().optional(),
        courseLevel: z.string().optional(),
        preferredBatch: z.string().optional(),
        budget: z.number().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        pincode: z.string().optional(),
        address: z.string().optional(),
        ownerId: z.string().optional(),
        nextFollowUp: z.date().optional(),
        tags: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Get current lead to check for status change
      const currentLead = await ctx.db.lead.findUnique({ where: { id } });

      const lead = await ctx.db.lead.update({
        where: { id },
        data: {
          ...data,
          email: data.email || null,
          source: data.source as never,
          status: data.status as never,
          priority: data.priority as never,
          lastContactAt: new Date(),
        },
      });

      // Create activity for status change
      if (currentLead && data.status && currentLead.status !== data.status) {
        await ctx.db.activity.create({
          data: {
            type: "STATUS_CHANGE",
            subject: "Status changed",
            description: `Status changed from ${currentLead.status} to ${data.status}`,
            leadId: lead.id,
            userId: ctx.session.user.id,
          },
        });
      }

      return lead;
    }),

  // Delete lead
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.lead.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Assign lead to user
  assign: protectedProcedure
    .input(
      z.object({
        leadId: z.string(),
        ownerId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.update({
        where: { id: input.leadId },
        data: { ownerId: input.ownerId },
      });

      await ctx.db.activity.create({
        data: {
          type: "LEAD_ASSIGNED",
          subject: "Lead assigned",
          description: `Lead assigned to new owner`,
          leadId: lead.id,
          userId: ctx.session.user.id,
        },
      });

      return lead;
    }),

  // Convert lead to deal
  convert: protectedProcedure
    .input(
      z.object({
        leadId: z.string(),
        dealName: z.string(),
        amount: z.number(),
        courseName: z.string().optional(),
        courseDuration: z.string().optional(),
        expectedCloseDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { leadId, ...dealData } = input;

      // Update lead as converted
      await ctx.db.lead.update({
        where: { id: leadId },
        data: {
          isConverted: true,
          convertedAt: new Date(),
          status: "CONVERTED",
        },
      });

      // Create deal
      const deal = await ctx.db.deal.create({
        data: {
          name: dealData.dealName,
          amount: dealData.amount,
          courseName: dealData.courseName,
          courseDuration: dealData.courseDuration,
          expectedCloseDate: dealData.expectedCloseDate,
          leadId,
          ownerId: ctx.session.user.id,
          createdById: ctx.session.user.id,
        },
      });

      // Create activity
      await ctx.db.activity.create({
        data: {
          type: "DEAL_CREATED",
          subject: "Lead converted to deal",
          description: `Lead converted to deal: ${dealData.dealName}`,
          leadId,
          userId: ctx.session.user.id,
        },
      });

      return deal;
    }),

  // Get lead stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [
      total,
      newLeads,
      contacted,
      qualified,
      converted,
      todayFollowUps,
    ] = await Promise.all([
      ctx.db.lead.count(),
      ctx.db.lead.count({ where: { status: "NEW" } }),
      ctx.db.lead.count({ where: { status: "CONTACTED" } }),
      ctx.db.lead.count({ where: { status: "QUALIFIED" } }),
      ctx.db.lead.count({ where: { status: "CONVERTED" } }),
      ctx.db.lead.count({
        where: {
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
});
