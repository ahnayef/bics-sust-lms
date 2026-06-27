import { db } from "@/lib/db";
import { retry } from "@/lib/db/retry";
import * as schema from "@/lib/db/schema";
import { and, eq, ilike, inArray, sql } from "drizzle-orm";

export async function getTransactionById(id: string) {
  return retry(() =>
    db.query.transactions.findFirst({
      where: eq(schema.transactions.id, id),
      with: { user: true, book: true, copy: true, reviewer: true },
    })
  );
}

export async function getTransactionsByUserId(userId: string) {
  return retry(() =>
    db.query.transactions.findMany({
      where: eq(schema.transactions.user_id, userId),
      with: {
        user: true,
        book: true,
        copy: true,
        reviewer: true,
      },
      orderBy: (transactions, { desc }) => [desc(transactions.request_date)],
    })
  );
}

export async function getAllTransactions() {
  return retry(() =>
    db.query.transactions.findMany({
      with: {
        user: true,
        book: true,
        copy: true,
        reviewer: true,
      },
      orderBy: (transactions, { desc }) => [desc(transactions.request_date)],
    })
  );
}

export async function getTransactionsByFilters(filters: {
  type?: string;
  status?: string;
  userId?: string;
}) {
  const whereConditions: any[] = [];
  if (filters.type)
    whereConditions.push(eq(schema.transactions.type, filters.type));
  if (filters.status)
    whereConditions.push(eq(schema.transactions.status, filters.status));
  if (filters.userId)
    whereConditions.push(eq(schema.transactions.user_id, filters.userId));

  return retry(() =>
    db.query.transactions.findMany({
      where: and(...whereConditions),
      with: {
        user: {
          columns: { id: true, full_name: true, username: true, email: true, avatar_url: true },
        },
        copy: {
          columns: { id: true, copy_number: true, status: true, book_id: true },
        },
        book: {
          columns: { id: true, title: true, author: true, is_syllabus: true },
        },
        reviewer: {
          columns: { id: true, full_name: true },
        },
      },
      orderBy: (transactions, { desc }) => [desc(transactions.request_date)],
    })
  );
}

export async function getDuplicateTransaction(
  userId: string,
  copyId: string,
  type: string,
  statuses: string[],
) {
  return retry(() =>
    db.query.transactions.findFirst({
      where: and(
        eq(schema.transactions.user_id, userId),
        ilike(schema.transactions.copy_id, copyId),
        eq(schema.transactions.type, type),
        inArray(schema.transactions.status, statuses),
      ),
    })
  );
}

export async function createTransaction(
  txn: typeof schema.transactions.$inferInsert,
) {
  return retry(() =>
    db.insert(schema.transactions).values({
      ...txn,
      copy_id: txn.copy_id.toUpperCase(),
      book_id: txn.book_id.toUpperCase(),
    })
  );
}

export async function updateTransaction(
  id: string,
  updates: Partial<typeof schema.transactions.$inferInsert>,
) {
  return retry(() =>
    db
      .update(schema.transactions)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(schema.transactions.id, id))
  );
}

export async function updateBorrowStatus(
  userId: string,
  copyId: string,
  status: string,
  returnDate?: Date,
) {
  return retry(() =>
    db
      .update(schema.transactions)
      .set({ status, return_date: returnDate, updated_at: new Date() })
      .where(
        and(
          eq(schema.transactions.user_id, userId),
          ilike(schema.transactions.copy_id, copyId),
          eq(schema.transactions.type, "borrow"),
          inArray(schema.transactions.status, ["active", "overdue"]),
        ),
      )
  );
}

export async function getRecentTransactions(limit: number = 15) {
  return retry(() =>
    db.query.transactions.findMany({
      with: {
        user: { columns: { id: true, full_name: true, username: true, avatar_url: true } },
        book: { columns: { id: true, title: true, author: true } },
        copy: { columns: { id: true, copy_number: true } }
      },
      orderBy: (transactions, { desc }) => [desc(transactions.request_date)],
      limit,
    })
  );
}

export async function getCompletedSince(date: string) {
  return retry(() =>
    db.query.transactions.findMany({
      where: and(
        eq(schema.transactions.status, "completed"),
        sql`${schema.transactions.updated_at} >= ${date}`
      ),
      columns: { id: true },
    })
  );
}
