import { CirculationNav } from "@/app/dashboard/components/StaffHubNav";
import PageTransition from "@/components/PageTransition";
import { TRANSACTION_STATUS_COLORS, USER_ROLES } from "@/lib/constants";
import { getTranslation } from "@/lib/i18n/server";
import { getMyProfile } from "@/server/auth-utils";
import { getOverviewData } from "@/server/library";
import type {
  PdfSubmission,
  PopularBook,
  TopMember,
  Transaction,
} from "@/types/library";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FaArrowRight,
  FaBook,
  FaExchangeAlt,
  FaExclamationTriangle,
  FaFileAlt,
  FaHourglassHalf,
  FaUsers,
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

function fmtDate(
  d: string | null | undefined,
  language: string = "en",
): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB", {
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
      className={`border rounded-xl p-2.5 sm:p-4 transition-colors h-full flex flex-col justify-between ${cls}`}
    >
      <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight truncate">
        {label}
      </p>
      <p
        className={`text-lg sm:text-2xl font-bold ink-title mt-1 leading-none ${valCls}`}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[9px] sm:text-[10px] text-[#7a6a5a] ink-text mt-1 truncate">
          {sub}
        </p>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  ) : (
    <div className="h-full">{inner}</div>
  );
}

function SectionHeader({
  title,
  href,
  hrefLabel,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3.5 border-b border-[#7d6d5a]">
      <h3 className="font-bold text-[#221910] ink-title uppercase tracking-wider text-xs sm:text-sm truncate">
        {title}
      </h3>
      {href && (
        <Link
          href={href}
          className="text-[10px] sm:text-xs font-bold text-[#5c4f42] hover:text-[#221910] flex items-center gap-1 transition-colors uppercase tracking-wider shrink-0 ml-2"
        >
          <span>{hrefLabel}</span> <FaArrowRight className="w-2 h-2" />
        </Link>
      )}
    </div>
  );
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={32}
        height={32}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#8a7966] object-cover shrink-0"
      />
    );
  }
  return (
    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#d9cbb7] border border-[#8a7966] flex items-center justify-center text-[10px] font-bold text-[#4a3e33] shrink-0">
      {getInitials(name)}
    </div>
  );
}

function StatusPill({ status, label }: { status: string; label: string }) {
  const colors =
    TRANSACTION_STATUS_COLORS[
      status as keyof typeof TRANSACTION_STATUS_COLORS
    ] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-tighter ${colors}`}
    >
      {label}
    </span>
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
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-medium text-[#5c4f42]">
        <span>{label}</span>
        <span>
          {value} ({Math.round(pct)}%)
        </span>
      </div>
      <div className="h-1.5 bg-[#d2bfa5]/40 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TH({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 sm:px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-[#5c4f42]">
      {children}
    </th>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default async function Overview() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  if (
    profile.role !== USER_ROLES.ADMIN &&
    profile.role !== USER_ROLES.SUPERADMIN &&
    profile.role !== USER_ROLES.MODERATOR
  ) {
    redirect("/dashboard");
  }

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

  const { t, language } = await getTranslation();

  const urgentCount =
    stats.overdueCount +
    stats.pendingBorrowRequests +
    stats.pendingReturnRequests +
    stats.pendingPdfSubmissions;

  const getStatusLabel = (tx: Transaction) => {
    if (tx.status === "pending")
      return tx.type === "borrow"
        ? t.history.status.pending_borrow
        : t.history.status.pending_return;
    if (tx.status === "active") return t.history.status.borrowed;
    if (tx.status === "overdue") return t.history.status.overdue;
    if (tx.status === "completed") return t.history.status.returned;
    return tx.type === "borrow"
      ? t.history.status.rejected_borrow
      : t.history.status.rejected_return;
  };

  return (
    <PageTransition className="space-y-3 sm:space-y-5">
      {/* ── Sub-Navigation for Circulation Hub (Desktop/Tablet) ─────────── */}
      <div className="hidden md:block">
        <CirculationNav />
      </div>

      {/* ── Action Center: Needs Your Attention (Zero Training!) ──────── */}
      {urgentCount > 0 && (
        <section className="bg-[#fce8e4] border-2 border-[#d0604a] rounded-xl p-3 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
            <FaExclamationTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-[#8b2c1a] shrink-0" />
            <h2 className="text-xs sm:text-base font-bold text-[#8b2c1a] ink-title uppercase tracking-wider truncate">
              {language === "bn"
                ? `জরুরি মনোযোগ প্রয়োজন (${urgentCount})`
                : `Needs Your Immediate Attention (${urgentCount})`}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            {stats.pendingBorrowRequests > 0 && (
              <Link
                href="/dashboard/transactions?tab=pending"
                className="p-2.5 sm:p-3 bg-white/80 hover:bg-white rounded-lg border border-[#d0604a]/40 text-center transition-all shadow-xs group"
              >
                <span className="text-xl sm:text-2xl font-bold text-[#8b2c1a] block leading-none">
                  {stats.pendingBorrowRequests}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-[#221910] mt-1 block truncate">
                  {language === "bn" ? "ধার নেওয়ার আবেদন" : "Borrow Requests"}
                </span>
                <span className="text-[9px] sm:text-[10px] text-[#8b2c1a] font-bold group-hover:underline block mt-0.5">
                  {language === "bn" ? "অনুমোদন করুন →" : "Approve now →"}
                </span>
              </Link>
            )}
            {stats.pendingReturnRequests > 0 && (
              <Link
                href="/dashboard/transactions?tab=pending"
                className="p-2.5 sm:p-3 bg-white/80 hover:bg-white rounded-lg border border-[#d0604a]/40 text-center transition-all shadow-xs group"
              >
                <span className="text-xl sm:text-2xl font-bold text-[#9a3412] block leading-none">
                  {stats.pendingReturnRequests}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-[#221910] mt-1 block truncate">
                  {language === "bn" ? "ফেরতের আবেদন" : "Return Requests"}
                </span>
                <span className="text-[9px] sm:text-[10px] text-[#9a3412] font-bold group-hover:underline block mt-0.5">
                  {language === "bn" ? "যাচাই করুন →" : "Verify now →"}
                </span>
              </Link>
            )}
            {stats.overdueCount > 0 && (
              <Link
                href="/dashboard/transactions?tab=active"
                className="p-2.5 sm:p-3 bg-white/80 hover:bg-white rounded-lg border border-[#d0604a]/40 text-center transition-all shadow-xs group"
              >
                <span className="text-xl sm:text-2xl font-bold text-[#8b2c1a] block leading-none">
                  {stats.overdueCount}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-[#221910] mt-1 block truncate">
                  {language === "bn" ? "মেয়াদোত্তীর্ণ বই" : "Overdue Books"}
                </span>
                <span className="text-[9px] sm:text-[10px] text-[#8b2c1a] font-bold group-hover:underline block mt-0.5">
                  {language === "bn" ? "দেখুন →" : "Inspect →"}
                </span>
              </Link>
            )}
            {stats.pendingPdfSubmissions > 0 && (
              <Link
                href="/dashboard/transactions?tab=pdf"
                className="p-2.5 sm:p-3 bg-white/80 hover:bg-white rounded-lg border border-[#d0604a]/40 text-center transition-all shadow-xs group"
              >
                <span className="text-xl sm:text-2xl font-bold text-[#234b7d] block leading-none">
                  {stats.pendingPdfSubmissions}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-[#221910] mt-1 block truncate">
                  {language === "bn" ? "পিডিএফ রিভিউ" : "PDF Reviews"}
                </span>
                <span className="text-[9px] sm:text-[10px] text-[#234b7d] font-bold group-hover:underline block mt-0.5">
                  {language === "bn" ? "রিভিউ করুন →" : "Review now →"}
                </span>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ── Staff Quick Ops Bar ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        <Link
          href="/dashboard/transactions?tab=pending"
          className="p-2.5 sm:p-3 rounded-xl bg-[#3f3328] text-[#f4e8d4] text-[11px] sm:text-xs font-bold hover:bg-[#4a3d31] transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs"
        >
          <FaHourglassHalf className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {language === "bn" ? "আবেদন অনুমোদন" : "Approve Requests"}
          </span>
        </Link>
        <Link
          href="/dashboard/transactions?tab=active"
          className="p-2.5 sm:p-3 rounded-xl bg-[#eadcc8] text-[#221910] text-[11px] sm:text-xs font-bold hover:bg-[#ded0bc] transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs border border-[#8a7966]/40"
        >
          <FaExchangeAlt className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {language === "bn" ? "বই ফেরত নিন" : "Return Desk"}
          </span>
        </Link>
        <Link
          href="/dashboard/books"
          className="p-2.5 sm:p-3 rounded-xl bg-[#eadcc8] text-[#221910] text-[11px] sm:text-xs font-bold hover:bg-[#ded0bc] transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs border border-[#8a7966]/40"
        >
          <FaBook className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {language === "bn" ? "বই সংযোজন" : "Add / Edit Books"}
          </span>
        </Link>
        <Link
          href="/dashboard/users"
          className="p-2.5 sm:p-3 rounded-xl bg-[#eadcc8] text-[#221910] text-[11px] sm:text-xs font-bold hover:bg-[#ded0bc] transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs border border-[#8a7966]/40"
        >
          <FaUsers className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {language === "bn" ? "সদস্য যাচাই" : "Verify Members"}
          </span>
        </Link>
      </div>

      {/* ── Header + Key Stats ─────────────────────────────────────────── */}
      <section className="dashboard-surface tron-border rounded-xl p-3.5 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 mb-3.5 sm:mb-5">
          <div>
            <h1 className="text-base sm:text-2xl font-bold text-[#221910] ink-title">
              {t.overview.header.title}
            </h1>
            <p className="text-[11px] sm:text-sm text-[#5c4f42] mt-0.5 ink-text">
              {t.overview.header.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/transactions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#4e4033] bg-[#3f3328] text-[#f4e8d4] hover:bg-[#4a3d31] transition-colors text-xs font-medium rounded-lg ink-text"
            >
              <span>{t.overview.header.viewTransactions}</span>
              <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <StatCard
            label={t.overview.stats.books}
            value={stats.totalBooks}
            sub={`${stats.syllabusBooks} ${t.overview.stats.syllabus}`}
            href="/dashboard/books"
          />
          <StatCard
            label={t.overview.stats.copies}
            value={stats.totalCopies}
            sub={`${stats.availableCopies} ${t.overview.stats.available}`}
            href="/dashboard/copies"
          />
          <StatCard
            label={t.overview.stats.members}
            value={stats.totalMembers}
            sub={`${stats.verifiedMembers} ${t.overview.stats.verified}`}
            href="/dashboard/users"
          />
          <StatCard
            label={t.overview.stats.activeBorrows}
            value={stats.activeBorrows}
            href="/dashboard/transactions?tab=active"
          />
          <StatCard
            label={t.overview.stats.overdue}
            value={stats.overdueCount}
            urgent={stats.overdueCount > 0}
            href="/dashboard/transactions?tab=active"
          />
          <StatCard
            label={t.overview.stats.doneThisMonth}
            value={stats.completedThisMonth}
            sub={t.overview.stats.completed}
            href="/dashboard/transactions?tab=history"
          />
        </div>
      </section>

      {/* ── Action Required + Collection Health ──────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-5">
        {/* Action Required */}
        <section className="dashboard-surface tron-border rounded-xl">
          <SectionHeader
            title={t.overview.sections.actionRequired}
            href="/dashboard/transactions"
            hrefLabel={t.overview.sections.openQueue}
          />
          <div className="p-3 sm:p-5 space-y-2 sm:space-y-2.5">
            {[
              {
                label: t.overview.actions.overdueBorrows,
                count: stats.overdueCount,
                icon: FaExclamationTriangle,
                urgent: true,
                tab: "active",
              },
              {
                label: t.overview.actions.pendingBorrowRequests,
                count: stats.pendingBorrowRequests,
                icon: FaHourglassHalf,
                urgent: stats.pendingBorrowRequests > 0,
                tab: "pending",
              },
              {
                label: t.overview.actions.pendingReturnRequests,
                count: stats.pendingReturnRequests,
                icon: FaExchangeAlt,
                urgent: stats.pendingReturnRequests > 0,
                tab: "pending",
              },
              {
                label: t.overview.actions.pdfSubmissionsReview,
                count: stats.pendingPdfSubmissions,
                icon: FaFileAlt,
                urgent: false,
                tab: "pdf",
              },
            ].map(({ label, count, icon: Icon, urgent, tab }) => (
              <Link
                key={label}
                href={`/dashboard/transactions?tab=${tab}`}
                className={`flex items-center justify-between p-2.5 sm:p-3 border rounded-lg transition-colors ${
                  urgent && count > 0
                    ? "border-[#c4614a] bg-[#fdf0ec] hover:bg-[#f9e6e1]"
                    : "border-[#c4b08a] bg-[#f8f1e6] hover:bg-[#ede3d4]"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      urgent && count > 0 ? "text-[#c4614a]" : "text-[#7a6a5a]"
                    }`}
                  />
                  <span className="text-xs sm:text-sm ink-text text-[#3f3328]">
                    {label}
                  </span>
                </div>
                <span
                  className={`text-lg sm:text-xl font-bold ink-title ${
                    urgent && count > 0 ? "text-[#9b3a25]" : "text-[#221910]"
                  }`}
                >
                  {count}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Collection Health */}
        <section className="dashboard-surface tron-border rounded-xl">
          <SectionHeader title={t.overview.sections.collectionHealth} />
          <div className="p-3 sm:p-5 space-y-4 sm:space-y-5">
            <div className="space-y-2 sm:space-y-2.5">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text font-semibold">
                {t.overview.stats.copies}
              </p>
              <BarRow
                label={t.overview.stats.available}
                value={stats.availableCopies}
                total={stats.totalCopies}
                color="bg-[#6b9e5e]"
              />
              <BarRow
                label={t.overview.stats.borrowed}
                value={stats.borrowedCopies}
                total={stats.totalCopies}
                color="bg-[#5a7ab5]"
              />
              <BarRow
                label={t.overview.stats.damaged}
                value={stats.damagedCopies}
                total={stats.totalCopies}
                color="bg-[#c4614a]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 border-t border-[#d2bfa5]">
              <div>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] mb-2 ink-text font-semibold">
                  {t.overview.stats.books}
                </p>
                <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm ink-text">
                  {stats.booksByCategory.map(({ name, count }) => (
                    <div
                      key={name}
                      className="flex justify-between text-[#3f3328]"
                    >
                      <span>{name}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] mb-2 ink-text font-semibold">
                  {t.overview.stats.members}
                </p>
                <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm ink-text">
                  {[
                    [t.overview.stats.verified, stats.verifiedMembers],
                    [t.overview.stats.unverified, stats.unverifiedMembers],
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-5">
        <section className="dashboard-surface tron-border rounded-xl overflow-hidden">
          <SectionHeader
            title={t.overview.sections.topBorrowers}
            href="/dashboard/users"
            hrefLabel={t.common.viewAll}
          />
          {topMembers.length === 0 ? (
            <p className="p-4 sm:p-5 text-xs sm:text-sm text-[#6a5a4c] ink-text">
              {t.overview.empty.noBorrowHistory}
            </p>
          ) : (
            <div className="divide-y divide-[#d2bfa5]">
              {topMembers.map((m: TopMember, i) => (
                <Link
                  key={m.id}
                  href={`/dashboard/users/${m.id}`}
                  className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3.5 hover:bg-[#f4ebdc] transition-colors"
                >
                  <span className="w-4 sm:w-5 text-xs font-bold text-[#8a7966] ink-text shrink-0">
                    #{i + 1}
                  </span>
                  <Avatar url={m.avatar_url} name={m.full_name} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#2b2119] ink-text text-xs sm:text-sm truncate">
                      {m.full_name}
                    </p>
                    <p className="text-[11px] sm:text-xs text-[#7a6a5a] ink-text">
                      @{m.username}
                    </p>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#221910] ink-title shrink-0">
                    {m.totalBorrows}×
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-surface tron-border rounded-xl overflow-hidden">
          <SectionHeader
            title={t.overview.sections.mostBorrowedBooks}
            href="/dashboard/books"
            hrefLabel={t.common.viewAll}
          />
          {popularBooks.length === 0 ? (
            <p className="p-4 sm:p-5 text-xs sm:text-sm text-[#6a5a4c] ink-text">
              {t.overview.empty.noBorrowHistory}
            </p>
          ) : (
            <div className="divide-y divide-[#d2bfa5]">
              {popularBooks.map((b: PopularBook, i) => (
                <div
                  key={b.id}
                  className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3.5"
                >
                  <span className="w-4 sm:w-5 text-xs font-bold text-[#8a7966] ink-text shrink-0">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#2b2119] ink-text text-xs sm:text-sm truncate">
                      {b.title}
                    </p>
                    <p className="text-[11px] sm:text-xs text-[#7a6a5a] ink-text flex items-center gap-1.5">
                      <span className="truncate">{b.author}</span>
                      {b.category_name && (
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold border border-[#8aa06f] bg-[#eef5e9] text-[#3d5c2e] rounded-md shrink-0">
                          {b.category_name}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#221910] ink-title shrink-0">
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
          className="dashboard-surface tron-border rounded-xl overflow-hidden"
          style={{ borderColor: "#c4614a" }}
        >
          <SectionHeader
            title={`${t.overview.sections.overdueBorrows} — ${overdueItems.length}`}
            href="/dashboard/transactions?tab=active"
            hrefLabel={t.overview.sections.manage}
          />
          {/* Mobile Overdue Cards (block md:hidden) */}
          <div className="block md:hidden divide-y divide-[#f0d4cc]">
            {overdueItems.map((tx: Transaction) => {
              const days = daysOverdue(tx.due_date);
              return (
                <div
                  key={tx.id}
                  className="p-3 space-y-2 hover:bg-[#fdf0ec] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        url={tx.user?.avatar_url ?? null}
                        name={tx.user?.full_name ?? "?"}
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/users/${tx.user?.id}`}
                          className="font-semibold text-xs text-[#2b2119] hover:underline truncate block"
                        >
                          {tx.user?.full_name}
                        </Link>
                        <span className="text-[10px] text-[#7a6a5a]">
                          {tx.copy_id ? `Copy: ${tx.copy_id}` : ""}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[11px] font-bold text-[#9b3a25] bg-[#fcdbd6] border border-[#d0604a] rounded-full shrink-0">
                      {days}d {language === "bn" ? "বিলম্বে" : "overdue"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#5a4b3f] pt-0.5">
                    <p className="truncate font-medium text-[#2b2119] flex-1 pr-2 text-xs">
                      {tx.book?.title}
                    </p>
                    <span className="shrink-0 text-[10px] text-[#7a6a5a]">
                      {t.overview.table.dueDate}:{" "}
                      {fmtDate(tx.due_date, language)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Overdue Table (hidden md:block) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm ink-text">
              <thead>
                <tr className="bg-[#fce8e4] border-b border-[#d0604a]">
                  {[
                    t.overview.table.member,
                    t.overview.table.book,
                    t.overview.table.copy,
                    t.overview.table.dueDate,
                    t.overview.table.daysOver,
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b2c1a] whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
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
                        {tx.copy_id || "—"}
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-[#5a4b3f] whitespace-nowrap">
                        {fmtDate(tx.due_date, language)}
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-5">
          {pendingBorrows.length > 0 && (
            <section className="dashboard-surface tron-border rounded-xl overflow-hidden">
              <SectionHeader
                title={`${t.overview.sections.borrowRequests} — ${pendingBorrows.length}`}
                href="/dashboard/transactions?tab=pending"
                hrefLabel={t.overview.sections.review}
              />
              <div className="divide-y divide-[#d2bfa5]">
                {pendingBorrows.map((tx: Transaction) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3.5 hover:bg-[#f4ebdc] transition-colors"
                  >
                    <Avatar
                      url={tx.user?.avatar_url ?? null}
                      name={tx.user?.full_name ?? "?"}
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/dashboard/users/${tx.user?.id}`}
                        className="text-xs sm:text-sm font-medium text-[#2b2119] ink-text truncate hover:underline hover:text-[#5a4b3f] transition-colors block"
                      >
                        {tx.user?.full_name}
                      </Link>
                      <p className="text-[11px] sm:text-xs text-[#7a6a5a] ink-text truncate">
                        {tx.book?.title}
                      </p>
                    </div>
                    <p className="text-[10px] sm:text-xs text-[#7a6a5a] ink-text whitespace-nowrap shrink-0">
                      {fmtDate(tx.request_date, language)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {pendingReturns.length > 0 && (
            <section className="dashboard-surface tron-border rounded-xl overflow-hidden">
              <SectionHeader
                title={`${t.overview.sections.returnRequests} — ${pendingReturns.length}`}
                href="/dashboard/transactions?tab=pending"
                hrefLabel={t.overview.sections.review}
              />
              <div className="divide-y divide-[#d2bfa5]">
                {pendingReturns.map((tx: Transaction) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3.5 hover:bg-[#f4ebdc] transition-colors"
                  >
                    <Avatar
                      url={tx.user?.avatar_url ?? null}
                      name={tx.user?.full_name ?? "?"}
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/dashboard/users/${tx.user?.id}`}
                        className="text-xs sm:text-sm font-medium text-[#2b2119] ink-text truncate hover:underline hover:text-[#5a4b3f] transition-colors block"
                      >
                        {tx.user?.full_name}
                      </Link>
                      <p className="text-[11px] sm:text-xs text-[#7a6a5a] ink-text truncate">
                        {tx.book?.title}
                      </p>
                    </div>
                    <p className="text-[10px] sm:text-xs text-[#7a6a5a] ink-text whitespace-nowrap shrink-0">
                      {fmtDate(tx.request_date, language)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Recent Activity ───────────────────────────────────────────── */}
      <section className="dashboard-surface tron-border rounded-xl overflow-hidden">
        <SectionHeader
          title={t.overview.sections.recentActivity}
          href="/dashboard/transactions?tab=history"
          hrefLabel={t.overview.header.viewTransactions}
        />
        {recentActivity.length === 0 ? (
          <p className="p-4 sm:p-5 text-xs sm:text-sm text-[#6a5a4c] ink-text">
            {t.overview.empty.noActivity}
          </p>
        ) : (
          <>
            {/* Mobile Activity Cards (block md:hidden) */}
            <div className="block md:hidden divide-y divide-[#d2bfa5]">
              {recentActivity.map((tx: Transaction) => (
                <div
                  key={tx.id}
                  className="p-3 space-y-1.5 hover:bg-[#f4ebdc] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        url={tx.user?.avatar_url ?? null}
                        name={tx.user?.full_name ?? "?"}
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/users/${tx.user?.id}`}
                          className="font-semibold text-xs text-[#2b2119] hover:underline truncate block"
                        >
                          {tx.user?.full_name}
                        </Link>
                        <span className="text-[10px] text-[#7a6a5a] capitalize">
                          {tx.type === "borrow"
                            ? t.history.table.borrowed
                            : t.history.table.returned}
                          {tx.copy_id ? ` • ${tx.copy_id}` : ""}
                        </span>
                      </div>
                    </div>
                    <StatusPill status={tx.status} label={getStatusLabel(tx)} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#5a4b3f] pt-0.5">
                    <p className="truncate font-medium text-[#2b2119] flex-1 pr-2 text-xs">
                      {tx.book?.title}
                    </p>
                    <span className="shrink-0 text-[10px] text-[#7a6a5a]">
                      {fmtDate(tx.request_date, language)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Activity Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm ink-text">
                <thead>
                  <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                    <TH>{t.overview.table.member}</TH>
                    <TH>{t.overview.table.type}</TH>
                    <TH>{t.overview.table.book}</TH>
                    <TH>{t.overview.table.copy}</TH>
                    <TH>{t.overview.table.date}</TH>
                    <TH>{t.overview.table.status}</TH>
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
                        {tx.type === "borrow"
                          ? t.history.table.borrowed
                          : t.history.table.returned}
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-[#3f3328] max-w-48">
                        <p className="truncate">{tx.book?.title}</p>
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-[#5a4b3f]">
                        {tx.copy_id || "—"}
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-[#5a4b3f] whitespace-nowrap">
                        {fmtDate(tx.request_date, language)}
                      </td>
                      <td className="px-4 sm:px-5 py-3">
                        <StatusPill
                          status={tx.status}
                          label={getStatusLabel(tx)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* ── Pending PDF Submissions ───────────────────────────────────── */}
      {pendingPdfs.length > 0 && (
        <section className="dashboard-surface tron-border rounded-xl overflow-hidden">
          <SectionHeader
            title={`${t.overview.sections.pendingPdfReviews} — ${pendingPdfs.length}`}
            href="/dashboard/transactions?tab=pdf"
            hrefLabel={t.overview.sections.review}
          />
          {/* Mobile PDF Cards (block md:hidden) */}
          <div className="block md:hidden divide-y divide-[#d2bfa5]">
            {pendingPdfs.map((ps: PdfSubmission) => (
              <div
                key={ps.id}
                className="p-3 space-y-1.5 hover:bg-[#f4ebdc] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar
                      url={ps.user?.avatar_url ?? null}
                      name={ps.user?.full_name ?? "?"}
                    />
                    <Link
                      href={`/dashboard/users/${ps.user?.id}`}
                      className="font-semibold text-xs text-[#2b2119] hover:underline truncate"
                    >
                      {ps.user?.full_name}
                    </Link>
                  </div>
                  <span className="text-[10px] text-[#7a6a5a] shrink-0">
                    {fmtDate(ps.submitted_at, language)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#3f3328]">
                  <p className="truncate font-medium flex-1">
                    {ps.book?.title}
                  </p>
                  {ps.book?.is_syllabus && (
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold border border-[#8aa06f] bg-[#eef5e9] text-[#3d5c2e] rounded-md shrink-0">
                      {t.overview.sections.syllabus}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop PDF Table (hidden md:block) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm ink-text">
              <thead>
                <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                  <TH>{t.overview.table.member}</TH>
                  <TH>{t.overview.table.book}</TH>
                  <TH>{t.overview.table.submitted}</TH>
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
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold border border-[#8aa06f] bg-[#eef5e9] text-[#3d5c2e] rounded-md">
                          {t.overview.sections.syllabus}
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-[#5a4b3f] whitespace-nowrap">
                      {fmtDate(ps.submitted_at, language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </PageTransition>
  );
}
