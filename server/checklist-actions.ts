"use server";

import { USER_ROLES } from "@/lib/constants";
import {
  deleteChecklistCompletion,
  deleteChecklistItem as deleteChecklistItemQuery,
  deleteChecklist as deleteChecklistQuery,
  insertChecklist,
  insertChecklistCompletion,
  insertChecklistItem,
  updateChecklistItem as updateChecklistItemQuery,
  updateChecklist as updateChecklistQuery,
} from "@/lib/db/queries/checklists";
import { getMyProfile, requireAuth } from "@/server/auth-utils";
import { invalidateAfterChecklistCompletionMutation, invalidateAfterChecklistMutation } from "@/server/cache-invalidation";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const user = await requireAuth();
  const profile = await getMyProfile();
  if (!profile || profile.role !== USER_ROLES.ADMIN) {
    throw new Error("Unauthorized");
  }
  return profile;
}

export async function createChecklist(name: string, visible: boolean) {
  try {
    await requireAdmin();

    await insertChecklist({ name, visible });

    invalidateAfterChecklistMutation();
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export async function updateChecklist(id: string, name: string, visible: boolean) {
  try {
    await requireAdmin();

    await updateChecklistQuery(id, { name, visible });

    invalidateAfterChecklistMutation();
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export async function deleteChecklist(id: string) {
  try {
    await requireAdmin();

    await deleteChecklistQuery(id);

    invalidateAfterChecklistMutation();
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export async function addChecklistItem(checklistId: string, name: string) {
  try {
    await requireAdmin();

    await insertChecklistItem({ checklist_id: checklistId, name });

    invalidateAfterChecklistMutation();
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export async function updateChecklistItem(id: string, name: string) {
  try {
    await requireAdmin();

    await updateChecklistItemQuery(id, { name });

    invalidateAfterChecklistMutation();
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export async function deleteChecklistItem(id: string) {
  try {
    await requireAdmin();

    await deleteChecklistItemQuery(id);

    invalidateAfterChecklistMutation();
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export async function toggleChecklistItem(itemId: string, checked: boolean) {
  try {
    const user = await requireAuth();
    const userId = user.id;

    if (checked) {
      await insertChecklistCompletion({ user_id: userId, checklist_item_id: itemId });
    } else {
      await deleteChecklistCompletion(userId, itemId);
    }

    invalidateAfterChecklistCompletionMutation();
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}
