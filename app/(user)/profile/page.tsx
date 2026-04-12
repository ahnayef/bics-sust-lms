"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FaArrowRight,
  FaBook,
  FaBookOpen,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaQrcode,
} from "react-icons/fa";

export default function MemberProfile() {
  // Pagination state
  const [borrowPage, setBorrowPage] = useState(0);

  // Mock data - will be replaced with actual API calls
  const [member] = useState({
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    joinedDate: "2025-01-15",
  });

  const [stats] = useState({
    syllabusBooks: 80, // Fixed syllabus size (can be updated by admin)
    completedSyllabus: 12,
    active: 4,
    currentBorrows: [
      {
        id: 1,
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        borrowedDate: "2025-04-05",
        dueDate: "2025-04-12",
        isSyllabus: true,
      },
      {
        id: 2,
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        borrowedDate: "2025-04-02",
        dueDate: "2025-04-15",
        isSyllabus: false,
      },
      {
        id: 3,
        title: "Pride and Prejudice",
        author: "Jane Austen",
        borrowedDate: "2025-03-28",
        dueDate: "2025-04-10",
        isSyllabus: true,
      },
      {
        id: 4,
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        borrowedDate: "2025-04-08",
        dueDate: "2025-04-18",
        isSyllabus: true,
      },
      {
        id: 5,
        title: "One Hundred Years of Solitude",
        author: "Gabriel García Márquez",
        borrowedDate: "2025-04-10",
        dueDate: "2025-04-17",
        status: "active",
        isSyllabus: false,
      },
    ],
    history: [
      {
        id: 1,
        title: "Wuthering Heights",
        author: "Emily Brontë",
        borrowedDate: "2025-01-20",
        returnDate: "2025-01-27",
        status: "completed",
        isSyllabus: true,
      },
      {
        id: 2,
        title: "1984",
        author: "George Orwell",
        borrowedDate: "2025-03-20",
        returnDate: "2025-03-27",
        status: "completed",
        isSyllabus: true,
      },
      {
        id: 3,
        title: "Jane Eyre",
        author: "Charlotte Brontë",
        borrowedDate: "2025-02-15",
        dueDate: "2025-02-22",
        status: "overdue",
        isSyllabus: true,
      },
      {
        id: 4,
        title: "Mockingbird",
        author: "Harper Lee",
        borrowedDate: "2025-04-05",
        dueDate: "2025-04-12",
        status: "active",
        isSyllabus: false,
      },
    ],
  });

  const remaining = stats.syllabusBooks - stats.completedSyllabus;
  const completionPercentage = Math.round(
    (stats.completedSyllabus / stats.syllabusBooks) * 100,
  );

  // Pagination logic
  const itemsPerPage = 4;
  const totalBorrowPages = Math.ceil(
    stats.currentBorrows.length / itemsPerPage,
  );
  const paginatedBorrows = stats.currentBorrows.slice(
    borrowPage * itemsPerPage,
    (borrowPage + 1) * itemsPerPage,
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded">
            <FaCheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded">
            <FaClock className="w-3 h-3" />
            Active
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 text-xs font-medium rounded">
            <FaExclamationTriangle className="w-3 h-3" />
            Overdue
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo/Home */}
            <Link
              href="/profile"
              className="flex items-center gap-1 sm:gap-2 font-bold text-gray-900 hover:text-gray-700 transition-colors shrink-0 min-w-0"
            >
              <FaBook className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <span className="text-sm sm:text-lg font-bold truncate">
                BICS SUST LMS
              </span>
            </Link>

            {/* Navigation Links - Responsive */}
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 ml-2 sm:ml-4">
              <Link
                href="/profile"
                className="text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-2 sm:px-3 py-2 rounded-md hover:bg-gray-50"
              >
                Profile
              </Link>
              <Link
                href="/history"
                className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-2 sm:px-3 py-2 rounded-md hover:bg-gray-50"
              >
                History
              </Link>

              {/* Borrow Button - Visible on all screens */}
              <Link
                href="/borrow"
                className="inline-flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 bg-gray-900 text-white rounded-lg font-semibold text-xs sm:text-sm hover:bg-gray-800 active:bg-gray-950 transition-colors whitespace-nowrap shrink-0 h-10 sm:h-auto"
              >
                <FaQrcode className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline">Borrow</span>
                <span className="sm:hidden text-xs font-bold">QR</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {member.name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {member.email} • Member since{" "}
              {new Date(member.joinedDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Floating Borrow Button (Mobile) */}
      <Link
        href="/borrow"
        className="sm:hidden fixed bottom-6 right-6 bg-gray-900 text-white p-2.5 rounded-full shadow-md hover:shadow-lg hover:bg-gray-800 transition-all z-40 flex items-center justify-center w-12 h-12  hover:opacity-100"
      >
        <FaQrcode className="w-5 h-5" />
      </Link>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Syllabus Reading Progress
          </h2>

          {/* Progress Bar */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-3 gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {stats.completedSyllabus} of {stats.syllabusBooks} syllabus
                books
              </span>
              <span className="text-xl sm:text-2xl font-bold text-gray-900">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-linear-to-r from-gray-900 to-gray-700 h-4 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            {/* Completed */}
            <div className="bg-white border border-gray-200 p-3 sm:p-4 rounded-lg text-center hover:shadow-sm transition-shadow">
              <FaCheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-gray-700 mx-auto mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {stats.completedSyllabus}
              </p>
              <p className="text-xs text-gray-600 mt-1">Completed</p>
            </div>

            {/* Active */}
            <div className="bg-white border border-gray-200 p-3 sm:p-4 rounded-lg text-center hover:shadow-sm transition-shadow">
              <FaClock className="w-4 sm:w-5 h-4 sm:h-5 text-gray-700 mx-auto mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {stats.active}
              </p>
              <p className="text-xs text-gray-600 mt-1">Active</p>
            </div>

            {/* Remaining */}
            <div className="bg-white border border-gray-200 p-3 sm:p-4 rounded-lg text-center hover:shadow-sm transition-shadow">
              <FaBook className="w-4 sm:w-5 h-4 sm:h-5 text-gray-700 mx-auto mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {remaining}
              </p>
              <p className="text-xs text-gray-600 mt-1">Remaining</p>
            </div>

            {/* Total */}
            <div className="bg-white border border-gray-200 p-3 sm:p-4 rounded-lg text-center hover:shadow-sm transition-shadow">
              <FaBookOpen className="w-4 sm:w-5 h-4 sm:h-5 text-gray-700 mx-auto mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {stats.syllabusBooks}
              </p>
              <p className="text-xs text-gray-600 mt-1">Syllabus</p>
            </div>
          </div>
        </div>

        {/* Currently Borrowing - Full Width Grid */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FaClock className="w-5 h-5 text-gray-700" />
              Currently Borrowing
            </h2>
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
              {stats.currentBorrows.length} active
            </span>
          </div>

          {stats.currentBorrows.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {paginatedBorrows.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 sm:p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-gray-300 transition-all bg-linear-to-br from-white to-gray-50"
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex-1 mb-3 sm:mb-4">
                        <p className="font-semibold text-gray-900 line-clamp-2 text-xs sm:text-sm">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                          {item.author}
                        </p>
                      </div>
                      <div className="pt-3 sm:pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Due</p>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">
                          {new Date(item.dueDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Borrowed{" "}
                          {new Date(item.borrowedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalBorrowPages > 1 && (
                <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setBorrowPage((p) => Math.max(0, p - 1))}
                    disabled={borrowPage === 0}
                    className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-gray-600">
                    {borrowPage + 1}/{totalBorrowPages}
                  </span>
                  <button
                    onClick={() =>
                      setBorrowPage((p) =>
                        Math.min(totalBorrowPages - 1, p + 1),
                      )
                    }
                    disabled={borrowPage === totalBorrowPages - 1}
                    className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FaBook className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No active borrows</p>
            </div>
          )}
        </div>

        {/* Borrow History - Full Width Table */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent History
            </h2>
            <Link
              href="/history"
              className="text-sm text-gray-900 font-medium hover:underline flex items-center gap-1 group"
            >
              View All
              <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Table on desktop, cards on mobile */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Book
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Borrowed
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Returned
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.history.slice(0, 5).map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500">{item.author}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {new Date(item.borrowedDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {item.returnDate
                        ? new Date(item.returnDate).toLocaleDateString()
                        : item.dueDate
                          ? new Date(item.dueDate).toLocaleDateString()
                          : "-"}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards on mobile */}
          <div className="sm:hidden space-y-3">
            {stats.history.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="p-4 border border-gray-200 rounded-lg bg-linear-to-br from-white to-gray-50 hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 line-clamp-2 text-sm">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {item.author}
                    </p>
                  </div>
                  <div className="shrink-0">{getStatusBadge(item.status)}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs ">
                  <div>
                    <p className="text-gray-600 mb-1">Borrowed</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(item.borrowedDate).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" },
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Returned</p>
                    <p className="font-semibold text-gray-900">
                      {item.returnDate
                        ? new Date(item.returnDate).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )
                        : item.dueDate
                          ? new Date(item.dueDate).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" },
                            )
                          : "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
