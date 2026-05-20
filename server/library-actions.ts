"use server";

/**
 * server/library-actions.ts — Server Actions for book and copy CRUD.
 *
 * Caller must be admin or moderator for all write operations.
 */

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { isModerator, requireAuth } from "@/server/auth-utils";
import { invalidateAfterBookOrCopyMutation } from "@/server/cache-invalidation";
import {
  deleteBook,
  deleteCopy,
  getBookById,
  getBorrowedCopiesCountByBookId,
  getCopyById,
  getMaxCopyNumber,
  insertBook,
  insertCopy,
  updateBook,
  updateCopy,
} from "@/server/db-access";
import { logActionError } from "@/server/error-log";
import { randomBytes } from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────────────────────────────────────
// Auth helper
// ─────────────────────────────────────────────────────────────────────────────

async function requireModOrAdmin() {
  const user = await requireAuth();
  const mod = await isModerator();
  if (!mod) throw new Error("Insufficient permissions");
  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// Books
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add a new book. Optionally creates the first copy in the same action.
 *
 * FormData fields:
 *   title (required), author (required), is_syllabus ("true"|"false"),
 *   pages (number, optional), pdf_link (optional),
 *   first_copy_id (QR text, optional — creates copy 1 if provided)
 */
export async function addBook(
  formData: FormData,
): Promise<{ error?: string; bookId?: string }> {
  try {
    const user = await requireModOrAdmin();

    const title = (formData.get("title") as string)?.trim();
    const author = (formData.get("author") as string)?.trim();
    const is_syllabus = formData.get("is_syllabus") === "true";
    const pagesRaw = parseInt(formData.get("pages") as string, 10);
    const pages = Number.isFinite(pagesRaw) && pagesRaw > 0 ? pagesRaw : null;
    const pdf_link = (formData.get("pdf_link") as string)?.trim() || null;
    const first_copy_raw = formData.get("auto_add_first_copy") === "true";

    if (!title) return { error: "Title is required" };
    if (!author) return { error: "Author is required" };

    const short_id = randomBytes(3).toString("hex").toUpperCase();

    const [book] = await insertBook({ title, author, is_syllabus, pages, pdf_link, short_id });

    if (!book) {
      throw new Error("Failed to add book");
    }

    if (first_copy_raw) {
      const first_copy_id = `QR${book.short_id}-1`;
      try {
        await insertCopy({ id: first_copy_id, book_id: book.id, copy_number: 1 });
      } catch (copyErr: any) {
        const msg = `Book added but failed to create first copy: ${copyErr.message}`;
        logActionError("addBook", msg, user.id, { bookId: book.id, first_copy_id });
        invalidateAfterBookOrCopyMutation();
        revalidatePath("/dashboard/books");
        return { bookId: book.id, error: msg };
      }
    }

    invalidateAfterBookOrCopyMutation();
    revalidatePath("/dashboard/books");
    revalidatePath("/dashboard/copies");
    return { bookId: book.id };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Edit an existing book's metadata (title, author, is_syllabus, pages, pdf_link).
 *
 * FormData fields: id (required), title, author, is_syllabus, pages, pdf_link
 */
export async function editBook(
  formData: FormData,
): Promise<{ error?: string }> {
  try {
    const user = await requireModOrAdmin();

    const id = formData.get("id") as string;
    const title = (formData.get("title") as string)?.trim();
    const author = (formData.get("author") as string)?.trim();
    const is_syllabus = formData.get("is_syllabus") === "true";
    const pagesRaw = parseInt(formData.get("pages") as string, 10);
    const pages = Number.isFinite(pagesRaw) && pagesRaw > 0 ? pagesRaw : null;
    const pdf_link = (formData.get("pdf_link") as string)?.trim() || null;

    if (!id) return { error: "Book ID is required" };
    if (!title) return { error: "Title is required" };
    if (!author) return { error: "Author is required" };

    await updateBook(id, { title, author, is_syllabus, pages, pdf_link });

    invalidateAfterBookOrCopyMutation();
    revalidatePath("/dashboard/books");
    revalidatePath("/dashboard/copies");
    return {};
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Delete a book and all its copies (cascades via FK).
 * Will fail if any copy is currently borrowed.
 *
 * FormData fields: id (required)
 */
export async function removeBook(
  formData: FormData,
): Promise<{ error?: string }> {
  try {
    const user = await requireModOrAdmin();

    const id = formData.get("id") as string;
    if (!id) return { error: "Book ID is required" };

    // Safety: block if any copy is currently borrowed
    const borrowedCount = await getBorrowedCopiesCountByBookId(id);

    if (borrowedCount > 0) {
      const msg = "Cannot delete: one or more copies are currently borrowed";
      logActionError("removeBook", msg, user.id, { bookId: id });
      return { error: msg };
    }

    await deleteBook(id);

    invalidateAfterBookOrCopyMutation();
    revalidatePath("/dashboard/books");
    revalidatePath("/dashboard/copies");
    return {};
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Returns the number of active/pending transactions for a book.
 */
export async function getBookRefCount(bookId: string): Promise<number> {
  // We can use drizzle for this too
  const result = await db.query.transactions.findMany({
    where: and(
      eq(schema.transactions.book_id, bookId),
      inArray(schema.transactions.status, ["pending", "active", "overdue"])
    ),
    columns: { id: true },
  });
  return result.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Copies
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add a new physical copy of an existing book.
 * The copy_number is auto-incremented based on existing copies.
 *
 * FormData fields: book_id (UUID), copy_id (QR text, unique)
 */
export async function addCopyOfBook(
  formData: FormData,
): Promise<{ error?: string }> {
  try {
    const user = await requireModOrAdmin();

    const book_id = formData.get("book_id") as string;
    if (!book_id) return { error: "Book ID is required" };

    const book = await getBookById(book_id);
    if (!book) return { error: "Book not found" };

    // Retry loop to handle concurrent modifications (race condition)
    let attempt = 0;
    const maxAttempts = 5;
    let finalError = null;

    while (attempt < maxAttempts) {
      attempt++;

      // Auto-number: max existing copy_number + 1
      const copy_number = (await getMaxCopyNumber(book_id)) + 1;
      const copy_id = `QR${book.short_id}-${copy_number}`;

      try {
        await insertCopy({ id: copy_id, book_id, copy_number, status: "available" });

        invalidateAfterBookOrCopyMutation();
        revalidatePath("/dashboard/books");
        revalidatePath("/dashboard/copies");
        return {};
      } catch (err: any) {
        finalError = err;
        // If it's a unique constraint violation on id or copy_number, retry
        if (err.message?.includes("unique") || err.code === "23505") {
          continue;
        }
        throw err;
      }
    }

    throw finalError || new Error("Failed to add copy after multiple attempts");
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Delete a single copy.
 * Fails if the copy is currently borrowed.
 */
export async function removeCopy(
  formData: FormData,
): Promise<{ error?: string }> {
  try {
    const user = await requireModOrAdmin();

    const id = formData.get("id") as string;
    if (!id) return { error: "Copy ID is required" };

    const copy = await getCopyById(id);
    if (!copy) return { error: "Copy not found" };

    if (copy.status === "borrowed") {
      return { error: "Cannot delete a borrowed copy" };
    }

    await deleteCopy(id);

    invalidateAfterBookOrCopyMutation();
    revalidatePath("/dashboard/books");
    revalidatePath("/dashboard/copies");
    return {};
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Change status or other metadata of a copy.
 */
export async function updateCopyMetadata(
  formData: FormData,
): Promise<{ error?: string }> {
  try {
    const user = await requireModOrAdmin();

    const id = formData.get("id") as string;
    const status = formData.get("status") as string;

    if (!id) return { error: "Copy ID is required" };
    if (!status) return { error: "Status is required" };

    await updateCopy(id, { status });

    invalidateAfterBookOrCopyMutation();
    revalidatePath("/dashboard/books");
    revalidatePath("/dashboard/copies");
    return {};
  } catch (error: any) {
    return { error: error.message };
  }
}
