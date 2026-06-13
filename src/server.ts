import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      /* Only convert h3 catastrophic errors to HTML for page routes.
         API routes must always return JSON — converting them to HTML
         causes clients calling res.json() to throw parse errors. */
      const url = new URL(request.url);
      const isApiRoute = url.pathname.startsWith("/api/") || url.pathname.startsWith("/_serverFn/");
      if (isApiRoute) {
        /* For API routes: if h3 swallowed the error as HTTPError JSON, return a plain 500 JSON instead */
        if (response.status >= 500) {
          const ct = response.headers.get("content-type") ?? "";
          if (ct.includes("application/json")) {
            const body = await response.clone().text();
            if (isCatastrophicSsrErrorBody(body, response.status)) {
              const err = consumeLastCapturedError() ?? new Error(`Internal server error`);
              console.error(err);
              return Response.json({ error: "Internal server error. Please try again." }, { status: 500 });
            }
          }
        }
        return response;
      }
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      /* For API routes throwing before any response: return JSON error */
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_serverFn/")) {
        return Response.json({ error: "Internal server error. Please try again." }, { status: 500 });
      }
      return brandedErrorResponse();
    }
  },
};
