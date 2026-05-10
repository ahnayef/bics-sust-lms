"use client";

import StatusBadge from "@/app/components/StatusBadge";
import Link from "next/link";
import {
  FaArrowRight,
  FaBook,
  FaCheckCircle,
  FaClock,
  FaExchangeAlt,
  FaHourglassHalf,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";

interface MainMetricProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  href: string;
}

function MainMetric({ icon: Icon, label, value, href }: MainMetricProps) {
  return (
    <Link
      href={href}
      className="dashboard-surface tron-border rounded-sm p-2 sm:p-3 hover:bg-[#f4ebdc] transition-colors"
      data-aos="fade-up"
      data-aos-duration="600"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
            {label}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title mt-1 leading-none">
            {value}
          </p>
        </div>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#6f5e4d]" />
      </div>
    </Link>
  );
}

export default function DashboardOverview() {
  const stats = {
    totalBooks: 80,
    totalMembers: 24,
    totalCopies: 145,
    activeBorrows: 38,
    awaitingApproval: 5,
    overdue: 3,
  };

  const recentTransactions = [
    {
      id: 1,
      member: "Ahsan Habib",
      action: "Borrowed",
      book: "ইসলামের সামাজিক বিধান",
      date: "2026-04-11",
      status: "active",
    },
    {
      id: 2,
      member: "Rakib Hasan",
      action: "Returned",
      book: "পর্দা ও ইসলাম",
      date: "2026-04-10",
      status: "pending",
    },
    {
      id: 3,
      member: "Mahmudul Hasan",
      action: "Borrowed",
      book: "আদাবে জিন্দেগী",
      date: "2026-04-09",
      status: "active",
    },
    {
      id: 4,
      member: "Farhan Rahman",
      action: "Returned",
      book: "ইসলামী ব্যাংকিং ও অর্থায়ন পদ্ধতি: সমস্যা ও সমাধান",
      date: "2026-04-08",
      status: "approved",
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <StatusBadge tone="info" icon={FaClock}>
          Active
        </StatusBadge>
      );
    }

    if (status === "pending") {
      return (
        <StatusBadge tone="warning" icon={FaHourglassHalf}>
          Pending
        </StatusBadge>
      );
    }

    return (
      <StatusBadge tone="success" icon={FaCheckCircle}>
        Approved
      </StatusBadge>
    );
  };

  return (
    <div className="min-h-full bg-[#e5d9c4] dashboard-paper pb-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Courier+Prime:wght@400;700&display=swap');

        .dashboard-paper {
          background-image:
            linear-gradient(180deg, #eee4d3 0%, #e5d8c1 52%, #dcccb2 100%),
            linear-gradient(92deg, rgba(88, 66, 46, 0.05), transparent 24%),
            linear-gradient(268deg, rgba(88, 66, 46, 0.04), transparent 18%),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px),
            url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="4" seed="11"/></filter><rect width="220" height="220" fill="%23e5d9c4"/><rect width="220" height="220" filter="url(%23p)" opacity="0.028"/></svg>');
        }

        .ink-text {
          font-family: 'Courier Prime', monospace;
        }

        .ink-title {
          font-family: 'Playfair Display', serif;
        }

        .dashboard-surface {
          background-color: #f1e7d8;
          border: 1px solid #46372b;
          box-shadow: inset 0 0 0 1px rgba(244, 235, 219, 0.55), 0 0 0 1px rgba(69, 55, 43, 0.2);
        }

        .tron-border {
          position: relative;
          overflow: hidden;
        }

        .tron-border::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            repeating-linear-gradient(90deg, rgba(77, 59, 43, 0.24) 0 3px, transparent 3px 20px) top / 100% 1px no-repeat,
            repeating-linear-gradient(90deg, rgba(77, 59, 43, 0.18) 0 2px, transparent 2px 18px) bottom / 100% 1px no-repeat,
            repeating-linear-gradient(180deg, rgba(77, 59, 43, 0.18) 0 2px, transparent 2px 16px) left / 1px 100% no-repeat,
            repeating-linear-gradient(180deg, rgba(77, 59, 43, 0.14) 0 2px, transparent 2px 20px) right / 1px 100% no-repeat;
          opacity: 0.78;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-0 lg:px-8 py-6 space-y-5 sm:space-y-6">
        <section
          className="dashboard-surface tron-border rounded-sm p-5 sm:p-6"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
                Dashboard Bulletin
              </h1>
              <p className="text-sm sm:text-base text-[#5c4f42] mt-1.5 ink-text">
                Fast daily overview with clear priorities and quick action
                links.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-2 border border-[#7c6b59] bg-[#f6ecdd] text-[#4b3d31] text-xs uppercase tracking-[0.08em] ink-text">
                <FaShieldAlt className="w-3.5 h-3.5" />
                Records Verified
              </span>
              <Link
                href="/dashboard/transactions"
                className="inline-flex items-center gap-2 px-3 py-2 border border-[#4e4033] bg-[#3f3328] text-[#f4e8d4] hover:bg-[#4a3d31] transition-colors text-xs font-medium rounded-sm ink-text"
              >
                Review Queue <FaArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-5">
            <MainMetric
              icon={FaBook}
              label="Books"
              value={stats.totalBooks}
              href="/dashboard/books"
            />
            <MainMetric
              icon={FaUsers}
              label="Members"
              value={stats.totalMembers}
              href="/dashboard/users"
            />
            <MainMetric
              icon={FaExchangeAlt}
              label="Active"
              value={stats.activeBorrows}
              href="/dashboard/transactions"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-2.5 sm:mt-3">
            <Link
              href="/dashboard/copies"
              className="dashboard-surface rounded-sm p-2 sm:p-3 border border-[#b9a58b] hover:bg-[#f4ebdc] transition-colors"
              data-aos="fade-up"
              data-aos-duration="600"
            >
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
                Copies
              </p>
              <p className="text-lg sm:text-xl font-bold text-[#221910] ink-title mt-1 leading-none">
                {stats.totalCopies}
              </p>
            </Link>
            <Link
              href="/dashboard/transactions"
              className="dashboard-surface rounded-sm p-2 sm:p-3 border border-[#b9a58b] hover:bg-[#f4ebdc] transition-colors"
              data-aos="fade-up"
              data-aos-duration="600"
            >
              <p className="text-lg sm:text-xl font-bold text-[#221910] ink-title mt-1 leading-none">
                {stats.awaitingApproval}
              </p>
            </Link>
            <Link
              href="/dashboard/transactions"
              className="dashboard-surface rounded-sm p-2 sm:p-3 border border-[#b9a58b] hover:bg-[#f4ebdc] transition-colors"
              data-aos="fade-up"
              data-aos-duration="600"
            >
              <p className="text-lg sm:text-xl font-bold text-[#221910] ink-title mt-1 leading-none">
                {stats.overdue}
              </p>
            </Link>
          </div>
        </section>

        <section
          className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <div
            className="dashboard-surface tron-border rounded-sm p-5 sm:p-6"
            data-aos="fade-up"
            data-aos-duration="800"
          >
            <div className="space-y-3 ink-text text-sm">
              <div className="flex items-center justify-between p-3 bg-[#f6ecdd] border border-[#8a7966] rounded-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[#5c4f42]">
                    Past Due
                  </p>
                  <p className="text-2xl font-bold text-[#221910] ink-title mt-1">
                    {stats.overdue}
                  </p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 border border-[#7e6a55] bg-[#ebddc9] text-[#3f3328] uppercase tracking-[0.08em]">
                  Priority
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#f6ecdd] border border-[#8a7966] rounded-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[#5c4f42]">
                    Awaiting Approval
                  </p>
                  <p className="text-2xl font-bold text-[#221910] ink-title mt-1">
                    {stats.awaitingApproval}
                  </p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 border border-[#7e6a55] bg-[#ebddc9] text-[#3f3328] uppercase tracking-[0.08em]">
                  Queue
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/dashboard/transactions"
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#4e4033] bg-[#3f3328] text-[#f4e8d4] hover:bg-[#4a3d31] transition-colors text-sm font-medium rounded-sm ink-text"
              >
                Open Transactions <FaArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/dashboard/copies"
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#8a7966] text-[#4f4134] hover:bg-[#eadcc8] transition-colors text-sm font-medium rounded-sm ink-text"
              >
                Inspect Copies
              </Link>
            </div>
          </div>

          <div
            className="dashboard-surface tron-border rounded-sm p-5 sm:p-6"
            data-aos="fade-up"
            data-aos-duration="800"
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-[#5c4f42] mb-2 ink-text">
                  Most Active Members
                </p>
                <div className="space-y-2.5 ink-text">
                  {[
                    { name: "Ahsan Habib", books: 12 },
                    { name: "Farhan Rahman", books: 10 },
                    { name: "Rakib Hasan", books: 8 },
                  ].map((member) => (
                    <div
                      key={member.name}
                      className="flex items-center justify-between border-b border-[#ccb99f] pb-2"
                    >
                      <span className="text-sm text-[#46392d] font-medium">
                        {member.name}
                      </span>
                      <span className="text-sm font-bold text-[#221910]">
                        {member.books} books
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-[#5c4f42] mb-2 ink-text">
                  Popular Books
                </p>
                <div className="space-y-2.5 ink-text">
                  {[
                    { title: "ইসলামের সামাজিক বিধান", borrows: 24 },
                    { title: "ইসলামী অর্থনীতি", borrows: 19 },
                    { title: "গণতন্ত্র: ইসলামী দৃষ্টিকোণ", borrows: 18 },
                  ].map((book) => (
                    <div
                      key={book.title}
                      className="flex items-center justify-between border-b border-[#ccb99f] pb-2"
                    >
                      <span className="text-sm text-[#46392d] truncate pr-3">
                        {book.title}
                      </span>
                      <span className="text-sm font-bold text-[#221910] whitespace-nowrap">
                        {book.borrows}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="dashboard-surface tron-border rounded-sm overflow-hidden"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <div className="p-5 sm:p-6 border-b border-[#7d6d5a] flex items-center justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#221910] ink-title">
              Latest Transactions
            </h2>
            <Link
              href="/dashboard/transactions"
              className="inline-flex items-center gap-2 text-[#4f4134] hover:text-[#2f251d] font-medium text-sm ink-text"
            >
              View All <FaArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm ink-text min-w-160">
              <thead>
                <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                  <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] text-xs sm:text-sm font-semibold uppercase tracking-[0.08em]">
                    Member
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] text-xs sm:text-sm font-semibold uppercase tracking-[0.08em]">
                    Action
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] text-xs sm:text-sm font-semibold uppercase tracking-[0.08em]">
                    Book
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] text-xs sm:text-sm font-semibold uppercase tracking-[0.08em]">
                    Date
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] text-xs sm:text-sm font-semibold uppercase tracking-[0.08em]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 font-medium text-[#2b2119]">
                      {tx.member}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-[#5a4b3f]">
                      {tx.action}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-[#5a4b3f]">
                      {tx.book}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-[#5a4b3f]">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      {getStatusBadge(tx.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
