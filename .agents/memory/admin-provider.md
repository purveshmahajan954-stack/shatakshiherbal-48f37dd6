---
name: AdminAuthProvider placement
description: AdminAuthProvider must wrap the entire app in __root.tsx to avoid SSR crashes
---

`AdminAuthProvider` must be added to `RootComponent` in `src/routes/__root.tsx`, wrapping `<Outlet />`. Without it, any route that calls `useAdminAuth()` crashes during SSR with "useAdminAuth must be used within AdminAuthProvider".

**Why:** TanStack Start SSR renders the full component tree server-side. Context providers missing from the root cause crashes even before client hydration.

**How to apply:** When adding any new auth context or global provider, always add it to `RootComponent` in `__root.tsx`. Order: QueryClientProvider → ThemeProvider → AuthProvider → AdminAuthProvider → CartProvider → WishlistProvider → Outlet.
