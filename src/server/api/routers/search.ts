import { z } from "zod";
import {
  createTRPCRouter,
  protectedWorkspaceProcedure,
} from "@/server/api/trpc";

export const searchRouter = createTRPCRouter({
  // Global search across leads, users, tasks, and more
  globalSearch: protectedWorkspaceProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;
      const searchTerm = query.toLowerCase();

      // Search leads
      const leads = await ctx.db.lead.findMany({
        where: {
          workspaceId: ctx.workspaceId,
          OR: [
            { firstName: { contains: searchTerm } },
            { lastName: { contains: searchTerm } },
            { email: { contains: searchTerm } },
            { phone: { contains: searchTerm } },
            { courseInterested: { contains: searchTerm } },
            { city: { contains: searchTerm } },
          ],
        },
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          source: true,
          courseInterested: true,
          owner: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Search users/team members
      const users = await ctx.db.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { email: { contains: searchTerm } },
            { phone: { contains: searchTerm } },
          ],
        },
        take: Math.floor(limit / 2),
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          image: true,
        },
      });

      // Search tasks
      const tasks = await ctx.db.task.findMany({
        where: {
          workspaceId: ctx.workspaceId,
          OR: [
            { title: { contains: searchTerm } },
            { description: { contains: searchTerm } },
            { note: { contains: searchTerm } },
          ],
        },
        take: Math.floor(limit / 2),
        include: {
          assignee: {
            select: {
              name: true,
              image: true,
            },
          },
          lead: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Search campaigns
      const campaigns = await ctx.db.campaign.findMany({
        where: {
          workspaceId: ctx.workspaceId,
          name: { contains: searchTerm },
        },
        take: Math.floor(limit / 4),
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          startDate: true,
          totalLeads: true,
        },
      });

      // Search courses
      const courses = await ctx.db.course.findMany({
        where: {
          workspaceId: ctx.workspaceId,
          OR: [
            { name: { contains: searchTerm } },
            { code: { contains: searchTerm } },
            { category: { contains: searchTerm } },
          ],
        },
        take: Math.floor(limit / 4),
        select: {
          id: true,
          name: true,
          code: true,
          price: true,
          isActive: true,
        },
      });

      return {
        leads: leads.map((lead) => ({
          ...lead,
          type: "lead" as const,
          title: `${lead.firstName} ${lead.lastName || ""}`.trim(),
          subtitle: lead.phone || lead.email || "",
          url: `/dashboard/leads/${lead.id}`,
        })),
        users: users.map((user) => ({
          ...user,
          type: "user" as const,
          title: user.name || "Unknown User",
          subtitle: user.email || user.phone || "",
          url: `/dashboard/users`,
        })),
        tasks: tasks.map((task) => ({
          ...task,
          type: "task" as const,
          title: task.title || "Untitled Task",
          subtitle: task.lead
            ? `Lead: ${task.lead.firstName} ${task.lead.lastName || ""}`
            : task.description || "",
          url: `/dashboard/tasks`,
        })),
        campaigns: campaigns.map((campaign) => ({
          ...campaign,
          type: "campaign" as const,
          title: campaign.name,
          subtitle: `${campaign.type} • ${campaign.totalLeads} leads`,
          url: `/dashboard/campaigns/${campaign.id}`,
        })),
        courses: courses.map((course) => ({
          ...course,
          type: "course" as const,
          title: course.name,
          subtitle: `${course.code} • ₹${course.price}`,
          url: `/dashboard/courses`,
        })),
      };
    }),

  // Get recent searches (stored in localStorage on client)
  getRecentLeads: protectedWorkspaceProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ ctx, input }) => {
      const leads = await ctx.db.lead.findMany({
        where: {
          workspaceId: ctx.workspaceId,
        },
        take: input.limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      return leads.map((lead) => ({
        id: lead.id,
        title: `${lead.firstName} ${lead.lastName || ""}`.trim(),
        subtitle: lead.phone,
        url: `/dashboard/leads/${lead.id}`,
      }));
    }),
});
