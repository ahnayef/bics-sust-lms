import { applyCacheLife } from "@/lib/cache";
import {
  getAllChecklists,
  getChecklistsByVisibility,
  getUserChecklistCompletions as getUserChecklistCompletionsQuery
} from "@/lib/db/queries/checklists";
import * as schema from "@/lib/db/schema";
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
  const checklists = await getAllChecklists();
  return checklists as unknown as ChecklistWithItems[];
}

export async function getChecklists(onlyVisible = false): Promise<ChecklistWithItems[]> {
  const checklists = onlyVisible ? await getChecklistsByVisibility(true) : await loadChecklistsCached();
  return checklists as unknown as ChecklistWithItems[];
}

export async function getUserChecklistCompletions(userId: string): Promise<Set<string>> {
  const completions = await getUserChecklistCompletionsQuery(userId);
  return new Set(completions.map(c => c.checklist_item_id));
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
