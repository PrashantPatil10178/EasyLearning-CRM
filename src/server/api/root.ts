import { dashboardRouter } from "@/server/api/routers/dashboard";
import { userRouter } from "@/server/api/routers/user";
import { leadRouter } from "@/server/api/routers/lead";
import { taskRouter } from "@/server/api/routers/task";
import { callLogRouter } from "@/server/api/routers/call";
import { campaignRouter } from "@/server/api/routers/campaign";
import { teamRouter } from "@/server/api/routers/team";
import { courseRouter } from "@/server/api/routers/course";
import { paymentRouter } from "@/server/api/routers/payment";
import { activityRouter } from "@/server/api/routers/activity";
import { workspaceRouter } from "@/server/api/routers/workspace";
import { integrationRouter } from "@/server/api/routers/integration";
import { dealRouter } from "@/server/api/routers/deal";
import { whatsappRouter } from "@/server/api/routers/whatsapp";
import { settingsRouter } from "@/server/api/routers/settings";
import { searchRouter } from "@/server/api/routers/search";
import { webhookRouter } from "@/server/api/routers/webhook";
import { reportsRouter } from "@/server/api/routers/reports";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  dashboard: dashboardRouter,
  user: userRouter,
  lead: leadRouter,
  task: taskRouter,
  callLog: callLogRouter,
  campaign: campaignRouter,
  team: teamRouter,
  course: courseRouter,
  payment: paymentRouter,
  activity: activityRouter,
  workspace: workspaceRouter,
  integration: integrationRouter,
  deal: dealRouter,
  whatsapp: whatsappRouter,
  settings: settingsRouter,
  search: searchRouter,
  webhook: webhookRouter,
  reports: reportsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
