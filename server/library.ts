/**
 * server/library.ts — plain async data-fetching helpers (NO "use server").
 *
 * Called directly from Server Components. Keep mutation-free.
 * All mutations live in server/library-actions.ts and server/transaction-actions.ts.
 */

import { applyCacheLife } from "@/lib/cache";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  getBookWithCopies,
  getCopyByQR,
  getCopyStatus,
} from "@/server/db-access";
import { logActionError } from "@/server/error-log";
import type {
  Book,
  Copy,
  OverviewData,
  PdfSubmission,
  PopularBook,
  TopMember,
  Transaction,
  UserStats,
  UserWithStats,
} from "@/types/library";
import type { Profile } from "@/types/profile";
import { asc } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { cookies } from "next/headers";

// ─────────────────────────────────────────────────────────────────────────────
// Books
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All books with their copies — cached across requests and invalidated on writes
 * via `updateTag("books")` (see server/cache-invalidation.ts).
 *
 * Uses the service role client inside `'use cache'` (no cookie context).
 */
async function loadBooksCached(): Promise<Book[]> {
  "use cache";
  cacheTag("books");
  applyCacheLife("max");

  const data = await db.query.books.findMany({
    with: {
      copies: {
        columns: {
          id: true,
          copy_number: true,
          status: true,
        },
      },
    },
    orderBy: [asc(schema.books.title)],
  });

  return data as unknown as Book[];
}

export async function getBooks(): Promise<Book[]> {
  return loadBooksCached();
}

/** Single book with all copies. */
export async function getBook(id: string): Promise<Book | null> {
  const data = await getBookWithCopies(id);
  if (!data) return null;
  return data as unknown as Book;
}

/** Look up a single copy (with its parent book) by QR code. */
export async function getBookByQR(copyId: string): Promise<Copy | null> {
  const data = await getCopyByQR(copyId);
  if (!data) return null;
  return data as unknown as Copy;
}

/** Current status of a specific copy. */
export async function bookStatus(
  copyId: string,
): Promise<Copy["status"] | null> {
  const status = await getCopyStatus(copyId);
  return (status as Copy["status"]) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Copies
// ─────────────────────────────────────────────────────────────────────────────

async function loadCopiesCached(): Promise<Copy[]> {
  "use cache";
  cacheTag("copies");
  applyCacheLife("max");

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("copies")
    .select(`
      *,
      book:books(id, title, author, is_syllabus),
      active_borrow:transactions(
        user:profiles!user_id(id, full_name)
      )
    `)
    .eq("active_borrow.type", "borrow")
    .in("active_borrow.status", ["active", "overdue"])
    .order("book_id")
    .order("copy_number");

  if (error || !data) {
    if (error) logActionError("loadCopiesCached", error.message);
    return [];
  }

  // Flatten the join: take the first active borrower if it exists
  return data.map((row: any) => {
    const { active_borrow, ...copy } = row;
    const borrower =
      active_borrow && active_borrow.length > 0
        ? active_borrow[0].user
        : null;
    return { ...copy, borrower };
  }) as unknown as Copy[];
}

/** All copies with their parent book info. */
export async function getCopies(): Promise<Copy[]> {
  return loadCopiesCached();
}

// ─────────────────────────────────────────────────────────────────────────────
// Transactions
// ─────────────────────────────────────────────────────────────────────────────

export interface TransactionFilters {
  type?: "borrow" | "return";
  status?: string;
  userId?: string;
}

async function loadTransactionsCached(
  filters: TransactionFilters,
): Promise<Transaction[]> {
  "use cache";
  cacheTag("transactions");
  applyCacheLife("max");

  const supabase = createServiceClient();
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

  if (filters.type) query = query.eq("type", filters.type);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.userId) query = query.eq("user_id", filters.userId);

  const { data, error } = await query;
  if (error || !data) {
    if (error) logActionError("loadTransactionsCached", error.message, null, { filters });
    return [];
  }
  return data as unknown as Transaction[];
}

/** All transactions matching optional filters, newest first. */
export async function getTransactions(
  filters?: TransactionFilters,
): Promise<Transaction[]> {
  return loadTransactionsCached(filters ?? {});
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

async function loadPdfSubmissionsCached(
  filters: PdfFilters,
): Promise<PdfSubmission[]> {
  "use cache";
  cacheTag("pdf-submissions");
  applyCacheLife("max");

  const supabase = createServiceClient();
  let query = supabase
    .from("pdf_submissions")
    .select(
      `*,
       user:profiles!user_id(id, full_name, username, avatar_url),
       book:books!book_id(id, title, author, is_syllabus),
       reviewer:profiles!reviewed_by(id, full_name)`,
    )
    .order("submitted_at", { ascending: false });

  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error || !data) return [];
  return data as unknown as PdfSubmission[];
}

/** All PDF reading submissions, newest first. */
export async function getPdfSubmissions(
  filters?: PdfFilters,
): Promise<PdfSubmission[]> {
  return loadPdfSubmissionsCached(filters ?? {});
}

// ─────────────────────────────────────────────────────────────────────────────
// User stats (reading progress, active borrows, etc.)
// ─────────────────────────────────────────────────────────────────────────────

/** Reading progress and active borrow info for one user. */
export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = await createClient();

  const { count: syllabusTotal } = await supabase
    .from("books")
    .select("id", { count: "exact", head: true })
    .eq("is_syllabus", true);

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
    if ((t as { book?: { is_syllabus?: boolean } }).book?.is_syllabus)
      syllabusIds.add(t.book_id);
  }
  for (const ps of approvedPdfs ?? []) {
    if ((ps as { book?: { is_syllabus?: boolean } }).book?.is_syllabus)
      syllabusIds.add(ps.book_id);
  }

  const now = new Date();
  return {
    syllabusCompleted: syllabusIds.size,
    syllabusTotal: syllabusTotal ?? 0,
    activeBorrows: activeBorrows?.length ?? 0,
    overdueBorrows: (activeBorrows ?? []).filter((t) => {
      const tx = t as unknown as Transaction;
      return tx.status === "overdue" || (tx.due_date && new Date(tx.due_date) < now);
    }).length,
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
async function loadUsersCached(): Promise<UserWithStats[]> {
  "use cache";
  cacheTag("users");
  applyCacheLife("max");

  const supabase = createServiceClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, full_name, username, email, avatar_url, role, is_verified, profile_completed, created_at, updated_at, phone, thana_id, rank_id",
    )
    .order("created_at", { ascending: false });

  if (!profiles || profiles.length === 0) return [];

  // Fetch all ranks to map rank_id
  const { data: ranks } = await supabase.from("ranks").select("id, name");
  const rankById = new Map<string, { id: string; name: string }>();
  for (const r of ranks ?? []) {
    rankById.set(r.id, r);
  }

  const thanaIds = [
    ...new Set(
      profiles
        .map((p) => (p as { thana_id?: string | null }).thana_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const thanaById = new Map<string, { id: string; name: string }>();
  if (thanaIds.length > 0) {
    const { data: thanaRows } = await supabase
      .from("thanas")
      .select("id, name")
      .in("id", thanaIds);
    for (const t of thanaRows ?? []) {
      thanaById.set(t.id, t);
    }
  }

  const ids = profiles.map((p) => p.id);

  const { count: syllabusTotal } = await supabase
    .from("books")
    .select("id", { count: "exact", head: true })
    .eq("is_syllabus", true);

  // Batch: active/overdue borrow counts
  const { data: activeTxns } = await supabase
    .from("transactions")
    .select("user_id, status, due_date")
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

  const now = new Date();
  return profiles.map((profile): UserWithStats => {
    const userActiveTxns = (activeTxns ?? []).filter(
      (t) => t.user_id === profile.id,
    );
    const activeBorrows = userActiveTxns.length;
    const overdueBorrows = userActiveTxns.filter(
      (t) => t.status === "overdue" || (t.due_date && new Date(t.due_date) < now),
    ).length;
    const pendingRequests = (pendingTxns ?? []).filter(
      (t) => t.user_id === profile.id,
    ).length;

    const syllabusIds = new Set<string>();
    for (const t of completedBorrows ?? []) {
      const row = t as {
        user_id: string;
        book_id: string;
        book?: { is_syllabus?: boolean };
      };
      if (row.user_id === profile.id && row.book?.is_syllabus) {
        syllabusIds.add(row.book_id);
      }
    }
    for (const ps of approvedPdfs ?? []) {
      const row = ps as {
        user_id: string;
        book_id: string;
        book?: { is_syllabus?: boolean };
      };
      if (row.user_id === profile.id && row.book?.is_syllabus) {
        syllabusIds.add(row.book_id);
      }
    }

    return {
      ...(profile as unknown as Profile),
      thana: profile.thana_id
        ? thanaById.get(profile.thana_id as string)
        : undefined,
      rank: (profile as any).rank_id
        ? rankById.get((profile as any).rank_id as string)
        : undefined,
      syllabusCompleted: syllabusIds.size,
      syllabusTotal: syllabusTotal ?? 0,
      activeBorrows,
      overdueBorrows,
      pendingRequests,
    };
  });
}

export async function getUsers(): Promise<UserWithStats[]> {
  return loadUsersCached();
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Overview
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches everything the overview dashboard needs in parallel:
 * stats, overdue items, pending queues, recent activity,
 * top borrowers, and most-borrowed books.
 *
 * `firstOfMonth` is part of the cache key so the "completed this month" query
 * stays correct across month boundaries. `mark_overdue_transactions` runs on
 * cache refresh (miss / after invalidation), not on every cache hit.
 */
async function loadOverviewDataCached(
  firstOfMonth: string,
): Promise<OverviewData> {
  "use cache";
  cacheTag("overview");
  applyCacheLife("minutes");

  const supabase = createServiceClient();

  await supabase.rpc("mark_overdue_transactions");

  const [
    { data: books },
    { data: copies },
    { data: members },
    { data: openTransactions },
    { data: recentActivity },
    { data: borrowHistory },
    { data: pendingPdfs },
    { count: completedThisMonth },
  ] = await Promise.all([
    supabase.from("books").select("id, is_syllabus"),

    supabase.from("copies").select("id, status"),

    supabase.from("profiles").select("id, is_verified").eq("role", "member"),

    // All open work in one query — partitioned client-side
    supabase
      .from("transactions")
      .select(
        `id, type, status, request_date, due_date,
         user:profiles!user_id(id, full_name, username, avatar_url),
         book:books!book_id(id, title, author, is_syllabus),
         copy:copies!copy_id(id, copy_number)`,
      )
      .in("status", ["active", "overdue", "pending"])
      .order("due_date", { ascending: true }),

    // Latest 15 transactions for the activity feed
    supabase
      .from("transactions")
      .select(
        `id, type, status, request_date, due_date,
         user:profiles!user_id(id, full_name, username, avatar_url),
         book:books!book_id(id, title, author),
         copy:copies!copy_id(id, copy_number)`,
      )
      .order("request_date", { ascending: false })
      .limit(15),

    // Recent borrow records for top-member and popular-book aggregation.
    // 300 rows is more than enough to surface the real top-5 in any
    // reasonably-sized library; fetching the whole table would be wasteful.
    supabase
      .from("transactions")
      .select(
        "user_id, book_id, user:profiles!user_id(id, full_name, username, avatar_url), book:books!book_id(id, title, author, is_syllabus)",
      )
      .eq("type", "borrow")
      .in("status", ["active", "completed", "overdue"])
      .order("request_date", { ascending: false })
      .limit(300),

    // Pending PDF submissions
    supabase
      .from("pdf_submissions")
      .select(
        `id, submitted_at,
         user:profiles!user_id(id, full_name, username, avatar_url),
         book:books!book_id(id, title, author, is_syllabus)`,
      )
      .eq("status", "pending")
      .order("submitted_at", { ascending: true })
      .limit(10),

    // Completed this calendar month — count only
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("updated_at", firstOfMonth),
  ]);

  // Partition open transactions
  const allOpen = openTransactions ?? [];
  const now = new Date();
  const overdueItems = allOpen.filter(
    (t) =>
      t.type === "borrow" &&
      (t.status === "overdue" ||
        (t.status === "active" && t.due_date && new Date(t.due_date) < now)),
  );
  const pendingBorrows = allOpen.filter(
    (t) => t.type === "borrow" && t.status === "pending",
  );
  const pendingReturns = allOpen.filter(
    (t) => t.type === "return" && t.status === "pending",
  );
  const activeBorrows = allOpen.filter(
    (t) =>
      t.status === "active" ||
      t.status === "overdue" ||
      (t.status === "active" && t.due_date && new Date(t.due_date) < now),
  );

  // Aggregate top borrowers
  const memberMap = new Map<
    string,
    { meta: NonNullable<Transaction["user"]>; count: number }
  >();
  for (const tx of borrowHistory ?? []) {
    const user = (tx as unknown as Transaction).user;
    if (!user) continue;
    const entry = memberMap.get(tx.user_id) ?? { meta: user, count: 0 };
    entry.count++;
    memberMap.set(tx.user_id, entry);
  }
  const topMembers: TopMember[] = [...memberMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ meta, count }) => ({
      id: meta.id,
      full_name: meta.full_name,
      username: meta.username,
      avatar_url: meta.avatar_url,
      totalBorrows: count,
    }));

  // Aggregate most-borrowed books
  const bookMap = new Map<
    string,
    { meta: NonNullable<Transaction["book"]>; count: number }
  >();
  for (const tx of borrowHistory ?? []) {
    const book = (tx as unknown as Transaction).book;
    if (!book) continue;
    const entry = bookMap.get(tx.book_id) ?? { meta: book, count: 0 };
    entry.count++;
    bookMap.set(tx.book_id, entry);
  }
  const popularBooks: PopularBook[] = [...bookMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ meta, count }) => ({
      id: meta.id,
      title: meta.title,
      author: meta.author,
      is_syllabus: meta.is_syllabus,
      totalBorrows: count,
    }));

  const booksArr = books ?? [];
  const copiesArr = copies ?? [];
  const membersArr = members ?? [];

  return {
    stats: {
      totalBooks: booksArr.length,
      syllabusBooks: booksArr.filter((b) => b.is_syllabus).length,
      generalBooks: booksArr.filter((b) => !b.is_syllabus).length,
      totalCopies: copiesArr.length,
      availableCopies: copiesArr.filter((c) => c.status === "available").length,
      borrowedCopies: copiesArr.filter((c) => c.status === "borrowed").length,
      damagedCopies: copiesArr.filter((c) => c.status === "damaged").length,
      totalMembers: membersArr.length,
      verifiedMembers: membersArr.filter((m) => m.is_verified).length,
      unverifiedMembers: membersArr.filter((m) => !m.is_verified).length,
      activeBorrows: activeBorrows.length,
      overdueCount: overdueItems.length,
      pendingBorrowRequests: pendingBorrows.length,
      pendingReturnRequests: pendingReturns.length,
      pendingPdfSubmissions: (pendingPdfs ?? []).length,
      completedThisMonth: completedThisMonth ?? 0,
    },
    overdueItems: overdueItems as unknown as Transaction[],
    pendingBorrows: pendingBorrows as unknown as Transaction[],
    pendingReturns: pendingReturns as unknown as Transaction[],
    recentActivity: (recentActivity ?? []) as unknown as Transaction[],
    topMembers,
    popularBooks,
    pendingPdfs: (pendingPdfs ?? []) as unknown as PdfSubmission[],
  };
}

export async function getOverviewData(): Promise<OverviewData> {
  await cookies();
  const firstOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  ).toISOString();
  return loadOverviewDataCached(firstOfMonth);
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifications & Admin Logs
// ─────────────────────────────────────────────────────────────────────────────

import type { ActionLog, NotificationItem } from "@/types/library";

export async function getUserNotifications(userId: string): Promise<NotificationItem[]> {
  const supabase = await createClient();

  const [
    { data: txs },
    { data: pdfs },
    { data: logs }
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, status, type, updated_at, request_date, rejection_reason, book:books(title)")
      .eq("user_id", userId)
      .in("status", ["active", "completed", "rejected", "overdue"]),

    supabase
      .from("pdf_submissions")
      .select("id, status, submitted_at, updated_at, rejection_reason, book:books(title)")
      .eq("user_id", userId)
      .in("status", ["approved", "rejected"]),

    supabase
      .from("action_logs")
      .select("id, action_type, created_at, details")
      .eq("target_id", userId)
      .neq("action_type", "error")
  ]);

  const items: NotificationItem[] = [];

  for (const tx of txs ?? []) {
    const bookTitle = (tx as any).book?.title ?? "a book";
    let type: NotificationItem["type"] | null = null;
    let title = "";
    let message = "";

    if (tx.status === "active") {
      type = "transaction_approved";
      title = "Borrow Request Approved";
      message = `Your request to borrow "${bookTitle}" has been approved.`;
    } else if (tx.status === "rejected") {
      type = "transaction_rejected";
      title = "Borrow Request Rejected";
      message = `Your request to borrow "${bookTitle}" was rejected.`;
    } else if (tx.status === "completed" && tx.type === "return") {
      type = "transaction_completed";
      title = "Return Completed";
      message = `Your return for "${bookTitle}" has been processed.`;
    } else if (tx.status === "overdue") {
      type = "transaction_overdue";
      title = "Book Overdue";
      message = `Your borrow for "${bookTitle}" is overdue.`;
    }

    if (type) {
      items.push({
        id: tx.id,
        date: tx.updated_at ?? tx.request_date,
        type,
        title,
        message,
        reason: tx.rejection_reason,
        link: `/dashboard/history`,
      });
    }
  }

  for (const pdf of pdfs ?? []) {
    const bookTitle = (pdf as any).book?.title ?? "a book";
    items.push({
      id: pdf.id,
      date: pdf.updated_at ?? pdf.submitted_at,
      type: pdf.status === "approved" ? "pdf_approved" : "pdf_rejected",
      title: pdf.status === "approved" ? "PDF Reading Approved" : "PDF Reading Rejected",
      message: `Your reading submission for "${bookTitle}" was ${pdf.status}.`,
      reason: pdf.rejection_reason,
      link: `/dashboard/transactions?tab=pdf`,
    });
  }

  for (const log of logs ?? []) {
    let title = "";
    let message = log.details ?? "Action taken on your account.";
    let type: NotificationItem["type"] = "user_joined";

    if (log.action_type === "user_verified") {
      type = "user_verified";
      title = "Account Verified";
      message = `Your account has been verified.`;
    } else if (log.action_type === "user_unverified") {
      type = "user_unverified";
      title = "Verification Revoked";
      message = `Your account verification has been revoked.`;
    } else if (log.action_type === "role_changed") {
      type = "role_changed";
      title = "Role Updated";
    } else if (log.action_type === "thana_deleted") {
      type = "thana_deleted";
      title = "Thana Removed";
      message = log.details ?? "Your thana has been removed. Please update your profile.";
    }

    if (log.action_type !== "user_joined") {
      items.push({
        id: log.id,
        date: log.created_at,
        type,
        title,
        message,
        reason: log.details,
      });
    }
  }

  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getAdminLogs(days: number = 30): Promise<ActionLog[]> {
  const supabase = await createClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data, error } = await supabase
    .from("action_logs")
    .select("*, actor:profiles!actor_id(id, full_name, username), target:profiles!target_id(id, full_name, username)")
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as unknown as ActionLog[];
}
