import { getTranslation } from "@/lib/i18n/server";
import { getUserNotifications, getUserStats } from "@/server/library";
import { getClaims } from "@/server/user";
import type { Transaction } from "@/types/library";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FaBook, FaHistory, FaQrcode, FaUndoAlt } from "react-icons/fa";
import RecentNotificationsClient from "./RecentNotificationsClient";

export default async function DashboardHomePage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");
  const { t, language } = await getTranslation();
  const stats = await getUserStats(claims.sub);
  const notifications = await getUserNotifications(claims.sub);
  const recentNotifications = notifications.slice(0, 3);
  return (
    <div className="p-2 sm:p-0 max-w-3xl mx-auto space-y-6">
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <h2 className="text-lg font-bold text-[#221910] ink-title mb-2">
          {t.dashboard.home.title}
        </h2>
        <p className="text-sm text-[#5a4b3f] ink-text">
          {t.dashboard.home.description}{" "}
          <Link
            href="/dashboard/profile"
            className="font-semibold text-[#3f3328] underline underline-offset-2 hover:text-[#221910]"
          >
            {t.dashboard.home.myProfile}
          </Link>
        </p>
      </section>
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6a5a4c] ink-text mb-3">
          {t.dashboard.home.quickActions}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              href: "/dashboard/book-list",
              icon: FaBook,
              label: t.dashboard.home.actions.bookList,
              sub: t.dashboard.home.actions.bookListSub,
            },
            {
              href: "/dashboard/borrow",
              icon: FaQrcode,
              label: t.dashboard.home.actions.scanQr,
              sub: t.dashboard.home.actions.scanQrSub,
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
          ].map(({ href, icon: Icon, label, sub }) => (
            <Link
              key={href}
              href={href}
              className="dashboard-surface tron-border rounded-sm p-4 flex flex-col items-center gap-2.5 hover:bg-[#ece0ce] transition-colors text-center group"
            >
              <div className="w-11 h-11 rounded-full bg-[#3f3328] flex items-center justify-center group-hover:bg-[#4a3d31] transition-colors">
                <Icon className="w-5 h-5 text-[#f4e8d4]" />
              </div>
              <span className="text-sm font-semibold text-[#221910] ink-title">
                {label}
              </span>
              <span className="text-xs text-[#7a6a5c] ink-text leading-snug hidden sm:block">
                {sub}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <RecentNotificationsClient userId={claims.sub as string} recentNotifications={recentNotifications} />

      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <h2 className="text-lg font-bold text-[#221910] ink-title mb-4 border-b border-[#c9b89a] pb-2">
          {t.dashboard.recentBorrows.title}
        </h2>
        {stats.currentBorrows.length === 0 ? (
          <p className="text-sm text-[#6a5a4c] ink-text">
            {t.dashboard.recentBorrows.empty}{" "}
            <Link
              href="/dashboard/book-list"
              className="font-semibold text-[#3f3328] underline underline-offset-2 hover:text-[#221910]"
            >
              {t.dashboard.recentBorrows.browseLink}
            </Link>{" "}
            {t.dashboard.recentBorrows.toBorrow}
          </p>
        ) : (
          <ul className="space-y-3">
            {stats.currentBorrows.map((tx: Transaction) => {
              const isOverdue =
                tx.due_date && new Date(tx.due_date) < new Date();

              let isDueSoon = false;
              let daysUntilDue = 0;
              if (tx.due_date && !isOverdue) {
                const diffTime = new Date(tx.due_date).getTime() - new Date().getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 2 && diffDays >= 0) {
                  isDueSoon = true;
                  daysUntilDue = diffDays;
                }
              }

              return (
                <li
                  key={tx.id}
                  className="flex items-start justify-between gap-3 py-2 border-b border-[#e4d4bf] last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#221910] ink-title truncate">
                      {(tx as { book?: { title?: string } }).book?.title ?? t.dashboard.recentBorrows.unknownBook}
                    </p>
                    <p className="text-xs text-[#7a6a5c] ink-text">
                      {t.dashboard.recentBorrows.copy}:{" "}
                      <span className="font-mono font-semibold">
                        {tx.copy_id}
                      </span>
                      {tx.due_date && (
                        <>
                          {" "}· {t.dashboard.recentBorrows.due}:{" "}
                          {new Date(tx.due_date).toLocaleDateString(
                            language === "bn" ? "bn-BD" : "en-GB",
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold border shrink-0 ink-text ${isOverdue
                        ? "bg-red-50 text-red-700 border-red-300"
                        : isDueSoon
                          ? "bg-[#fff7ed] text-[#9a3412] border-[#fdba74]"
                          : "bg-teal-50 text-teal-700 border-teal-300"
                      }`}
                  >
                    {isOverdue
                      ? t.dashboard.recentBorrows.status.overdue
                      : isDueSoon
                        ? (daysUntilDue === 0 ? t.dashboard.recentBorrows.status.dueToday : (daysUntilDue > 1 ? t.dashboard.recentBorrows.status.dueInDays.replace("{days}", daysUntilDue.toString()) : t.dashboard.recentBorrows.status.dueInDay.replace("{days}", daysUntilDue.toString())))
                        : t.dashboard.recentBorrows.status.active
                    }
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
