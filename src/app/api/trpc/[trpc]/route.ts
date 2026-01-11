import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { env } from "@/env";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  const heads = new Headers(req.headers);
  const url = new URL(req.url);
  const connectionParamsStr = url.searchParams.get("connectionParams");

  if (connectionParamsStr) {
    try {
      const connectionParams = JSON.parse(connectionParamsStr);
      if (connectionParams["x-workspace-id"]) {
        heads.set("x-workspace-id", connectionParams["x-workspace-id"]);
      }
    } catch (e) {
      console.error("Failed to parse connectionParams", e);
    }
  }

  return createTRPCContext({
    headers: heads,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
