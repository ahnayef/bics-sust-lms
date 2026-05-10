"use server";

/**
 * server/geo-actions.ts — Server Actions for upazila (thana) management.
 *
 * Divisions and districts are seeded from the national registry and are
 * read-only here. Upazilas can be added, renamed, or removed by admins.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin(): Promise<{ error: string } | { sub: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (!sub) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", sub)
    .single();

  if (profile?.role !== "admin") return { error: "Only admins can manage thanas" };
  return { sub };
}

/**
 * Add a missing upazila to a district.
 *
 * FormData: district_id (text), name (text)
 */
export async function addThana(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const district_id = formData.get("district_id") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!district_id) return { error: "District is required" };
  if (!name) return { error: "Name is required" };

  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const { error } = await supabase
    .from("upazilas")
    .insert({ id, district_id, name });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/thanas");
  return {};
}

/**
 * Delete an upazila by ID.
 * Blocks deletion if any profile references this upazila.
 *
 * FormData: id (text)
 */
export async function deleteThana(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const id = formData.get("id") as string;
  if (!id) return { error: "Upazila ID is required" };

  // Safety: don't delete if any profile uses this upazila
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("upazila_id", id);

  if (count && count > 0) {
    return { error: `Cannot delete: ${count} profile(s) reference this upazila` };
  }

  const { error } = await supabase.from("upazilas").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/thanas");
  return {};
}

/**
 * Rename an upazila.
 *
 * FormData: id (text), name (text)
 */
export async function modifyThana(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!id) return { error: "Upazila ID is required" };
  if (!name) return { error: "Name is required" };

  const { error } = await supabase
    .from("upazilas")
    .update({ name })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/thanas");
  return {};
}
