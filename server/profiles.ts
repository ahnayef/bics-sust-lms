"use server";

/**
 * server/profiles.ts — Server Actions only (form submissions, mutations).
 *
 * Data-fetching helpers (getProfile, getThanas, etc.) live in server/geo.ts
 * so they can be called directly from Server Components without the "use server"
 * restriction that turns everything into POST-only Server Actions.
 */

import { createClient } from "@/lib/supabase/server";
import { invalidateUsersAndOverview } from "@/server/cache-invalidation";
import type { ActionLogType } from "@/types/library";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cacheAvatarLocally } from "./avatar";

// ---------------------------------------------------------------------------
// Helper: Insert Action Log
// ---------------------------------------------------------------------------
async function insertActionLog(
  supabase: any,
  actionType: ActionLogType,
  targetId: string,
  actorId: string | null = null,
  details: string | null = null
) {
  await supabase.from("action_logs").insert({
    action_type: actionType,
    target_id: targetId,
    actor_id: actorId,
    details,
  });
}

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const thanaIdRequired = z.string().uuid("Please select a thana");

const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be at most 100 characters")
    .trim(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username may only contain letters, numbers, and underscores",
    )
    .trim(),
  phone: z
    .string()
    .regex(
      /^\+?[0-9]*$/,
      "Phone number must contain only digits and an optional '+' at the start",
    )
    .max(19, "Phone number must be at most 19 characters")
    .optional()
    .or(z.literal("")),
  rank: z.enum(["None", "Member", "Associate", "Supporter"], {
    error: "Rank must be None, Member, Associate, or Supporter",
  }),
  thana_id: thanaIdRequired,
});

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

export async function setupProfile(
  formData: FormData,
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub) redirect("/login");

  // Read avatar from OAuth provider metadata (e.g. Google)
  const { data: userData } = await supabase.auth.getUser();
  const rawAvatarUrl: string | null =
    userData?.user?.user_metadata?.avatar_url ?? null;

  const localAvatarUrl = await cacheAvatarLocally(claims.sub, rawAvatarUrl);

  const raw = {
    full_name: formData.get("full_name") as string,
    username: formData.get("username") as string,
    phone: (formData.get("phone") as string | null) ?? "",
    rank: formData.get("rank") as string,
    thana_id: formData.get("thana_id") as string,
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  const { full_name, username, phone, rank, thana_id } = parsed.data;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", claims.sub)
    .maybeSingle();

  if (existing) return { error: "Username already taken" };

  const { error: upsertError } = await supabase.from("profiles").upsert({
    id: claims.sub,
    username,
    full_name,
    email: claims.email as string,
    phone: phone || null,
    avatar_url: localAvatarUrl,
    rank,
    thana_id,
    role: "member",
    is_verified: false,
    profile_completed: true,
  });

  if (upsertError) return { error: upsertError.message };

  if (!existing) {
    await insertActionLog(supabase, "user_joined", claims.sub);
  }

  invalidateUsersAndOverview();
  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// updateProfileInfo — edit-only action (username & avatar are immutable)
// Rank change automatically strips is_verified.
// ---------------------------------------------------------------------------

const optionalThanaId = z
  .string()
  .transform((s) => (s.trim() === "" ? null : s.trim()))
  .pipe(z.union([z.null(), z.string().uuid()]));

const profileEditSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be at most 100 characters")
    .trim(),
  phone: z
    .string()
    .regex(
      /^\+?[0-9]*$/,
      "Phone number must contain only digits and an optional '+' at the start",
    )
    .max(19, "Phone number must be at most 19 characters")
    .optional()
    .or(z.literal("")),
  rank: z.enum(["None", "Member", "Associate", "Supporter"], {
    error: "Invalid rank",
  }),
  thana_id: optionalThanaId,
  hide_sensitive_info: z.boolean().optional(),
});

export async function updateProfileInfo(
  formData: FormData,
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) redirect("/login");

  const raw = {
    full_name: formData.get("full_name") as string,
    phone: (formData.get("phone") as string | null) ?? "",
    rank: formData.get("rank") as string,
    thana_id: (formData.get("thana_id") as string | null) ?? "",
    hide_sensitive_info: formData.get("hide_sensitive_info") === "true",
  };

  const parsed = profileEditSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Validation error" };
  }

  const { full_name, phone, rank, thana_id, hide_sensitive_info } =
    parsed.data;

  // Detect rank change → strip verification
  const { data: current } = await supabase
    .from("profiles")
    .select("rank")
    .eq("id", claims.sub)
    .single();

  const rankChanged = current?.rank !== rank;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name,
      phone: phone || null,
      rank,
      thana_id,
      hide_sensitive_info: hide_sensitive_info ?? false,
      ...(rankChanged ? { is_verified: false } : {}),
    })
    .eq("id", claims.sub);

  if (updateError) return { error: updateError.message };

  invalidateUsersAndOverview();
  redirect("/dashboard/profile");
}

export async function verifyUser(userId: string): Promise<{ error?: string }> {
  console.log("[verifyUser] called with userId:", userId);

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  console.log("[verifyUser] caller sub:", claims?.sub ?? "(none)");

  if (!claims?.sub) return { error: "Not authenticated" };

  const { data: callerProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.sub)
    .single();

  console.log(
    "[verifyUser] callerProfile:",
    callerProfile,
    "profileError:",
    profileError,
  );

  if (!callerProfile || !["admin", "moderator"].includes(callerProfile.role)) {
    return { error: "Insufficient permissions" };
  }

  const {
    data: updateData,
    error,
    count,
    status,
    statusText,
  } = await supabase
    .from("profiles")
    .update({ is_verified: true })
    .eq("id", userId)
    .select();

  console.log("[verifyUser] update result:", {
    updateData,
    error,
    count,
    status,
    statusText,
  });

  if (error) return { error: error.message };

  await insertActionLog(supabase, "user_verified", userId, claims.sub, "Moderator verified user");

  invalidateUsersAndOverview();
  revalidatePath(`/dashboard/users/${userId}`);
  revalidatePath("/dashboard/users");
  return {};
}

export async function unVerifyUser(
  userId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return { error: "Not authenticated" };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.sub)
    .single();

  if (
    !callerProfile ||
    !(callerProfile.role === "admin" || callerProfile.role === "moderator")
  ) {
    return { error: "Insufficient permissions" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_verified: false })
    .eq("id", userId);

  if (error) return { error: error.message };

  await insertActionLog(supabase, "user_unverified", userId, claims.sub, "Moderator unverified user");

  invalidateUsersAndOverview();
  revalidatePath(`/dashboard/users/${userId}`);
  revalidatePath("/dashboard/users");
  return {};
}

/**
 * moderatorPermissions — returns the set of actions the current user is
 * allowed to perform, based on their role. Useful for conditional UI rendering
 * and API guards without repeating role checks everywhere.
 */
export async function moderatorPermissions(): Promise<{
  canManageBooks: boolean;
  canManageCopies: boolean;
  canApproveTransactions: boolean;
  canVerifyUsers: boolean;
  canManageUsers: boolean;
  canManageModerators: boolean;
  canManageThanas: boolean;
  role: string;
}> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) {
    return {
      canManageBooks: false,
      canManageCopies: false,
      canApproveTransactions: false,
      canVerifyUsers: false,
      canManageUsers: false,
      canManageModerators: false,
      canManageThanas: false,
      role: "member",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.sub)
    .single();

  const role = profile?.role ?? "member";
  const isMod = role === "moderator" || role === "admin";
  const isAdmin = role === "admin";

  return {
    canManageBooks: isMod,
    canManageCopies: isMod,
    canApproveTransactions: isMod,
    canVerifyUsers: isMod,
    canManageUsers: isMod,
    canManageModerators: isAdmin,
    canManageThanas: isMod,
    role,
  };
}

/** Alias kept for backward compatibility — prefer promoteToModerator. */
export const makeModerator = promoteToModerator;

export async function promoteToModerator(
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return { error: "Not authenticated" };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.sub)
    .single();
  if (callerProfile?.role !== "admin")
    return { error: "Only admins can promote moderators" };

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "Email is required" };

  const { data: target } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("email", email)
    .single();

  if (!target) return { error: "No user found with that email" };
  if (target.role === "admin")
    return { error: "Cannot change role of an admin" };
  if (target.role === "moderator")
    return { error: "User is already a moderator" };

  const { error } = await supabase
    .from("profiles")
    .update({ role: "moderator" })
    .eq("id", target.id);

  if (error) return { error: error.message };

  await insertActionLog(supabase, "role_changed", target.id, claims.sub, "Promoted to moderator");

  invalidateUsersAndOverview();
  return { success: `${target.full_name} is now a moderator` };
}

export async function makeAdmin(
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return { error: "Not authenticated" };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.sub)
    .single();
  if (callerProfile?.role !== "admin")
    return { error: "Only admins can promote users to admin" };

  const userId = formData.get("userId") as string;
  if (!userId) return { error: "User ID is required" };

  const { data: target } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", userId)
    .single();

  if (!target) return { error: "User not found" };
  if (target.role === "admin")
    return { error: "User is already an admin" };

  const { error } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);

  if (error) return { error: error.message };

  await insertActionLog(supabase, "role_changed", userId, claims.sub, "Promoted to admin");

  invalidateUsersAndOverview();
  return { success: `${target.full_name} is now an admin` };
}

export async function demoteModerator(
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return { error: "Not authenticated" };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.sub)
    .single();
  if (callerProfile?.role !== "admin")
    return { error: "Only admins can demote moderators" };

  const userId = formData.get("userId") as string;
  if (!userId) return { error: "User ID is required" };

  const { data: target } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", userId)
    .single();

  if (!target) return { error: "User not found" };
  if (target.role !== "moderator") return { error: "User is not a moderator" };

  const { error } = await supabase
    .from("profiles")
    .update({ role: "member" })
    .eq("id", userId);

  if (error) return { error: error.message };

  await insertActionLog(supabase, "role_changed", userId, claims.sub, "Demoted to member");

  invalidateUsersAndOverview();
  return { success: `${target.full_name} has been removed as moderator` };
}

export async function checkUsernameAvailability(username: string): Promise<"available" | "unavailable" | "invalid"> {
  const parsed = profileSchema.shape.username.safeParse(username);
  if (!parsed.success) return "invalid";

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  return existing ? "unavailable" : "available";
}
