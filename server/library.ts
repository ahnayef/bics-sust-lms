/**
 * server/library.ts — plain async data-fetching helpers (NO "use server").
 *
 * Called directly from Server Components. Keep mutation-free.
 * All mutations live in server/library-actions.ts and server/transaction-actions.ts.
 */

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import type {
  Book,
  Copy,
  OverviewData,
  PopularBook,
  PdfSubmission,
  TopMember,
  Transaction,
  UserStats,
  UserWithStats,
} from "@/types/library";
import type { Profile } from "@/types/profile";

// ─────────────────────────────────────────────────────────────────────────────
// Books
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All books with their copies — cached across requests and invalidated
 * automatically whenever a book or copy is mutated (via revalidateTag).
 *
 * The underlying fetch uses the service client so it can run safely inside
 * `unstable_cache` (no request/cookie context required).
 */
const fetchBooks = unstable_cache(
  async (): Promise<Book[]> => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("books")
      .select("*, copies(id, copy_number, status)")
      .order("title");
    if (error || !data) return [];
    return data as unknown as Book[];
  },
  ["books-list"],
  { tags: ["books"] },
);

export async function getBooks(): Promise<Book[]> {
  return fetchBooks();
}

/** Single book with all copies. */
export async function getBook(id: string): Promise<Book | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select(
      "*, copies(id, copy_number, status, book_id, created_at, updated_at)",
    )
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
    .select("*, book:books(id, title, author, is_syllabus, pages, pdf_link)")
    .eq("id", copyId)
    .single();
  if (error || !data) return null;
  return data as unknown as Copy;
}

/** Current status of a specific copy. */
export async function bookStatus(
  copyId: string,
): Promise<Copy["status"] | null> {
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
    .select("*, book:books(id, title, author, is_syllabus)")
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
      "id, full_name, username, email, avatar_url, rank, role, is_verified, profile_completed, created_at, updated_at, phone, division_id, district_id, upazila_id, division:divisions(id,name), district:districts(id,name), upazila:upazilas(id,name)",
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

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Overview
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches everything the overview dashboard needs in parallel:
 * stats, overdue items, pending queues, recent activity,
 * top borrowers, and most-borrowed books.
 *
 * Also triggers `mark_overdue_transactions()` so that any active borrow
 * past its due_date is automatically marked overdue before stats are read.
 */
export async function getOverviewData(): Promise<OverviewData> {
  const supabase = await createClient();

  // Fire-and-forget: mark overdue borrows without blocking the main queries.
  // If the function doesn't exist yet the error is silently swallowed.
  supabase.rpc("mark_overdue_transactions").then(
    () => {},
    () => {},
  );

  const firstOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  ).toISOString();

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
  const overdueItems = allOpen.filter((t) => t.status === "overdue");
  const pendingBorrows = allOpen.filter(
    (t) => t.type === "borrow" && t.status === "pending",
  );
  const pendingReturns = allOpen.filter(
    (t) => t.type === "return" && t.status === "pending",
  );
  const activeBorrows = allOpen.filter(
    (t) => t.status === "active" || t.status === "overdue",
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
