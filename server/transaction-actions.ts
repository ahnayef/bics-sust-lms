"use server";

/**
 * server/transaction-actions.ts — Server Actions for the borrow/return workflow
 * and PDF self-report management.
 */

import { COPY_STATUS, TRANSACTION_STATUS, USER_ROLES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import {
  invalidateAfterPdfMutation,
  invalidateAfterTransactionMutation,
} from "@/server/cache-invalidation";
import {
  createPdfSubmission,
  createTransaction,
  getCopyById,
  getDuplicatePdfSubmission,
  getDuplicateTransaction,
  getProfileById,
  getTransactionById,
  updateBorrowStatus,
  updateCopy,
  updatePdfSubmission,
  updateTransaction,
} from "@/server/db-access";
import { logActionError } from "@/server/error-log";
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

  const profile = await getProfileById(sub);
  return { sub, role: (profile?.role ?? USER_ROLES.MEMBER) as string, supabase };
}

async function requireModOrAdmin() {
  const caller = await getCaller();
  if (!caller) return { error: "Not authenticated" as string };
  if (![USER_ROLES.ADMIN, USER_ROLES.MODERATOR].includes(caller.role as any)) {
    return { error: "Insufficient permissions" as string };
  }
  return caller;
}

// ─────────────────────────────────────────────────────────────────────────────
// Copy lookup
// ─────────────────────────────────────────────────────────────────────────────

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

export async function borrowBook(
  formData: FormData,
): Promise<{ error?: string }> {
  const caller = await getCaller();
  if (!caller) return { error: "Not authenticated" };

  const { sub } = caller;
  const copy_id = (formData.get("copy_id") as string)?.trim();
  if (!copy_id) return { error: "Copy ID is required" };

  const copy = await getCopyById(copy_id);
  if (!copy) return { error: "Copy not found" };
  if (copy.status !== COPY_STATUS.AVAILABLE)
    return { error: "This copy is not available" };

  const dup = await getDuplicateTransaction(sub, copy_id, [
    TRANSACTION_STATUS.PENDING,
    TRANSACTION_STATUS.ACTIVE,
    TRANSACTION_STATUS.OVERDUE,
  ]);

  if (dup) {
    return {
      error: "You already have an active or pending request for this copy",
    };
  }

  try {
    await createTransaction({
      user_id: sub,
      copy_id: copy_id,
      book_id: copy.book_id,
      type: "borrow",
      status: TRANSACTION_STATUS.PENDING,
      due_date: (formData.get("due_date") as string) || null,
    });
  } catch (error: any) {
    logActionError("borrowBook", error.message, sub, { copy_id, book_id: copy.book_id });
    return { error: error.message };
  }

  invalidateAfterTransactionMutation();
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/return");
  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/book-list");
  return {};
}

export async function returnBook(
  formData: FormData,
): Promise<{ error?: string }> {
  const caller = await getCaller();
  if (!caller) return { error: "Not authenticated" };

  const { sub } = caller;
  const copy_id = (formData.get("copy_id") as string)?.trim();
  if (!copy_id) return { error: "Copy ID is required" };

  const borrow = await getDuplicateTransaction(sub, copy_id, [
    TRANSACTION_STATUS.ACTIVE,
    TRANSACTION_STATUS.OVERDUE,
  ]);

  if (!borrow) return { error: "No active borrow found for this copy" };

  const dupReturn = await getDuplicateTransaction(sub, copy_id, [
    TRANSACTION_STATUS.PENDING,
  ]);

  if (dupReturn && dupReturn.type === "return") {
    return { error: "You already have a pending return request for this copy" };
  }

  try {
    await createTransaction({
      user_id: sub,
      copy_id: copy_id,
      book_id: borrow.book_id,
      type: "return",
      status: TRANSACTION_STATUS.PENDING,
    });
  } catch (error: any) {
    logActionError("returnBook", error.message, sub, { copy_id, book_id: borrow.book_id });
    return { error: error.message };
  }

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

export async function allowBorrowRequest(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const { sub } = auth;
  const transaction_id = formData.get("transaction_id") as string;
  const due_date = (formData.get("due_date") as string) || null;

  if (!transaction_id) return { error: "Transaction ID is required" };

  const txn = await getTransactionById(transaction_id);

  if (!txn) return { error: "Transaction not found" };
  if (txn.type !== "borrow") return { error: "Not a borrow request" };
  if (txn.status !== TRANSACTION_STATUS.PENDING) return { error: "Transaction is not pending" };

  const currentCopy = await getCopyById(txn.copy_id);

  if (!currentCopy) {
    return { error: "Could not verify copy status" };
  }

  if (currentCopy.status !== COPY_STATUS.AVAILABLE) {
    return {
      error: `This copy is no longer available (current status: ${currentCopy.status}).`,
    };
  }

  try {
    await updateTransaction(transaction_id, {
      status: TRANSACTION_STATUS.ACTIVE,
      approved_date: new Date(),
      due_date: due_date,
      reviewed_by: sub,
    });

    await updateCopy(txn.copy_id, { status: COPY_STATUS.BORROWED });
  } catch (error: any) {
    logActionError("allowBorrowRequest", error.message, sub, { transaction_id, due_date });
    return { error: error.message };
  }

  invalidateAfterTransactionMutation();
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/book-list");
  revalidatePath("/dashboard/return");
  revalidatePath("/dashboard/history");
  return {};
}

export async function rejectBorrowRequest(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const { sub } = auth;
  const transaction_id = formData.get("transaction_id") as string;
  const rejection_reason = (formData.get("rejection_reason") as string) || null;

  const txn = await getTransactionById(transaction_id);

  if (!txn) return { error: "Transaction not found" };
  if (txn.type !== "borrow") return { error: "Not a borrow request" };
  if (txn.status !== TRANSACTION_STATUS.PENDING) return { error: "Transaction is not pending" };

  try {
    await updateTransaction(transaction_id, {
      status: TRANSACTION_STATUS.REJECTED,
      rejection_reason: rejection_reason,
      reviewed_by: sub,
    });
  } catch (error: any) {
    logActionError("rejectBorrowRequest", error.message, sub, { transaction_id });
    return { error: error.message };
  }

  invalidateAfterTransactionMutation();
  revalidatePath("/dashboard/transactions");
  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Moderator / admin — return approval
// ─────────────────────────────────────────────────────────────────────────────

export async function approveReturnRequest(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const { sub } = auth;
  const transaction_id = formData.get("transaction_id") as string;
  if (!transaction_id) return { error: "Transaction ID is required" };

  const txn = await getTransactionById(transaction_id);

  if (!txn) return { error: "Transaction not found" };
  if (txn.type !== "return") return { error: "Not a return request" };
  if (txn.status !== TRANSACTION_STATUS.PENDING) return { error: "Transaction is not pending" };

  const now = new Date();

  try {
    await updateTransaction(transaction_id, {
      status: TRANSACTION_STATUS.COMPLETED,
      approved_date: now,
      return_date: now,
      reviewed_by: sub,
    });

    await updateBorrowStatus(txn.user_id, txn.copy_id, TRANSACTION_STATUS.COMPLETED, now);
    await updateCopy(txn.copy_id, { status: COPY_STATUS.AVAILABLE });
  } catch (error: any) {
    logActionError("approveReturnRequest", error.message, sub, { transaction_id });
    return { error: error.message };
  }

  invalidateAfterTransactionMutation();
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/return");
  revalidatePath("/dashboard/book-list");
  revalidatePath("/dashboard/history");
  return {};
}

export async function rejectReturnRequest(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const { sub } = auth;
  const transaction_id = formData.get("transaction_id") as string;
  const rejection_reason = (formData.get("rejection_reason") as string) || null;

  const txn = await getTransactionById(transaction_id);

  if (!txn) return { error: "Transaction not found" };
  if (txn.type !== "return") return { error: "Not a return request" };
  if (txn.status !== TRANSACTION_STATUS.PENDING) return { error: "Transaction is not pending" };

  try {
    await updateTransaction(transaction_id, {
      status: TRANSACTION_STATUS.REJECTED,
      rejection_reason: rejection_reason,
      reviewed_by: sub,
    });
  } catch (error: any) {
    logActionError("rejectReturnRequest", error.message, sub, { transaction_id });
    return { error: error.message };
  }

  invalidateAfterTransactionMutation();
  revalidatePath("/dashboard/transactions");
  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF reading self-reports
// ─────────────────────────────────────────────────────────────────────────────

export async function submitPdfReport(
  formData: FormData,
): Promise<{ error?: string }> {
  const caller = await getCaller();
  if (!caller) return { error: "Not authenticated" };

  const { sub } = caller;
  const book_id = formData.get("book_id") as string;
  const read_date = (formData.get("read_date") as string) || null;
  const note = (formData.get("note") as string)?.trim() || null;

  if (!book_id) return { error: "Book ID is required" };

  const dup = await getDuplicatePdfSubmission(sub, book_id);

  if (dup) {
    return {
      error: "You already have a pending or approved report for this book",
    };
  }

  try {
    await createPdfSubmission({
      user_id: sub,
      book_id: book_id,
      read_date: read_date,
      note,
      status: TRANSACTION_STATUS.PENDING,
    });
  } catch (error: any) {
    logActionError("submitPdfReport", error.message, sub, { book_id });
    return { error: error.message };
  }

  invalidateAfterPdfMutation();
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/book-list");
  return {};
}

export async function approvePdfReport(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const { sub } = auth;
  const submission_id = formData.get("submission_id") as string;
  if (!submission_id) return { error: "Submission ID is required" };

  try {
    await updatePdfSubmission(submission_id, {
      status: "approved",
      reviewed_at: new Date(),
      reviewed_by: sub,
    });
  } catch (error: any) {
    logActionError("approvePdfReport", error.message, sub, { submission_id });
    return { error: error.message };
  }

  invalidateAfterPdfMutation();
  revalidatePath("/dashboard/transactions");
  return {};
}

export async function rejectPdfReport(
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireModOrAdmin();
  if ("error" in auth) return auth;

  const { sub } = auth;
  const submission_id = formData.get("submission_id") as string;
  const rejection_reason = (formData.get("rejection_reason") as string) || null;
  if (!submission_id) return { error: "Submission ID is required" };

  try {
    await updatePdfSubmission(submission_id, {
      status: "rejected",
      reviewed_at: new Date(),
      reviewed_by: sub,
      rejection_reason: rejection_reason,
    });
  } catch (error: any) {
    logActionError("rejectPdfReport", error.message, sub, { submission_id });
    return { error: error.message };
  }

  invalidateAfterPdfMutation();
  revalidatePath("/dashboard/transactions");
  return {};
}
