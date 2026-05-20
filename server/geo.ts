/**
 * server/geo.ts — plain async data-fetching helpers (NO "use server").
 *
 * These are called directly from Server Components and Server Actions.
 * They must NOT carry "use server" because that would turn them into
 * Server Actions (POST-only), breaking direct calls from Server Components.
 */

import { createClient } from "@/lib/supabase/server";
import { logActionError } from "@/server/error-log";
import type { Profile, Rank, Thana } from "@/types/profile";
import type { SupabaseClient } from "@supabase/supabase-js";

export type GeoSource = "supabase" | "unavailable";

/** Avoid PostgREST embed (`thana:thanas`) — it can fail and null the whole row. */
const PROFILE_ROW_SELECT =
  "id, username, full_name, email, phone, avatar_url, role, is_verified, profile_completed, hide_sensitive_info, created_at, updated_at, thana_id, rank_id";

async function attachMetadata(
  supabase: SupabaseClient,
  row: Record<string, unknown>,
): Promise<Profile> {
  const thanaId = row.thana_id as string | null | undefined;
  const rankId = row.rank_id as string | null | undefined;

  let thana: Thana | undefined;
  let rank: Rank | undefined;

  if (thanaId) {
    const { data: t } = await supabase
      .from("thanas")
      .select("id, name")
      .eq("id", thanaId)
      .maybeSingle();
    if (t) thana = t as Thana;
  }

  if (rankId) {
    const { data: r } = await supabase
      .from("ranks")
      .select("id, name")
      .eq("id", rankId)
      .maybeSingle();
    if (r) rank = r as Rank;
  }

  return { ...(row as object), thana, rank } as Profile;
}

export interface GeoResult<T> {
  data: T[];
  source: GeoSource;
}

// ---------------------------------------------------------------------------
// Profile reads
// ---------------------------------------------------------------------------

export async function getProfile(userId?: string): Promise<Profile | null> {
  const supabase = await createClient();

  let resolvedId = userId;
  if (!resolvedId) {
    const { data } = await supabase.auth.getClaims();
    resolvedId = data?.claims?.sub ?? undefined;
  }

  if (!resolvedId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_ROW_SELECT)
    .eq("id", resolvedId)
    .single();

  if (error || !data) {
    if (error && resolvedId) {
      logActionError("getProfile", error.message, resolvedId, { userId: resolvedId });
    }
    return null;
  }
  return attachMetadata(supabase, data as Record<string, unknown>);
}

export async function getProfileByUsername(
  username: string,
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_ROW_SELECT)
    .ilike("username", username)
    .single();

  if (error || !data) {
    if (error && error.code !== "PGRST116") { // Ignore "not found" which is normal for username checks
      logActionError("getProfileByUsername", error.message, null, { username });
    }
    return null;
  }
  return attachMetadata(supabase, data as Record<string, unknown>);
}

export async function getModeratorsAndAdmin(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, email, avatar_url, role, is_verified, created_at, rank_id",
    )
    .in("role", ["admin", "moderator"])
    .order("created_at", { ascending: true });

  if (error || !data) {
    if (error) {
      logActionError("getModeratorsAndAdmin", error.message);
    }
    return [];
  }

  // Attach ranks to the list
  const ranksResponse = await getRanks();
  const ranks = ranksResponse.data;
  
  const enrichedData = data.map(row => {
    const rank = row.rank_id ? ranks.find((r: Rank) => r.id === row.rank_id) : undefined;
    return { ...row, rank } as Profile;
  });

  return enrichedData.sort((a, b) => {
    if (a.role === "admin" && b.role !== "admin") return -1;
    if (a.role !== "admin" && b.role === "admin") return 1;
    return 0;
  });
}

export async function checkUsernameAvailable(
  username: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (error) return false;
  return data === null;
}

// ---------------------------------------------------------------------------
// Thana list (flat)
// ---------------------------------------------------------------------------

export async function getThanas(): Promise<GeoResult<Thana>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("thanas")
    .select("id, name")
    .order("name", { ascending: true });

  if (!error && data && data.length > 0) {
    return { data: data as Thana[], source: "supabase" };
  }

  return { data: [], source: "unavailable" };
}

// ---------------------------------------------------------------------------
// Rank list (flat)
// ---------------------------------------------------------------------------

export async function getRanks(): Promise<GeoResult<Rank>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ranks")
    .select("id, name")
    .order("name", { ascending: true });

  if (!error && data && data.length > 0) {
    return { data: data as Rank[], source: "supabase" };
  }

  return { data: [], source: "unavailable" };
}
