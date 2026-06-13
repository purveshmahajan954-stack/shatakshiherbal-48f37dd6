---
name: API routes must not get HTML error conversion
description: server.ts normalizeCatastrophicSsrResponse must be skipped for /api/ routes or clients get HTML instead of JSON
---

## Rule
In `src/server.ts`, the `normalizeCatastrophicSsrResponse` function converts h3's `{"unhandled":true,"message":"HTTPError"}` 500 responses into a branded HTML error page. This is correct for SSR page routes but **must never apply to `/api/` or `/_serverFn/` routes**.

## Why
When an API route handler throws an unhandled error, h3 wraps it as `{"unhandled":true,"message":"HTTPError"}` with status 500 and `content-type: application/json`. Without the guard, `normalizeCatastrophicSsrResponse` converts this to HTML. Any client code that then calls `res.json()` throws `"Unexpected token '<', "<!doctype "... is not valid JSON"` — exactly the checkout payment error the user reported.

## How to apply
The guard is already in `src/server.ts`:
```javascript
const url = new URL(request.url);
const isApiRoute = url.pathname.startsWith("/api/") || url.pathname.startsWith("/_serverFn/");
if (isApiRoute) {
  // still convert h3 HTTPError to clean JSON 500, but never HTML
  ...
  return response;
}
return await normalizeCatastrophicSsrResponse(response);
```

Also: never call `res.json()` before checking `res.ok` or content-type — always guard with `const ct = res.headers.get("content-type") ?? ""; if (!ct.includes("json")) throw ...` first.
