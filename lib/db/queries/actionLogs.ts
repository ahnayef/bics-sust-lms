import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq, gte, ne, desc } from "drizzle-orm";

export async function getActionLogs(days: number = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return db.query.actionLogs.findMany({
    where: gte(schema.actionLogs.created_at, cutoff),
    with: {
      actor: { columns: { id: true, full_name: true, username: true } },
      target: { columns: { id: true, full_name: true, username: true } }
    },
    orderBy: [desc(schema.actionLogs.created_at)]
  });
}

export async function getActionLogsForTarget(userId: string) {
  return db.query.actionLogs.findMany({
    where: and(
      eq(schema.actionLogs.target_id, userId),
      ne(schema.actionLogs.action_type, "error")
    )
  });
}

export async function insertActionLog(log: typeof schema.actionLogs.$inferInsert) {
  return db.insert(schema.actionLogs).values(log);
}

export async function getActionLogById(id: string) {
  return db.query.actionLogs.findFirst({
    where: eq(schema.actionLogs.id, id),
    with: { actor: true, target: true },
  });
}
