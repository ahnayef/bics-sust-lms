import { applyCacheLife } from "@/lib/cache";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { cacheTag } from "next/cache";

export type ChecklistWithItems = typeof schema.checklists.$inferSelect & {
  items: (typeof schema.checklistItems.$inferSelect)[];
};

export type ChecklistProgress = {
  checklistId: string;
  checklistName: string;
  total: number;
  completed: number;
};

async function loadChecklistsCached(): Promise<ChecklistWithItems[]> {
  "use cache";
  cacheTag("checklists");
  applyCacheLife("max");

  const checklists = await db.query.checklists.findMany({
    with: { items: { orderBy: [asc(schema.checklistItems.order)] } },
    orderBy: [asc(schema.checklists.created_at)],
  });

  return checklists as unknown as ChecklistWithItems[];
}

export async function getChecklists(onlyVisible = false): Promise<ChecklistWithItems[]> {
  const checklists = await loadChecklistsCached();
  if (onlyVisible) {
    return checklists.filter(c => c.visible);
  }
  return checklists;
}

async function loadUserChecklistCompletionsCached(userId: string): Promise<Set<string>> {
  "use cache";
  cacheTag("checklists");
  cacheTag("users");
  applyCacheLife("max");

  const completions = await db.query.checklistCompletions.findMany({
    where: (completions, { eq }) => eq(completions.user_id, userId),
  });

  return new Set(completions.map(c => c.checklist_item_id));
}

export async function getUserChecklistCompletions(userId: string): Promise<Set<string>> {
  return loadUserChecklistCompletionsCached(userId);
}

export async function getUserChecklistProgress(userId: string): Promise<ChecklistProgress[]> {
  const checklists = await getChecklists(true);
  const completedItemIds = await getUserChecklistCompletions(userId);

  return checklists.map(checklist => ({
    checklistId: checklist.id,
    checklistName: checklist.name,
    total: checklist.items.length,
    completed: checklist.items.filter(item => completedItemIds.has(item.id)).length,
  }));
}
