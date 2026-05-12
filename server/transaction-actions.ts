"use server";

/**
 * server/transaction-actions.ts — Server Actions for the borrow/return workflow
 * and PDF self-report management.
 *
 * Borrow flow:
 *   borrowBook()          → transaction(type=borrow, status=pending)
 *   allowBorrowRequest()  → status=active,  copy=borrowed
 *   rejectBorrowRequest() → status=rejected
 *
 * Return flow:
 *   returnBook()            → transaction(type=return, status=pending)
 *   approveReturnRequest()  → both transactions=completed, copy=available
 *   rejectReturnRequest()   → return transaction=rejected
 *
 * PDF reports:
 *   submitPdfReport()  → pdf_submission(status=pending)
 *   approvePdfReport() → status=approved
 *   rejectPdfReport()  → status=rejected
 */

import { createClient } from "@/lib/supabase/server";
import {
  invalidateAfterPdfMutation,
  invalidateAfterTransactionMutation,
} from "@/server/cache-invalidation";
import { getBookByQR } from "@/server/library";
import type { Copy } from "@/types/library";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────────────────────────────────────

async function getCaller() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (!sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", sub)
    .single();

  return { sub, role: (profile?.role ?? "member") as string, supabase };
}

async function requireModOrAdmin() {
  const caller = await getCaller();
  if (!caller) return { error: "Not authenticated" as string };
  if (!["admin", "moderator"].includes(caller.role)) {
    return { error: "Insufficient permissions" as string };
  }
  return caller;
}

// ─────────────────────────────────────────────────────────────────────────────
// Copy lookup (used by the borrow UI to resolve a QR/ID to book info)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Look up a copy by its QR/ID text and return it with nested book data.
 * Called client-side during the borrow flow so we avoid exposing the full
 * copies table — callers only learn what they need for a borrow request.
 */
export async function lookupCopy(
  copyId: string,
): Promise<{ copy: Copy | null; error?: string }> {
  const trimmed = copyId.trim().toUpperCase();
  if (!trimmed) return { copy: null };
  const copy = await getBookByQR(trimmed);
  if (!copy)
    return { copy: null, error: "Copy not found. Check the ID and try again." };
  return { copy };
}

// ─────────────────────────────────────────────────────────────────────────────
// User-facing borrow / return
// ─────────────────────────────────────────────────────────────────────────────

/**
 * User requests to borrow a specific copy.
 *
 * FormData: copy_id (QR text)
 */
export async function borrowBook(
  formData: FormData,
): Promise<{ error?: string }> {
  const caller = await getCaller();
  if (!caller) return { error: "Not authenticated" };

  const { sub, supabase } = caller;
  const copy_id = (formData.get("copy_id") as string)?.trim();
  if (!copy_id) return { error: "Copy ID is required" };

  const { data: copy } = await supabase
    .from("copies")
    .select("id, book_id, status")
    .ilike("id", copy_id)
    .single();

  if (!copy) return { error: "Copy not found" };
  if (copy.status !== "available")
    return { error: "This copy is not available" };

  // Block duplicate requests
  const { data: dup } = await supabase
    .from("transactions")
    .select("id")
    .eq("user_id", sub)
    .ilike("copy_id", copy_id)
    .in("status", ["pending", "active", "overdue"])
    .limit(1);

  if (dup && dup.length > 0) {
    return {
      error: "You already have an active or pending request for this copy",
    };
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: sub,
    copy_id,
    book_id: copy.book_id,
    type: "borrow",
    status: "pending",
    due_date: (formData.get("due_date") as string) || null,
  });

  if (error) return { error: error.message };

  invalidateAfterTransactionMutation();
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/return");
  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/book-list");
  return {};
}

/**
 * User requests to return a copy they have borrowed.
 *
 * FormData: copy_id (QR text)
 */
export async function returnBook(
  formData: FormData,
): Promise<{ error?: string }> {
  const caller = await getCaller();
  if (!caller) return { error: "Not authenticated" };

  const { sub, supabase } = caller;
  const copy_id = (formData.get("copy_id") as string)?.trim();
  if (!copy_id) return { error: "Copy ID is required" };

  // Verify the user has an active borrow for this copy
  const { data: borrow } = await supabase
    .from("transactions")
    .select("id, book_id")
    .eq("user_id", sub)
    .ilike("copy_id", copy_id)
    .eq("type", "borrow")
    .in("status", ["active", "overdue"])
    .limit(1)
    .maybeSingle();

  if (!borrow) return { error: "No active borrow found for this copy" };

  // Block duplicate return requests
  const { data: dupReturn } = await supabase
    .from("transactions")
    .select("id")
    .eq("user_id", sub)
    .ilike("copy_id", copy_id)
    .eq("type", "return")
    .eq("status", "pending")
    .limit(1);

  if (dupReturn && dupReturn.length > 0) {
    return { error: "You already have a pending return request for this copy" };
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: sub,
    copy_id,
    book_id: borrow.book_id,
    type: "return",
    status: "pending",
  });

  if (error) return { error: error.message };

  invalidateAfterTransactionMutation();
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/return");
  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/book-list");
  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Moderator / admin — borrow approval
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Approve a pending borrow request.
 * Sets the transaction to "active" and marks the copy as "borrowed".
 *
 * FormData: transaction_id (UUID), due_date (YYYY-MM-DD, optional)
 */
export async function allowBorrowRequest(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const { sub, supabase } = auth;
  const transaction_id = formData.get("transaction_id") as string;
  const due_date = (formData.get("due_date") as string) || null;

  if (!transaction_id) return { error: "Transaction ID is required" };

  const { data: txn } = await supabase
    .from("transactions")
    .select("id, copy_id, type, status")
    .eq("id", transaction_id)
    .single();

  if (!txn) return { error: "Transaction not found" };
  if (txn.type !== "borrow") return { error: "Not a borrow request" };
  if (txn.status !== "pending") return { error: "Transaction is not pending" };

  // Double-check copy availability at the moment of approval
  const { data: currentCopy, error: copyCheckErr } = await supabase
    .from("copies")
    .select("status")
    .eq("id", txn.copy_id)
    .single();

  if (copyCheckErr || !currentCopy) {
    return { error: "Could not verify copy status" };
  }

  if (currentCopy.status !== "available") {
    return {
      error: `This copy is no longer available (current status: ${currentCopy.status}).`,
    };
  }

  const { error: txnErr } = await supabase
    .from("transactions")
    .update({
      status: "active",
      approved_date: new Date().toISOString(),
      due_date,
      reviewed_by: sub,
    })
    .eq("id", transaction_id);

  if (txnErr) return { error: txnErr.message };

  const { error: copyErr } = await supabase
    .from("copies")
    .update({ status: "borrowed" })
    .eq("id", txn.copy_id);

  if (copyErr)
    return { error: `Approved but copy update failed: ${copyErr.message}` };

  invalidateAfterTransactionMutation();
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/book-list");
  revalidatePath("/dashboard/return");
  revalidatePath("/dashboard/history");
  return {};
}

/**
 * Reject a pending borrow request.
 *
 * FormData: transaction_id (UUID), rejection_reason (optional)
 */
export async function rejectBorrowRequest(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const { sub, supabase } = auth;
  const transaction_id = formData.get("transaction_id") as string;
  const rejection_reason = (formData.get("rejection_reason") as string) || null;

  const { data: txn } = await supabase
    .from("transactions")
    .select("id, type, status")
    .eq("id", transaction_id)
    .single();

  if (!txn) return { error: "Transaction not found" };
  if (txn.type !== "borrow") return { error: "Not a borrow request" };
  if (txn.status !== "pending") return { error: "Transaction is not pending" };

  const { error } = await supabase
    .from("transactions")
    .update({ status: "rejected", rejection_reason, reviewed_by: sub })
    .eq("id", transaction_id);

  if (error) return { error: error.message };

  invalidateAfterTransactionMutation();
  revalidatePath("/dashboard/transactions");
  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Moderator / admin — return approval
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Approve a pending return request.
 * Marks the return transaction as "completed", resolves the original borrow
 * transaction, and frees the copy back to "available".
 *
 * FormData: transaction_id (UUID)
 */
export async function approveReturnRequest(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const { sub, supabase } = auth;
  const transaction_id = formData.get("transaction_id") as string;
  if (!transaction_id) return { error: "Transaction ID is required" };

  const { data: txn } = await supabase
    .from("transactions")
    .select("id, copy_id, user_id, book_id, type, status")
    .eq("id", transaction_id)
    .single();

  if (!txn) return { error: "Transaction not found" };
  if (txn.type !== "return") return { error: "Not a return request" };
  if (txn.status !== "pending") return { error: "Transaction is not pending" };

  const now = new Date().toISOString();

  // Complete the return transaction
  const { error: returnErr } = await supabase
    .from("transactions")
    .update({
      status: "completed",
      approved_date: now,
      return_date: now,
      reviewed_by: sub,
    })
    .eq("id", transaction_id);

  if (returnErr) return { error: returnErr.message };

  // Complete the original borrow transaction (active/overdue → completed)
  const { error: borrowErr } = await supabase
    .from("transactions")
    .update({ status: "completed", return_date: now })
    .eq("user_id", txn.user_id)
    .eq("copy_id", txn.copy_id)
    .eq("type", "borrow")
    .in("status", ["active", "overdue"]);

  if (borrowErr) {
    // Non-fatal: the return is already recorded; log and continue.
    console.error(
      "[approveReturnRequest] borrow update failed:",
      borrowErr.message,
    );
  }

  // Free the copy
  const { error: copyErr } = await supabase
    .from("copies")
    .update({ status: "available" })
    .eq("id", txn.copy_id);

  if (copyErr)
    return {
      error: `Return approved but copy update failed: ${copyErr.message}`,
    };

  invalidateAfterTransactionMutation();
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/return");
  revalidatePath("/dashboard/book-list");
  revalidatePath("/dashboard/history");
  return {};
}

/**
 * Reject a pending return request (e.g. book not in acceptable condition).
 *
 * FormData: transaction_id (UUID), rejection_reason (optional)
 */
export async function rejectReturnRequest(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const { sub, supabase } = auth;
  const transaction_id = formData.get("transaction_id") as string;
  const rejection_reason = (formData.get("rejection_reason") as string) || null;

  const { data: txn } = await supabase
    .from("transactions")
    .select("id, type, status")
    .eq("id", transaction_id)
    .single();

  if (!txn) return { error: "Transaction not found" };
  if (txn.type !== "return") return { error: "Not a return request" };
  if (txn.status !== "pending") return { error: "Transaction is not pending" };

  const { error } = await supabase
    .from("transactions")
    .update({ status: "rejected", rejection_reason, reviewed_by: sub })
    .eq("id", transaction_id);

  if (error) return { error: error.message };

  invalidateAfterTransactionMutation();
  revalidatePath("/dashboard/transactions");
  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF reading self-reports
// ─────────────────────────────────────────────────────────────────────────────

/**
 * User submits a PDF reading report for a book they read digitally.
 *
 * FormData: book_id (UUID), read_date (YYYY-MM-DD, optional), note (optional)
 */
export async function submitPdfReport(
  formData: FormData,
): Promise<{ error?: string }> {
  const caller = await getCaller();
  if (!caller) return { error: "Not authenticated" };

  const { sub, supabase } = caller;
  const book_id = formData.get("book_id") as string;
  const read_date = (formData.get("read_date") as string) || null;
  const note = (formData.get("note") as string)?.trim() || null;

  if (!book_id) return { error: "Book ID is required" };

  // Block duplicate pending/approved submissions for the same book
  const { data: dup } = await supabase
    .from("pdf_submissions")
    .select("id")
    .eq("user_id", sub)
    .eq("book_id", book_id)
    .in("status", ["pending", "approved"])
    .limit(1);

  if (dup && dup.length > 0) {
    return {
      error: "You already have a pending or approved report for this book",
    };
  }

  const { error } = await supabase.from("pdf_submissions").insert({
    user_id: sub,
    book_id,
    read_date,
    note,
    status: "pending",
  });

  if (error) return { error: error.message };

  invalidateAfterPdfMutation();
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/book-list");
  return {};
}

/**
 * Approve a PDF reading report.
 *
 * FormData: submission_id (UUID)
 */
export async function approvePdfReport(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const { sub, supabase } = auth;
  const submission_id = formData.get("submission_id") as string;
  if (!submission_id) return { error: "Submission ID is required" };

  const { error } = await supabase
    .from("pdf_submissions")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: sub,
    })
    .eq("id", submission_id)
    .eq("status", "pending");

  if (error) return { error: error.message };

  invalidateAfterPdfMutation();
  revalidatePath("/dashboard/transactions");
  return {};
}

/**
 * Reject a PDF reading report with a reason.
 *
 * FormData: submission_id (UUID), rejection_reason (optional)
 */
export async function rejectPdfReport(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const { sub, supabase } = auth;
  const submission_id = formData.get("submission_id") as string;
  const rejection_reason = (formData.get("rejection_reason") as string) || null;
  if (!submission_id) return { error: "Submission ID is required" };

  const { error } = await supabase
    .from("pdf_submissions")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: sub,
      rejection_reason,
    })
    .eq("id", submission_id)
    .eq("status", "pending");

  if (error) return { error: error.message };

  invalidateAfterPdfMutation();
  revalidatePath("/dashboard/transactions");
  return {};
}
