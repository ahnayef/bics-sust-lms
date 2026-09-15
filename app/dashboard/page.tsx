import { getTranslation } from "@/lib/i18n/server";
import { getMyProfile } from "@/server/auth-utils";
import { getUserStats } from "@/server/library";
import { getClaims } from "@/server/user";
import type { Transaction } from "@/types/library";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FaArrowRight,
  FaBook,
  FaBookOpen,
  FaCheckCircle,
  FaClock,
  FaFilePdf,
  FaHistory,
  FaHourglassHalf,
  FaQrcode,
  FaUndoAlt,
} from "react-icons/fa";

export default async function DashboardHomePage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const [profile, stats, { t, language }] = await Promise.all([
    getMyProfile(),
    getUserStats(claims.sub),
    getTranslation(),
  ]);

  const userName = profile?.full_name || claims.name || "Member";
  const isVerified = profile?.is_verified ?? false;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. Hero Greeting Banner                                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="dashboard-surface tron-border rounded-xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-[#221910] ink-title">
                Salam, {userName} 👋
              </h2>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#d3decb] text-[#2d4a35] border border-[#4a7c59]/40">
                  <FaCheckCircle className="w-3 h-3 text-[#2d4a35]" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fff7ed] text-[#9a3412] border border-[#fdba74]">
                  <FaHourglassHalf className="w-3 h-3 text-[#9a3412]" />
                  Pending Verification
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#5a4b3f] ink-text mt-1">
              {t.dashboard.home.description}{" "}
              <Link
                href="/dashboard/profile"
                className="font-bold text-[#221910] underline underline-offset-2 hover:text-[#5a4b3f]"
              >
                {t.dashboard.home.myProfile}
              </Link>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/borrow"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#3f3328] text-[#f4e8d4] text-xs font-bold hover:bg-[#4a3d31] active:scale-95 transition-all shadow-sm shrink-0"
            >
              <FaQrcode className="w-3.5 h-3.5" />
              <span>{t.dashboard.sidebar.borrow}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. Active Loan Hero Card (Most Critical User Info)                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#6a5a4c] ink-text">
            {t.dashboard.recentBorrows.title}
          </h2>
          {stats.currentBorrows.length > 0 && (
            <Link
              href="/dashboard/history"
              className="text-xs font-bold text-[#5c4f42] hover:text-[#221910] flex items-center gap-1 transition-colors"
            >
              {t.dashboard.home.actions.history}{" "}
              <FaArrowRight className="w-2.5 h-2.5" />
            </Link>
          )}
        </div>

        {stats.currentBorrows.length === 0 ? (
          <div className="dashboard-surface tron-border rounded-xl p-6 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#eadcc8] text-[#4e4033] flex items-center justify-center mx-auto">
              <FaBookOpen className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <p className="text-sm font-semibold text-[#221910] ink-title">
                {t.dashboard.recentBorrows.empty}
              </p>
              <p className="text-xs text-[#7a6a5c] mt-0.5">
                Browse our catalog of physical books and PDF documents to start
                reading.
              </p>
            </div>
            <Link
              href="/dashboard/book-list"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3f3328] text-[#f4e8d4] text-xs font-bold hover:bg-[#4a3d31] transition-all shadow-sm"
            >
              <FaBook className="w-3.5 h-3.5" />
              {t.dashboard.recentBorrows.browseLink}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.currentBorrows.map((tx: Transaction) => {
              const bookData = (
                tx as unknown as {
                  book?: { title?: string; pdf_link?: string | null };
                }
              ).book;
              const isOverdue =
                tx.due_date && new Date(tx.due_date) < new Date();

              let isDueSoon = false;
              let daysUntilDue = 0;
              if (tx.due_date && !isOverdue) {
                const diffTime =
                  new Date(tx.due_date).getTime() - new Date().getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 2 && diffDays >= 0) {
                  isDueSoon = true;
                  daysUntilDue = diffDays;
                }
              }

              return (
                <div
                  key={tx.id}
                  className="dashboard-surface tron-border rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xs border-l-4 border-l-[#4e4033]"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#7a6a5c] block">
                          {t.dashboard.recentBorrows.copy}: #{tx.copy_id}
                        </span>
                        <h3 className="text-base font-bold text-[#221910] ink-title truncate">
                          {bookData?.title ??
                            t.dashboard.recentBorrows.unknownBook}
                        </h3>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 border ${
                          isOverdue
                            ? "bg-red-50 text-red-700 border-red-300"
                            : isDueSoon
                              ? "bg-[#fff7ed] text-[#9a3412] border-[#fdba74]"
                              : "bg-teal-50 text-teal-700 border-teal-300"
                        }`}
                      >
                        {isOverdue
                          ? t.dashboard.recentBorrows.status.overdue
                          : isDueSoon
                            ? daysUntilDue === 0
                              ? t.dashboard.recentBorrows.status.dueToday
                              : t.dashboard.recentBorrows.status.dueInDays.replace(
                                  "{days}",
                                  daysUntilDue.toString(),
                                )
                            : t.dashboard.recentBorrows.status.active}
                      </span>
                    </div>

                    {tx.due_date && (
                      <p className="text-xs text-[#6a5a4c] flex items-center gap-1.5 ink-text">
                        <FaClock className="w-3 h-3 text-[#7a6a5c]" />
                        <span>{t.dashboard.recentBorrows.due}:</span>
                        <span className="font-semibold text-[#221910]">
                          {new Date(tx.due_date).toLocaleDateString(
                            language === "bn" ? "bn-BD" : "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* 1-Tap Action Bar */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#e4d4bf]">
                    <Link
                      href={`/dashboard/return?copyId=${encodeURIComponent(tx.copy_id)}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#3f3328] text-[#f4e8d4] text-xs font-bold hover:bg-[#4a3d31] active:scale-95 transition-all shadow-xs"
                    >
                      <FaUndoAlt className="w-3 h-3" />
                      <span>{t.dashboard.recentBorrows.returnCopy}</span>
                    </Link>
                    {bookData?.pdf_link && (
                      <a
                        href={bookData.pdf_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#7d6d5a] bg-[#fbf5ed] text-[#3f3328] text-xs font-bold hover:bg-[#ece0ce] transition-colors shadow-xs"
                      >
                        <FaFilePdf className="w-3 h-3 text-[#9b3a25]" />
                        <span>{t.dashboard.recentBorrows.readPdf}</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. Quick-Action Dock (Thumb-friendly 4 Grid)                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#6a5a4c] ink-text px-1">
          {t.dashboard.home.quickActions}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {[
            {
              href: "/dashboard/borrow",
              icon: FaQrcode,
              label: t.dashboard.home.actions.scanQr,
              sub: t.dashboard.home.actions.scanQrSub,
              primary: true,
            },
            {
              href: "/dashboard/book-list",
              icon: FaBook,
              label: t.dashboard.home.actions.bookList,
              sub: t.dashboard.home.actions.bookListSub,
            },
            {
              href: "/dashboard/return",
              icon: FaUndoAlt,
              label: t.dashboard.home.actions.return,
              sub: t.dashboard.home.actions.returnSub,
            },
            {
              href: "/dashboard/history",
              icon: FaHistory,
              label: t.dashboard.home.actions.history,
              sub: t.dashboard.home.actions.historySub,
            },
          ].map(({ href, icon: Icon, label, sub, primary }) => (
            <Link
              key={href}
              href={href}
              className={`dashboard-surface tron-border rounded-xl p-3.5 sm:p-4 flex flex-col items-center justify-center text-center gap-2 transition-all active:scale-95 shadow-xs group ${
                primary
                  ? "border-[#5e4e3e] bg-[#f0e4d2]/70"
                  : "hover:bg-[#ece0ce]"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                  primary
                    ? "bg-[#3f3328] text-[#f4e8d4]"
                    : "bg-[#eadcc8] text-[#3f3328]"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-[#221910] ink-title block leading-tight">
                  {label}
                </span>
                <span className="text-[10px] text-[#7a6a5c] ink-text mt-0.5 line-clamp-1 hidden sm:block">
                  {sub}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. Reading & Syllabus Progress Snapshot                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="dashboard-surface tron-border rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaBookOpen className="w-4 h-4 text-[#4a7c59]" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#6a5a4c] ink-text">
              {t.dashboard.recentBorrows.readingProgress}
            </h2>
          </div>
          <Link
            href="/dashboard/checklists"
            className="text-xs font-bold text-[#5c4f42] hover:text-[#221910] flex items-center gap-1 transition-colors"
          >
            {t.dashboard.recentBorrows.viewChecklists}{" "}
            <FaArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>

        {/* Syllabus Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-[#5a4b3f] mb-1.5">
            <span>Syllabus Reading Target</span>
            <span className="text-[#221910] font-bold">
              {stats.syllabusCompleted} / {stats.syllabusTotal} (
              {Math.round(
                (stats.syllabusCompleted / Math.max(1, stats.syllabusTotal)) *
                  100,
              )}
              %)
            </span>
          </div>
          <div className="w-full h-2.5 bg-[#e4d4bf] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4a7c59] rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    (stats.syllabusCompleted /
                      Math.max(1, stats.syllabusTotal)) *
                      100,
                  ),
                )}%`,
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
