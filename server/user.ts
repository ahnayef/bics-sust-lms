import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/server/geo";
import type { Profile, UserRole } from "@/types/profile";

/** Returns JWT claims or null */
export async function getClaims() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
}

/**
 * Fallback display fields from the JWT when `profiles` cannot be read yet.
 * Custom JWT hooks often mirror `role` onto the token for RLS.
 */
export function shellHintsFromClaims(claims: unknown): {
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole | null;
} {
  if (!claims || typeof claims !== "object") {
    return { displayName: null, avatarUrl: null, role: null };
  }

  const c = claims as Record<string, unknown>;
  const userMeta =
    (c.user_metadata as Record<string, unknown> | undefined) ?? {};
  const appMeta =
    (c.app_metadata as Record<string, unknown> | undefined) ?? {};

  const email =
    typeof c.email === "string"
      ? c.email
      : typeof userMeta.email === "string"
        ? userMeta.email
        : null;

  const fromMeta =
    typeof userMeta.full_name === "string"
      ? userMeta.full_name
      : typeof userMeta.name === "string"
        ? userMeta.name
        : typeof userMeta.preferred_username === "string"
          ? userMeta.preferred_username
          : null;

  const displayName = fromMeta ?? email;

  const avatarUrl =
    typeof userMeta.avatar_url === "string"
      ? userMeta.avatar_url
      : typeof userMeta.picture === "string"
        ? userMeta.picture
        : null;

  const rawRole =
    c.role ?? appMeta.role ?? userMeta.role ?? (c as { user_role?: unknown }).user_role;

  let role: UserRole | null = null;
  if (rawRole === "admin" || rawRole === "moderator" || rawRole === "member") {
    role = rawRole;
  }

  return { displayName, avatarUrl, role };
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
