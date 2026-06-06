import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq, ilike, inArray, ne } from "drizzle-orm";

export async function getProfileById(id: string) {
  return db.query.profiles.findFirst({
    where: eq(schema.profiles.id, id),
  });
}

export async function getProfileByUsername(username: string) {
  return db.query.profiles.findFirst({
    where: eq(schema.profiles.username, username),
  });
}

export async function getProfileByEmail(email: string) {
  return db.query.profiles.findFirst({
    where: eq(schema.profiles.email, email),
  });
}

export async function getProfileByUsernameExcludingId(
  username: string,
  excludeId: string,
) {
  return db.query.profiles.findFirst({
    where: and(
      eq(schema.profiles.username, username),
      ne(schema.profiles.id, excludeId),
    ),
  });
}

export async function upsertProfile(profile: typeof schema.profiles.$inferInsert) {
  return db
    .insert(schema.profiles)
    .values(profile)
    .onConflictDoUpdate({
      target: schema.profiles.id,
      set: profile,
    });
}

export async function updateProfile(
  id: string,
  profile: Partial<typeof schema.profiles.$inferInsert>,
) {
  return db
    .update(schema.profiles)
    .set({ ...profile, updated_at: new Date() })
    .where(eq(schema.profiles.id, id));
}

export async function createActionLog(log: typeof schema.actionLogs.$inferInsert) {
  return db.insert(schema.actionLogs).values(log);
}

// ── Books & Copies ──────────────────────────────────────────────────────────

export async function getBookById(id: string) {
  return db.query.books.findFirst({
    where: ilike(schema.books.id, id),
  });
}

export async function insertBook(book: typeof schema.books.$inferInsert) {
  return db.insert(schema.books).values(book).returning();
}

export async function updateBook(id: string, book: Partial<typeof schema.books.$inferInsert>) {
  return db.update(schema.books).set(book).where(ilike(schema.books.id, id));
}

export async function deleteBook(id: string) {
  return db.delete(schema.books).where(ilike(schema.books.id, id));
}

export async function getCopyById(id: string) {
  return db.query.copies.findFirst({
    where: ilike(schema.copies.id, id),
  });
}

export async function insertCopy(copy: typeof schema.copies.$inferInsert) {
  return db.insert(schema.copies).values(copy).returning();
}

export async function updateCopy(id: string, copy: Partial<typeof schema.copies.$inferInsert>) {
  return db.update(schema.copies).set(copy).where(ilike(schema.copies.id, id));
}

export async function deleteCopy(id: string) {
  return db.delete(schema.copies).where(ilike(schema.copies.id, id));
}

export async function getBorrowedCopiesCountByBookId(bookId: string) {
  const result = await db.query.copies.findMany({
    where: and(
      ilike(schema.copies.book_id, bookId),
      eq(schema.copies.status, "borrowed")
    ),
    columns: { id: true },
    limit: 1,
  });
  return result.length;
}

export async function getMaxCopyNumber(bookId: string) {
  const result = await db.query.copies.findFirst({
    where: ilike(schema.copies.book_id, bookId),
    orderBy: (copies, { desc }) => [desc(copies.copy_number)],
    columns: { copy_number: true },
  });
  return result?.copy_number ?? 0;
}

export async function getBookWithCopies(id: string) {
  return db.query.books.findFirst({
    where: ilike(schema.books.id, id),
    with: {
      copies: true,
    },
  });
}

export async function getCopyByQR(copyId: string) {
  return db.query.copies.findFirst({
    where: ilike(schema.copies.id, copyId),
    with: {
      book: true,
    },
  });
}

export async function getCopyStatus(id: string) {
  const copy = await db.query.copies.findFirst({
    where: ilike(schema.copies.id, id),
    columns: { status: true },
  });
  return copy?.status;
}

// ── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactionById(id: string) {
  return db.query.transactions.findFirst({
    where: eq(schema.transactions.id, id),
  });
}

export async function getDuplicateTransaction(
  userId: string,
  copyId: string,
  type: string,
  statuses: string[],
) {
  return db.query.transactions.findFirst({
    where: and(
      eq(schema.transactions.user_id, userId),
      ilike(schema.transactions.copy_id, copyId),
      eq(schema.transactions.type, type),
      inArray(schema.transactions.status, statuses),
    ),
  });
}

export async function createTransaction(
  txn: typeof schema.transactions.$inferInsert,
) {
  return db.insert(schema.transactions).values({
    ...txn,
    copy_id: txn.copy_id.toUpperCase(),
    book_id: txn.book_id.toUpperCase(),
  });
}

export async function updateTransaction(
  id: string,
  txn: Partial<typeof schema.transactions.$inferInsert>,
) {
  return db
    .update(schema.transactions)
    .set({ ...txn, updated_at: new Date() })
    .where(eq(schema.transactions.id, id));
}

export async function updateBorrowStatus(
  userId: string,
  copyId: string,
  status: string,
  returnDate?: Date,
) {
  return db
    .update(schema.transactions)
    .set({ status, return_date: returnDate, updated_at: new Date() })
    .where(
      and(
        eq(schema.transactions.user_id, userId),
        ilike(schema.transactions.copy_id, copyId),
        eq(schema.transactions.type, "borrow"),
        inArray(schema.transactions.status, ["active", "overdue"]),
      ),
    );
}

// ── PDF Submissions ──────────────────────────────────────────────────────────

export async function getDuplicatePdfSubmission(userId: string, bookId: string) {
  return db.query.pdfSubmissions.findFirst({
    where: and(
      eq(schema.pdfSubmissions.user_id, userId),
      ilike(schema.pdfSubmissions.book_id, bookId),
      inArray(schema.pdfSubmissions.status, ["pending", "approved"]),
    ),
  });
}

export async function createPdfSubmission(
  submission: typeof schema.pdfSubmissions.$inferInsert,
) {
  return db.insert(schema.pdfSubmissions).values({
    ...submission,
    book_id: submission.book_id.toUpperCase(),
  });
}

export async function updatePdfSubmission(
  id: string,
  submission: Partial<typeof schema.pdfSubmissions.$inferInsert>,
) {
  return db
    .update(schema.pdfSubmissions)
    .set(submission)
    .where(eq(schema.pdfSubmissions.id, id));
}

export async function getTransactionsByUserId(userId: string) {
  return db.query.transactions.findMany({
    where: eq(schema.transactions.user_id, userId),
    with: {
      user: true,
      book: true,
      copy: true,
      reviewer: true,
    },
    orderBy: (transactions, { desc }) => [desc(transactions.request_date)],
  });
}

export async function getAllTransactions() {
  return db.query.transactions.findMany({
    with: {
      user: true,
      book: true,
      copy: true,
      reviewer: true,
    },
    orderBy: (transactions, { desc }) => [desc(transactions.request_date)],
  });
}

export async function getPdfSubmissionsByUserId(userId: string) {
  return db.query.pdfSubmissions.findMany({
    where: eq(schema.pdfSubmissions.user_id, userId),
    with: {
      user: true,
      book: true,
      reviewer: true,
    },
    orderBy: (pdfs, { desc }) => [desc(pdfs.submitted_at)],
  });
}

export async function getAllPdfSubmissions() {
  return db.query.pdfSubmissions.findMany({
    with: {
      user: true,
      book: true,
      reviewer: true,
    },
    orderBy: (pdfs, { desc }) => [desc(pdfs.submitted_at)],
  });
}
