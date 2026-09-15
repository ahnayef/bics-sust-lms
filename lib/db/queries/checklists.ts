import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";

export async function getAllChecklists() {
  return db.query.checklists.findMany({
    with: { items: { orderBy: [asc(schema.checklistItems.order)] } },
    orderBy: [asc(schema.checklists.created_at)],
  });
}

export async function getChecklistsByVisibility(visible: boolean = true) {
  return db.query.checklists.findMany({
    where: eq(schema.checklists.visible, visible),
    with: { items: { orderBy: [asc(schema.checklistItems.order)] } },
    orderBy: [asc(schema.checklists.created_at)],
  });
}

export async function getChecklistById(id: string) {
  return db.query.checklists.findFirst({
    where: eq(schema.checklists.id, id),
    with: { items: { orderBy: [asc(schema.checklistItems.order)] } },
  });
}

export async function getChecklistItemsByChecklistId(checklistId: string) {
  return db.query.checklistItems.findMany({
    where: eq(schema.checklistItems.checklist_id, checklistId),
    orderBy: [asc(schema.checklistItems.order)],
  });
}

export async function getUserChecklistCompletions(userId: string) {
  return db.query.checklistCompletions.findMany({
    where: eq(schema.checklistCompletions.user_id, userId),
  });
}

export async function insertChecklist(checklist: typeof schema.checklists.$inferInsert) {
  const now = new Date();
  return db.insert(schema.checklists).values({
    ...checklist,
    created_at: now,
    updated_at: now,
  }).returning();
}

export async function updateChecklist(
  id: string,
  updates: Partial<typeof schema.checklists.$inferInsert>,
) {
  return db.update(schema.checklists).set({
    ...updates,
    updated_at: new Date(),
  }).where(eq(schema.checklists.id, id));
}

export async function deleteChecklist(id: string) {
  return db.delete(schema.checklists).where(eq(schema.checklists.id, id));
}

export async function insertChecklistItem(item: typeof schema.checklistItems.$inferInsert) {
  const lastItem = await db.query.checklistItems.findFirst({
    where: eq(schema.checklistItems.checklist_id, item.checklist_id),
    orderBy: [desc(schema.checklistItems.order)],
  });
  const newOrder = lastItem ? lastItem.order + 1 : 0;
  const now = new Date();
  return db.insert(schema.checklistItems).values({
    ...item,
    order: newOrder,
    created_at: now,
    updated_at: now,
  }).returning();
}

export async function updateChecklistItem(
  id: string,
  updates: Partial<typeof schema.checklistItems.$inferInsert>,
) {
  return db.update(schema.checklistItems).set({
    ...updates,
    updated_at: new Date(),
  }).where(eq(schema.checklistItems.id, id));
}

export async function deleteChecklistItem(id: string) {
  return db.delete(schema.checklistItems).where(eq(schema.checklistItems.id, id));
}

export async function insertChecklistCompletion(
  completion: typeof schema.checklistCompletions.$inferInsert,
) {
  return db.insert(schema.checklistCompletions).values(completion).returning();
}

export async function deleteChecklistCompletion(userId: string, itemId: string) {
  return db
    .delete(schema.checklistCompletions)
    .where(
      and(
        eq(schema.checklistCompletions.user_id, userId),
        eq(schema.checklistCompletions.checklist_item_id, itemId),
      ),
    );
}
