"use client";

import Link from "next/link";
import {
  FaArrowRight,
  FaBook,
  FaCheckCircle,
  FaClock,
  FaCopy,
  FaExchangeAlt,
  FaHourglassHalf,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  href?: string;
}

function StatCard({ icon: Icon, label, value, href }: StatCardProps) {
  const card = (
    <div className="dashboard-surface tron-border rounded-sm p-4 sm:p-5 transition-colors hover:bg-[#f4ebdc]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] sm:text-xs text-[#5c4f42] tracking-[0.08em] uppercase ink-text">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-[#221910] mt-1 ink-title">
            {value}
          </p>
        </div>
        <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-[#6f5e4d]" />
      </div>
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

export default function DashboardOverview() {
  // Mock stats data
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
      member: "John Doe",
      action: "Borrowed",
      book: "The Great Gatsby",
      date: "2026-04-11",
      status: "active",
    },
    {
      id: 2,
      member: "Jane Smith",
      action: "Returned",
      book: "To Kill a Mockingbird",
      date: "2026-04-10",
      status: "pending",
    },
    {
      id: 3,
      member: "Mike Johnson",
      action: "Borrowed",
      book: "1984",
      date: "2026-04-09",
      status: "active",
    },
    {
      id: 4,
      member: "Sarah Williams",
      action: "Returned",
      book: "Pride and Prejudice",
      date: "2026-04-08",
      status: "approved",
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f3e9d8] text-[#3f3328] border border-[#8f7f6c] text-xs font-semibold rounded-sm ink-text">
          <FaClock className="w-3 h-3 text-[#6b5a4a]" />
          Active
        </span>
      );
    }

    if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f3e9d8] text-[#3f3328] border border-[#8f7f6c] text-xs font-semibold rounded-sm ink-text">
          <FaHourglassHalf className="w-3 h-3 text-[#7a6146]" />
          Pending
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f3e9d8] text-[#3f3328] border border-[#8f7f6c] text-xs font-semibold rounded-sm ink-text">
        <FaCheckCircle className="w-3 h-3 text-[#4e4033]" />
        Approved
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#e5d9c4] dashboard-paper pb-8">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
                Dashboard Bulletin
              </h1>
              <p className="text-sm sm:text-base text-[#5c4f42] mt-2 ink-text">
                Daily circulation snapshot for the library desk.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 border border-[#7c6b59] bg-[#f6ecdd] text-[#4b3d31] text-xs uppercase tracking-[0.08em] ink-text">
              <FaShieldAlt className="w-3.5 h-3.5" />
              Records Verified
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          <StatCard
            icon={FaBook}
            label="Total Books"
            value={stats.totalBooks}
            href="/dashboard/books"
          />
          <StatCard
            icon={FaCopy}
            label="Total Copies"
            value={stats.totalCopies}
            href="/dashboard/copies"
          />
          <StatCard
            icon={FaUsers}
            label="Members"
            value={stats.totalMembers}
            href="/dashboard/users"
          />
          <StatCard
            icon={FaExchangeAlt}
            label="Active Borrows"
            value={stats.activeBorrows}
            href="/dashboard/transactions"
          />
          <StatCard
            icon={FaClock}
            label="Awaiting Approval"
            value={stats.awaitingApproval}
            href="/dashboard/transactions"
          />
          <StatCard
            icon={FaArrowRight}
            label="Overdue Records"
            value={stats.overdue}
            href="/dashboard/transactions"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5">
          {/* Overdue Items Alert */}
          <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#221910] mb-4 ink-title">
              Overdue Watch
            </h2>
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
                    Expiring Soon
                  </p>
                  <p className="text-2xl font-bold text-[#221910] ink-title mt-1">
                    7
                  </p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 border border-[#7e6a55] bg-[#ebddc9] text-[#3f3328] uppercase tracking-[0.08em]">
                  This Week
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/transactions"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-[#4e4033] bg-[#3f3328] text-[#f4e8d4] hover:bg-[#4a3d31] transition-colors text-sm font-medium rounded-sm ink-text"
            >
              Review Queue <FaArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Most Active Members */}
          <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#221910] mb-4 ink-title">
              Most Active Members
            </h2>
            <div className="space-y-2.5 ink-text">
              {[
                { name: "John Doe", books: 12 },
                { name: "Sarah Williams", books: 10 },
                { name: "Jane Smith", books: 8 },
                { name: "Mike Johnson", books: 6 },
                { name: "Emma Davis", books: 5 },
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

          {/* Popular Books */}
          <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[#221910] mb-4 ink-title">
              Popular Books
            </h2>
            <div className="space-y-2.5 ink-text">
              {[
                { title: "The Great Gatsby", borrows: 24 },
                { title: "To Kill a Mockingbird", borrows: 19 },
                { title: "1984", borrows: 18 },
                { title: "Pride and Prejudice", borrows: 16 },
                { title: "Jane Eyre", borrows: 14 },
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

        {/* Recent Transactions */}
        <div className="dashboard-surface tron-border rounded-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-[#7d6d5a] flex items-center justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#221910] ink-title">
              Recent Transactions
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
        </div>
      </div>
    </div>
  );
}
