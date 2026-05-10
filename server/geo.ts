/**
 * server/geo.ts — plain async data-fetching helpers (NO "use server").
 *
 * These are called directly from Server Components and Server Actions.
 * They must NOT carry "use server" because that would turn them into
 * Server Actions (POST-only), breaking direct calls from Server Components.
 */

import { createClient } from "@/lib/supabase/server";
import type { Profile, Division, District, Upazila } from "@/types/profile";
import {
  cachedDivisions,
  cachedDistricts,
  cachedUpazilas,
} from "@/lib/geo-cache";

export type GeoSource = "supabase" | "local-cache" | "unavailable";

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
    .select(
      "id, username, full_name, email, phone, avatar_url, rank, role, is_verified, profile_completed, hide_sensitive_info, created_at, updated_at, division_id, district_id, upazila_id, division:divisions(id,name), district:districts(id,division_id,name), upazila:upazilas(id,district_id,name)",
    )
    .eq("id", resolvedId)
    .single();

  if (error || !data) return null;
  return data as unknown as Profile;
}

export async function getProfileByUsername(
  username: string,
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, email, phone, avatar_url, rank, role, is_verified, profile_completed, hide_sensitive_info, created_at, updated_at, division_id, district_id, upazila_id, division:divisions(id,name), district:districts(id,division_id,name), upazila:upazilas(id,district_id,name)",
    )
    .ilike("username", username) // case-insensitive exact match
    .single();

  if (error || !data) return null;
  return data as unknown as Profile;
}

export async function getModeratorsAndAdmin(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, email, avatar_url, role, rank, is_verified, created_at",
    )
    .in("role", ["admin", "moderator"])
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  // Sort: admin(s) first, then moderators
  return (data as Profile[]).sort((a, b) => {
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
// Geo reads
// ---------------------------------------------------------------------------

export async function getDivisions(): Promise<GeoResult<Division>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("divisions")
    .select("id, name")
    .order("name", { ascending: true });

  if (!error && data && data.length > 0) {
    return { data: data as Division[], source: "supabase" };
  }

  if (cachedDivisions.length > 0) {
    return {
      data: [...cachedDivisions].sort((a, b) => a.name.localeCompare(b.name)),
      source: "local-cache",
    };
  }

  return { data: [], source: "unavailable" };
}

export async function getDistrictsByDivision(
  divisionId: string,
): Promise<GeoResult<District>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("districts")
    .select("id, division_id, name")
    .eq("division_id", divisionId)
    .order("name", { ascending: true });

  if (!error && data && data.length > 0) {
    return { data: data as District[], source: "supabase" };
  }

  const fromCache = cachedDistricts
    .filter((d) => d.division_id === divisionId)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (fromCache.length > 0) {
    return { data: fromCache, source: "local-cache" };
  }

  return { data: [], source: "unavailable" };
}

export async function getUpazilasByDistrict(
  districtId: string,
): Promise<GeoResult<Upazila>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("upazilas")
    .select("id, district_id, name")
    .eq("district_id", districtId)
    .order("name", { ascending: true });

  if (!error && data && data.length > 0) {
    return { data: data as Upazila[], source: "supabase" };
  }

  const fromCache = cachedUpazilas
    .filter((u) => u.district_id === districtId)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (fromCache.length > 0) {
    return { data: fromCache, source: "local-cache" };
  }

  return { data: [], source: "unavailable" };
}
