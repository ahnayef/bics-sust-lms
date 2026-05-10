import { createServerClient } from "@supabase/ssr";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";

/**
 * Per-request memoised SSR Supabase client.
 *
 * React's `cache()` deduplicates this function within a single render tree
 * (i.e. one HTTP request). Every server function that calls `createClient()`
 * — getClaims, getProfile, getUserStats, etc. — reuses the SAME client
 * instance, so cookies are read only once and only one client object is
 * constructed per request.
 *
 * The memoisation is automatically reset for the next request, so there is
 * no cross-request leakage.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore.
          }
        },
      },
    },
  );
});

/**
 * Bare service-role client for use inside `'use cache'` scopes and similar.
 *
 * Those callbacks run outside a normal request-bound Supabase SSR client,
 * so they cannot call `await cookies()`. This client skips the SSR cookie
 * plumbing and connects directly with the service key — RLS is still
 * bypassed because RLS is disabled at the database level.
 *
 * Create a fresh instance on each call; the cache layer ensures the heavy
 * work only runs on cache misses, not on every request.
 */
export function createServiceClient() {
  return createRawClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );
}
