"use server";

/**
 * server/rank-actions.ts — Server Actions for dynamic rank management.
 */

import { createClient } from "@/lib/supabase/server";
import { invalidateUsersAndOverview } from "@/server/cache-invalidation";
import { logActionError } from "@/server/error-log";
import { revalidatePath } from "next/cache";

async function requireAdmin(): Promise<
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

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can manage ranks" };
  }
  return { sub };
}

/** FormData: name (text) */
export async function addRank(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const supabase = await createClient();
  const { error } = await supabase.from("ranks").insert({ name });

  if (error) {
    logActionError("addRank", error.message, auth.sub, { name });
    return { error: error.message };
  }

  invalidateUsersAndOverview();
  revalidatePath("/dashboard/ranks");
  return {};
}

export async function getRankRefCount(
  rankId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("rank_id", rankId);
  return count ?? 0;
}

/** FormData: id (uuid) */
export async function deleteRank(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const id = formData.get("id") as string;
  if (!id) return { error: "Rank ID is required" };

  const { data: rank } = await supabase
    .from("ranks")
    .select("name")
    .eq("id", id)
    .single();

  const { data: affectedProfiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("rank_id", id);

  const { error } = await supabase.from("ranks").delete().eq("id", id);
  if (error) {
    logActionError("deleteRank", error.message, auth.sub, { id });
    return { error: error.message };
  }

  if (affectedProfiles && affectedProfiles.length > 0) {
    const rankName = rank?.name ?? "your rank";
    await supabase.from("action_logs").insert(
      affectedProfiles.map((p) => ({
        action_type: "rank_deleted",
        target_id: p.id,
        actor_id: auth.sub,
        details: `The rank "${rankName}" has been removed. Your rank has been set to None.`,
      })),
    );
  }

  invalidateUsersAndOverview();
  revalidatePath("/dashboard/ranks");
  return {};
}

/** FormData: id (uuid), name (text) */
export async function modifyRank(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!id) return { error: "Rank ID is required" };
  if (!name) return { error: "Name is required" };

  const { error } = await supabase.from("ranks").update({ name }).eq("id", id);

  if (error) {
    logActionError("modifyRank", error.message, auth.sub, { id, name });
    return { error: error.message };
  }

  invalidateUsersAndOverview();
  revalidatePath("/dashboard/ranks");
  return {};
}
