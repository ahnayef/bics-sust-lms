import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Standard SSR Supabase client.
 *
 * RLS is disabled on all tables — authorisation is enforced in application
 * code (server actions / route handlers) instead. This client reads the
 * user session from cookies so auth.getClaims() / auth.getUser() work as
 * expected in every Server Action and Route Handler.
 */
export async function createClient() {
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
}
