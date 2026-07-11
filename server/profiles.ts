"use server";

/**
 * server/profiles.ts — Server Actions only (form submissions, mutations).
 */

import { USER_ROLES } from "@/lib/constants";
import {
  insertActionLog as insertActionLogQuery,
} from "@/lib/db/queries/actionLogs";
import {
  getProfileByEmail,
  getProfileById,
  getProfileByUsername,
  getProfileByUsernameExcludingId,
  updateProfile,
  upsertProfile,
} from "@/lib/db/queries/profiles";
import { requireAuth } from "@/server/auth-utils";
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
  actionType: ActionLogType,
  targetId: string,
  actorId: string | null = null,
  details: string | null = null
) {
  await insertActionLogQuery({
    action_type: actionType,
    target_id: targetId,
    actor_id: actorId,
    details,
  });
}

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

/**
 * Helper for fields that can be a UUID, null, or empty string/special value.
 * Safely converts "none" or empty strings to null before UUID validation.
 */
const optionalUuid = z
  .preprocess((val) => {
    if (typeof val !== "string") return val;
    const trimmed = val.trim();
    if (trimmed === "" || trimmed.toLowerCase() === "none") return null;
    return trimmed;
  }, z.string().uuid().nullable())
  .optional();

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
  rank_id: optionalUuid,
  thana_id: z.string().uuid("Please select a valid thana"),
});

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

export async function setupProfile(
  formData: FormData,
): Promise<{ error: string } | void> {
  try {
    const user = await requireAuth();

    // Read avatar from OAuth provider metadata (e.g. Google)
    const rawAvatarUrl: string | null = (user as any).user_metadata?.avatar_url ?? null;

    const localAvatarUrl = await cacheAvatarLocally(user.id, rawAvatarUrl);

    const raw = {
      full_name: formData.get("full_name") as string,
      username: formData.get("username") as string,
      phone: (formData.get("phone") as string | null) ?? "",
      rank_id: formData.get("rank_id"),
      thana_id: formData.get("thana_id"),
    };

    const validated = profileSchema.parse(raw);

    // Check username uniqueness
    const existing = await getProfileByUsernameExcludingId(validated.username, user.id);
    if (existing) {
      return { error: "Username is already taken" };
    }

    const isFirstTime = !(await getProfileById(user.id));

    await upsertProfile({
      id: user.id,
      email: user.email!,
      full_name: validated.full_name,
      username: validated.username,
      phone: validated.phone || null,
      rank_id: validated.rank_id,
      thana_id: validated.thana_id,
      avatar_url: localAvatarUrl,
      role: USER_ROLES.MEMBER,
      is_verified: false,
      profile_completed: true,
    });

    if (isFirstTime) {
      await insertActionLog("user_joined", user.id);
    }

    invalidateUsersAndOverview();
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Validation error" };
    }
    return { error: error.message || "Failed to setup profile" };
  }

  redirect("/dashboard");
}

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
  rank_id: optionalUuid,
  thana_id: optionalUuid,
  hide_sensitive_info: z.boolean().optional(),
});

export async function updateProfileInfo(
  formData: FormData,
): Promise<{ error: string } | void> {
  try {
    const user = await requireAuth();

    const raw = {
      full_name: formData.get("full_name") as string,
      phone: (formData.get("phone") as string | null) ?? "",
      rank_id: formData.get("rank_id"),
      thana_id: formData.get("thana_id"),
      hide_sensitive_info: formData.get("hide_sensitive_info") === "true",
    };

    const validated = profileEditSchema.parse(raw);

    const current = await getProfileById(user.id);
    const rankChanged = current?.rank_id !== validated.rank_id;
    const rankRequiresReverification = rankChanged && validated.rank_id !== null;

    await updateProfile(user.id, {
      full_name: validated.full_name,
      phone: validated.phone || null,
      rank_id: validated.rank_id,
      thana_id: validated.thana_id,
      hide_sensitive_info: validated.hide_sensitive_info ?? false,
      ...(rankRequiresReverification ? { is_verified: false } : {}),
    });

    invalidateUsersAndOverview();
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Validation error" };
    }
    return { error: error.message || "Failed to update profile info" };
  }

  redirect("/dashboard/profile");
}

export async function verifyUser(
  userId: string,
): Promise<{ error?: string; success?: string }> {
  try {
    const user = await requireAuth();
    const callerProfile = await getProfileById(user.id);
    if (callerProfile?.role !== USER_ROLES.ADMIN && callerProfile?.role !== USER_ROLES.MODERATOR)
      return { error: "Only admins and moderators can verify users" };

    await updateProfile(userId, { is_verified: true });
    await insertActionLog("user_verified", userId, user.id);

    invalidateUsersAndOverview();
    revalidatePath(`/dashboard/users/${userId}`);
    revalidatePath("/dashboard/users");
    return { success: "User verified" };
  } catch (error: any) {
    console.error("verifyUser error:", error);
    return { error: error.message || "Failed to verify user" };
  }
}

export async function unverifyUser(
  userId: string,
): Promise<{ error?: string; success?: string }> {
  try {
    const user = await requireAuth();
    const callerProfile = await getProfileById(user.id);
    if (callerProfile?.role !== USER_ROLES.ADMIN && callerProfile?.role !== USER_ROLES.MODERATOR)
      return { error: "Only admins and moderators can unverify users" };

    await updateProfile(userId, { is_verified: false });
    await insertActionLog("user_unverified", userId, user.id);

    invalidateUsersAndOverview();
    revalidatePath(`/dashboard/users/${userId}`);
    revalidatePath("/dashboard/users");
    return { success: "User unverified" };
  } catch (error: any) {
    console.error("unverifyUser error:", error);
    return { error: error.message || "Failed to unverify user" };
  }
}

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
  try {
    const user = await requireAuth();
    const profile = await getProfileById(user.id);

    const role = profile?.role ?? USER_ROLES.MEMBER;
    const isMod = role === USER_ROLES.MODERATOR || role === USER_ROLES.ADMIN;
    const isAdminRole = role === USER_ROLES.ADMIN;

    return {
      canManageBooks: isMod,
      canManageCopies: isMod,
      canApproveTransactions: isMod,
      canVerifyUsers: isMod,
      canManageUsers: isMod,
      canManageModerators: isMod, // TODO: To revoke this, change back to isAdminRole
      canManageThanas: isMod,
      role,
    };
  } catch {
    return {
      canManageBooks: false,
      canManageCopies: false,
      canApproveTransactions: false,
      canVerifyUsers: false,
      canManageUsers: false,
      canManageModerators: false,
      canManageThanas: false,
      role: USER_ROLES.MEMBER,
    };
  }
}

export async function promoteToModerator(
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const user = await requireAuth();
    const callerProfile = await getProfileById(user.id);
    if (callerProfile?.role !== USER_ROLES.ADMIN && callerProfile?.role !== USER_ROLES.MODERATOR)
      return { error: "Only admins and moderators can promote moderators" }; // TODO: To revoke, change back to only ADMIN

    const email = (formData.get("email") as string)?.trim().toLowerCase();
    if (!email) return { error: "Email is required" };

    const targetProfile = await getProfileByEmail(email);

    if (!targetProfile) return { error: "No user found with that email" };
    if (targetProfile.role === USER_ROLES.ADMIN)
      return { error: "Cannot change role of an admin" };
    if (targetProfile.role === USER_ROLES.MODERATOR)
      return { error: "User is already a moderator" };

    await updateProfile(targetProfile.id, { role: USER_ROLES.MODERATOR });
    await insertActionLog("role_changed", targetProfile.id, user.id, "Promoted to moderator");

    invalidateUsersAndOverview();
    return { success: `${targetProfile.full_name} is now a moderator` };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function makeModerator(
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const user = await requireAuth();
    const callerProfile = await getProfileById(user.id);
    if (callerProfile?.role !== USER_ROLES.ADMIN && callerProfile?.role !== USER_ROLES.MODERATOR)
      return { error: "Only admins and moderators can promote moderators" }; // TODO: To revoke, change back to only ADMIN

    const userId = formData.get("userId") as string;
    if (!userId) return { error: "User ID is required" };

    const targetProfile = await getProfileById(userId);
    if (!targetProfile) return { error: "User not found" };
    if (targetProfile.role === USER_ROLES.ADMIN)
      return { error: "Cannot change role of an admin" };
    if (targetProfile.role === USER_ROLES.MODERATOR)
      return { error: "User is already a moderator" };

    await updateProfile(userId, { role: USER_ROLES.MODERATOR });
    await insertActionLog("role_changed", userId, user.id, "Promoted to moderator");

    invalidateUsersAndOverview();
    return { success: `${targetProfile.full_name} is now a moderator` };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function changeUserRank(
  userId: string,
  rankId: string | null,
): Promise<{ error?: string; success?: string }> {
  try {
    const user = await requireAuth();
    const callerProfile = await getProfileById(user.id);

    if (callerProfile?.role !== USER_ROLES.ADMIN) {
      return { error: "Only admins can change user ranks" };
    }

    await updateProfile(userId, { rank_id: rankId });

    invalidateUsersAndOverview();
    return { success: "Rank updated successfully" };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function makeAdmin(
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const user = await requireAuth();
    const callerProfile = await getProfileById(user.id);
    if (callerProfile?.role !== USER_ROLES.ADMIN)
      return { error: "Only admins can promote users to admin" };

    const userId = formData.get("userId") as string;
    if (!userId) return { error: "User ID is required" };

    const targetProfile = await getProfileById(userId);
    if (!targetProfile) return { error: "User not found" };
    if (targetProfile.role === USER_ROLES.ADMIN)
      return { error: "User is already an admin" };

    await updateProfile(userId, { role: USER_ROLES.ADMIN });
    await insertActionLog("role_changed", userId, user.id, "Promoted to admin");

    invalidateUsersAndOverview();
    return { success: `${targetProfile.full_name} is now an admin` };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function demoteModerator(
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const user = await requireAuth();
    const callerProfile = await getProfileById(user.id);
    if (callerProfile?.role !== USER_ROLES.ADMIN && callerProfile?.role !== USER_ROLES.MODERATOR)
      return { error: "Only admins and moderators can demote moderators" }; // TODO: To revoke, change back to only ADMIN

    const userId = formData.get("userId") as string;
    if (!userId) return { error: "User ID is required" };

    const targetProfile = await getProfileById(userId);

    if (!targetProfile) return { error: "User not found" };
    if (targetProfile.role !== USER_ROLES.MODERATOR) return { error: "User is not a moderator" };

    await updateProfile(userId, { role: USER_ROLES.MEMBER });
    await insertActionLog("role_changed", userId, user.id, "Demoted to member");

    invalidateUsersAndOverview();
    return { success: `${targetProfile.full_name} has been removed as moderator` };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function demoteFromAdminAction(
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const user = await requireAuth();
    const callerProfile = await getProfileById(user.id);
    if (callerProfile?.role !== USER_ROLES.ADMIN)
      return { error: "Only admins can demote admins" };

    const userId = formData.get("userId") as string;
    if (!userId) return { error: "User ID is required" };

    if (userId === user.id) return { error: "You cannot demote yourself" };

    const targetProfile = await getProfileById(userId);
    if (!targetProfile) return { error: "User not found" };

    await updateProfile(userId, { role: USER_ROLES.MEMBER });
    await insertActionLog("role_changed", userId, user.id, "Demoted to member");

    invalidateUsersAndOverview();
    return { success: `${targetProfile.full_name} is now a member` };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function checkUsernameAvailability(username: string): Promise<"available" | "unavailable" | "invalid"> {
  const parsed = profileSchema.shape.username.safeParse(username);
  if (!parsed.success) return "invalid";

  const existing = await getProfileByUsername(username);
  return existing ? "unavailable" : "available";
}
