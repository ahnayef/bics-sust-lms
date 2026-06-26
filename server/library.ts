/**
 * server/library.ts — plain async data-fetching helpers (NO "use server").
 *
 * Called directly from Server Components. Keep mutation-free.
 * All mutations live in server/library-actions.ts and server/transaction-actions.ts.
 */

import { applyCacheLife } from "@/lib/cache";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import {
  getBookWithCopies,
  getCopyByQR,
  getCopyStatus
} from "@/server/db-access";
import type {
  Book,
  Category,
  CategoryProgress,
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
import { and, asc, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { cacheTag } from "next/cache";

// ─────────────────────────────────────────────────────────────────────────────
// Books
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All books with their copies — cached across requests and invalidated on writes
 * via `updateTag("books")` (see server/cache-invalidation.ts).
 */
async function loadBooksCached(): Promise<Book[]> {
  "use cache";
  cacheTag("books");
  applyCacheLife("max");

  const data = await db.query.books.findMany({
    with: {
      category: true,
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

/** All categories. */
export async function getCategories(): Promise<Category[]> {
  const data = await db.query.categories.findMany({
    orderBy: [asc(schema.categories.name)],
  });
  return data as unknown as Category[];
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

  const data = await db.query.copies.findMany({
    with: {
      book: {
        columns: {
          id: true,
          title: true,
          author: true,
          is_syllabus: true,
        },
      },
      transactions: {
        where: and(
          eq(schema.transactions.type, "borrow"),
          inArray(schema.transactions.status, ["active", "overdue"])
        ),
        with: {
          user: {
            columns: {
              id: true,
              full_name: true,
            },
          },
        },
      },
    },
    orderBy: [asc(schema.copies.book_id), asc(schema.copies.created_at)],
  });

  // Flatten the join: take the first active borrower if it exists
  return data.map((row: any) => {
    const { transactions, ...copy } = row;
    const borrower =
      transactions && transactions.length > 0
        ? transactions[0].user
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

  const whereConditions = [];
  if (filters.type) whereConditions.push(eq(schema.transactions.type, filters.type));
  if (filters.status) whereConditions.push(eq(schema.transactions.status, filters.status));
  if (filters.userId) whereConditions.push(eq(schema.transactions.user_id, filters.userId));

  const data = await db.query.transactions.findMany({
    where: and(...whereConditions),
    with: {
      user: {
        columns: {
          id: true,
          full_name: true,
          username: true,
          email: true,
          avatar_url: true,
        },
      },
      copy: {
        columns: {
          id: true,
          copy_number: true,
          status: true,
          book_id: true,
        },
      },
      book: {
        columns: {
          id: true,
          title: true,
          author: true,
          is_syllabus: true,
        },
      },
      reviewer: {
        columns: {
          id: true,
          full_name: true,
        },
      },
    },
    orderBy: [desc(schema.transactions.request_date)],
  });

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

  const whereConditions = [];
  if (filters.userId) whereConditions.push(eq(schema.pdfSubmissions.user_id, filters.userId));
  if (filters.status) whereConditions.push(eq(schema.pdfSubmissions.status, filters.status));

  const data = await db.query.pdfSubmissions.findMany({
    where: and(...whereConditions),
    with: {
      user: {
        columns: {
          id: true,
          full_name: true,
          username: true,
          avatar_url: true,
        },
      },
      book: {
        columns: {
          id: true,
          title: true,
          author: true,
          is_syllabus: true,
        },
      },
      reviewer: {
        columns: {
          id: true,
          full_name: true,
        },
      },
    },
    orderBy: [desc(schema.pdfSubmissions.submitted_at)],
  });

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

async function loadUserStatsCached(userId: string): Promise<UserStats> {
  "use cache";
  cacheTag("users", "books", "transactions", "pdf-submissions");
  applyCacheLife("short");

  // 1. Fetch all categories that count in progress
  const categories = await db.query.categories.findMany({
    where: eq(schema.categories.count_in_progress, true),
    columns: { id: true, name: true },
  });

  const categoryIds = categories.map((c) => c.id);

  // 2. Fetch total books per category
  const categoryTotals = await db.query.books.findMany({
    where: inArray(schema.books.category_id, categoryIds),
    columns: { category_id: true },
  });

  const totalPerCategory = new Map<string, number>();
  for (const b of categoryTotals) {
    if (b.category_id) {
      totalPerCategory.set(
        b.category_id,
        (totalPerCategory.get(b.category_id) ?? 0) + 1,
      );
    }
  }

  // 3. Fetch completed books (transactions + PDF)
  const completedBorrows = await db.query.transactions.findMany({
    where: and(
      eq(schema.transactions.user_id, userId),
      eq(schema.transactions.type, "borrow"),
      eq(schema.transactions.status, "completed")
    ),
    with: {
      book: {
        columns: { category_id: true }
      }
    }
  });

  const approvedPdfs = await db.query.pdfSubmissions.findMany({
    where: and(
      eq(schema.pdfSubmissions.user_id, userId),
      eq(schema.pdfSubmissions.status, "approved")
    ),
    with: {
      book: {
        columns: { category_id: true }
      }
    }
  });

  // Map to track unique completed books per category
  const completedIdsPerCategory = new Map<string, Set<string>>();
  for (const c of categories) {
    completedIdsPerCategory.set(c.id, new Set());
  }

  const addBookToProgress = (b: any) => {
    if (
      b.book?.category_id &&
      completedIdsPerCategory.has(b.book.category_id)
    ) {
      completedIdsPerCategory.get(b.book.category_id)!.add(b.book_id);
    }
  };

  completedBorrows.forEach(addBookToProgress);
  approvedPdfs.forEach(addBookToProgress);

  const categoryProgress: CategoryProgress[] = categories.map((c) => ({
    categoryId: c.id,
    categoryName: c.name,
    completed: completedIdsPerCategory.get(c.id)?.size ?? 0,
    total: totalPerCategory.get(c.id) ?? 0,
  }));

  // Legacy syllabus support
  const syllabusCat = categories.find((c) => c.name === "Syllabus");
  const syllabusCompleted = syllabusCat
    ? (completedIdsPerCategory.get(syllabusCat.id)?.size ?? 0)
    : 0;
  const syllabusTotal = syllabusCat
    ? (totalPerCategory.get(syllabusCat.id) ?? 0)
    : 0;

  // Active + overdue borrows (what they currently have)
  const activeBorrows = await db.query.transactions.findMany({
    where: and(
      eq(schema.transactions.user_id, userId),
      eq(schema.transactions.type, "borrow"),
      inArray(schema.transactions.status, ["active", "overdue"])
    ),
    with: {
      book: {
        columns: { id: true, title: true, author: true, is_syllabus: true }
      },
      copy: {
        columns: { id: true, copy_number: true }
      }
    }
  });

  // Pending requests (not yet approved)
  const pendingRequests = await db.query.transactions.findMany({
    where: and(
      eq(schema.transactions.user_id, userId),
      eq(schema.transactions.status, "pending")
    ),
    columns: { id: true }
  });

  const now = new Date();
  return {
    syllabusCompleted,
    syllabusTotal,
    categoryProgress,
    activeBorrows: activeBorrows.length,
    overdueBorrows: activeBorrows.filter((tx) => {
      return (
        tx.status === "overdue" ||
        (tx.due_date && new Date(tx.due_date) < now)
      );
    }).length,
    pendingRequests: pendingRequests.length,
    currentBorrows: activeBorrows as unknown as Transaction[],
  };
}

/** Reading progress and active borrow info for one user (cached). */
export async function getUserStats(userId: string): Promise<UserStats> {
  return loadUserStatsCached(userId);
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

  const profilesData = await db.query.profiles.findMany({
    with: {
      thana: true,
      rank: true,
    },
    orderBy: [desc(schema.profiles.created_at)],
  });

  if (!profilesData || profilesData.length === 0) return [];

  const ids = profilesData.map((p) => p.id);

  // Fetch categories for progress tracking
  const progressCategories = await db.query.categories.findMany({
    where: eq(schema.categories.count_in_progress, true),
    columns: { id: true, name: true },
  });

  // Fetch total books per category
  const categoryTotals = await db.query.books.findMany({
    columns: { category_id: true },
  });
  const totalPerCategory = new Map<string, number>();
  for (const b of categoryTotals) {
    if (b.category_id) {
      totalPerCategory.set(
        b.category_id,
        (totalPerCategory.get(b.category_id) ?? 0) + 1,
      );
    }
  }

  // Legacy syllabus total
  const syllabusCat = progressCategories.find((c) => c.name === "Syllabus");
  const syllabusTotal = syllabusCat
    ? (totalPerCategory.get(syllabusCat.id) ?? 0)
    : 0;

  // Batch: active/overdue borrow counts
  const activeTxns = await db.query.transactions.findMany({
    where: and(
      inArray(schema.transactions.user_id, ids),
      eq(schema.transactions.type, "borrow"),
      inArray(schema.transactions.status, ["active", "overdue"])
    ),
    columns: { user_id: true, status: true, due_date: true },
  });

  // Batch: pending counts
  const pendingTxns = await db.query.transactions.findMany({
    where: and(
      inArray(schema.transactions.user_id, ids),
      eq(schema.transactions.status, "pending")
    ),
    columns: { user_id: true },
  });

  // Batch: completed borrows with category info
  const completedBorrows = await db.query.transactions.findMany({
    where: and(
      inArray(schema.transactions.user_id, ids),
      eq(schema.transactions.type, "borrow"),
      eq(schema.transactions.status, "completed")
    ),
    with: {
      book: {
        columns: { category_id: true }
      }
    }
  });

  // Batch: approved PDF submissions with category info
  const approvedPdfs = await db.query.pdfSubmissions.findMany({
    where: and(
      inArray(schema.pdfSubmissions.user_id, ids),
      eq(schema.pdfSubmissions.status, "approved")
    ),
    with: {
      book: {
        columns: { category_id: true }
      }
    }
  });

  const now = new Date();
  return profilesData.map((profile): UserWithStats => {
    const userActiveTxns = activeTxns.filter(
      (t) => t.user_id === profile.id,
    );
    const activeBorrowsCount = userActiveTxns.length;
    const overdueBorrowsCount = userActiveTxns.filter(
      (t) =>
        t.status === "overdue" || (t.due_date && new Date(t.due_date) < now),
    ).length;
    const pendingRequestsCount = pendingTxns.filter(
      (t) => t.user_id === profile.id,
    ).length;

    // Calculate progress per category
    const completedIdsPerCategory = new Map<string, Set<string>>();
    for (const c of progressCategories) {
      completedIdsPerCategory.set(c.id, new Set());
    }

    const processItem = (row: any) => {
      if (
        row.user_id === profile.id &&
        row.book?.category_id &&
        completedIdsPerCategory.has(row.book.category_id)
      ) {
        completedIdsPerCategory.get(row.book.category_id)!.add(row.book_id);
      }
    };

    completedBorrows.forEach(processItem);
    approvedPdfs.forEach(processItem);

    const categoryProgress: CategoryProgress[] = progressCategories.map(
      (c) => ({
        categoryId: c.id,
        categoryName: c.name,
        completed: completedIdsPerCategory.get(c.id)?.size ?? 0,
        total: totalPerCategory.get(c.id) ?? 0,
      }),
    );

    const syllabusCompleted = syllabusCat
      ? (completedIdsPerCategory.get(syllabusCat.id)?.size ?? 0)
      : 0;

    return {
      ...(profile as unknown as Profile),
      syllabusCompleted,
      syllabusTotal,
      categoryProgress,
      activeBorrows: activeBorrowsCount,
      overdueBorrows: overdueBorrowsCount,
      pendingRequests: pendingRequestsCount,
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
 * Fetches everything the overview dashboard needs in parallel.
 */
async function loadOverviewDataCached(
  firstOfMonth: string,
): Promise<OverviewData> {
  "use cache";
  cacheTag("overview");
  applyCacheLife("minutes");

  // In Drizzle, we don't have a direct equivalent to supabase.rpc unless we use db.execute
  // But we can just rely on the application logic for overdue checks or run a raw query
  await db.execute(sql`SELECT mark_overdue_transactions()`);

  const [
    booksData,
    copiesData,
    membersData,
    allOpenTransactions,
    recentActivityData,
    borrowHistoryData,
    pendingPdfsData,
    completedThisMonthData,
  ] = await Promise.all([
    db.query.books.findMany({ columns: { id: true, is_syllabus: true } }),
    db.query.copies.findMany({ columns: { id: true, status: true } }),
    db.query.profiles.findMany({
      where: eq(schema.profiles.role, "member"),
      columns: { id: true, is_verified: true }
    }),
    db.query.transactions.findMany({
      where: inArray(schema.transactions.status, ["active", "overdue", "pending"]),
      with: {
        user: { columns: { id: true, full_name: true, username: true, avatar_url: true } },
        book: { columns: { id: true, title: true, author: true, is_syllabus: true } },
        copy: { columns: { id: true, copy_number: true } }
      },
      orderBy: [asc(schema.transactions.due_date)]
    }),
    db.query.transactions.findMany({
      with: {
        user: { columns: { id: true, full_name: true, username: true, avatar_url: true } },
        book: { columns: { id: true, title: true, author: true } },
        copy: { columns: { id: true, copy_number: true } }
      },
      orderBy: [desc(schema.transactions.request_date)],
      limit: 15
    }),
    db.query.transactions.findMany({
      where: and(
        eq(schema.transactions.type, "borrow"),
        inArray(schema.transactions.status, ["active", "completed", "overdue"])
      ),
      with: {
        user: { columns: { id: true, full_name: true, username: true, avatar_url: true } },
        book: { columns: { id: true, title: true, author: true, is_syllabus: true } }
      },
      orderBy: [desc(schema.transactions.request_date)],
      limit: 300
    }),
    db.query.pdfSubmissions.findMany({
      where: eq(schema.pdfSubmissions.status, "pending"),
      with: {
        user: { columns: { id: true, full_name: true, username: true, avatar_url: true } },
        book: { columns: { id: true, title: true, author: true, is_syllabus: true } }
      },
      orderBy: [asc(schema.pdfSubmissions.submitted_at)],
      limit: 10
    }),
    db.query.transactions.findMany({
      where: and(
        eq(schema.transactions.status, "completed"),
        sql`${schema.transactions.updated_at} >= ${firstOfMonth}`
      ),
      columns: { id: true }
    })
  ]);

  const now = new Date();
  const overdueItems = allOpenTransactions.filter(
    (t) =>
      t.type === "borrow" &&
      (t.status === "overdue" ||
        (t.status === "active" && t.due_date && new Date(t.due_date) < now)),
  );
  const pendingBorrows = allOpenTransactions.filter(
    (t) => t.type === "borrow" && t.status === "pending",
  );
  const pendingReturns = allOpenTransactions.filter(
    (t) => t.type === "return" && t.status === "pending",
  );
  const activeBorrows = allOpenTransactions.filter(
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
  for (const tx of borrowHistoryData) {
    const user = tx.user;
    if (!user) continue;
    const entry = memberMap.get(tx.user_id) ?? { meta: user as any, count: 0 };
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
  for (const tx of borrowHistoryData) {
    const book = tx.book;
    if (!book) continue;
    const entry = bookMap.get(tx.book_id) ?? { meta: book as any, count: 0 };
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

  return {
    stats: {
      totalBooks: booksData.length,
      syllabusBooks: booksData.filter((b) => b.is_syllabus).length,
      generalBooks: booksData.filter((b) => !b.is_syllabus).length,
      totalCopies: copiesData.length,
      availableCopies: copiesData.filter((c) => c.status === "available").length,
      borrowedCopies: copiesData.filter((c) => c.status === "borrowed").length,
      damagedCopies: copiesData.filter((c) => c.status === "damaged").length,
      totalMembers: membersData.length,
      verifiedMembers: membersData.filter((m) => m.is_verified).length,
      unverifiedMembers: membersData.filter((m) => !m.is_verified).length,
      activeBorrows: activeBorrows.length,
      overdueCount: overdueItems.length,
      pendingBorrowRequests: pendingBorrows.length,
      pendingReturnRequests: pendingReturns.length,
      pendingPdfSubmissions: pendingPdfsData.length,
      completedThisMonth: completedThisMonthData.length,
    },
    overdueItems: overdueItems as unknown as Transaction[],
    pendingBorrows: pendingBorrows as unknown as Transaction[],
    pendingReturns: pendingReturns as unknown as Transaction[],
    recentActivity: recentActivityData as unknown as Transaction[],
    topMembers,
    popularBooks,
    pendingPdfs: pendingPdfsData as unknown as PdfSubmission[],
  };
}

export async function getOverviewData(): Promise<OverviewData> {
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
async function loadUserNotificationsCached(userId: string): Promise<NotificationItem[]> {
  "use cache";
  cacheTag("users", "transactions", "pdf-submissions", "actionLogs");
  applyCacheLife("short");

  const [txs, pdfs, logs] = await Promise.all([
    db.query.transactions.findMany({
      where: and(
        eq(schema.transactions.user_id, userId),
        inArray(schema.transactions.status, ["active", "completed", "rejected", "overdue"])
      ),
      with: { book: { columns: { title: true } } }
    }),
    db.query.pdfSubmissions.findMany({
      where: and(
        eq(schema.pdfSubmissions.user_id, userId),
        inArray(schema.pdfSubmissions.status, ["approved", "rejected"])
      ),
      with: { book: { columns: { title: true } } }
    }),
    db.query.actionLogs.findMany({
      where: and(
        eq(schema.actionLogs.target_id, userId),
        ne(schema.actionLogs.action_type, "error")
      )
    })
  ]);

  const items: NotificationItem[] = [];

  for (const tx of txs) {
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
        date: (tx.updated_at ?? tx.request_date)?.toISOString() ?? new Date().toISOString(),
        type,
        title,
        message,
        reason: tx.rejection_reason,
        link: `/dashboard/history`,
      });
    }
  }

  for (const pdf of pdfs) {
    const bookTitle = (pdf as any).book?.title ?? "a book";
    items.push({
      id: pdf.id,
      date: (pdf.reviewed_at ?? pdf.submitted_at)?.toISOString() ?? new Date().toISOString(),
      type: pdf.status === "approved" ? "pdf_approved" : "pdf_rejected",
      title: pdf.status === "approved" ? "PDF Reading Approved" : "PDF Reading Rejected",
      message: `Your reading submission for "${bookTitle}" was ${pdf.status}.`,
      reason: pdf.rejection_reason,
      link: `/dashboard/transactions?tab=pdf`,
    });
  }

  for (const log of logs) {
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
        date: log.created_at?.toISOString() ?? new Date().toISOString(),
        type,
        title,
        message,
        reason: log.details,
      });
    }
  }

  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Get notifications for a user (cached). */
export async function getUserNotifications(userId: string): Promise<NotificationItem[]> {
  return loadUserNotificationsCached(userId);
}

export async function getAdminLogs(days: number = 30): Promise<ActionLog[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const data = await db.query.actionLogs.findMany({
    where: gte(schema.actionLogs.created_at, cutoff),
    with: {
      actor: { columns: { id: true, full_name: true, username: true } },
      target: { columns: { id: true, full_name: true, username: true } }
    },
    orderBy: [desc(schema.actionLogs.created_at)]
  });

  return data as unknown as ActionLog[];
}
