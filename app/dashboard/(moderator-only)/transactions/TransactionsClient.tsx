"use client";

import StatusBadge from "@/app/components/StatusBadge";
import { getRelativeTime } from "@/lib/utils";
import {
  allowBorrowRequest,
  approvePdfReport,
  approveReturnRequest,
  directReturnByStaff,
  rejectBorrowRequest,
  rejectPdfReport,
  rejectReturnRequest,
} from "@/server/transaction-actions";
import type { PdfSubmission, Transaction } from "@/types/library";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  FaCheck,
  FaExclamationTriangle,
  FaFileAlt,
  FaPhone,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import { CirculationNav } from "@/app/dashboard/components/StaffHubNav";
import { useTranslation } from "@/lib/i18n/context";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SortKey = "date" | "member";
type StatusFilter = "all" | "active" | "overdue";

interface RejectTarget {
  kind: "borrow" | "return" | "pdf";
  id: string;
  title: string;
}

interface Props {
  transactions: Transaction[];
  pdfSubmissions: PdfSubmission[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(
  date: string | null | undefined,
  language: string = "en",
): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(
    language === "bn" ? "bn-BD" : "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function isOverdueDate(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// Badge pill shown next to tab labels
function CountBadge({ n, urgent = false }: { n: number; urgent?: boolean }) {
  if (n === 0) return null;
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold leading-none ml-1 shrink-0 ${
        urgent ? "bg-[#8b2c1a] text-[#fdf0ec]" : "bg-[#5a4d40] text-[#f4e8d4]"
      }`}
    >
      {n}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function TransactionsClient({
  transactions,
  pdfSubmissions,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, language } = useTranslation();
  const activeTab = searchParams.get("tab") || "pending";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [dueDates, setDueDates] = useState<Record<string, string>>({});
  const [rejectTarget, setRejectTarget] = useState<RejectTarget | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!rejectTarget) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRejectModal();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [rejectTarget]);

  // ── Derived lists ──────────────────────────────────────────────────────────

  const pendingBorrows = useMemo(
    () =>
      transactions.filter(
        (tx) =>
          tx.status === "pending" &&
          tx.type === "borrow" &&
          !hiddenIds.has(tx.id),
      ),
    [transactions, hiddenIds],
  );

  const pendingReturns = useMemo(
    () =>
      transactions.filter(
        (tx) =>
          tx.status === "pending" &&
          tx.type === "return" &&
          !hiddenIds.has(tx.id),
      ),
    [transactions, hiddenIds],
  );

  const pendingPdfs = useMemo(
    () =>
      pdfSubmissions.filter(
        (s) => s.status === "pending" && !hiddenIds.has(s.id),
      ),
    [pdfSubmissions, hiddenIds],
  );

  // Group pending borrows by copy_id to detect conflicts and identify members
  const copyConflicts = useMemo(() => {
    const map: Record<string, string[]> = {};
    pendingBorrows.forEach((tx) => {
      const name = tx.user?.full_name || t.common.unknown;
      if (!map[tx.copy_id]) map[tx.copy_id] = [];
      map[tx.copy_id].push(name);
    });
    return map;
  }, [pendingBorrows, t.common.unknown]);

  // Map of copy_id to the transaction currently holding it (active/overdue)
  const activeBorrowers = useMemo(() => {
    const map: Record<string, Transaction> = {};
    transactions.forEach((tx) => {
      if (
        tx.type === "borrow" &&
        (tx.status === "active" || tx.status === "overdue")
      ) {
        map[tx.copy_id] = tx;
      }
    });
    return map;
  }, [transactions]);

  function sortTxns(list: Transaction[]): Transaction[] {
    return [...list].sort((a, b) =>
      sortBy === "member"
        ? (a.user?.full_name ?? "").localeCompare(b.user?.full_name ?? "")
        : new Date(b.request_date).getTime() -
          new Date(a.request_date).getTime(),
    );
  }

  const activeTransactions = useMemo(() => {
    const base = transactions.filter(
      (tx) =>
        tx.type === "borrow" &&
        (tx.status === "active" || tx.status === "overdue"),
    );
    const q = searchTerm.toLowerCase();
    return sortTxns(
      base.filter((tx) => {
        const matchSearch =
          (tx.user?.full_name ?? "").toLowerCase().includes(q) ||
          (tx.book?.title ?? "").toLowerCase().includes(q) ||
          (tx.copy?.id ?? tx.copy_id).toLowerCase().includes(q);

        const isActuallyOverdue =
          tx.status === "overdue" || isOverdueDate(tx.due_date);
        const matchStatus =
          statusFilter === "all" ||
          (statusFilter === "overdue" && isActuallyOverdue) ||
          (statusFilter === "active" &&
            !isActuallyOverdue &&
            tx.status === "active");

        return matchSearch && matchStatus;
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, searchTerm, sortBy, statusFilter]);

  const historyTransactions = useMemo(() => {
    const base = transactions.filter(
      (tx) =>
        (tx.status === "completed" || tx.status === "rejected") &&
        !(tx.type === "return" && tx.status === "completed"),
    );

    // Map approved/rejected PDFs to look like transactions for the history table
    const pdfToTx = pdfSubmissions
      .filter((pdf) => pdf.status === "approved" || pdf.status === "rejected")
      .map(
        (pdf) =>
          ({
            id: pdf.id,
            user: pdf.user,
            book: pdf.book,
            copy_id: "—",
            copy: null,
            type: t.transactions.tabs.pdf as any, // Type override for UI
            status: pdf.status as any,
            request_date: pdf.submitted_at,
            _isPdf: true, // Custom marker for PDF submissions
            _pdfStatus: pdf.status,
          }) as unknown as Transaction & {
            _isPdf?: boolean;
            _pdfStatus?: string;
          },
      );

    const combined = [...base, ...pdfToTx];
    const q = searchTerm.toLowerCase();

    return sortTxns(
      combined.filter(
        (tx) =>
          (tx.user?.full_name ?? "").toLowerCase().includes(q) ||
          (tx.book?.title ?? "").toLowerCase().includes(q) ||
          (tx.copy?.id ?? tx.copy_id).toLowerCase().includes(q),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    transactions,
    pdfSubmissions,
    searchTerm,
    sortBy,
    t.transactions.tabs.pdf,
  ]);

  const summary = useMemo(
    () => ({
      pending: transactions.filter((tx) => tx.status === "pending").length,
      active: transactions.filter(
        (tx) => tx.status === "active" && !isOverdueDate(tx.due_date),
      ).length,
      overdue: transactions.filter(
        (tx) =>
          tx.status === "overdue" ||
          (tx.status === "active" && isOverdueDate(tx.due_date)),
      ).length,
      completed: transactions.filter((tx) => tx.status === "completed").length,
    }),
    [transactions],
  );

  // ── Actions ────────────────────────────────────────────────────────────────

  async function runAction(id: string, fn: () => Promise<{ error?: string }>) {
    setProcessingId(id);
    setErrorMsg(null);
    startTransition(async () => {
      const result = await fn();
      setProcessingId(null);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        // Optimistically hide the processed item
        setHiddenIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
        router.refresh();
      }
    });
  }

  function handleApproveBorrow(tx: Transaction) {
    const due = dueDates[tx.id] ?? tx.due_date ?? defaultDueDate();
    runAction(tx.id, async () => {
      const fd = new FormData();
      fd.set("transaction_id", tx.id);
      fd.set("due_date", due);
      return allowBorrowRequest(fd);
    });
  }

  function handleApproveReturn(tx: Transaction) {
    runAction(tx.id, async () => {
      const fd = new FormData();
      fd.set("transaction_id", tx.id);
      return approveReturnRequest(fd);
    });
  }

  function handleApprovePdf(pdf: PdfSubmission) {
    runAction(pdf.id, async () => {
      const fd = new FormData();
      fd.set("submission_id", pdf.id);
      return approvePdfReport(fd);
    });
  }

  function handleDirectReturn(tx: Transaction) {
    const bookTitle = tx.book?.title || t.common.unknown;
    const memberName = tx.user?.full_name || t.common.unknown;
    const confirmMsg =
      language === "bn"
        ? `সদস্য "${memberName}" এর ধার করা "${bookTitle}" বইটি ফেরত হিসেবে গ্রহণ করতে চান?`
        : `Mark "${bookTitle}" borrowed by ${memberName} as returned?`;

    if (!window.confirm(confirmMsg)) return;

    runAction(tx.id, async () => {
      const fd = new FormData();
      fd.set("transaction_id", tx.id);
      return directReturnByStaff(fd);
    });
  }

  function openRejectModal(
    kind: RejectTarget["kind"],
    id: string,
    title: string,
  ) {
    setRejectTarget({ kind, id, title });
    setRejectionReason("");
    setErrorMsg(null);
  }

  function closeRejectModal() {
    setRejectTarget(null);
    setRejectionReason("");
  }

  function handleConfirmReject() {
    if (!rejectTarget) return;
    const { kind, id } = rejectTarget;
    runAction(id, async () => {
      const fd = new FormData();
      fd.set("rejection_reason", rejectionReason);
      if (kind === "pdf") {
        fd.set("submission_id", id);
        return rejectPdfReport(fd);
      } else if (kind === "borrow") {
        fd.set("transaction_id", id);
        return rejectBorrowRequest(fd);
      } else {
        fd.set("transaction_id", id);
        return rejectReturnRequest(fd);
      }
    });
    closeRejectModal();
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  function renderBorrowCard(tx: Transaction) {
    const working = processingId === tx.id && isPending;
    const due = dueDates[tx.id] ?? tx.due_date ?? defaultDueDate();
    const otherRequesters = (copyConflicts[tx.copy_id] || []).filter(
      (name) => name !== (tx.user?.full_name || t.common.unknown),
    );
    const hasConflict = otherRequesters.length > 0;

    const currentBorrower = activeBorrowers[tx.copy_id];
    const isUnavailable = !!currentBorrower;

    return (
      <article
        key={tx.id}
        className={`border rounded-xl p-3 sm:p-4 ink-text ${
          isUnavailable
            ? "border-[#b0665c] bg-[#f8e7e3] opacity-90 shadow-[inset_4px_0_0_0_#b0665c]"
            : hasConflict
              ? "border-[#c49b6b] bg-[#f8f1e6] shadow-[inset_4px_0_0_0_#c49b6b]"
              : "border-[#b9a58b] bg-[#f6ecdd]"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
            {/* Profile Photo */}
            <div className="shrink-0">
              <Link href={`/dashboard/users/${tx.user?.id}`}>
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-[#cfbba1] bg-[#ece0ce] hover:border-[#8b5c4a] transition-colors">
                  {tx.user?.avatar_url ? (
                    <Image
                      src={tx.user.avatar_url}
                      alt={tx.user.full_name || ""}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#8b5c4a] font-bold text-sm">
                      {(tx.user?.full_name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-[#2b2119] truncate">
                  <Link
                    href={`/dashboard/users/${tx.user?.id}`}
                    className="hover:underline hover:text-[#5a4b3f] transition-colors"
                  >
                    {tx.user?.full_name ?? t.common.unknown}
                  </Link>
                </p>
                {isUnavailable ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8b5c4a] text-[#f6ecdd] uppercase tracking-wider">
                    {t.transactions.actions.unavailable}
                  </span>
                ) : (
                  hasConflict && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8b5c4a] text-[#f6ecdd] uppercase tracking-wider">
                      {t.transactions.actions.conflict}
                    </span>
                  )
                )}
              </div>
              <p className="text-xs text-[#5a4b3f] mt-0.5 truncate">
                {tx.book?.title ?? t.common.unknown}{" "}
                <span className="font-mono text-[10px] opacity-70">
                  ({tx.copy?.id ?? tx.copy_id})
                </span>
              </p>
            </div>
          </div>
          <StatusBadge
            tone={isUnavailable ? "danger" : "info"}
            size="xs"
            className="shrink-0"
          >
            {t.history.table.borrowed}
          </StatusBadge>
        </div>

        {isUnavailable ? (
          <div className="mt-2 p-2 bg-[#f2d8d3] border border-[#d6a59e] rounded-lg text-[10px] text-[#7d2d23] font-medium space-y-1">
            <div className="flex items-center gap-1.5">
              <FaExclamationTriangle className="w-3 h-3 shrink-0" />
              <span>
                {t.transactions.actions.currentlyBorrowedBy}
                <Link
                  href={`/dashboard/users/${currentBorrower.user?.id}`}
                  className="font-bold underline hover:text-[#5a1d17]"
                >
                  {currentBorrower.user?.full_name}
                </Link>
              </span>
            </div>
            {currentBorrower.due_date && (
              <div className="pl-4">
                <span>
                  {t.transactions.actions.expectedReturn}
                  {formatDate(currentBorrower.due_date, language)}
                  {isOverdueDate(currentBorrower.due_date) && (
                    <span className="ml-1 font-bold text-[#b52a1a]">
                      ({t.transactions.actions.overdue})
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        ) : (
          hasConflict && (
            <div className="mt-2 p-2 bg-[#fdf3e7] border border-[#d9af7c] rounded-lg text-[10px] text-[#7d5218] flex items-center gap-1.5">
              <FaExclamationTriangle className="w-3 h-3 shrink-0 text-[#a06820]" />
              <span>
                {t.transactions.actions.alsoRequestedBy}
                {otherRequesters.join(", ")}
              </span>
            </div>
          )
        )}

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#5a4b3f] sm:pl-[52px]">
          <p>
            {t.transactions.table.requested}:{" "}
            {formatDate(tx.request_date, language)}
          </p>
          <div className="flex items-center gap-1.5">
            <label
              htmlFor={`due-${tx.id}`}
              className="text-xs text-[#5a4b3f] whitespace-nowrap"
            >
              {t.transactions.table.due}:
            </label>
            <input
              id={`due-${tx.id}`}
              type="date"
              value={due}
              min={todayStr()}
              onChange={(e) =>
                setDueDates((prev) => ({ ...prev, [tx.id]: e.target.value }))
              }
              className="px-2 py-0.5 text-xs border border-[#8a7966] rounded-md bg-[#f6ecdd] text-[#2f251d] focus:ring-1 focus:ring-[#6e5d4a] outline-none"
            />
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2 pt-2.5 border-t border-[#cfbba1]">
          <button
            disabled={working || isUnavailable}
            onClick={() => handleApproveBorrow(tx)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-[#f6ecdd] bg-[#2d5a3c] hover:bg-[#22442d] rounded-lg transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FaCheck className="w-3 h-3" />
            {working
              ? t.transactions.actions.approving
              : isUnavailable
                ? t.transactions.actions.unavailable
                : t.transactions.actions.approve}
          </button>
          <button
            disabled={working}
            onClick={() =>
              openRejectModal(
                "borrow",
                tx.id,
                tx.book?.title ?? t.common.unknown,
              )
            }
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#f6ecdd] bg-[#8b5c4a] hover:bg-[#6b4437] rounded-lg transition-colors border border-[#6b4437] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FaTimes className="w-3 h-3" />
            {t.transactions.actions.reject}
          </button>
        </div>
      </article>
    );
  }

  function renderReturnCard(tx: Transaction) {
    const working = processingId === tx.id && isPending;
    const originalBorrow = activeBorrowers[tx.copy_id];

    return (
      <article
        key={tx.id}
        className="border border-[#b9a58b] rounded-xl bg-[#f6ecdd] p-3 sm:p-4 ink-text"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
            {/* Profile Photo */}
            <div className="shrink-0">
              <Link href={`/dashboard/users/${tx.user?.id}`}>
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-[#cfbba1] bg-[#ece0ce] hover:border-[#8b5c4a] transition-colors">
                  {tx.user?.avatar_url ? (
                    <Image
                      src={tx.user.avatar_url}
                      alt={tx.user.full_name || ""}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#8b5c4a] font-bold text-sm">
                      {(tx.user?.full_name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#2b2119] truncate">
                <Link
                  href={`/dashboard/users/${tx.user?.id}`}
                  className="hover:underline hover:text-[#5a4b3f] transition-colors"
                >
                  {tx.user?.full_name ?? t.common.unknown}
                </Link>
              </p>
              <p className="text-xs text-[#5a4b3f] mt-0.5 truncate">
                {tx.book?.title ?? t.common.unknown}{" "}
                <span className="font-mono text-[10px] opacity-70">
                  ({tx.copy?.id ?? tx.copy_id})
                </span>
              </p>
            </div>
          </div>
          <StatusBadge tone="accent" size="xs" className="shrink-0">
            {t.history.table.returned}
          </StatusBadge>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#5a4b3f] sm:pl-[52px]">
          <p>
            {t.transactions.table.requested}:{" "}
            {formatDate(tx.request_date, language)}
          </p>
          <p>
            {t.return.form.borrowedOn}:{" "}
            {formatDate(originalBorrow?.approved_date, language)}
          </p>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2 pt-2.5 border-t border-[#cfbba1]">
          <button
            disabled={working}
            onClick={() => handleApproveReturn(tx)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-[#f6ecdd] bg-[#2d5a3c] hover:bg-[#22442d] rounded-lg transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FaCheck className="w-3 h-3" />
            {working
              ? t.transactions.actions.approving
              : t.transactions.actions.approve}
          </button>
          <button
            disabled={working}
            onClick={() =>
              openRejectModal(
                "return",
                tx.id,
                tx.book?.title ?? t.common.unknown,
              )
            }
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#f6ecdd] bg-[#8b5c4a] hover:bg-[#6b4437] rounded-lg transition-colors border border-[#6b4437] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FaTimes className="w-3 h-3" />
            {t.transactions.actions.reject}
          </button>
        </div>
      </article>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* Circulation Hub Sub-Nav (Desktop/Tablet) */}
      <div className="hidden md:block">
        <CirculationNav />
      </div>

      {/* Header & Stats Strip */}
      {/* Header & Quick Filter Tabs */}
      <section className="dashboard-surface tron-border rounded-xl p-3 sm:p-5">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-base sm:text-2xl font-bold text-[#221910] ink-title">
              {t.transactions.header.title}
            </h1>
            <p className="text-[11px] sm:text-sm text-[#5a4b3f] mt-0.5 ink-text">
              {t.transactions.header.subtitle}
            </p>
          </div>

          {/* 100% Viewport-Fitting 2x2 Segmented Grid on Mobile, 4-Column on Desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 p-1 bg-[#eadcc8] rounded-xl border border-[#8a7966]/40 w-full">
            {/* Tab 1: Pending */}
            <button
              type="button"
              onClick={() => handleTabChange("pending")}
              className={`flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "pending"
                  ? "bg-[#3f3328] text-[#f4e8d4] shadow-xs font-bold"
                  : "text-[#5a4a3a] hover:bg-[#dfcfb9] hover:text-[#221910]"
              }`}
            >
              <span>⏳</span>
              <span className="truncate">{t.transactions.tabs.pending}</span>
              {pendingBorrows.length + pendingReturns.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                    activeTab === "pending"
                      ? "bg-[#5a4d40] text-[#fdf6ec]"
                      : "bg-[#8b2c1a] text-[#fdf0ec]"
                  }`}
                >
                  {pendingBorrows.length + pendingReturns.length}
                </span>
              )}
            </button>

            {/* Tab 2: Active */}
            <button
              type="button"
              onClick={() => {
                handleTabChange("active");
                setStatusFilter("all");
              }}
              className={`flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "active"
                  ? "bg-[#3f3328] text-[#f4e8d4] shadow-xs font-bold"
                  : "text-[#5a4a3a] hover:bg-[#dfcfb9] hover:text-[#221910]"
              }`}
            >
              <span>📖</span>
              <span className="truncate">{t.transactions.tabs.active}</span>
              {summary.active + summary.overdue > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                    activeTab === "active"
                      ? "bg-[#5a4d40] text-[#fdf6ec]"
                      : summary.overdue > 0
                        ? "bg-[#8b2c1a] text-[#fdf0ec]"
                        : "bg-[#d2bfa5] text-[#3f2f20]"
                  }`}
                >
                  {summary.active + summary.overdue}
                </span>
              )}
            </button>

            {/* Tab 3: History */}
            <button
              type="button"
              onClick={() => handleTabChange("history")}
              className={`flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-[#3f3328] text-[#f4e8d4] shadow-xs font-bold"
                  : "text-[#5a4a3a] hover:bg-[#dfcfb9] hover:text-[#221910]"
              }`}
            >
              <span>✓</span>
              <span className="truncate">{t.transactions.tabs.history}</span>
              {summary.completed > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                    activeTab === "history"
                      ? "bg-[#5a4d40] text-[#fdf6ec]"
                      : "bg-[#d2bfa5] text-[#3f2f20]"
                  }`}
                >
                  {summary.completed}
                </span>
              )}
            </button>

            {/* Tab 4: PDF */}
            <button
              type="button"
              onClick={() => handleTabChange("pdf")}
              className={`flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "pdf"
                  ? "bg-[#3f3328] text-[#f4e8d4] shadow-xs font-bold"
                  : "text-[#5a4a3a] hover:bg-[#dfcfb9] hover:text-[#221910]"
              }`}
            >
              <FaFileAlt className="w-3 h-3 shrink-0" />
              <span className="truncate">{t.transactions.tabs.pdf}</span>
              {pendingPdfs.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                    activeTab === "pdf"
                      ? "bg-[#5a4d40] text-[#fdf6ec]"
                      : "bg-[#8b2c1a] text-[#fdf0ec]"
                  }`}
                >
                  {pendingPdfs.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-2.5 p-2 bg-[#f3e2de] border border-[#b58a82] rounded-lg text-xs text-[#6f3d35] ink-text">
            {errorMsg}
          </div>
        )}
      </section>

      {/* Tab Content Section */}
      <section className="dashboard-surface tron-border rounded-xl border border-[#5f4f40] overflow-hidden">
        {/* ── Pending ── */}
        {activeTab === "pending" && (
          <div className="p-2.5 sm:p-5">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <section className="space-y-3">
                <header className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[#2b2119] ink-title">
                    {t.overview.sections.borrowRequests}
                  </h2>
                  <span className="text-xs text-[#6a5a4c] ink-text">
                    {pendingBorrows.length}{" "}
                    {language === "bn" ? "অপেক্ষমান" : "waiting"}
                  </span>
                </header>
                {pendingBorrows.length === 0 ? (
                  <div className="border border-[#cfbba1] rounded-sm p-6 text-center text-[#6a5a4c] ink-text">
                    {t.transactions.empty.noPending}
                  </div>
                ) : (
                  pendingBorrows.map(renderBorrowCard)
                )}
              </section>

              <section className="space-y-3">
                <header className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[#2b2119] ink-title">
                    {t.overview.sections.returnRequests}
                  </h2>
                  <span className="text-xs text-[#6a5a4c] ink-text">
                    {pendingReturns.length}{" "}
                    {language === "bn" ? "অপেক্ষমান" : "waiting"}
                  </span>
                </header>
                {pendingReturns.length === 0 ? (
                  <div className="border border-[#cfbba1] rounded-sm p-6 text-center text-[#6a5a4c] ink-text">
                    {t.transactions.empty.noPending}
                  </div>
                ) : (
                  pendingReturns.map(renderReturnCard)
                )}
              </section>
            </div>
          </div>
        )}

        {/* ── Active ── */}
        {activeTab === "active" && (
          <div className="p-2.5 sm:p-5 space-y-3 sm:space-y-4">
            {/* Quick Status Pill Filters & Search */}
            <div className="space-y-2 sm:space-y-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer shrink-0 ${
                    statusFilter === "all"
                      ? "bg-[#3f3328] text-[#f4e8d4] border-[#3f3328] shadow-xs font-bold"
                      : "bg-[#eadcc8] text-[#4a3e33] border-[#c9b89a] hover:bg-[#decbb6]"
                  }`}
                >
                  {t.transactions.filters.status.all} (
                  {summary.active + summary.overdue})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("overdue")}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                    statusFilter === "overdue"
                      ? "bg-[#8b2c1a] text-[#fdf0ec] border-[#8b2c1a] shadow-xs font-bold"
                      : "bg-[#faeae6] text-[#8b2c1a] border-[#d67b6a] hover:bg-[#f3d9d3]"
                  }`}
                >
                  <span>⚠️</span>
                  <span>
                    {t.transactions.filters.status.overdue} ({summary.overdue})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer shrink-0 ${
                    statusFilter === "active"
                      ? "bg-[#3f3328] text-[#f4e8d4] border-[#3f3328] shadow-xs font-bold"
                      : "bg-[#eadcc8] text-[#4a3e33] border-[#c9b89a] hover:bg-[#decbb6]"
                  }`}
                >
                  {t.transactions.filters.status.active} ({summary.active})
                </button>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-3">
                <div className="relative sm:col-span-2">
                  <FaSearch className="absolute left-3 top-2.5 text-[#7a6a5a]" />
                  <input
                    type="text"
                    placeholder={t.transactions.filters.search}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-lg focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-xs sm:text-sm"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="w-full px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-lg focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-xs sm:text-sm"
                >
                  <option value="date">
                    {t.transactions.filters.sort.date}
                  </option>
                  <option value="member">
                    {t.transactions.filters.sort.member}
                  </option>
                </select>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-2.5">
              {activeTransactions.length === 0 ? (
                <div className="border border-[#cfbba1] rounded-xl p-8 text-center text-[#6a5a4c] ink-text">
                  {t.transactions.empty.noActive}
                </div>
              ) : (
                activeTransactions.map((tx) => {
                  const isActuallyOverdue =
                    tx.status === "overdue" || isOverdueDate(tx.due_date);
                  const working = processingId === tx.id && isPending;
                  const overdueDays =
                    isActuallyOverdue && tx.due_date
                      ? Math.max(
                          1,
                          Math.ceil(
                            (new Date().getTime() -
                              new Date(tx.due_date).getTime()) /
                              (1000 * 3600 * 24),
                          ),
                        )
                      : 0;

                  return (
                    <article
                      key={tx.id}
                      className={`border rounded-xl p-3 sm:p-4 ink-text transition-colors ${
                        isActuallyOverdue
                          ? "border-[#c4614a] bg-[#fdf0ec]"
                          : "border-[#b9a58b] bg-[#f6ecdd]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                          {/* Profile Photo */}
                          <div className="shrink-0">
                            <Link href={`/dashboard/users/${tx.user?.id}`}>
                              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-[#cfbba1] bg-[#ece0ce] hover:border-[#8b5c4a] transition-colors">
                                {tx.user?.avatar_url ? (
                                  <Image
                                    src={tx.user.avatar_url}
                                    alt={tx.user.full_name || ""}
                                    fill
                                    referrerPolicy="no-referrer"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#8b5c4a] font-bold text-sm">
                                    {(tx.user?.full_name || "?")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </Link>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#2b2119] truncate">
                              <Link
                                href={`/dashboard/users/${tx.user?.id}`}
                                className="hover:underline hover:text-[#5a4b3f] transition-colors"
                              >
                                {tx.user?.full_name ?? t.common.unknown}
                              </Link>
                            </p>
                            <p className="text-xs text-[#5a4b3f] mt-0.5 truncate">
                              {tx.book?.title ?? t.common.unknown}{" "}
                              <span className="font-mono text-[10px] opacity-70">
                                ({tx.copy?.id ?? tx.copy_id})
                              </span>
                            </p>
                          </div>
                        </div>
                        <StatusBadge
                          tone={isActuallyOverdue ? "danger" : "info"}
                          size="xs"
                          className="shrink-0"
                        >
                          {isActuallyOverdue
                            ? t.history.status.overdue
                            : t.history.table.borrowed}
                        </StatusBadge>
                      </div>

                      <div className="mt-2 text-xs text-[#5a4b3f] flex flex-wrap gap-x-4 gap-y-1 pl-[44px] sm:pl-[52px]">
                        <p>
                          {t.transactions.table.requested}:{" "}
                          {formatDate(tx.request_date, language)}
                        </p>
                        <p
                          className={
                            isActuallyOverdue ? "text-red-700 font-bold" : ""
                          }
                        >
                          {t.transactions.table.due}:{" "}
                          {formatDate(tx.due_date, language)}
                          {overdueDays > 0 && (
                            <span className="ml-1 text-[11px] font-bold text-[#b52a1a]">
                              ({overdueDays}{" "}
                              {language === "bn"
                                ? "দিন মেয়াদোত্তীর্ণ"
                                : "days overdue"}
                              )
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Desk Return & Contact Action Bar */}
                      <div className="mt-3 pt-2.5 border-t border-[#d8c7b2] flex items-center justify-between gap-2 flex-wrap pl-[44px] sm:pl-[52px]">
                        <div className="flex items-center gap-2">
                          {tx.user?.phone && (
                            <a
                              href={`tel:${tx.user.phone}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#ece0ce] hover:bg-[#decbb5] text-[#3f3328] border border-[#c4b39c] transition-colors cursor-pointer"
                              title={`Call ${tx.user.phone}`}
                            >
                              <FaPhone className="w-2.5 h-2.5 text-[#5a4b3f]" />
                              <span>{tx.user.phone}</span>
                            </a>
                          )}
                          <Link
                            href={`/dashboard/users/${tx.user?.id}`}
                            className="text-xs text-[#6a5a4c] hover:text-[#221910] hover:underline"
                          >
                            {language === "bn" ? "প্রোফাইল →" : "Profile →"}
                          </Link>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDirectReturn(tx)}
                          disabled={working}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#f6ecdd] bg-[#2d5a3c] hover:bg-[#22442d] rounded-lg transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          <FaCheck className="w-3 h-3" />
                          <span>
                            {working
                              ? language === "bn"
                                ? "প্রসেসিং..."
                                : "Processing..."
                              : language === "bn"
                                ? "বই ফেরত নিন"
                                : "Mark Returned"}
                          </span>
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── History ── */}
        {activeTab === "history" && (
          <div className="p-2.5 sm:p-5 space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="relative sm:col-span-2">
                <FaSearch className="absolute left-3 top-2.5 text-[#7a6a5a]" />
                <input
                  type="text"
                  placeholder={t.transactions.filters.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-lg focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-xs sm:text-sm"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-lg focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-xs sm:text-sm"
              >
                <option value="date">{t.transactions.filters.sort.date}</option>
                <option value="member">
                  {t.transactions.filters.sort.member}
                </option>
              </select>
            </div>

            {/* Mobile History Cards */}
            <div className="space-y-2 lg:hidden">
              {historyTransactions.length === 0 ? (
                <div className="p-8 text-center text-[#6a5a4c] ink-text border border-[#cfbba1] rounded-xl">
                  {t.transactions.empty.noHistory}
                </div>
              ) : (
                historyTransactions.map((tx) => (
                  <article
                    key={tx.id}
                    className="border border-[#b9a58b] bg-[#f6ecdd] rounded-xl p-3 sm:p-3.5 ink-text"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/dashboard/users/${tx.user?.id}`}
                          className="text-sm font-bold text-[#221910] hover:underline truncate block"
                        >
                          {tx.user?.full_name ?? t.common.unknown}
                        </Link>
                        <p className="text-xs text-[#5a4b3f] truncate mt-0.5">
                          {tx.book?.title ?? t.common.unknown}{" "}
                          <span className="font-mono text-[10px] opacity-70">
                            ({tx.copy?.id ?? tx.copy_id})
                          </span>
                        </p>
                      </div>
                      {(tx as any)._isPdf ? (
                        <StatusBadge
                          tone={
                            (tx as any)._pdfStatus === "approved"
                              ? "success"
                              : "danger"
                          }
                          size="xs"
                          className="shrink-0"
                        >
                          {(tx as any)._pdfStatus === "approved"
                            ? t.bookList.bookCard.pdfStatus.approved
                            : t.bookList.bookCard.pdfStatus.rejected}
                        </StatusBadge>
                      ) : (
                        <StatusBadge
                          tone={
                            tx.status === "completed" ? "success" : "danger"
                          }
                          size="xs"
                          className="shrink-0"
                        >
                          {tx.status === "completed"
                            ? t.history.status.returned
                            : t.history.status.rejected_borrow}
                        </StatusBadge>
                      )}
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-[#dfceb9] flex items-center justify-between text-xs text-[#6a5a4c]">
                      <span className="text-[11px] uppercase tracking-wider font-semibold">
                        {(tx as any)._isPdf
                          ? t.transactions.tabs.pdf
                          : tx.type === "borrow"
                            ? t.history.table.borrowed
                            : tx.type === "return"
                              ? t.history.table.returned
                              : tx.type}
                      </span>
                      <span>
                        {formatDate(tx.request_date, language)} (
                        {getRelativeTime(tx.request_date)})
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>

            {/* Desktop History Table */}
            <div className="hidden lg:block overflow-x-auto border border-[#b9a58b] rounded-xl">
              <table className="w-full text-sm ink-text min-w-[640px]">
                <thead>
                  <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                    {[
                      t.transactions.table.member,
                      t.transactions.table.book,
                      t.transactions.table.type,
                      t.transactions.table.status,
                      t.transactions.table.date,
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[#3a2e22] ink-title"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c9b89a]/50">
                  {historyTransactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-[#6a5a4c] ink-text text-sm"
                      >
                        {t.transactions.empty.noHistory}
                      </td>
                    </tr>
                  ) : (
                    historyTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-[#f0e4d2] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/users/${tx.user?.id}`}
                            className="font-medium hover:underline text-[#2b2119] block"
                          >
                            {tx.user?.full_name ?? t.common.unknown}
                          </Link>
                          {tx.user?.username && (
                            <span className="text-xs text-[#7a6a5a]">
                              @{tx.user.username}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[#2b2119] font-medium block">
                            {tx.book?.title ?? t.common.unknown}
                          </span>
                          <span className="font-mono text-xs text-[#5a4b3f]">
                            {tx.copy?.id ?? tx.copy_id}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#5a4b3f] capitalize">
                          {(tx as any)._isPdf ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-xs text-[#8b5c4a]">
                              <FaFileAlt className="w-3 h-3" />
                              {t.transactions.tabs.pdf}
                            </span>
                          ) : (
                            tx.type
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {(tx as any)._isPdf ? (
                            <StatusBadge
                              tone={
                                (tx as any)._pdfStatus === "approved"
                                  ? "success"
                                  : "danger"
                              }
                              size="xs"
                            >
                              {(tx as any)._pdfStatus === "approved"
                                ? t.bookList.bookCard.pdfStatus.approved
                                : t.bookList.bookCard.pdfStatus.rejected}
                            </StatusBadge>
                          ) : (
                            <StatusBadge
                              tone={
                                tx.status === "completed" ? "success" : "danger"
                              }
                              size="xs"
                            >
                              {tx.status === "completed"
                                ? t.history.status.returned
                                : t.history.status.rejected_borrow}
                            </StatusBadge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#5a4b3f] whitespace-nowrap">
                          <span
                            className="text-xs border-b border-dashed border-[#bfa687] cursor-help"
                            title={new Date(tx.request_date).toLocaleString(
                              language === "bn" ? "bn-BD" : "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              },
                            )}
                          >
                            {getRelativeTime(tx.request_date)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PDF Reports ── */}
        {activeTab === "pdf" && (
          <div className="p-2.5 sm:p-5">
            {pendingPdfs.length === 0 ? (
              <div className="p-8 sm:p-10 text-center border border-[#b9a58b] rounded-xl text-[#6a5a4c] ink-text">
                <FaFileAlt className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 opacity-40" />
                <p>{t.transactions.empty.noPdfs}</p>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">
                {pendingPdfs.map((pdf) => {
                  const working = processingId === pdf.id && isPending;
                  return (
                    <article
                      key={pdf.id}
                      className="border border-[#b9a58b] rounded-xl bg-[#f6ecdd] p-3 sm:p-4 ink-text"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                          {/* Profile Photo */}
                          <div className="shrink-0">
                            <Link href={`/dashboard/users/${pdf.user?.id}`}>
                              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-[#cfbba1] bg-[#ece0ce] hover:border-[#8b5c4a] transition-colors">
                                {pdf.user?.avatar_url ? (
                                  <Image
                                    src={pdf.user.avatar_url}
                                    alt={pdf.user.full_name || ""}
                                    fill
                                    referrerPolicy="no-referrer"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#8b5c4a] font-bold text-sm">
                                    {(pdf.user?.full_name || "?")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </Link>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#2b2119] truncate">
                              <Link
                                href={`/dashboard/users/${pdf.user?.id}`}
                                className="hover:underline hover:text-[#5a4b3f] transition-colors"
                              >
                                {pdf.user?.full_name ?? t.common.unknown}
                              </Link>
                            </p>
                            <p className="text-xs text-[#5a4b3f] mt-0.5 truncate">
                              {pdf.book?.title ?? t.common.unknown}
                            </p>
                          </div>
                        </div>
                        <StatusBadge
                          tone="warning"
                          size="xs"
                          className="shrink-0"
                        >
                          {t.bookList.bookCard.pdfReport}
                        </StatusBadge>
                      </div>

                      <div className="mb-3 text-xs text-[#5a4b3f] space-y-1 sm:pl-[52px]">
                        <p>
                          {t.transactions.pdf.submitted}:{" "}
                          {formatDate(pdf.submitted_at, language)}
                        </p>
                        {pdf.note && (
                          <div className="bg-[#f0e4d1] border border-[#c9b89a] p-2 rounded-lg mt-2 italic text-[#3f3328]">
                            &quot;{pdf.note}&quot;
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-[#cfbba1] flex-wrap">
                        {pdf.book?.pdf_link && (
                          <a
                            href={pdf.book.pdf_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#f6ecdd] bg-[#5a4d40] hover:bg-[#4a3e33] rounded-lg transition-colors shadow-xs"
                          >
                            <FaFileAlt className="w-3 h-3" />
                            {t.bookList.bookCard.readPdf}
                          </a>
                        )}
                        <button
                          disabled={working}
                          onClick={() => handleApprovePdf(pdf)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#f6ecdd] bg-[#2d5a3c] hover:bg-[#22442d] rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <FaCheck className="w-3 h-3" />
                          {working
                            ? t.transactions.actions.approving
                            : t.transactions.actions.approve}
                        </button>
                        <button
                          disabled={working}
                          onClick={() =>
                            openRejectModal(
                              "pdf",
                              pdf.id,
                              pdf.book?.title ?? t.common.unknown,
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#f6ecdd] bg-[#8b5c4a] hover:bg-[#6b4437] rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <FaTimes className="w-3 h-3" />
                          {t.transactions.actions.reject}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Reject Modal ── */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="dashboard-surface tron-border w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-[#221910] ink-title mb-1">
              {t.transactions.actions.confirmReject}
            </h3>
            <p className="text-sm text-[#5a4b3f] ink-text mb-4">
              {rejectTarget.title}
            </p>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="reason"
                  className="block text-xs font-bold text-[#6a5a4c] uppercase tracking-wider mb-1.5"
                >
                  {t.transactions.actions.rejectionReason}
                </label>
                <textarea
                  id="reason"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-[#8a7966] bg-[#f8f1e6] text-[#2f251d] rounded-sm focus:ring-1 focus:ring-[#6e5d4a] outline-none ink-text text-sm resize-none"
                  placeholder="..."
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeRejectModal}
                  className="flex-1 px-4 py-2.5 border border-[#8a7966] text-[#4e4033] rounded-sm font-bold hover:bg-[#ece0ce] transition-colors ink-text text-sm"
                >
                  {t.transactions.actions.cancel}
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="flex-1 px-4 py-2.5 bg-[#8b5c4a] text-[#f6ecdd] rounded-sm font-bold hover:bg-[#6b4437] transition-colors ink-text text-sm"
                >
                  {t.transactions.actions.reject}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
