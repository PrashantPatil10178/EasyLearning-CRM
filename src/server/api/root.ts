import { dashboardRouter } from "@/server/api/routers/dashboard";
import { userRouter } from "@/server/api/routers/user";
import { leadRouter } from "@/server/api/routers/lead";
import { dealRouter } from "@/server/api/routers/deal";
import { taskRouter } from "@/server/api/routers/task";
import { callRouter } from "@/server/api/routers/call";
import { campaignRouter } from "@/server/api/routers/campaign";
import { teamRouter } from "@/server/api/routers/team";
import { courseRouter } from "@/server/api/routers/course";
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
  deal: dealRouter,
  task: taskRouter,
  call: callRouter,
  campaign: campaignRouter,
  team: teamRouter,
  course: courseRouter,
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
