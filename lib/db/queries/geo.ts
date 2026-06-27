import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";

// Thanas
export async function getThanas() {
  return db.query.thanas.findMany({
    orderBy: [asc(schema.thanas.name)],
  });
}

export async function getThanaById(id: string) {
  return db.query.thanas.findFirst({
    where: eq(schema.thanas.id, id),
  });
}

export async function insertThana(thana: typeof schema.thanas.$inferInsert) {
  return db.insert(schema.thanas).values(thana).returning();
}

export async function updateThana(
  id: string,
  updates: Partial<typeof schema.thanas.$inferInsert>,
) {
  return db.update(schema.thanas).set(updates).where(eq(schema.thanas.id, id));
}

export async function deleteThana(id: string) {
  return db.delete(schema.thanas).where(eq(schema.thanas.id, id));
}

// Ranks
export async function getRanks() {
  return db.query.ranks.findMany({
    orderBy: [asc(schema.ranks.name)],
  });
}

export async function getRankById(id: string) {
  return db.query.ranks.findFirst({
    where: eq(schema.ranks.id, id),
  });
}

export async function insertRank(rank: typeof schema.ranks.$inferInsert) {
  return db.insert(schema.ranks).values(rank).returning();
}

export async function updateRank(
  id: string,
  updates: Partial<typeof schema.ranks.$inferInsert>,
) {
  return db.update(schema.ranks).set(updates).where(eq(schema.ranks.id, id));
}

export async function deleteRank(id: string) {
  return db.delete(schema.ranks).where(eq(schema.ranks.id, id));
}

// Categories
export async function getCategories() {
  return db.query.categories.findMany({
    orderBy: [asc(schema.categories.name)],
  });
}

export async function getCategoriesForProgress() {
  return db.query.categories.findMany({
    where: eq(schema.categories.count_in_progress, true),
    orderBy: [asc(schema.categories.name)],
  });
}

export async function getCategoryById(id: string) {
  return db.query.categories.findFirst({
    where: eq(schema.categories.id, id),
  });
}

export async function insertCategory(category: typeof schema.categories.$inferInsert) {
  const now = new Date();
  return db.insert(schema.categories).values({
    ...category,
    created_at: now,
    updated_at: now,
  }).returning();
}

export async function updateCategory(
  id: string,
  updates: Partial<typeof schema.categories.$inferInsert>,
) {
  return db.update(schema.categories).set({
    ...updates,
    updated_at: new Date(),
  }).where(eq(schema.categories.id, id));
}

export async function deleteCategory(id: string) {
  return db.delete(schema.categories).where(eq(schema.categories.id, id));
}
