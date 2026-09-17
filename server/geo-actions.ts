"use server";

/**
 * server/geo-actions.ts — Server Actions for flat thana list management.
 */

import { createClient } from "@/lib/supabase/server";
import { invalidateUsersDirectory } from "@/server/cache-invalidation";
import { logActionError } from "@/server/error-log";
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

  if (
    !profile ||
    !["admin", "superadmin", "moderator"].includes(profile.role)
  ) {
    return { error: "Only admins can manage thanas" };
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

  if (error) {
    logActionError("addThana", error.message, auth.sub, { name });
    return { error: error.message };
  }

  invalidateUsersDirectory();
  revalidatePath("/dashboard/thanas");
  return {};
}

export async function getThanaRefCount(thanaId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("thana_id", thanaId);
  return count ?? 0;
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

  const { data: thana } = await supabase
    .from("thanas")
    .select("name")
    .eq("id", id)
    .single();

  const { data: affectedProfiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("thana_id", id);

  const { error } = await supabase.from("thanas").delete().eq("id", id);
  if (error) {
    logActionError("deleteThana", error.message, auth.sub, { id });
    return { error: error.message };
  }

  if (affectedProfiles && affectedProfiles.length > 0) {
    const thanaName = thana?.name ?? "your thana";
    await supabase.from("action_logs").insert(
      affectedProfiles.map((p) => ({
        action_type: "thana_deleted" as const,
        target_id: p.id,
        actor_id: auth.sub,
        details: `The thana "${thanaName}" has been removed. Please update your profile to select a new thana.`,
      })),
    );
  }

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

  if (error) {
    logActionError("modifyThana", error.message, auth.sub, { id, name });
    return { error: error.message };
  }

  invalidateUsersDirectory();
  revalidatePath("/dashboard/thanas");
  return {};
}
