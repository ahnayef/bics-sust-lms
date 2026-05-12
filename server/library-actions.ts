"use server";

/**
 * server/library-actions.ts — Server Actions for book and copy CRUD.
 *
 * Caller must be admin or moderator for all write operations.
 */

import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import { invalidateAfterBookOrCopyMutation } from "@/server/cache-invalidation";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// No more formatCopyId needed, IDs are auto-generated as QR{book-id}-{copyNumber}

// ─────────────────────────────────────────────────────────────────────────────
// Auth helper
// ─────────────────────────────────────────────────────────────────────────────

async function requireModOrAdmin(): Promise<
  { sub: string; role: string } | { error: string }
> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (!sub) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", sub)
    .single();

  if (!profile || !["admin", "moderator"].includes(profile.role)) {
    return { error: "Insufficient permissions" };
  }
  return { sub, role: profile.role };
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
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const supabase = await createClient();

  const title = (formData.get("title") as string)?.trim();
  const author = (formData.get("author") as string)?.trim();
  const is_syllabus = formData.get("is_syllabus") === "true";
  const pagesRaw = parseInt(formData.get("pages") as string, 10);
  const pages = Number.isFinite(pagesRaw) && pagesRaw > 0 ? pagesRaw : null;
  const pdf_link = (formData.get("pdf_link") as string)?.trim() || null;
  const first_copy_raw = formData.get("auto_add_first_copy") === "true";

  if (!title) return { error: "Title is required" };
  if (!author) return { error: "Author is required" };

  const short_id = randomBytes(3).toString("hex");

  const { data: book, error: bookErr } = await supabase
    .from("books")
    .insert({ title, author, is_syllabus, pages, pdf_link, short_id })
    .select("id, short_id")
    .single();

  if (bookErr || !book)
    return { error: bookErr?.message ?? "Failed to add book" };

  if (first_copy_raw) {
    const first_copy_id = `QR${book.short_id}-1`;
    const { error: copyErr } = await supabase
      .from("copies")
      .insert({ id: first_copy_id, book_id: book.id, copy_number: 1 });

    if (copyErr) {
      invalidateAfterBookOrCopyMutation();
      revalidatePath("/dashboard/books");
      return {
        bookId: book.id,
        error: `Book added but failed to create first copy: ${copyErr.message}`,
      };
    }
  }

  invalidateAfterBookOrCopyMutation();
  revalidatePath("/dashboard/books");
  revalidatePath("/dashboard/copies");
  return { bookId: book.id };
}

/**
 * Edit an existing book's metadata (title, author, is_syllabus, pages, pdf_link).
 *
 * FormData fields: id (required), title, author, is_syllabus, pages, pdf_link
 */
export async function editBook(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const supabase = await createClient();

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

  const { error } = await supabase
    .from("books")
    .update({ title, author, is_syllabus, pages, pdf_link })
    .eq("id", id);

  if (error) return { error: error.message };

  invalidateAfterBookOrCopyMutation();
  revalidatePath("/dashboard/books");
  revalidatePath("/dashboard/copies");
  return {};
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
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const id = formData.get("id") as string;
  if (!id) return { error: "Book ID is required" };

  // Safety: block if any copy is currently borrowed
  const { data: borrowed } = await supabase
    .from("copies")
    .select("id")
    .eq("book_id", id)
    .eq("status", "borrowed")
    .limit(1);

  if (borrowed && borrowed.length > 0) {
    return {
      error: "Cannot delete: one or more copies are currently borrowed",
    };
  }

  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) return { error: error.message };

  invalidateAfterBookOrCopyMutation();
  revalidatePath("/dashboard/books");
  revalidatePath("/dashboard/copies");
  return {};
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
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const book_id = formData.get("book_id") as string;
  if (!book_id) return { error: "Book ID is required" };

  const { data: book } = await supabase
    .from("books")
    .select("short_id")
    .eq("id", book_id)
    .single();

  if (!book) return { error: "Book not found" };

  // Auto-number: max existing copy_number + 1
  const { data: existing } = await supabase
    .from("copies")
    .select("copy_number")
    .eq("book_id", book_id)
    .order("copy_number", { ascending: false })
    .limit(1);

  const copy_number = (existing?.[0]?.copy_number ?? 0) + 1;
  const copy_id = `QR${book.short_id}-${copy_number}`;

  const { error } = await supabase
    .from("copies")
    .insert({ id: copy_id, book_id, copy_number, status: "available" });

  if (error) return { error: error.message };

  invalidateAfterBookOrCopyMutation();
  revalidatePath("/dashboard/copies");
  revalidatePath("/dashboard/books");
  return {};
}

/**
 * Remove a specific physical copy.
 * Blocked if the copy is currently borrowed.
 *
 * FormData fields: copy_id (QR text)
 */
export async function removeCopyOfBook(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const copy_id = formData.get("copy_id") as string;
  if (!copy_id) return { error: "Copy ID is required" };

  const { data: copy } = await supabase
    .from("copies")
    .select("status")
    .eq("id", copy_id)
    .single();

  if (!copy) return { error: "Copy not found" };
  if (copy.status === "borrowed") {
    return { error: "Cannot remove a copy that is currently borrowed" };
  }

  const { error } = await supabase.from("copies").delete().eq("id", copy_id);
  if (error) return { error: error.message };

  invalidateAfterBookOrCopyMutation();
  revalidatePath("/dashboard/copies");
  revalidatePath("/dashboard/books");
  return {};
}
