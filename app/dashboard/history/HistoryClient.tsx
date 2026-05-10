"use client";

import StatusBadge from "@/app/components/StatusBadge";
import type { PdfSubmission, Transaction } from "@/types/library";
import { useMemo, useState } from "react";
import {
  FaBook,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaFileAlt,
  FaSearch,
  FaTimesCircle,
} from "react-icons/fa";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type BorrowFilter =
  | "all"
  | "active"
  | "completed"
  | "overdue"
  | "pending"
  | "rejected";

interface Props {
  transactions: Transaction[];
  pdfSubmissions: PdfSubmission[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const FILTER_LABELS: Record<BorrowFilter, string> = {
  all: "All",
  active: "Active",
  completed: "Completed",
  overdue: "Overdue",
  pending: "Pending",
  rejected: "Rejected",
};

const FILTERS: BorrowFilter[] = [
  "all",
  "active",
  "completed",
  "overdue",
  "pending",
  "rejected",
];

// ─────────────────────────────────────────────────────────────────────────────
// Badge sub-components
// ─────────────────────────────────────────────────────────────────────────────

function BorrowStatusBadge({ status }: { status: Transaction["status"] }) {
  switch (status) {
    case "active":
      return (
        <StatusBadge tone="info" icon={FaClock}>
          Active
        </StatusBadge>
      );
    case "completed":
      return (
        <StatusBadge tone="success" icon={FaCheckCircle}>
          Completed
        </StatusBadge>
      );
    case "overdue":
      return (
        <StatusBadge tone="danger" icon={FaExclamationTriangle}>
          Overdue
        </StatusBadge>
      );
    case "pending":
      return (
        <StatusBadge tone="warning" icon={FaClock}>
          Pending
        </StatusBadge>
      );
    case "rejected":
      return (
        <StatusBadge tone="danger" icon={FaTimesCircle}>
          Rejected
        </StatusBadge>
      );
    default:
      return <StatusBadge tone="neutral">{status}</StatusBadge>;
  }
}

function PdfStatusBadge({ status }: { status: PdfSubmission["status"] }) {
  switch (status) {
    case "approved":
      return (
        <StatusBadge tone="success" icon={FaCheckCircle}>
          Approved
        </StatusBadge>
      );
    case "pending":
      return (
        <StatusBadge tone="warning" icon={FaClock}>
          Pending
        </StatusBadge>
      );
    case "rejected":
      return (
        <StatusBadge tone="danger" icon={FaTimesCircle}>
          Rejected
        </StatusBadge>
      );
    default:
      return <StatusBadge tone="neutral">{status}</StatusBadge>;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function HistoryClient({ transactions, pdfSubmissions }: Props) {
  const [borrowSearch, setBorrowSearch] = useState("");
  const [borrowFilter, setBorrowFilter] = useState<BorrowFilter>("all");

  // Only borrow-type transactions (already newest-first from the server)
  const borrowTransactions = useMemo(
    () => transactions.filter((tx) => tx.type === "borrow"),
    [transactions],
  );

  const filteredBorrows = useMemo(() => {
    const q = borrowSearch.toLowerCase().trim();
    return borrowTransactions.filter((tx) => {
      const matchesSearch =
        !q ||
        (tx.book?.title ?? "").toLowerCase().includes(q) ||
        tx.copy_id.toLowerCase().includes(q);
      const matchesFilter =
        borrowFilter === "all" || tx.status === borrowFilter;
      return matchesSearch && matchesFilter;
    });
  }, [borrowTransactions, borrowSearch, borrowFilter]);

  return (
    <div className="space-y-10">
      {/* ── Page title ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
          History
        </h1>
        <p className="text-sm text-[#5c4f42] mt-1 ink-text">
          Your borrowing and PDF reading activity
        </p>
      </div>

      {/* ── Section 1: Borrow History ───────────────────────────── */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#2f251d] ink-title">
          <FaBook className="w-4 h-4 text-[#5c4a3a]" />
          Borrow History
          <span className="text-sm font-normal text-[#6e5e50] ink-text ml-0.5">
            ({borrowTransactions.length})
          </span>
        </h2>

        {/* Search + filter bar */}
        <div className="dashboard-surface tron-border rounded-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search input */}
            <div className="relative flex-1 min-w-0">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78695a] w-3.5 h-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by book title or copy ID…"
                value={borrowSearch}
                onChange={(e) => setBorrowSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-[#5a4d40] ink-text"
              />
            </div>

            {/* Status filter pills */}
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setBorrowFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-sm border transition-colors ink-text ${
                    borrowFilter === f
                      ? "bg-[#5a4d40] text-[#f4e8d4] border-[#5a4d40]"
                      : "bg-[#f0e4d1] text-[#4e4033] border-[#b5a490] hover:bg-[#eadcc8]"
                  }`}
                >
                  {FILTER_LABELS[f]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Borrow table */}
        <div className="dashboard-surface tron-border rounded-sm overflow-hidden">
          {filteredBorrows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#b9a992] bg-[#eadcca]">
                    <th className="text-left py-3 px-4 lg:px-6 font-semibold text-[#4e4033] ink-text">
                      Book
                    </th>
                    <th className="text-left py-3 px-4 lg:px-6 font-semibold text-[#4e4033] ink-text">
                      Copy ID
                    </th>
                    <th className="text-left py-3 px-4 lg:px-6 font-semibold text-[#4e4033] ink-text whitespace-nowrap">
                      Borrowed
                    </th>
                    <th className="text-left py-3 px-4 lg:px-6 font-semibold text-[#4e4033] ink-text whitespace-nowrap">
                      Due
                    </th>
                    <th className="text-left py-3 px-4 lg:px-6 font-semibold text-[#4e4033] ink-text whitespace-nowrap">
                      Returned
                    </th>
                    <th className="text-left py-3 px-4 lg:px-6 font-semibold text-[#4e4033] ink-text">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBorrows.map((tx, i) => (
                    <tr
                      key={tx.id}
                      className={`hover:bg-[#f0e4d2] transition-colors ${
                        i < filteredBorrows.length - 1
                          ? "border-b border-[#c5b59d]"
                          : ""
                      }`}
                    >
                      <td className="py-3 px-4 lg:px-6">
                        <p className="font-medium text-[#221910] ink-title leading-snug">
                          {tx.book?.title ?? "—"}
                        </p>
                        {tx.book?.author && (
                          <p className="text-xs text-[#5c4f42] ink-text mt-0.5">
                            {tx.book.author}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 lg:px-6">
                        <span className="font-mono text-xs text-[#3d2f1f] bg-[#ede3d5] border border-[#c5b59d] px-2 py-0.5 rounded-sm">
                          {tx.copy_id}
                        </span>
                      </td>
                      <td className="py-3 px-4 lg:px-6 text-xs text-[#5c4f42] ink-text whitespace-nowrap">
                        {formatDate(tx.request_date)}
                      </td>
                      <td className="py-3 px-4 lg:px-6 text-xs text-[#5c4f42] ink-text whitespace-nowrap">
                        {formatDate(tx.due_date)}
                      </td>
                      <td className="py-3 px-4 lg:px-6 text-xs text-[#5c4f42] ink-text whitespace-nowrap">
                        {formatDate(tx.return_date)}
                      </td>
                      <td className="py-3 px-4 lg:px-6">
                        <BorrowStatusBadge status={tx.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-[#5c4f42] ink-text">No borrow records found</p>
              <p className="text-sm text-[#7a6a5c] ink-text mt-1">
                Try adjusting your search or filter
              </p>
            </div>
          )}
        </div>

        {/* Count footer */}
        <p className="text-xs text-[#6a5c4e] ink-text text-right">
          Showing {filteredBorrows.length} of {borrowTransactions.length} borrow
          records
        </p>
      </section>

      {/* ── Section 2: PDF Reading Reports ──────────────────────── */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#2f251d] ink-title">
          <FaFileAlt className="w-4 h-4 text-[#5c4a3a]" />
          PDF Reading Reports
          <span className="text-sm font-normal text-[#6e5e50] ink-text ml-0.5">
            ({pdfSubmissions.length})
          </span>
        </h2>

        <div className="dashboard-surface tron-border rounded-sm overflow-hidden">
          {pdfSubmissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#b9a992] bg-[#eadcca]">
                    <th className="text-left py-3 px-4 lg:px-6 font-semibold text-[#4e4033] ink-text">
                      Book
                    </th>
                    <th className="text-left py-3 px-4 lg:px-6 font-semibold text-[#4e4033] ink-text whitespace-nowrap">
                      Submitted
                    </th>
                    <th className="text-left py-3 px-4 lg:px-6 font-semibold text-[#4e4033] ink-text">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 lg:px-6 font-semibold text-[#4e4033] ink-text">
                      Note / Reason
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pdfSubmissions.map((pdf, i) => (
                    <tr
                      key={pdf.id}
                      className={`hover:bg-[#f0e4d2] transition-colors ${
                        i < pdfSubmissions.length - 1
                          ? "border-b border-[#c5b59d]"
                          : ""
                      }`}
                    >
                      <td className="py-3 px-4 lg:px-6">
                        <p className="font-medium text-[#221910] ink-title leading-snug">
                          {pdf.book?.title ?? "—"}
                        </p>
                        {pdf.book?.author && (
                          <p className="text-xs text-[#5c4f42] ink-text mt-0.5">
                            {pdf.book.author}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 lg:px-6 text-xs text-[#5c4f42] ink-text whitespace-nowrap">
                        {formatDate(pdf.submitted_at)}
                      </td>
                      <td className="py-3 px-4 lg:px-6">
                        <PdfStatusBadge status={pdf.status} />
                      </td>
                      <td className="py-3 px-4 lg:px-6 max-w-xs">
                        {pdf.rejection_reason ? (
                          <p className="text-xs text-[#7a3a30] ink-text">
                            {pdf.rejection_reason}
                          </p>
                        ) : pdf.note ? (
                          <p className="text-xs text-[#5c4f42] ink-text">
                            {pdf.note}
                          </p>
                        ) : (
                          <span className="text-xs text-[#9a8a7c] ink-text">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-[#5c4f42] ink-text">No PDF submissions yet</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
