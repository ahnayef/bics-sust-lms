import { db } from "@/lib/db";
import { retry } from "@/lib/db/retry";
import * as schema from "@/lib/db/schema";
import { and, eq, ilike, inArray } from "drizzle-orm";

export async function getAllCopies() {
  return retry(() =>
    db.query.copies.findMany({
      with: {
        book: {
          columns: { id: true, title: true, author: true, is_syllabus: true },
        },
        transactions: {
          where: and(
            eq(schema.transactions.type, "borrow"),
            inArray(schema.transactions.status, ["active", "overdue"])
          ),
          with: {
            user: {
              columns: { id: true, full_name: true },
            },
          },
        },
      },
      orderBy: (copies, { asc }) => [asc(copies.book_id), asc(copies.created_at)],
    })
  );
}

export async function getCopyById(id: string) {
  return retry(() =>
    db.query.copies.findFirst({
      where: ilike(schema.copies.id, id),
      with: { book: true },
    })
  );
}

export async function getCopiesByBookId(bookId: string) {
  return retry(() =>
    db.query.copies.findMany({
      where: ilike(schema.copies.book_id, bookId),
      orderBy: (copies, { asc }) => [asc(copies.copy_number)],
    })
  );
}

export async function getCopyStatus(id: string) {
  const copy = await retry(() =>
    db.query.copies.findFirst({
      where: ilike(schema.copies.id, id),
      columns: { status: true },
    })
  );
  return copy?.status;
}

export async function getBorrowedCopiesCountByBookId(bookId: string) {
  const result = await retry(() =>
    db.query.copies.findMany({
      where: and(
        ilike(schema.copies.book_id, bookId),
        eq(schema.copies.status, "borrowed")
      ),
      columns: { id: true },
      limit: 1,
    })
  );
  return result.length;
}

export async function getMaxCopyNumber(bookId: string) {
  const result = await retry(() =>
    db.query.copies.findFirst({
      where: ilike(schema.copies.book_id, bookId),
      orderBy: (copies, { desc }) => [desc(copies.copy_number)],
      columns: { copy_number: true },
    })
  );
  return result?.copy_number ?? 0;
}

export async function insertCopy(copy: typeof schema.copies.$inferInsert) {
  return retry(() =>
    db.insert(schema.copies).values(copy).returning()
  );
}

export async function updateCopy(
  id: string,
  updates: Partial<typeof schema.copies.$inferInsert>,
) {
  return retry(() =>
    db.update(schema.copies).set(updates).where(ilike(schema.copies.id, id))
  );
}

export async function deleteCopy(id: string) {
  return retry(() =>
    db.delete(schema.copies).where(ilike(schema.copies.id, id))
  );
}
