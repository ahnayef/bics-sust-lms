import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/server/geo";
import type { Profile, UserRole } from "@/types/profile";

import { cookies } from "next/headers";
import { cache } from "react";

/** Returns JWT claims or null (memoized per-request, 0ms local decode) */
export const getClaims = cache(async () => {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const authCookies = allCookies
      .filter((c) => c.name.includes("-auth-token"))
      .sort((a, b) => a.name.localeCompare(b.name));

    let rawTokenString = "";
    if (authCookies.length === 1) {
      rawTokenString = authCookies[0].value;
    } else if (authCookies.length > 1) {
      rawTokenString = authCookies.map((c) => c.value).join("");
    }

    if (rawTokenString) {
      let accessToken = "";
      try {
        const parsed = JSON.parse(rawTokenString);
        accessToken = parsed.access_token || parsed[0] || "";
      } catch {
        if (rawTokenString.startsWith("base64-")) {
          const decoded = Buffer.from(
            rawTokenString.slice(7),
            "base64",
          ).toString("utf-8");
          const parsed = JSON.parse(decoded);
          accessToken = parsed.access_token || "";
        }
      }

      if (accessToken && accessToken.includes(".")) {
        const payloadBase64 = accessToken.split(".")[1];
        const payloadStr = Buffer.from(payloadBase64, "base64").toString(
          "utf-8",
        );
        const payload = JSON.parse(payloadStr);
        if (
          payload &&
          payload.sub &&
          (!payload.exp || payload.exp * 1000 > Date.now())
        ) {
          return payload;
        }
      }
    }
  } catch {
    // ignore
  }

  // Fallback to supabase client getSession / getClaims
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      const payloadBase64 = session.access_token.split(".")[1];
      const payloadStr = Buffer.from(payloadBase64, "base64").toString("utf-8");
      return JSON.parse(payloadStr);
    }
    const { data } = await supabase.auth.getClaims();
    return data?.claims ?? null;
  } catch {
    return null;
  }
});

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
  const appMeta = (c.app_metadata as Record<string, unknown> | undefined) ?? {};

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
    c.role ??
    appMeta.role ??
    userMeta.role ??
    (c as { user_role?: unknown }).user_role;

  let role: UserRole | null = null;
  if (rawRole === "superadmin" || rawRole === "admin" || rawRole === "member") {
    role = rawRole;
  } else if (rawRole === "moderator") {
    role = "admin";
  }

  return { displayName, avatarUrl, role };
}

/** Returns the full profile row or null */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const claims = await getClaims();
  if (!claims) return null;
  return getProfile(claims.sub);
});

// legacy aliases
export const getUser = getClaims;
export const getSession = getClaims;
