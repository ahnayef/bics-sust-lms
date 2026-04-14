"use client";

import UserNavbar from "@/app/components/UserNavbar";
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
    name: "Ahsan Habib",
    email: "ahnayef@duck.com",
    joinedDate: "2025-01-15",
  });

  const [stats] = useState({
    syllabusBooks: 80, // Fixed syllabus size (can be updated by admin)
    completedSyllabus: 12,
    active: 4,
    currentBorrows: [
      {
        id: 1,
        title: "ইসলামের সামাজিক বিধান",
        author: "আল্লামা জামাল আল বাদাবী",
        borrowedDate: "2025-04-05",
        dueDate: "2025-04-12",
        isSyllabus: true,
      },
      {
        id: 2,
        title: "পর্দা ও ইসলাম",
        author: "সাইয়েদ আবুল আ’লা মওদূদী",
        borrowedDate: "2025-04-02",
        dueDate: "2025-04-15",
        isSyllabus: false,
      },
      {
        id: 3,
        title: "আদাবে জিন্দেগী",
        author: "আল্লামা ইউসুফ ইসলাহী",
        borrowedDate: "2025-03-28",
        dueDate: "2025-04-10",
        isSyllabus: true,
      },
      {
        id: 4,
        title: "ইসলামী ব্যাংকিং ও অর্থায়ন পদ্ধতি: সমস্যা ও সমাধান",
        author: "মুফতি তাকি উসমানি",
        borrowedDate: "2025-04-08",
        dueDate: "2025-04-18",
        isSyllabus: true,
      },
      {
        id: 5,
        title: "ইসলামী অর্থনীতি",
        author: "সাইয়েদ আবুল আ’লা মওদূদী",
        borrowedDate: "2025-04-10",
        dueDate: "2025-04-17",
        status: "active",
        isSyllabus: false,
      },
    ],
    history: [
      {
        id: 1,
        title: "ইসলামী অর্থ ব্যবস্থায় যাকাত",
        author: "ড. জাবের মোহাম্মদ (ইসলামিক সেন্টার)",
        borrowedDate: "2025-01-20",
        returnDate: "2025-01-27",
        status: "completed",
        isSyllabus: true,
      },
      {
        id: 2,
        title: "খেলাফত ও রাজতন্ত্র",
        author: "সাইয়েদ আবুল আ’লা মওদূদী",
        borrowedDate: "2025-03-20",
        returnDate: "2025-03-27",
        status: "completed",
        isSyllabus: true,
      },
      {
        id: 3,
        title: "ইসলামী রাষ্ট্রে অমুসলিমদের অধিকার",
        author: "সাইয়েদ আবুল আ’লা মওদূদী",
        borrowedDate: "2025-02-15",
        dueDate: "2025-02-22",
        status: "overdue",
        isSyllabus: true,
      },
      {
        id: 4,
        title: "একটি সত্যনিষ্ঠ দলের প্রয়োজন",
        author: "সাইয়েদ আবুল আ’লা মওদূদী",
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f3e9d8] text-[#3f3328] border border-[#8f7f6c] text-xs font-semibold rounded-sm ink-text">
            <FaCheckCircle className="w-3 h-3 text-[#4e4033]" />
            Completed
          </span>
        );
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f3e9d8] text-[#3f3328] border border-[#8f7f6c] text-xs font-semibold rounded-sm ink-text">
            <FaClock className="w-3 h-3 text-[#6b5a4a]" />
            Active
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f3e9d8] text-[#3f3328] border border-[#8f7f6c] text-xs font-semibold rounded-sm ink-text">
            <FaExclamationTriangle className="w-3 h-3 text-[#7a4c37]" />
            Overdue
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#e5d9c4] profile-paper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Courier+Prime:wght@400;700&display=swap');

        .profile-paper {
          background-image:
            linear-gradient(180deg, #eee4d3 0%, #e5d8c1 52%, #dcccb2 100%),
            linear-gradient(92deg, rgba(88, 66, 46, 0.05), transparent 24%),
            linear-gradient(268deg, rgba(88, 66, 46, 0.04), transparent 18%),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px),
            url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="4" seed="6"/></filter><rect width="220" height="220" fill="%23e5d9c4"/><rect width="220" height="220" filter="url(%23p)" opacity="0.028"/></svg>');
        }

        .ink-text {
          font-family: 'Courier Prime', monospace;
        }

        .ink-title {
          font-family: 'Playfair Display', serif;
        }

        .profile-surface {
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
      <UserNavbar />

      {/* Profile Header Section */}
      <div className="profile-surface border-b border-[#5a4a3b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
              {member.name}
            </h1>
            <p className="text-sm text-[#5c4f42] mt-1 ink-text">
              {member.email} • Member since{" "}
              {new Date(member.joinedDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Floating Borrow Button (Mobile) */}
      <Link
        href="/borrow"
        className="sm:hidden fixed bottom-6 right-6 bg-[#5a4d40] text-[#f6ede1] p-2.5 rounded-full shadow-md hover:shadow-lg hover:bg-[#4c4035] transition-all z-40 flex items-center justify-center w-12 h-12"
      >
        <FaQrcode className="w-5 h-5" />
      </Link>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview Card */}
        <div className="profile-surface tron-border rounded-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <h2 className="text-lg font-semibold text-[#221910] mb-6 ink-title">
            Syllabus Reading Progress
          </h2>

          {/* Progress Bar */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-3 gap-2">
              <span className="text-xs sm:text-sm font-medium text-[#4e4033] ink-text">
                {stats.completedSyllabus} of {stats.syllabusBooks} syllabus
                books
              </span>
              <span className="text-xl sm:text-2xl font-bold text-[#221910] ink-title">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-[#d7c7b0] rounded-full h-4">
              <div
                className="bg-linear-to-r from-[#5a4d40] to-[#3d3126] h-4 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            {/* Completed */}
            <div className="bg-[#f6ecdd] border border-[#786a5c] p-3 sm:p-4 rounded-lg text-center">
              <FaCheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-[#4e4033] mx-auto mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-[#221910] ink-title">
                {stats.completedSyllabus}
              </p>
              <p className="text-xs text-[#5c4f42] mt-1 ink-text">Completed</p>
            </div>

            {/* Active */}
            <div className="bg-[#f6ecdd] border border-[#786a5c] p-3 sm:p-4 rounded-lg text-center">
              <FaClock className="w-4 sm:w-5 h-4 sm:h-5 text-[#4e4033] mx-auto mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-[#221910] ink-title">
                {stats.active}
              </p>
              <p className="text-xs text-[#5c4f42] mt-1 ink-text">Active</p>
            </div>

            {/* Remaining */}
            <div className="bg-[#f6ecdd] border border-[#786a5c] p-3 sm:p-4 rounded-lg text-center">
              <FaBook className="w-4 sm:w-5 h-4 sm:h-5 text-[#4e4033] mx-auto mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-[#221910] ink-title">
                {remaining}
              </p>
              <p className="text-xs text-[#5c4f42] mt-1 ink-text">Remaining</p>
            </div>

            {/* Total */}
            <div className="bg-[#f6ecdd] border border-[#786a5c] p-3 sm:p-4 rounded-lg text-center">
              <FaBookOpen className="w-4 sm:w-5 h-4 sm:h-5 text-[#4e4033] mx-auto mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-[#221910] ink-title">
                {stats.syllabusBooks}
              </p>
              <p className="text-xs text-[#5c4f42] mt-1 ink-text">Syllabus</p>
            </div>
          </div>
        </div>

        {/* Currently Borrowing - Full Width Grid */}
        <div className="profile-surface tron-border rounded-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#221910] flex items-center gap-2 ink-title">
              <FaClock className="w-5 h-5 text-[#4e4033]" />
              Currently Borrowing
            </h2>
            <span className="text-sm text-[#5c4f42] bg-[#ebdfcd] px-3 py-1 rounded ink-text">
              {stats.currentBorrows.length} active
            </span>
          </div>

          {stats.currentBorrows.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {paginatedBorrows.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 sm:p-4 border border-[#7b6d5f] rounded-lg shadow-sm transition-all bg-[#f6ecdd]"
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex-1 mb-3 sm:mb-4">
                        <p className="font-semibold text-[#221910] line-clamp-2 text-xs sm:text-sm ink-title">
                          {item.title}
                        </p>
                        <p className="text-xs text-[#5c4f42] mt-1 line-clamp-1 ink-text">
                          {item.author}
                        </p>
                      </div>
                      <div className="pt-3 sm:pt-4 border-t border-[#b9a992]">
                        <p className="text-xs text-[#5c4f42] mb-1 ink-text">
                          Due
                        </p>
                        <p className="text-xs sm:text-sm font-semibold text-[#221910] ink-text">
                          {new Date(item.dueDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-[#6f6256] mt-2 ink-text">
                          Borrowed{" "}
                          {new Date(item.borrowedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalBorrowPages > 1 && (
                <div className="flex items-center justify-between gap-2 pt-4 border-t border-[#b9a992]">
                  <button
                    onClick={() => setBorrowPage((p) => Math.max(0, p - 1))}
                    disabled={borrowPage === 0}
                    className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-[#4e4033] border border-[#7b6d5f] rounded hover:bg-[#eadcca] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap ink-text"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-[#5c4f42] ink-text">
                    {borrowPage + 1}/{totalBorrowPages}
                  </span>
                  <button
                    onClick={() =>
                      setBorrowPage((p) =>
                        Math.min(totalBorrowPages - 1, p + 1),
                      )
                    }
                    disabled={borrowPage === totalBorrowPages - 1}
                    className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-[#4e4033] border border-[#7b6d5f] rounded hover:bg-[#eadcca] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap ink-text"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-[#5c4f42] ink-text">
              <FaBook className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No active borrows</p>
            </div>
          )}
        </div>

        {/* Borrow History - Full Width Table */}
        <div className="profile-surface tron-border rounded-lg p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#221910] ink-title">
              Recent History
            </h2>
            <Link
              href="/history"
              className="text-sm text-[#3b2f24] font-medium hover:underline flex items-center gap-1 group ink-text"
            >
              View All
              <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Table on desktop, cards on mobile */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#b9a992] bg-[#eadcca]">
                  <th className="text-left py-3 px-4 font-semibold text-[#4e4033] ink-text">
                    Book
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-[#4e4033] ink-text">
                    Borrowed
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-[#4e4033] ink-text">
                    Returned
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-[#4e4033] ink-text">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.history.slice(0, 5).map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[#c5b59d] hover:bg-[#f0e4d2] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-[#221910] line-clamp-1 ink-title">
                          {item.title}
                        </p>
                        <p className="text-xs text-[#6f6256] ink-text">
                          {item.author}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#5c4f42] text-xs ink-text">
                      {new Date(item.borrowedDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-[#5c4f42] text-xs ink-text">
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
                className="p-4 border border-[#7b6d5f] rounded-lg bg-[#f6ecdd] transition-all"
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#221910] line-clamp-2 text-sm ink-title">
                      {item.title}
                    </p>
                    <p className="text-xs text-[#6f6256] line-clamp-1 ink-text">
                      {item.author}
                    </p>
                  </div>
                  <div className="shrink-0">{getStatusBadge(item.status)}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs ">
                  <div>
                    <p className="text-[#5c4f42] mb-1 ink-text">Borrowed</p>
                    <p className="font-semibold text-[#221910] ink-text">
                      {new Date(item.borrowedDate).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" },
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#5c4f42] mb-1 ink-text">Returned</p>
                    <p className="font-semibold text-[#221910] ink-text">
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
