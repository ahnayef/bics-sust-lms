"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/app/components/StatusBadge";
import type { Transaction, PdfSubmission } from "@/types/library";
import {
  allowBorrowRequest,
  rejectBorrowRequest,
  approveReturnRequest,
  rejectReturnRequest,
  approvePdfReport,
  rejectPdfReport,
} from "@/server/transaction-actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FaCheck, FaClock, FaFileAlt, FaSearch, FaTimes } from "react-icons/fa";

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

function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
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
function CountBadge({ n }: { n: number }) {
  if (n === 0) return null;
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#5a4d40] text-[#f4e8d4] text-[10px] font-bold leading-none ml-1">
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [dueDates, setDueDates] = useState<Record<string, string>>({});
  const [rejectTarget, setRejectTarget] = useState<RejectTarget | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // ── Derived lists ──────────────────────────────────────────────────────────

  const pendingBorrows = useMemo(
    () =>
      transactions.filter(
        (tx) => tx.status === "pending" && tx.type === "borrow",
      ),
    [transactions],
  );

  const pendingReturns = useMemo(
    () =>
      transactions.filter(
        (tx) => tx.status === "pending" && tx.type === "return",
      ),
    [transactions],
  );

  const pendingPdfs = useMemo(
    () => pdfSubmissions.filter((s) => s.status === "pending"),
    [pdfSubmissions],
  );

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
        const matchStatus =
          statusFilter === "all" || tx.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, searchTerm, sortBy, statusFilter]);

  const historyTransactions = useMemo(() => {
    const base = transactions.filter(
      (tx) => tx.status === "completed" || tx.status === "rejected",
    );

    // Map approved/rejected PDFs to look like transactions for the history table
    const pdfToTx: Transaction[] = pdfSubmissions
      .filter((pdf) => pdf.status === "approved" || pdf.status === "rejected")
      .map(
        (pdf) =>
          ({
            id: pdf.id,
            user: pdf.user,
            book: pdf.book,
            copy_id: "—",
            copy: null,
            type: "PDF Report" as any, // Type override for UI
            status: pdf.status === "approved" ? "completed" : "rejected",
            request_date: pdf.submitted_at,
          }) as unknown as Transaction,
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
  }, [transactions, pdfSubmissions, searchTerm, sortBy]);

  const summary = useMemo(
    () => ({
      pending: transactions.filter((tx) => tx.status === "pending").length,
      active: transactions.filter((tx) => tx.status === "active").length,
      overdue: transactions.filter((tx) => tx.status === "overdue").length,
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
        router.refresh();
      }
    });
  }

  function handleApproveBorrow(tx: Transaction) {
    const due = dueDates[tx.id] ?? defaultDueDate();
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
    const due = dueDates[tx.id] ?? defaultDueDate();
    return (
      <article
        key={tx.id}
        className="border border-[#b9a58b] rounded-sm bg-[#f6ecdd] p-4 ink-text"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-[#2b2119]">
              <Link
                href={`/dashboard/users/${tx.user?.id}`}
                className="hover:underline hover:text-[#5a4b3f] transition-colors"
              >
                {tx.user?.full_name ?? "Unknown Member"}
              </Link>
            </p>
            <p className="text-xs text-[#5a4b3f] mt-0.5">
              {tx.book?.title ?? "Unknown Book"}{" "}
              <span className="font-mono">({tx.copy?.id ?? tx.copy_id})</span>
            </p>
          </div>
          <StatusBadge tone="info" size="xs" className="shrink-0">
            Borrow
          </StatusBadge>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#5a4b3f]">
          <p>Requested: {formatDate(tx.request_date)}</p>
          <div className="flex items-center gap-1.5">
            <label htmlFor={`due-${tx.id}`} className="shrink-0">
              Due:
            </label>
            <input
              id={`due-${tx.id}`}
              type="date"
              value={due}
              min={todayStr()}
              onChange={(e) =>
                setDueDates((prev) => ({ ...prev, [tx.id]: e.target.value }))
              }
              className="flex-1 min-w-0 px-2 py-0.5 border border-[#8a7966] bg-[#f0e6d3] text-[#2f251d] rounded-sm focus:ring-1 focus:ring-[#6e5d4a] outline-none ink-text text-xs"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-[#cfbba1]">
          <button
            disabled={working}
            onClick={() => handleApproveBorrow(tx)}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#f6ecdd] bg-[#4a7c59] hover:bg-[#3d6447] rounded-sm transition-colors border border-[#3d6447] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaCheck className="w-3.5 h-3.5" />
            {working ? "Working…" : "Approve"}
          </button>
          <button
            disabled={working}
            onClick={() =>
              openRejectModal("borrow", tx.id, tx.book?.title ?? "Unknown Book")
            }
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#f6ecdd] bg-[#8b5c4a] hover:bg-[#6b4437] rounded-sm transition-colors border border-[#6b4437] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaTimes className="w-3.5 h-3.5" />
            Reject
          </button>
        </div>
      </article>
    );
  }

  function renderReturnCard(tx: Transaction) {
    const working = processingId === tx.id && isPending;
    return (
      <article
        key={tx.id}
        className="border border-[#b9a58b] rounded-sm bg-[#f6ecdd] p-4 ink-text"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-[#2b2119]">
              <Link
                href={`/dashboard/users/${tx.user?.id}`}
                className="hover:underline hover:text-[#5a4b3f] transition-colors"
              >
                {tx.user?.full_name ?? "Unknown Member"}
              </Link>
            </p>
            <p className="text-xs text-[#5a4b3f] mt-0.5">
              {tx.book?.title ?? "Unknown Book"}{" "}
              <span className="font-mono">({tx.copy?.id ?? tx.copy_id})</span>
            </p>
          </div>
          <StatusBadge tone="accent" size="xs" className="shrink-0">
            Return
          </StatusBadge>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#5a4b3f]">
          <p>Requested: {formatDate(tx.request_date)}</p>
          <p>Borrowed on: {formatDate(tx.approved_date)}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-[#cfbba1]">
          <button
            disabled={working}
            onClick={() => handleApproveReturn(tx)}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#f6ecdd] bg-[#4a7c59] hover:bg-[#3d6447] rounded-sm transition-colors border border-[#3d6447] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaCheck className="w-3.5 h-3.5" />
            {working ? "Working…" : "Approve Return"}
          </button>
          <button
            disabled={working}
            onClick={() =>
              openRejectModal("return", tx.id, tx.book?.title ?? "Unknown Book")
            }
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#f6ecdd] bg-[#8b5c4a] hover:bg-[#6b4437] rounded-sm transition-colors border border-[#6b4437] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaTimes className="w-3.5 h-3.5" />
            Reject
          </button>
        </div>
      </article>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Stats */}
      <section
        className="dashboard-surface tron-border rounded-sm p-5 sm:p-6"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
          Transactions
        </h1>
        <p className="text-sm text-[#5a4b3f] mt-1 mb-5 ink-text">
          Review requests, monitor live borrows, and track completed returns.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-[#f3e2de] border border-[#b58a82] rounded-sm text-sm text-[#6f3d35] ink-text">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(
            [
              { label: "Pending", value: summary.pending },
              { label: "Active", value: summary.active },
              { label: "Overdue", value: summary.overdue },
              { label: "Completed", value: summary.completed },
            ] as const
          ).map(({ label, value }) => (
            <div
              key={label}
              className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3"
            >
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text">
                {label}
              </p>
              <p className="text-2xl font-bold text-[#221910] ink-title">
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <section
        className="dashboard-surface tron-border rounded-sm border border-[#5f4f40] overflow-hidden"
      >
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Tab bar */}
          <TabsList className="w-full h-auto rounded-none bg-[#eadcc8] border-b border-[#7d6d5a] p-0 flex">
            <TabsTrigger
              value="pending"
              className="flex-1 rounded-none py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium ink-text text-[#5a4b3f] border-r border-[#c5b090] data-[state=active]:bg-[#f0e3cf] data-[state=active]:text-[#221910] data-[state=active]:font-semibold data-[state=active]:shadow-none hover:bg-[#ece0ce] transition-colors"
            >
              Pending{" "}
              <CountBadge n={pendingBorrows.length + pendingReturns.length} />
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="flex-1 rounded-none py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium ink-text text-[#5a4b3f] border-r border-[#c5b090] data-[state=active]:bg-[#f0e3cf] data-[state=active]:text-[#221910] data-[state=active]:font-semibold data-[state=active]:shadow-none hover:bg-[#ece0ce] transition-colors"
            >
              Active <CountBadge n={summary.active + summary.overdue} />
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex-1 rounded-none py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium ink-text text-[#5a4b3f] border-r border-[#c5b090] data-[state=active]:bg-[#f0e3cf] data-[state=active]:text-[#221910] data-[state=active]:font-semibold data-[state=active]:shadow-none hover:bg-[#ece0ce] transition-colors"
            >
              History
            </TabsTrigger>
            <TabsTrigger
              value="pdf"
              className="flex-1 rounded-none py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium ink-text text-[#5a4b3f] data-[state=active]:bg-[#f0e3cf] data-[state=active]:text-[#221910] data-[state=active]:font-semibold data-[state=active]:shadow-none hover:bg-[#ece0ce] transition-colors flex items-center justify-center gap-1.5"
            >
              <FaFileAlt className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">PDF Reports</span>
              <span className="sm:hidden">PDF</span>
              <CountBadge n={pendingPdfs.length} />
            </TabsTrigger>
          </TabsList>

          {/* ── Pending ── */}
          <TabsContent value="pending" className="p-4 sm:p-6 mt-0">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <section className="space-y-3">
                <header className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[#2b2119] ink-title">
                    Borrow Requests
                  </h2>
                  <span className="text-xs text-[#6a5a4c] ink-text">
                    {pendingBorrows.length} waiting
                  </span>
                </header>
                {pendingBorrows.length === 0 ? (
                  <div className="border border-[#cfbba1] rounded-sm p-6 text-center text-[#6a5a4c] ink-text">
                    No borrow requests waiting.
                  </div>
                ) : (
                  pendingBorrows.map(renderBorrowCard)
                )}
              </section>

              <section className="space-y-3">
                <header className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[#2b2119] ink-title">
                    Return Requests
                  </h2>
                  <span className="text-xs text-[#6a5a4c] ink-text">
                    {pendingReturns.length} waiting
                  </span>
                </header>
                {pendingReturns.length === 0 ? (
                  <div className="border border-[#cfbba1] rounded-sm p-6 text-center text-[#6a5a4c] ink-text">
                    No return requests waiting.
                  </div>
                ) : (
                  pendingReturns.map(renderReturnCard)
                )}
              </section>
            </div>
          </TabsContent>

          {/* ── Active ── */}
          <TabsContent value="active" className="p-4 sm:p-6 mt-0 space-y-4">
            {/* Search + filters */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="relative lg:col-span-2">
                <FaSearch className="absolute left-3 top-2.5 text-[#7a6a5a]" />
                <input
                  type="text"
                  placeholder="Search member, book, or copy ID…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                  className="w-full px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="overdue">Overdue</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="w-full px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text"
                >
                  <option value="date">Newest</option>
                  <option value="member">Member</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {activeTransactions.length === 0 ? (
                <div className="border border-[#cfbba1] rounded-sm p-8 text-center text-[#6a5a4c] ink-text">
                  No active borrows match current filters.
                </div>
              ) : (
                activeTransactions.map((tx) => (
                  <article
                    key={tx.id}
                    className="border border-[#b9a58b] rounded-sm bg-[#f6ecdd] p-4 ink-text"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#2b2119]">
                          <Link
                            href={`/dashboard/users/${tx.user?.id}`}
                            className="hover:underline hover:text-[#5a4b3f] transition-colors"
                          >
                            {tx.user?.full_name ?? "Unknown Member"}
                          </Link>
                        </p>
                        <p className="text-sm text-[#5a4b3f]">
                          {tx.book?.title ?? "Unknown Book"}{" "}
                          <span className="font-mono">
                            ({tx.copy?.id ?? tx.copy_id})
                          </span>
                        </p>
                      </div>
                      <StatusBadge
                        tone={tx.status === "overdue" ? "danger" : "info"}
                        size="xs"
                        icon={FaClock}
                      >
                        {tx.status === "overdue" ? "Overdue" : "Active"}
                      </StatusBadge>
                    </div>
                    <div className="mt-2 text-xs text-[#5a4b3f] grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <p>Requested: {formatDate(tx.request_date)}</p>
                      <p
                        className={
                          isOverdueDate(tx.due_date)
                            ? "font-semibold text-red-700"
                            : ""
                        }
                      >
                        Due: {formatDate(tx.due_date)}
                      </p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </TabsContent>

          {/* ── History ── */}
          <TabsContent value="history" className="p-4 sm:p-6 mt-0 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="relative lg:col-span-2">
                <FaSearch className="absolute left-3 top-2.5 text-[#7a6a5a]" />
                <input
                  type="text"
                  placeholder="Search member, book, or copy ID…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text"
              >
                <option value="date">Newest</option>
                <option value="member">Member Name</option>
              </select>
            </div>

            <div className="overflow-x-auto border border-[#b9a58b] rounded-sm">
              <table className="w-full text-sm ink-text min-w-[640px]">
                <thead>
                  <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                    {["Member", "Book", "Copy", "Type", "Status", "Date"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {historyTransactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-[#6a5a4c]"
                      >
                        No completed transactions match current filters.
                      </td>
                    </tr>
                  ) : (
                    historyTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-[#2b2119]">
                          <Link
                            href={`/dashboard/users/${tx.user?.id}`}
                            className="hover:underline hover:text-[#5a4b3f] transition-colors"
                          >
                            {tx.user?.full_name ?? "—"}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-[#5a4b3f] max-w-48 truncate">
                          {tx.book?.title ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs bg-[#efe4d1] text-[#3f3328] border border-[#8f7f6c] px-2 py-1 rounded-sm">
                            {tx.copy?.id ?? tx.copy_id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            tone={
                              tx.type === "borrow"
                                ? "info"
                                : tx.type === "return"
                                  ? "accent"
                                  : "success"
                            }
                            size="xs"
                          >
                            {tx.type}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            tone={
                              tx.status === "completed" ? "success" : "danger"
                            }
                            size="xs"
                          >
                            {tx.status}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-[#5a4b3f] whitespace-nowrap">
                          {formatDate(tx.request_date)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ── PDF Reports ── */}
          <TabsContent value="pdf" className="p-4 sm:p-6 mt-0">
            {pendingPdfs.length === 0 ? (
              <div className="p-10 text-center border border-[#b9a58b] rounded-sm text-[#6a5a4c] ink-text">
                <FaFileAlt className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No pending PDF submissions to review.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPdfs.map((pdf) => {
                  const working = processingId === pdf.id && isPending;
                  return (
                    <article
                      key={pdf.id}
                      className="border border-[#b9a58b] rounded-sm bg-[#f6ecdd] p-4 ink-text"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#5a4b3f]">
                            <Link
                              href={`/dashboard/users/${pdf.user?.id}`}
                              className="hover:underline hover:text-[#3b3026] transition-colors"
                            >
                              {pdf.user?.full_name ?? "Unknown"}
                              {pdf.user?.username && (
                                <span className="font-mono ml-1">
                                  (@{pdf.user.username})
                                </span>
                              )}
                            </Link>
                          </p>
                          <p className="font-semibold text-[#2b2119] mt-0.5">
                            {pdf.book?.title ?? "Unknown Book"}
                          </p>
                          {pdf.read_date && (
                            <p className="text-xs text-[#5a4b3f] mt-1">
                              Read:{" "}
                              {new Date(pdf.read_date).toLocaleDateString()}
                            </p>
                          )}
                          <p className="text-xs text-[#5a4b3f]">
                            Submitted: {formatDate(pdf.submitted_at)}
                          </p>
                          {pdf.note && (
                            <p className="text-xs text-[#6a5a4c] mt-2 italic">
                              &ldquo;{pdf.note}&rdquo;
                            </p>
                          )}
                        </div>
                        <StatusBadge
                          tone="accent"
                          size="xs"
                          className="shrink-0"
                        >
                          Pending
                        </StatusBadge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#c5b5a1]">
                        <button
                          disabled={working}
                          onClick={() => handleApprovePdf(pdf)}
                          className="px-3 py-2 bg-[#4a7c59] text-[#f6ecdd] border border-[#3d6447] rounded-sm hover:bg-[#3d6447] transition-colors text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaCheck className="w-3.5 h-3.5" />
                          {working ? "Working…" : "Approve"}
                        </button>
                        <button
                          disabled={working}
                          onClick={() =>
                            openRejectModal(
                              "pdf",
                              pdf.id,
                              pdf.book?.title ?? "Unknown Book",
                            )
                          }
                          className="px-3 py-2 bg-[#8b5c4a] text-[#f6ecdd] border border-[#6b4437] rounded-sm hover:bg-[#6b4437] transition-colors text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaTimes className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* Reject modal */}
      {rejectTarget && (
        <div
          className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-4 z-80"
          onClick={(e) => e.target === e.currentTarget && closeRejectModal()}
        >
          <div className="dashboard-surface tron-border rounded-sm max-w-md w-full p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-[#221910] ink-title">
                Reject{" "}
                {rejectTarget.kind === "pdf"
                  ? "PDF Report"
                  : rejectTarget.kind === "borrow"
                    ? "Borrow Request"
                    : "Return Request"}
              </h2>
              <button
                onClick={closeRejectModal}
                className="p-1.5 text-[#655648] hover:bg-[#e7d8c3] rounded-sm"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-[#5a4b3f] ink-text mb-1 font-medium truncate">
              {rejectTarget.title}
            </p>
            <label className="block text-sm font-medium text-[#4f4134] mb-1 mt-3 ink-text">
              Reason{" "}
              <span className="font-normal text-[#7a6a5c]">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this request is being rejected…"
              className="w-full px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-sm resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={closeRejectModal}
                className="flex-1 py-2.5 border border-[#8a7966] text-[#4f4134] rounded-sm hover:bg-[#eadcc8] font-medium ink-text"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 bg-[#8b5c4a] text-[#f6ecdd] border border-[#6b4437] rounded-sm hover:bg-[#6b4437] font-medium ink-text"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
