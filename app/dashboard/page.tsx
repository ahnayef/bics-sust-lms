import { getUserStats } from "@/server/library";
import { getClaims } from "@/server/user";
import type { Transaction } from "@/types/library";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FaBook, FaHistory, FaQrcode, FaUndoAlt } from "react-icons/fa";
export default async function DashboardHomePage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");
  const stats = await getUserStats(claims.sub);
  return (
    <div className="p-2 sm:p-0 max-w-3xl mx-auto space-y-6">
      {" "}
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        {" "}
        <h2 className="text-lg font-bold text-[#221910] ink-title mb-2">
          {" "}
          Your library home{" "}
        </h2>{" "}
        <p className="text-sm text-[#5a4b3f] ink-text">
          {" "}
          Jump to common tasks below. Your profile card, reading progress, and
          contact details are on{""}{" "}
          <Link
            href="/dashboard/profile"
            className="font-semibold text-[#3f3328] underline underline-offset-2 hover:text-[#221910]"
          >
            {" "}
            My Profile{" "}
          </Link>{" "}
        </p>{" "}
      </section>{" "}
      <section>
        {" "}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6a5a4c] ink-text mb-3">
          {" "}
          Quick Actions{" "}
        </h2>{" "}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {" "}
          {(
            [
              {
                href: "/dashboard/book-list",
                icon: FaBook,
                label: "Book List",
                sub: "Browse &amp; request",
              },
              {
                href: "/dashboard/borrow",
                icon: FaQrcode,
                label: "Scan QR",
                sub: "Borrow via QR code",
              },
              {
                href: "/dashboard/return",
                icon: FaUndoAlt,
                label: "Return",
                sub: "Return a copy",
              },
              {
                href: "/dashboard/history",
                icon: FaHistory,
                label: "History",
                sub: "Your borrow history",
              },
            ] as const
          ).map(({ href, icon: Icon, label, sub }) => (
            <Link
              key={href}
              href={href}
              className="dashboard-surface tron-border rounded-sm p-4 flex flex-col items-center gap-2.5 hover:bg-[#ece0ce] transition-colors text-center group"
            >
              {" "}
              <div className="w-11 h-11 rounded-full bg-[#3f3328] flex items-center justify-center group-hover:bg-[#4a3d31] transition-colors">
                {" "}
                <Icon className="w-5 h-5 text-[#f4e8d4]" />{" "}
              </div>{" "}
              <span className="text-sm font-semibold text-[#221910] ink-title">
                {" "}
                {label}{" "}
              </span>{" "}
              <span
                className="text-xs text-[#7a6a5c] ink-text leading-snug hidden sm:block"
                dangerouslySetInnerHTML={{ __html: sub }}
              />{" "}
            </Link>
          ))}{" "}
        </div>{" "}
      </section>{" "}
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        {" "}
        <h2 className="text-lg font-bold text-[#221910] ink-title mb-4 border-b border-[#c9b89a] pb-2">
          {" "}
          Currently Borrowing{" "}
        </h2>{" "}
        {stats.currentBorrows.length === 0 ? (
          <p className="text-sm text-[#6a5a4c] ink-text">
            {" "}
            You don&apos;t have any active borrows.{""}{" "}
            <Link
              href="/dashboard/book-list"
              className="font-semibold text-[#3f3328] underline underline-offset-2 hover:text-[#221910]"
            >
              {" "}
              Browse the book list{" "}
            </Link>
            {""} to borrow something.{" "}
          </p>
        ) : (
          <ul className="space-y-3">
            {" "}
            {stats.currentBorrows.map((tx: Transaction) => {
              const isOverdue =
                tx.due_date && new Date(tx.due_date) < new Date();
              return (
                <li
                  key={tx.id}
                  className="flex items-start justify-between gap-3 py-2 border-b border-[#e4d4bf] last:border-0"
                >
                  {" "}
                  <div className="flex-1 min-w-0">
                    {" "}
                    <p className="text-sm font-semibold text-[#221910] ink-title truncate">
                      {" "}
                      {(tx as { book?: { title?: string } }).book?.title ??
                        "Unknown book"}{" "}
                    </p>{" "}
                    <p className="text-xs text-[#7a6a5c] ink-text">
                      {" "}
                      Copy:{""}{" "}
                      <span className="font-mono font-semibold">
                        {" "}
                        {tx.copy_id}{" "}
                      </span>{" "}
                      {tx.due_date && (
                        <>
                          {" "}
                          {""} · Due:{""}{" "}
                          {new Date(tx.due_date).toLocaleDateString(
                            "en-GB",
                          )}{" "}
                        </>
                      )}{" "}
                    </p>{" "}
                  </div>{" "}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold border shrink-0 ink-text ${isOverdue ? "bg-red-50 text-red-700 border-red-300" : "bg-teal-50 text-teal-700 border-teal-300"}`}
                  >
                    {" "}
                    {isOverdue ? "Overdue" : "Active"}{" "}
                  </span>{" "}
                </li>
              );
            })}{" "}
          </ul>
        )}{" "}
      </section>{" "}
    </div>
  );
}
