"use client";

import StatusBadge from "@/app/components/StatusBadge";
import UserNavbar from "@/app/components/UserNavbar";
import {
  getSubmissionsForMember,
  type PdfReadSubmission,
} from "@/app/data/pdf-submissions";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaFileAlt,
  FaSearch,
} from "react-icons/fa";

const CURRENT_MEMBER = {
  id: "Member-204",
  name: "Mahmudul Hasan",
};

type HistoryStatus = "pending" | "completed" | "active" | "overdue";

type PhysicalHistoryItem = {
  source: "physical";
  id: number;
  copyId: string;
  title: string;
  author: string;
  borrowedDate: string;
  dueDate: string;
  returnDate: string | null;
  status: HistoryStatus;
};

type PdfHistoryItem = {
  source: "pdf";
  id: string;
  copyId?: undefined;
  title: string;
  author: string;
  borrowedDate: string;
  dueDate: string;
  returnDate: string;
  status: HistoryStatus;
  pdfNote?: string;
  rejectionReason?: string;
  pdfStatus: PdfReadSubmission["status"];
};

type HistoryItem = PhysicalHistoryItem | PdfHistoryItem;

const PHYSICAL_HISTORY: PhysicalHistoryItem[] = [
  {
    source: "physical",
    id: 1,
    copyId: "QR001",
    title: "ইসলামের সামাজিক বিধান",
    author: "আল্লামা জামাল আল বাদাবী",
    borrowedDate: "2025-04-01",
    dueDate: "2025-04-08",
    returnDate: "2025-04-08",
    status: "completed",
  },
  {
    source: "physical",
    id: 2,
    copyId: "QR002",
    title: "পর্দা ও ইসলাম",
    author: "সাইয়েদ আবুল আ’লা মওদূদী",
    borrowedDate: "2025-03-20",
    dueDate: "2025-03-27",
    returnDate: "2025-03-27",
    status: "completed",
  },
  {
    source: "physical",
    id: 3,
    copyId: "QR003",
    title: "আদাবে জিন্দেগী",
    author: "আল্লামা ইউসুফ ইসলাহী",
    borrowedDate: "2025-04-05",
    dueDate: "2025-04-12",
    returnDate: null,
    status: "pending",
  },
  {
    source: "physical",
    id: 4,
    copyId: "QR004",
    title: "ইসলামী ব্যাংকিং ও অর্থায়ন পদ্ধতি: সমস্যা ও সমাধান",
    author: "মুফতি তাকি উসমানি",
    borrowedDate: "2025-03-10",
    dueDate: "2025-03-17",
    returnDate: "2025-03-20",
    status: "completed",
  },
  {
    source: "physical",
    id: 5,
    copyId: "QR005",
    title: "ইসলামী অর্থনীতি",
    author: "সাইয়েদ আবুল আ’লা মওদূদী",
    borrowedDate: "2025-02-28",
    dueDate: "2025-03-07",
    returnDate: "2025-03-10",
    status: "completed",
  },
  {
    source: "physical",
    id: 6,
    copyId: "QR004",
    title: "ইসলামী অর্থ ব্যবস্থায় যাকাত",
    author: "ড. জাবের মোহাম্মদ (ইসলামিক সেন্টার)",
    borrowedDate: "2025-02-15",
    dueDate: "2025-02-22",
    returnDate: null,
    status: "overdue",
  },
  {
    source: "physical",
    id: 7,
    copyId: "QR002",
    title: "খেলাফত ও রাজতন্ত্র",
    author: "সাইয়েদ আবুল আ’লা মওদূদী",
    borrowedDate: "2025-02-01",
    dueDate: "2025-02-08",
    returnDate: "2025-02-10",
    status: "completed",
  },
  {
    source: "physical",
    id: 8,
    copyId: "QR001",
    title: "ইসলামী রাষ্ট্রে অমুসলিমদের অধিকার",
    author: "সাইয়েদ আবুল আ’লা মওদূদী",
    borrowedDate: "2025-01-20",
    dueDate: "2025-01-27",
    returnDate: "2025-01-30",
    status: "completed",
  },
];

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "completed" | "active" | "overdue"
  >("all");
  const [sortBy, setSortBy] = useState<"date" | "title" | "status">("date");

  // Get PDF submissions for current member
  const pdfSubmissions = getSubmissionsForMember(CURRENT_MEMBER.id);

  // Combine physical history with PDF submissions
  const allHistory = useMemo<HistoryItem[]>(
    () => [
      ...PHYSICAL_HISTORY,
      ...pdfSubmissions.map((pdf) => ({
        source: "pdf" as const,
        id: `pdf-${pdf.id}`,
        title: pdf.bookTitle,
        author: "PDF Read",
        borrowedDate: pdf.readDate,
        dueDate: pdf.readDate,
        returnDate: pdf.readDate,
        status:
          pdf.status === "approved"
            ? ("completed" as const)
            : pdf.status === "pending"
              ? ("pending" as const)
              : ("overdue" as const),
        pdfNote: pdf.note,
        rejectionReason: pdf.rejectionReason,
        pdfStatus: pdf.status,
      })),
    ],
    [pdfSubmissions],
  );

  // Filter and sort logic
  const filteredHistory = useMemo(() => {
    const filtered = allHistory.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.borrowedDate).getTime() -
          new Date(a.borrowedDate).getTime()
        );
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "status") {
        const statusOrder = { pending: 0, active: 1, overdue: 2, completed: 3 };
        return (
          statusOrder[a.status as keyof typeof statusOrder] -
          statusOrder[b.status as keyof typeof statusOrder]
        );
      }
      return 0;
    });

    return filtered;
  }, [allHistory, searchTerm, statusFilter, sortBy]);

  // Calculate stats
  const stats = {
    total: allHistory.length,
    pending: allHistory.filter((item) => item.status === "pending").length,
    completed: allHistory.filter((item) => item.status === "completed").length,
    active: allHistory.filter((item) => item.status === "active").length,
    overdue: allHistory.filter((item) => item.status === "overdue").length,
  };

  const getStatusBadge = (status: HistoryStatus, item?: HistoryItem) => {
    // Handle PDF status badges
    if (item?.source === "pdf") {
      if (item.pdfStatus === "approved") {
        return (
          <StatusBadge tone="success" icon={FaCheckCircle}>
            Approved
          </StatusBadge>
        );
      } else if (item.pdfStatus === "pending") {
        return (
          <StatusBadge tone="accent" icon={FaClock}>
            Pending Review
          </StatusBadge>
        );
      } else if (item.pdfStatus === "rejected") {
        return (
          <StatusBadge tone="danger" icon={FaExclamationTriangle}>
            Rejected
          </StatusBadge>
        );
      }
    }

    // Handle physical borrow status badges
    switch (status) {
      case "pending":
        return (
          <StatusBadge tone="warning" icon={FaClock}>
            Pending Approval
          </StatusBadge>
        );
      case "completed":
        return (
          <StatusBadge tone="success" icon={FaCheckCircle}>
            Completed
          </StatusBadge>
        );
      case "active":
        return (
          <StatusBadge tone="info" icon={FaClock}>
            Active
          </StatusBadge>
        );
      case "overdue":
        return (
          <StatusBadge tone="danger" icon={FaExclamationTriangle}>
            Overdue
          </StatusBadge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#e5d9c4] history-paper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Courier+Prime:wght@400;700&display=swap');

        .history-paper {
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

        .history-surface {
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

      {/* Header */}
      <div
        className="history-surface border-b border-[#5a4a3b]"
        data-aos="fade-up"
        data-aos-duration="800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
              Borrow History
            </h1>
            <p className="text-sm text-[#5c4f42] mt-1 ink-text">
              View all your book transactions
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-[#f6ecdd] border border-[#786a5c] p-4 rounded text-center">
              <p className="text-2xl font-bold text-[#221910] ink-title">
                {stats.total}
              </p>
              <p className="text-xs text-[#5c4f42] mt-1 ink-text">
                Total Transactions
              </p>
            </div>
            <div className="bg-[#f6ecdd] border border-[#786a5c] p-4 rounded text-center">
              <p className="text-2xl font-bold text-[#221910] ink-title">
                {stats.pending}
              </p>
              <p className="text-xs text-[#5c4f42] mt-1 ink-text">Pending</p>
            </div>
            <div className="bg-[#f6ecdd] border border-[#786a5c] p-4 rounded text-center">
              <p className="text-2xl font-bold text-[#221910] ink-title">
                {stats.completed}
              </p>
              <p className="text-xs text-[#5c4f42] mt-1 ink-text">Completed</p>
            </div>
            <div className="bg-[#f6ecdd] border border-[#786a5c] p-4 rounded text-center">
              <p className="text-2xl font-bold text-[#221910] ink-title">
                {stats.active}
              </p>
              <p className="text-xs text-[#5c4f42] mt-1 ink-text">Active</p>
            </div>
            <div className="bg-[#f6ecdd] border border-[#786a5c] p-4 rounded text-center">
              <p className="text-2xl font-bold text-[#221910] ink-title">
                {stats.overdue}
              </p>
              <p className="text-xs text-[#5c4f42] mt-1 ink-text">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div
          className="history-surface tron-border rounded-lg p-6 mb-8"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-[#4e4033] mb-2 ink-text">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Book title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] rounded focus:outline-none focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent ink-text"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#78695a] w-4 h-4" />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-[#4e4033] mb-2 ink-text">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | "all"
                      | "pending"
                      | "completed"
                      | "active"
                      | "overdue",
                  )
                }
                className="w-full px-4 py-2 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] rounded focus:outline-none focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent ink-text"
              >
                <option value="all">All</option>
                <option value="pending">Pending Approval</option>
                <option value="completed">Completed</option>
                <option value="active">Active</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-[#4e4033] mb-2 ink-text">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "date" | "title" | "status")
                }
                className="w-full px-4 py-2 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] rounded focus:outline-none focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent ink-text"
              >
                <option value="date">Borrow Date (Newest)</option>
                <option value="title">Title (A-Z)</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div
          className="history-surface tron-border rounded-lg overflow-hidden"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          {filteredHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#b9a992] bg-[#eadcca]">
                    <th className="text-left py-3 px-6 font-semibold text-[#4e4033] ink-text">
                      Book
                    </th>
                    <th className="text-left py-3 px-6 font-semibold text-[#4e4033] ink-text">
                      Source
                    </th>
                    <th className="text-left py-3 px-6 font-semibold text-[#4e4033] ink-text">
                      Borrowed
                    </th>
                    <th className="text-left py-3 px-6 font-semibold text-[#4e4033] ink-text">
                      Due
                    </th>
                    <th className="text-left py-3 px-6 font-semibold text-[#4e4033] ink-text">
                      Returned
                    </th>
                    <th className="text-left py-3 px-6 font-semibold text-[#4e4033] ink-text">
                      Status
                    </th>
                    <th className="text-left py-3 px-6 font-semibold text-[#4e4033] ink-text">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`border-b border-[#c5b59d] hover:bg-[#f0e4d2] transition-colors ${
                        index === filteredHistory.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <td className="py-3 px-6">
                        <div>
                          <p className="font-medium text-[#221910] ink-title">
                            {item.title}
                          </p>
                          <p className="text-xs text-[#5c4f42] ink-text">
                            {item.author}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        {item.source === "pdf" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#efe4d1] text-[#5a4b3f] border border-[#9b8a75] text-[10px] font-semibold rounded-sm ink-text">
                            <FaFileAlt className="w-3 h-3" />
                            PDF
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#f3e9d8] text-[#3f3328] border border-[#8f7f6c] text-[10px] font-semibold rounded-sm ink-text">
                            Physical Copy
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-[#5c4f42] text-xs ink-text">
                        {new Date(item.borrowedDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-6 text-[#5c4f42] text-xs ink-text">
                        {new Date(item.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-6 text-[#5c4f42] text-xs ink-text">
                        {item.returnDate
                          ? new Date(item.returnDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-3 px-6">
                        {getStatusBadge(item.status, item)}
                      </td>
                      <td className="py-3 px-6">
                        {item.status === "completed" ? (
                          <span className="text-xs text-[#7b6d5f] ink-text">
                            -
                          </span>
                        ) : item.status === "pending" ? (
                          <span className="text-xs text-[#7b6d5f] ink-text">
                            Awaiting Approval
                          </span>
                        ) : item.source === "pdf" &&
                          item.pdfStatus === "rejected" ? (
                          <span className="text-xs text-[#7b6d5f] ink-text">
                            -
                          </span>
                        ) : item.source === "physical" ? (
                          <Link
                            href={`/return?copyId=${encodeURIComponent(item.copyId)}`}
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-[#7b6d5f] rounded-md text-xs font-semibold text-[#4e4033] hover:bg-[#eadcca] transition-colors ink-text"
                          >
                            Return
                          </Link>
                        ) : (
                          <span className="text-xs text-[#7b6d5f] ink-text">
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-[#5c4f42] mb-2 ink-text">
                No transactions found
              </p>
              <p className="text-sm text-[#6f6256] ink-text">
                Try adjusting your filters or search terms
              </p>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-6 text-sm text-[#5c4f42] text-center ink-text">
          Showing {filteredHistory.length} of {allHistory.length} transactions
        </div>
      </div>
    </div>
  );
}
