/**
 * server/geo.ts — plain async data-fetching helpers (NO "use server").
 *
 * These are called directly from Server Components and Server Actions.
 * They must NOT carry "use server" because that would turn them into
 * Server Actions (POST-only), breaking direct calls from Server Components.
 */

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { logActionError } from "@/server/error-log";
import { getClaims } from "@/server/user";
import type { Profile, Rank, Thana } from "@/types/profile";
import { asc, eq, ilike, inArray } from "drizzle-orm";

export type GeoSource = "supabase" | "unavailable";

export interface GeoResult<T> {
  data: T[];
  source: GeoSource;
}

// ---------------------------------------------------------------------------
// Profile reads
// ---------------------------------------------------------------------------

export async function getProfile(userId?: string): Promise<Profile | null> {
  let resolvedId = userId;
  if (!resolvedId) {
    const claims = await getClaims();
    resolvedId = claims?.sub ?? undefined;
  }

  if (!resolvedId) return null;

  try {
    const data = await db.query.profiles.findFirst({
      where: eq(schema.profiles.id, resolvedId),
      with: {
        thana: true,
        rank: true,
      },
    });

    if (!data) return null;
    return data as unknown as Profile;
  } catch (error: any) {
    logActionError("getProfile", error.message, resolvedId, { userId: resolvedId });
    return null;
  }
}

export async function getProfileByUsername(
  username: string,
): Promise<Profile | null> {
  try {
    const data = await db.query.profiles.findFirst({
      where: ilike(schema.profiles.username, username),
      with: {
        thana: true,
        rank: true,
      },
    });

    if (!data) return null;
    return data as unknown as Profile;
  } catch (error: any) {
    logActionError("getProfileByUsername", error.message, null, { username });
    return null;
  }
}

export async function getModeratorsAndAdmin(): Promise<Profile[]> {
  try {
    const data = await db.query.profiles.findMany({
      where: inArray(schema.profiles.role, ["admin", "moderator"]),
      with: {
        rank: true,
      },
      orderBy: [asc(schema.profiles.created_at)],
    });

    return (data as unknown as Profile[]).sort((a, b) => {
      if (a.role === "admin" && b.role !== "admin") return -1;
      if (a.role !== "admin" && b.role === "admin") return 1;
      return 0;
    });
  } catch (error: any) {
    logActionError("getModeratorsAndAdmin", error.message);
    return [];
  }
}

export async function checkUsernameAvailable(
  username: string,
): Promise<boolean> {
  try {
    const data = await db.query.profiles.findFirst({
      where: eq(schema.profiles.username, username),
      columns: { id: true },
    });
    return data === null;
  } catch (error) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Thana list (flat)
// ---------------------------------------------------------------------------

export async function getThanas(): Promise<GeoResult<Thana>> {
  try {
    const data = await db.query.thanas.findMany({
      orderBy: [asc(schema.thanas.name)],
    });

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
    const data = await db.query.ranks.findMany({
      orderBy: [asc(schema.ranks.name)],
    });

    if (data.length > 0) {
      return { data: data as Rank[], source: "supabase" };
    }
    return { data: [], source: "unavailable" };
  } catch (error) {
    return { data: [], source: "unavailable" };
  }
}
