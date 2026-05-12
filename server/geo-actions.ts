"use server";

/**
 * server/geo-actions.ts — Server Actions for flat thana list management.
 */

import { createClient } from "@/lib/supabase/server";
import { invalidateUsersDirectory } from "@/server/cache-invalidation";
import { revalidatePath } from "next/cache";

async function requireModOrAdmin(): Promise<
  { error: string } | { sub: string }
> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (!sub) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", sub)
    .single();

  if (!profile || !["admin", "moderator"].includes(profile.role)) {
    return { error: "Only moderators and admins can manage thanas" };
  }
  return { sub };
}

/** FormData: name (text) */
export async function addThana(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const supabase = await createClient();
  const { error } = await supabase.from("thanas").insert({ name });

  if (error) return { error: error.message };

  invalidateUsersDirectory();
  revalidatePath("/dashboard/thanas");
  return {};
}

/** FormData: id (uuid) */
export async function deleteThana(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const id = formData.get("id") as string;
  if (!id) return { error: "Thana ID is required" };

  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("thana_id", id);

  if (count && count > 0) {
    return { error: `Cannot delete: ${count} profile(s) reference this thana` };
  }

  const { error } = await supabase.from("thanas").delete().eq("id", id);
  if (error) return { error: error.message };

  invalidateUsersDirectory();
  revalidatePath("/dashboard/thanas");
  return {};
}

/** FormData: id (uuid), name (text) */
export async function modifyThana(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!id) return { error: "Thana ID is required" };
  if (!name) return { error: "Name is required" };

  const { error } = await supabase.from("thanas").update({ name }).eq("id", id);

  if (error) return { error: error.message };

  invalidateUsersDirectory();
  revalidatePath("/dashboard/thanas");
  return {};
}
