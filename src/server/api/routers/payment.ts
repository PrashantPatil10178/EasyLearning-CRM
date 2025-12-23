import { z } from "zod";
import {
  createTRPCRouter,
  protectedWorkspaceProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const paymentRouter = createTRPCRouter({
  // Get all payments for a lead
  getByLead: protectedWorkspaceProcedure
    .input(z.object({ leadId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.payment.findMany({
        where: {
          leadId: input.leadId,
          workspaceId: ctx.workspaceId,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Get payment by ID
  getById: protectedWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const payment = await ctx.db.payment.findFirst({
        where: {
          id: input.id,
          workspaceId: ctx.workspaceId,
        },
        include: {
          lead: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      return payment;
    }),

  // Create payment
  create: protectedWorkspaceProcedure
    .input(
      z.object({
        leadId: z.string(),
        amount: z.number().positive(),
        currency: z.string().default("INR"),
        paymentMode: z.enum([
          "CASH",
          "ONLINE",
          "CARD",
          "UPI",
          "CHEQUE",
          "BANK_TRANSFER",
          "OTHER",
        ]),
        status: z
          .enum([
            "PENDING",
            "PROCESSING",
            "COMPLETED",
            "FAILED",
            "REFUNDED",
            "PARTIALLY_PAID",
          ])
          .default("PENDING"),
        transactionId: z.string().optional(),
        referenceNo: z.string().optional(),
        paymentDate: z.date().optional(),
        gateway: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { leadId, ...paymentData } = input;

      const lead = await ctx.db.lead.findFirst({
        where: {
          id: leadId,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found or you don't have access",
        });
      }

      // Create payment
      const payment = await ctx.db.payment.create({
        data: {
          ...paymentData,
          leadId: leadId,
          workspaceId: ctx.workspaceId,
        },
      });

      // Update lead's revenue if payment is completed
      if (payment.status === "COMPLETED") {
        await ctx.db.lead.update({
          where: { id: leadId },
          data: {
            revenue: { increment: payment.amount },
          },
        });
      }

      return payment;
    }),

  // Update payment
  update: protectedWorkspaceProcedure
    .input(
      z.object({
        id: z.string(),
        amount: z.number().positive().optional(),
        paymentMode: z
          .enum([
            "CASH",
            "ONLINE",
            "CARD",
            "UPI",
            "CHEQUE",
            "BANK_TRANSFER",
            "OTHER",
          ])
          .optional(),
        status: z
          .enum([
            "PENDING",
            "PROCESSING",
            "COMPLETED",
            "FAILED",
            "REFUNDED",
            "PARTIALLY_PAID",
          ])
          .optional(),
        transactionId: z.string().optional(),
        referenceNo: z.string().optional(),
        paymentDate: z.date().optional(),
        gateway: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const payment = await ctx.db.payment.findFirst({
        where: {
          id,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found or you don't have access",
        });
      }

      const updatedPayment = await ctx.db.payment.update({
        where: { id },
        data,
        include: {
          lead: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      return updatedPayment;
    }),

  // Delete payment
  delete: protectedWorkspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.db.payment.findFirst({
        where: {
          id: input.id,
          workspaceId: ctx.workspaceId,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found or you don't have access",
        });
      }

      await ctx.db.payment.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
