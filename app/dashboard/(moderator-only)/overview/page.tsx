import { TRANSACTION_STATUS_COLORS } from "@/lib/constants";
import { getOverviewData } from "@/server/library";
import type {
  PdfSubmission,
  PopularBook,
  TopMember,
  Transaction,
} from "@/types/library";
import Image from "next/image";
import Link from "next/link";
import {
  FaArrowRight,
  FaExchangeAlt,
  FaExclamationTriangle,
  FaFileAlt,
  FaHourglassHalf,
} from "react-icons/fa";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function daysOverdue(dueDate: string | null): number {
  if (!dueDate) return 0;
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(dueDate).getTime()) / 86_400_000),
  );
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (
    (parts[0][0]?.toUpperCase() ?? "") +
    (parts[parts.length - 1][0]?.toUpperCase() ?? "")
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI atoms
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  href,
  urgent = false,
}: {
  label: string;
  value: number | string;
  sub?: string;
  href?: string;
  urgent?: boolean;
}) {
  const cls = urgent
    ? "border-[#c4614a] bg-[#fdf0ec] hover:bg-[#f9e6e1]"
    : "border-[#b9a58b] bg-[#f6ecdd] hover:bg-[#f0e6d3]";
  const valCls = urgent ? "text-[#9b3a25]" : "text-[#221910]";

  const inner = (
    <div
      className={`border rounded-sm p-3 sm:p-4 transition-colors h-full ${cls}`}
    >
      <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
        {label}
      </p>
      <p
        className={`text-xl sm:text-2xl font-bold ink-title mt-1 leading-none ${valCls}`}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-[#7a6a5a] ink-text mt-1">{sub}</p>}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

function SectionHeader({
  title,
  href,
  hrefLabel = "View All",
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#7d6d5a]">
      <h2 className="text-base sm:text-lg font-bold text-[#221910] ink-title">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4f4134] hover:text-[#2f251d] ink-text transition-colors"
        >
          {hrefLabel} <FaArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles = TRANSACTION_STATUS_COLORS as Record<string, string>;
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[11px] font-semibold border rounded-sm ink-text capitalize ${styles[status] ?? "border-[#b9a58b] bg-[#f6ecdd] text-[#4f4134]"}`}
    >
      {status}
    </span>
  );
}

function Avatar({
  url,
  name,
  size = "sm",
}: {
  url: string | null;
  name: string;
  size?: "sm" | "md";
}) {
  const dim = size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
  return url ? (
    <Image
      src={url}
      alt={name}
      width={size === "md" ? 36 : 28}
      height={size === "md" ? 36 : 28}
      className={`${dim} rounded-full object-cover border border-[#8a7966] shrink-0`}
    />
  ) : (
    <div
      className={`${dim} rounded-full bg-[#d9cbb7] border border-[#8a7966] flex items-center justify-center font-bold text-[#4a3e33] shrink-0 ink-title select-none`}
    >
      {getInitials(name)}
    </div>
  );
}

function BarRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs ink-text text-[#5a4b3f] mb-1">
        <span>{label}</span>
        <span className="font-semibold text-[#221910]">
          {value} / {total}
        </span>
      </div>
      <div className="w-full h-2 bg-[#e4d4bf] rounded-full overflow-hidden border border-[#ccb79b]">
        <div
          className={`h-full ${color} rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const TH = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#3b3026] whitespace-nowrap">
    {children}
  </th>
);

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default async function DashboardOverview() {
  const {
    stats,
    overdueItems,
    pendingBorrows,
    pendingReturns,
    recentActivity,
    topMembers,
    popularBooks,
    pendingPdfs,
  } = await getOverviewData();

  const urgentCount =
    stats.overdueCount +
    stats.pendingBorrowRequests +
    stats.pendingReturnRequests +
    stats.pendingPdfSubmissions;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ── Header + Key Stats ─────────────────────────────────────────── */}
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
              Dashboard Overview
            </h1>
            <p className="text-sm text-[#5c4f42] mt-1 ink-text">
              Live snapshot of library operations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {urgentCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#d0604a] bg-[#fce8e4] text-[#8b2c1a] text-xs font-semibold rounded-sm ink-text">
                <FaExclamationTriangle className="w-3 h-3" />
                {urgentCount} action{urgentCount !== 1 ? "s" : ""} needed
              </span>
            )}
            <Link
              href="/dashboard/transactions"
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#4e4033] bg-[#3f3328] text-[#f4e8d4] hover:bg-[#4a3d31] transition-colors text-xs font-medium rounded-sm ink-text"
            >
              View Transactions <FaArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <StatCard
            label="Books"
            value={stats.totalBooks}
            sub={`${stats.syllabusBooks} syllabus`}
            href="/dashboard/books"
          />
          <StatCard
            label="Copies"
            value={stats.totalCopies}
            sub={`${stats.availableCopies} available`}
            href="/dashboard/copies"
          />
          <StatCard
            label="Members"
            value={stats.totalMembers}
            sub={`${stats.verifiedMembers} verified`}
            href="/dashboard/users"
          />
          <StatCard
            label="Active Borrows"
            value={stats.activeBorrows}
            href="/dashboard/transactions?tab=active"
          />
          <StatCard
            label="Overdue"
            value={stats.overdueCount}
            urgent={stats.overdueCount > 0}
            href="/dashboard/transactions?tab=active"
          />
          <StatCard
            label="Done This Month"
            value={stats.completedThisMonth}
            sub="completed"
            href="/dashboard/transactions?tab=history"
          />
        </div>
      </section>

      {/* ── Action Required + Collection Health ──────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
        {/* Action Required */}
        <section className="dashboard-surface tron-border rounded-sm">
          <SectionHeader
            title="Action Required"
            href="/dashboard/transactions"
            hrefLabel="Open Queue"
          />
          <div className="p-4 sm:p-5 space-y-2.5">
            {[
              {
                label: "Overdue Borrows",
                count: stats.overdueCount,
                icon: FaExclamationTriangle,
                urgent: true,
                tab: "active",
              },
              {
                label: "Pending Borrow Requests",
                count: stats.pendingBorrowRequests,
                icon: FaHourglassHalf,
                urgent: stats.pendingBorrowRequests > 0,
                tab: "pending",
              },
              {
                label: "Pending Return Requests",
                count: stats.pendingReturnRequests,
                icon: FaExchangeAlt,
                urgent: stats.pendingReturnRequests > 0,
                tab: "pending",
              },
              {
                label: "PDF Submissions to Review",
                count: stats.pendingPdfSubmissions,
                icon: FaFileAlt,
                urgent: false,
                tab: "pdf",
              },
            ].map(({ label, count, icon: Icon, urgent, tab }) => (
              <Link
                key={label}
                href={`/dashboard/transactions?tab=${tab}`}
                className={`flex items-center justify-between p-3 border rounded-sm transition-colors ${urgent && count > 0
                    ? "border-[#c4614a] bg-[#fdf0ec] hover:bg-[#f9e6e1]"
                    : "border-[#c4b08a] bg-[#f8f1e6] hover:bg-[#ede3d4]"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${urgent && count > 0 ? "text-[#c4614a]" : "text-[#7a6a5a]"}`}
                  />
                  <span className="text-sm ink-text text-[#3f3328]">
                    {label}
                  </span>
                </div>
                <span
                  className={`text-xl font-bold ink-title ${urgent && count > 0 ? "text-[#9b3a25]" : "text-[#221910]"}`}
                >
                  {count}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Collection Health */}
        <section className="dashboard-surface tron-border rounded-sm">
          <SectionHeader title="Collection Health" />
          <div className="p-4 sm:p-5 space-y-5">
            <div className="space-y-2.5">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text font-semibold">
                Copies
              </p>
              <BarRow
                label="Available"
                value={stats.availableCopies}
                total={stats.totalCopies}
                color="bg-[#6b9e5e]"
              />
              <BarRow
                label="Borrowed"
                value={stats.borrowedCopies}
                total={stats.totalCopies}
                color="bg-[#5a7ab5]"
              />
              <BarRow
                label="Damaged"
                value={stats.damagedCopies}
                total={stats.totalCopies}
                color="bg-[#c4614a]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#d2bfa5]">
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] mb-2 ink-text font-semibold">
                  Books
                </p>
                <div className="space-y-1.5 text-sm ink-text">
                  {[
                    ["Syllabus", stats.syllabusBooks],
                    ["General", stats.generalBooks],
                  ].map(([l, v]) => (
                    <div
                      key={String(l)}
                      className="flex justify-between text-[#3f3328]"
                    >
                      <span>{l}</span>
                      <span className="font-bold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] mb-2 ink-text font-semibold">
                  Members
                </p>
                <div className="space-y-1.5 text-sm ink-text">
                  {[
                    ["Verified", stats.verifiedMembers],
                    ["Unverified", stats.unverifiedMembers],
                  ].map(([l, v]) => (
                    <div
                      key={String(l)}
                      className="flex justify-between text-[#3f3328]"
                    >
                      <span>{l}</span>
                      <span className="font-bold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Top Borrowers + Popular Books ────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
        <section className="dashboard-surface tron-border rounded-sm">
          <SectionHeader title="Top Borrowers" href="/dashboard/users" />
          {topMembers.length === 0 ? (
            <p className="p-5 text-sm text-[#6a5a4c] ink-text">
              No borrow history yet.
            </p>
          ) : (
            <div className="divide-y divide-[#d2bfa5]">
              {topMembers.map((m: TopMember, i) => (
                <Link
                  key={m.id}
                  href={`/dashboard/users/${m.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f4ebdc] transition-colors"
                >
                  <span className="w-5 text-xs font-bold text-[#8a7966] ink-text shrink-0">
                    #{i + 1}
                  </span>
                  <Avatar url={m.avatar_url} name={m.full_name} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#2b2119] ink-text text-sm truncate">
                      {m.full_name}
                    </p>
                    <p className="text-xs text-[#7a6a5a] ink-text">
                      @{m.username}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[#221910] ink-title shrink-0">
                    {m.totalBorrows}×
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-surface tron-border rounded-sm">
          <SectionHeader title="Most Borrowed Books" href="/dashboard/books" />
          {popularBooks.length === 0 ? (
            <p className="p-5 text-sm text-[#6a5a4c] ink-text">
              No borrow history yet.
            </p>
          ) : (
            <div className="divide-y divide-[#d2bfa5]">
              {popularBooks.map((b: PopularBook, i) => (
                <div key={b.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="w-5 text-xs font-bold text-[#8a7966] ink-text shrink-0">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#2b2119] ink-text text-sm truncate">
                      {b.title}
                    </p>
                    <p className="text-xs text-[#7a6a5a] ink-text flex items-center gap-1.5">
                      {b.author}
                      {b.is_syllabus && (
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold border border-[#8aa06f] bg-[#eef5e9] text-[#3d5c2e] rounded-sm">
                          Syllabus
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[#221910] ink-title shrink-0">
                    {b.totalBorrows}×
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Overdue Items ─────────────────────────────────────────────── */}
      {overdueItems.length > 0 && (
        <section
          className="dashboard-surface tron-border rounded-sm overflow-hidden"
          style={{ borderColor: "#c4614a" }}
        >
          <SectionHeader
            title={`Overdue Borrows — ${overdueItems.length}`}
            href="/dashboard/transactions?tab=active"
            hrefLabel="Manage"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm ink-text">
              <thead>
                <tr className="bg-[#fce8e4] border-b border-[#d0604a]">
                  {["Member", "Book", "Copy", "Due Date", "Days Over"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b2c1a] whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {overdueItems.map((tx: Transaction) => {
                  const days = daysOverdue(tx.due_date);
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-[#f0d4cc] hover:bg-[#fdf0ec] transition-colors"
                    >
                      <td className="px-4 sm:px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar
                            url={tx.user?.avatar_url ?? null}
                            name={tx.user?.full_name ?? "?"}
                          />
                          <Link
                            href={`/dashboard/users/${tx.user?.id}`}
                            className="font-medium text-[#2b2119] hover:underline text-sm"
                          >
                            {tx.user?.full_name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-[#3f3328] max-w-48">
                        <p className="truncate">{tx.book?.title}</p>
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-[#5a4b3f]">
                        {tx.copy ? `#${tx.copy.copy_number}` : "—"}
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-[#5a4b3f] whitespace-nowrap">
                        {fmtDate(tx.due_date)}
                      </td>
                      <td className="px-4 sm:px-5 py-3">
                        <span className="font-bold text-[#9b3a25]">
                          {days}d
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Pending Queues ────────────────────────────────────────────── */}
      {(pendingBorrows.length > 0 || pendingReturns.length > 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
          {pendingBorrows.length > 0 && (
            <section className="dashboard-surface tron-border rounded-sm overflow-hidden">
              <SectionHeader
                title={`Borrow Requests — ${pendingBorrows.length}`}
                href="/dashboard/transactions?tab=pending"
                hrefLabel="Review"
              />
              <div className="divide-y divide-[#d2bfa5]">
                {pendingBorrows.map((tx: Transaction) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <Avatar
                      url={tx.user?.avatar_url ?? null}
                      name={tx.user?.full_name ?? "?"}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2b2119] ink-text truncate">
                        {tx.user?.full_name}
                      </p>
                      <p className="text-xs text-[#7a6a5a] ink-text truncate">
                        {tx.book?.title}
                      </p>
                    </div>
                    <p className="text-xs text-[#7a6a5a] ink-text whitespace-nowrap shrink-0">
                      {fmtDate(tx.request_date)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {pendingReturns.length > 0 && (
            <section className="dashboard-surface tron-border rounded-sm overflow-hidden">
              <SectionHeader
                title={`Return Requests — ${pendingReturns.length}`}
                href="/dashboard/transactions?tab=pending"
                hrefLabel="Review"
              />
              <div className="divide-y divide-[#d2bfa5]">
                {pendingReturns.map((tx: Transaction) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <Avatar
                      url={tx.user?.avatar_url ?? null}
                      name={tx.user?.full_name ?? "?"}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2b2119] ink-text truncate">
                        {tx.user?.full_name}
                      </p>
                      <p className="text-xs text-[#7a6a5a] ink-text truncate">
                        {tx.book?.title}
                      </p>
                    </div>
                    <p className="text-xs text-[#7a6a5a] ink-text whitespace-nowrap shrink-0">
                      {fmtDate(tx.request_date)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Recent Activity ───────────────────────────────────────────── */}
      <section className="dashboard-surface tron-border rounded-sm overflow-hidden">
        <SectionHeader
          title="Recent Activity"
          href="/dashboard/transactions?tab=history"
        />
        {recentActivity.length === 0 ? (
          <p className="p-5 text-sm text-[#6a5a4c] ink-text">
            No activity yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm ink-text">
              <thead>
                <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                  <TH>Member</TH>
                  <TH>Type</TH>
                  <TH>Book</TH>
                  <TH>Copy</TH>
                  <TH>Date</TH>
                  <TH>Status</TH>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((tx: Transaction) => (
                  <tr
                    key={tx.id}
                    className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                  >
                    <td className="px-4 sm:px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar
                          url={tx.user?.avatar_url ?? null}
                          name={tx.user?.full_name ?? "?"}
                        />
                        <Link
                          href={`/dashboard/users/${tx.user?.id}`}
                          className="font-medium text-[#2b2119] hover:underline text-sm"
                        >
                          {tx.user?.full_name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 sm:px-5 py-3 capitalize text-[#5a4b3f]">
                      {tx.type}
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-[#3f3328] max-w-48">
                      <p className="truncate">{tx.book?.title}</p>
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-[#5a4b3f]">
                      {tx.copy ? `#${tx.copy.copy_number}` : "—"}
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-[#5a4b3f] whitespace-nowrap">
                      {fmtDate(tx.request_date)}
                    </td>
                    <td className="px-4 sm:px-5 py-3">
                      <StatusPill status={tx.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Pending PDF Submissions ───────────────────────────────────── */}
      {pendingPdfs.length > 0 && (
        <section className="dashboard-surface tron-border rounded-sm overflow-hidden">
          <SectionHeader
            title={`Pending PDF Reviews — ${pendingPdfs.length}`}
            href="/dashboard/transactions?tab=pdf"
            hrefLabel="Review"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm ink-text">
              <thead>
                <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                  <TH>Member</TH>
                  <TH>Book</TH>
                  <TH>Submitted</TH>
                </tr>
              </thead>
              <tbody>
                {pendingPdfs.map((ps: PdfSubmission) => (
                  <tr
                    key={ps.id}
                    className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                  >
                    <td className="px-4 sm:px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar
                          url={ps.user?.avatar_url ?? null}
                          name={ps.user?.full_name ?? "?"}
                        />
                        <Link
                          href={`/dashboard/users/${ps.user?.id}`}
                          className="font-medium text-[#2b2119] hover:underline text-sm"
                        >
                          {ps.user?.full_name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-[#3f3328] max-w-48">
                      <p className="truncate">{ps.book?.title}</p>
                      {ps.book?.is_syllabus && (
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold border border-[#8aa06f] bg-[#eef5e9] text-[#3d5c2e] rounded-sm">
                          Syllabus
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-[#5a4b3f] whitespace-nowrap">
                      {fmtDate(ps.submitted_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
