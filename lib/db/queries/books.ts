import { db } from "@/lib/db";
import { retry } from "@/lib/db/retry";
import * as schema from "@/lib/db/schema";
import { eq, ilike, inArray } from "drizzle-orm";

export async function getAllBooks() {
  return retry(() =>
    db.query.books.findMany({
      with: {
        category: true,
        copies: {
          columns: { id: true, copy_number: true, status: true },
        },
      },
      orderBy: (books, { asc }) => [asc(books.title)],
    })
  );
}

export async function getBookById(id: string) {
  return retry(() =>
    db.query.books.findFirst({
      where: ilike(schema.books.id, id),
      with: {
        category: true,
        copies: true,
      },
    })
  );
}

export async function getBooksByCategory(categoryId: string) {
  return retry(() =>
    db.query.books.findMany({
      where: eq(schema.books.category_id, categoryId),
      orderBy: (books, { asc }) => [asc(books.title)],
    })
  );
}

export async function getBooksByIds(ids: string[]) {
  return retry(() =>
    db.query.books.findMany({
      where: inArray(schema.books.id, ids),
    })
  );
}

export async function insertBook(book: typeof schema.books.$inferInsert) {
  return retry(() =>
    db.insert(schema.books).values(book).returning()
  );
}

export async function updateBook(
  id: string,
  updates: Partial<typeof schema.books.$inferInsert>,
) {
  return retry(() =>
    db.update(schema.books).set(updates).where(ilike(schema.books.id, id))
  );
}

export async function deleteBook(id: string) {
  return retry(() =>
    db.delete(schema.books).where(ilike(schema.books.id, id))
  );
}
