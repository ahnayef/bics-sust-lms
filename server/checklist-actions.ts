"use server";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { requireAuth, getMyProfile } from "@/server/auth-utils";
import { USER_ROLES } from "@/lib/constants";
import { invalidateAfterChecklistCompletionMutation, invalidateAfterChecklistMutation } from "@/server/cache-invalidation";
import { and, desc, eq } from "drizzle-orm";
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
  await requireAdmin();

  await db.insert(schema.checklists).values({
    name,
    visible,
    created_at: new Date(),
    updated_at: new Date(),
  });

  invalidateAfterChecklistMutation();
  revalidatePath("/dashboard");
}

export async function updateChecklist(id: string, name: string, visible: boolean) {
  await requireAdmin();

  await db.update(schema.checklists).set({
    name,
    visible,
    updated_at: new Date(),
  }).where(eq(schema.checklists.id, id));

  invalidateAfterChecklistMutation();
  revalidatePath("/dashboard");
}

export async function deleteChecklist(id: string) {
  await requireAdmin();

  await db.delete(schema.checklists).where(eq(schema.checklists.id, id));

  invalidateAfterChecklistMutation();
  revalidatePath("/dashboard");
}

export async function addChecklistItem(checklistId: string, name: string) {
  await requireAdmin();

  const lastItem = await db.query.checklistItems.findFirst({
    where: eq(schema.checklistItems.checklist_id, checklistId),
    orderBy: [desc(schema.checklistItems.order)],
  });

  const newOrder = lastItem ? lastItem.order + 1 : 0;

  await db.insert(schema.checklistItems).values({
    checklist_id: checklistId,
    name,
    order: newOrder,
    created_at: new Date(),
    updated_at: new Date(),
  });

  invalidateAfterChecklistMutation();
  revalidatePath("/dashboard");
}

export async function updateChecklistItem(id: string, name: string) {
  await requireAdmin();

  await db.update(schema.checklistItems).set({
    name,
    updated_at: new Date(),
  }).where(eq(schema.checklistItems.id, id));

  invalidateAfterChecklistMutation();
  revalidatePath("/dashboard");
}

export async function deleteChecklistItem(id: string) {
  await requireAdmin();

  await db.delete(schema.checklistItems).where(eq(schema.checklistItems.id, id));

  invalidateAfterChecklistMutation();
  revalidatePath("/dashboard");
}

export async function toggleChecklistItem(itemId: string, checked: boolean) {
  const user = await requireAuth();
  const userId = user.id;

  if (checked) {
    await db.insert(schema.checklistCompletions).values({
      user_id: userId,
      checklist_item_id: itemId,
      created_at: new Date(),
    }).onConflictDoNothing();
  } else {
    await db.delete(schema.checklistCompletions).where(
      and(
        eq(schema.checklistCompletions.user_id, userId),
        eq(schema.checklistCompletions.checklist_item_id, itemId)
      )
    );
  }

  invalidateAfterChecklistCompletionMutation();
  revalidatePath("/dashboard");
}
