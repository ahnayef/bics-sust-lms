"use client";

import Link from "next/link";
import {
  FaArrowRight,
  FaBook,
  FaClock,
  FaExchangeAlt,
  FaUsers,
} from "react-icons/fa";

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

  const StatCard = ({
    icon: Icon,
    label,
    value,
    href,
  }: {
    icon: any;
    label: string;
    value: number;
    href?: string;
  }) => {
    const card = (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <Icon className="w-12 h-12 text-gray-300" />
        </div>
      </div>
    );

    return href ? <Link href={href}>{card}</Link> : card;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome to the Library Management System
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FaBook}
          label="Total Books"
          value={stats.totalBooks}
          href="/dashboard/books"
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue Items Alert */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Overdue Items
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">3</p>
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-700 rounded">
                Past Due
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-600">7</p>
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                This Week
              </span>
            </div>
            <Link
              href="/dashboard/transactions"
              className="block mt-4 px-4 py-2 text-center bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
            >
              View All
            </Link>
          </div>
        </div>

        {/* Most Active Members */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Most Active Members
          </h2>
          <div className="space-y-2">
            {[
              { name: "John Doe", books: 12 },
              { name: "Sarah Williams", books: 10 },
              { name: "Jane Smith", books: 8 },
              { name: "Mike Johnson", books: 6 },
              { name: "Emma Davis", books: 5 },
            ].map((member) => (
              <div
                key={member.name}
                className="flex items-center justify-between p-2"
              >
                <span className="text-sm text-gray-700 font-medium">
                  {member.name}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {member.books} books
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Books */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Popular Books
          </h2>
          <div className="space-y-2">
            {[
              { title: "The Great Gatsby", borrows: 24 },
              { title: "To Kill a Mockingbird", borrows: 19 },
              { title: "1984", borrows: 18 },
              { title: "Pride and Prejudice", borrows: 16 },
              { title: "Jane Eyre", borrows: 14 },
            ].map((book) => (
              <div
                key={book.title}
                className="flex items-center justify-between p-2"
              >
                <span className="text-sm text-gray-700 truncate">
                  {book.title}
                </span>
                <span className="text-sm font-bold text-gray-900 whitespace-nowrap ml-2">
                  {book.borrows}x
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Transactions
          </h2>
          <Link
            href="/dashboard/transactions"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            View All <FaArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Book
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {tx.member}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{tx.action}</td>
                  <td className="px-6 py-3 text-gray-600">{tx.book}</td>
                  <td className="px-6 py-3 text-gray-600">
                    {new Date(tx.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-900">
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
