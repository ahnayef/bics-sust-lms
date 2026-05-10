import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/server/geo";
import type { Profile } from "@/types/profile";

/** Returns JWT claims or null */
export async function getClaims() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
}

/** Returns the full profile row or null */
export async function getCurrentProfile(): Promise<Profile | null> {
  const claims = await getClaims();
  if (!claims) return null;
  return getProfile(claims.sub);
}

// legacy aliases
export const getUser = getClaims;
export const getSession = getClaims;
