/**
 * server/library.ts — plain async data-fetching helpers (NO "use server").
 *
 * Called directly from Server Components. Keep mutation-free.
 * All mutations live in server/library-actions.ts and server/transaction-actions.ts.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  Book,
  Copy,
  Transaction,
  PdfSubmission,
  UserStats,
  UserWithStats,
} from "@/types/library";
import type { Profile } from "@/types/profile";

// ─────────────────────────────────────────────────────────────────────────────
// Books
// ─────────────────────────────────────────────────────────────────────────────

/** All books with their copies. */
export async function getBooks(): Promise<Book[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*, copies(id, copy_number, status)")
    .order("title");
  if (error || !data) return [];
  return data as unknown as Book[];
}

/** Single book with all copies. */
export async function getBook(id: string): Promise<Book | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*, copies(id, copy_number, status, book_id, created_at, updated_at)")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as unknown as Book;
}

/** Look up a single copy (with its parent book) by QR code. */
export async function getBookByQR(copyId: string): Promise<Copy | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("copies")
    .select(
      "*, book:books(id, title, author, is_syllabus, pages, pdf_link)",
    )
    .eq("id", copyId)
    .single();
  if (error || !data) return null;
  return data as unknown as Copy;
}

/** Current status of a specific copy. */
export async function bookStatus(copyId: string): Promise<Copy["status"] | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("copies")
    .select("status")
    .eq("id", copyId)
    .single();
  return (data?.status as Copy["status"]) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Copies
// ─────────────────────────────────────────────────────────────────────────────

/** All copies with their parent book info. */
export async function getCopies(): Promise<Copy[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("copies")
    .select(
      "*, book:books(id, title, author, is_syllabus)",
    )
    .order("book_id")
    .order("copy_number");
  if (error || !data) return [];
  return data as unknown as Copy[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Transactions
// ─────────────────────────────────────────────────────────────────────────────

export interface TransactionFilters {
  type?: "borrow" | "return";
  status?: string;
  userId?: string;
}

/** All transactions matching optional filters, newest first. */
export async function getTransactions(
  filters?: TransactionFilters,
): Promise<Transaction[]> {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select(
      `*,
       user:profiles!user_id(id, full_name, username, email, avatar_url),
       copy:copies!copy_id(id, copy_number, status, book_id),
       book:books!book_id(id, title, author, is_syllabus),
       reviewer:profiles!reviewed_by(id, full_name)`,
    )
    .order("request_date", { ascending: false });

  if (filters?.type) query = query.eq("type", filters.type);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.userId) query = query.eq("user_id", filters.userId);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as unknown as Transaction[];
}

/** Transactions for a specific user. */
export async function getUserTransactions(
  userId: string,
): Promise<Transaction[]> {
  return getTransactions({ userId });
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF Submissions
// ─────────────────────────────────────────────────────────────────────────────

export interface PdfFilters {
  userId?: string;
  status?: string;
}

/** All PDF reading submissions, newest first. */
export async function getPdfSubmissions(
  filters?: PdfFilters,
): Promise<PdfSubmission[]> {
  const supabase = await createClient();
  let query = supabase
    .from("pdf_submissions")
    .select(
      `*,
       user:profiles!user_id(id, full_name, username, avatar_url),
       book:books!book_id(id, title, author, is_syllabus),
       reviewer:profiles!reviewed_by(id, full_name)`,
    )
    .order("submitted_at", { ascending: false });

  if (filters?.userId) query = query.eq("user_id", filters.userId);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as unknown as PdfSubmission[];
}

// ─────────────────────────────────────────────────────────────────────────────
// User stats (reading progress, active borrows, etc.)
// ─────────────────────────────────────────────────────────────────────────────

/** Reading progress and active borrow info for one user. */
export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = await createClient();

  const { data: setting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "syllabus_total")
    .single();
  const syllabusTotal = parseInt(setting?.value ?? "80", 10);

  // Active + overdue borrows (what they currently have)
  const { data: activeBorrows } = await supabase
    .from("transactions")
    .select(
      "*, book:books!book_id(id, title, author, is_syllabus), copy:copies!copy_id(id, copy_number)",
    )
    .eq("user_id", userId)
    .eq("type", "borrow")
    .in("status", ["active", "overdue"]);

  // Pending requests (not yet approved)
  const { count: pendingCount } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "pending");

  // Completed physical borrows (to count syllabus progress)
  const { data: completedBorrows } = await supabase
    .from("transactions")
    .select("book_id, book:books!book_id(is_syllabus)")
    .eq("user_id", userId)
    .eq("type", "borrow")
    .eq("status", "completed");

  // Approved PDF submissions
  const { data: approvedPdfs } = await supabase
    .from("pdf_submissions")
    .select("book_id, book:books!book_id(is_syllabus)")
    .eq("user_id", userId)
    .eq("status", "approved");

  // Union: unique syllabus book_ids completed
  const syllabusIds = new Set<string>();
  for (const t of completedBorrows ?? []) {
    if ((t as any).book?.is_syllabus) syllabusIds.add(t.book_id);
  }
  for (const ps of approvedPdfs ?? []) {
    if ((ps as any).book?.is_syllabus) syllabusIds.add(ps.book_id);
  }

  return {
    syllabusCompleted: syllabusIds.size,
    syllabusTotal,
    activeBorrows: activeBorrows?.length ?? 0,
    pendingRequests: pendingCount ?? 0,
    currentBorrows: (activeBorrows ?? []) as unknown as Transaction[],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Users list with computed stats (for the users management page)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All profiles (members, mods, admins) with their reading progress and
 * borrow counts. Uses batch queries to avoid N+1.
 */
export async function getUsers(): Promise<UserWithStats[]> {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, full_name, username, email, avatar_url, rank, role, is_verified, profile_completed, created_at, updated_at, phone, division_id, district_id, upazila_id",
    )
    .order("created_at", { ascending: false });

  if (!profiles || profiles.length === 0) return [];

  const ids = profiles.map((p) => p.id);

  const { data: setting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "syllabus_total")
    .single();
  const syllabusTotal = parseInt(setting?.value ?? "80", 10);

  // Batch: active/overdue borrow counts
  const { data: activeTxns } = await supabase
    .from("transactions")
    .select("user_id")
    .in("user_id", ids)
    .eq("type", "borrow")
    .in("status", ["active", "overdue"]);

  // Batch: pending counts
  const { data: pendingTxns } = await supabase
    .from("transactions")
    .select("user_id")
    .in("user_id", ids)
    .eq("status", "pending");

  // Batch: completed syllabus borrows
  const { data: completedBorrows } = await supabase
    .from("transactions")
    .select("user_id, book_id, book:books!book_id(is_syllabus)")
    .in("user_id", ids)
    .eq("type", "borrow")
    .eq("status", "completed");

  // Batch: approved PDF submissions for syllabus books
  const { data: approvedPdfs } = await supabase
    .from("pdf_submissions")
    .select("user_id, book_id, book:books!book_id(is_syllabus)")
    .in("user_id", ids)
    .eq("status", "approved");

  return profiles.map((profile): UserWithStats => {
    const activeBorrows = (activeTxns ?? []).filter(
      (t) => t.user_id === profile.id,
    ).length;
    const pendingRequests = (pendingTxns ?? []).filter(
      (t) => t.user_id === profile.id,
    ).length;

    const syllabusIds = new Set<string>();
    for (const t of completedBorrows ?? []) {
      if ((t as any).user_id === profile.id && (t as any).book?.is_syllabus) {
        syllabusIds.add(t.book_id);
      }
    }
    for (const ps of approvedPdfs ?? []) {
      if ((ps as any).user_id === profile.id && (ps as any).book?.is_syllabus) {
        syllabusIds.add(ps.book_id);
      }
    }

    return {
      ...(profile as unknown as Profile),
      syllabusCompleted: syllabusIds.size,
      syllabusTotal,
      activeBorrows,
      pendingRequests,
    };
  });
}
