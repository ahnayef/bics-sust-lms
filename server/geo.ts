/**
 * server/geo.ts — plain async data-fetching helpers (NO "use server").
 *
 * These are called directly from Server Components and Server Actions.
 * They must NOT carry "use server" because that would turn them into
 * Server Actions (POST-only), breaking direct calls from Server Components.
 */

import {
  getRanks as getRanksQuery,
  getThanas as getThanasQuery,
} from "@/lib/db/queries/geo";
import {
  checkUsernameAvailable as checkUsernameAvailableQuery,
  getModeratorsAndAdmin as getModeratorsAndAdminQuery,
  getProfileById,
  getProfileByUsername as getProfileByUsernameQuery,
} from "@/lib/db/queries/profiles";
import { logActionError } from "@/server/error-log";
import { getClaims } from "@/server/user";
import type { Profile, Rank, Thana } from "@/types/profile";

import { cache } from "react";

export type GeoSource = "supabase" | "unavailable";

export interface GeoResult<T> {
  data: T[];
  source: GeoSource;
}

// ---------------------------------------------------------------------------
// Profile reads
// ---------------------------------------------------------------------------

export const getProfile = cache(
  async (userId?: string): Promise<Profile | null> => {
    let resolvedId = userId;
    if (!resolvedId) {
      const claims = await getClaims();
      resolvedId = claims?.sub ?? undefined;
    }

    if (!resolvedId) return null;

    try {
      const data = await getProfileById(resolvedId);
      if (!data) return null;
      return data as unknown as Profile;
    } catch (error: any) {
      logActionError("getProfile", error.message, resolvedId, {
        userId: resolvedId,
      });
      return null;
    }
  },
);

export const getProfileByUsername = cache(
  async (username: string): Promise<Profile | null> => {
    try {
      const data = await getProfileByUsernameQuery(username);
      if (!data) return null;
      return data as unknown as Profile;
    } catch (error: any) {
      logActionError("getProfileByUsername", error.message, null, { username });
      return null;
    }
  },
);

export async function getModeratorsAndAdmin(): Promise<Profile[]> {
  try {
    return await getModeratorsAndAdminQuery();
  } catch (error: any) {
    logActionError("getModeratorsAndAdmin", error.message);
    return [];
  }
}

export async function checkUsernameAvailable(
  username: string,
): Promise<boolean> {
  try {
    return await checkUsernameAvailableQuery(username);
  } catch (error) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Thana list (flat)
// ---------------------------------------------------------------------------

export async function getThanas(): Promise<GeoResult<Thana>> {
  try {
    const data = await getThanasQuery();
    if (data.length > 0) {
      return { data: data as Thana[], source: "supabase" };
    }
    return { data: [], source: "unavailable" };
  } catch (error) {
    return { data: [], source: "unavailable" };
  }
}

// ---------------------------------------------------------------------------
// Rank list (flat)
// ---------------------------------------------------------------------------

export async function getRanks(): Promise<GeoResult<Rank>> {
  try {
    const data = await getRanksQuery();
    if (data.length > 0) {
      return { data: data as Rank[], source: "supabase" };
    }
    return { data: [], source: "unavailable" };
  } catch (error) {
    return { data: [], source: "unavailable" };
  }
}
