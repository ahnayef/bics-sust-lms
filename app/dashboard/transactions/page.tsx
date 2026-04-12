"use client";

import { useState } from "react";
import { FaCheck, FaSearch, FaTimes } from "react-icons/fa";

export default function TransactionsManagement() {
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "history">(
    "pending",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "member">("date");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "overdue"
  >("all");

  const mockTransactions = [
    // Pending Borrow Requests
    {
      id: 1,
      member: "John Doe",
      type: "borrow",
      book: "The Great Gatsby",
      bookId: "BOOK-001",
      requestDate: "2026-04-11",
      dueDate: "2026-04-18",
      status: "pending",
    },
    {
      id: 13,
      member: "Jane Smith",
      type: "borrow",
      book: "To Kill a Mockingbird",
      bookId: "BOOK-004",
      requestDate: "2026-04-10",
      dueDate: "2026-04-18",
      status: "pending",
    },

    // Pending Return Requests
    {
      id: 2,
      member: "Jane Smith",
      type: "return",
      book: "To Kill a Mockingbird",
      bookId: "BOOK-004",
      requestDate: "2026-04-10",
      borrowedDate: "2026-04-03",
      status: "pending",
    },
    {
      id: 14,
      member: "Mike Johnson",
      type: "return",
      book: "1984",
      bookId: "BOOK-007",
      requestDate: "2026-04-10",
      borrowedDate: "2026-04-03",
      status: "pending",
    },
    // Active Borrows
    {
      id: 3,
      member: "Mike Johnson",
      type: "borrow",
      book: "1984",
      bookId: "BOOK-007",
      requestDate: "2026-04-09",
      dueDate: "2026-04-16",
      status: "active",
    },
    {
      id: 4,
      member: "Sarah Williams",
      type: "borrow",
      book: "Pride and Prejudice",
      bookId: "BOOK-010",
      requestDate: "2026-04-08",
      dueDate: "2026-04-15",
      status: "active",
    },
    // Overdue Active Borrow
    {
      id: 5,
      member: "John Doe",
      type: "borrow",
      book: "The Hobbit",
      bookId: "BOOK-002",
      requestDate: "2026-04-05",
      dueDate: "2026-04-12",
      status: "overdue",
    },
    // Completed Return
    {
      id: 6,
      member: "Emma Davis",
      type: "return",
      book: "Wuthering Heights",
      bookId: "BOOK-009",
      requestDate: "2026-04-03",
      borrowedDate: "2026-03-27",
      status: "approved",
    },
  ];

  const pendingBorrows = mockTransactions.filter(
    (tx) => tx.status === "pending" && tx.type === "borrow",
  );
  const pendingReturns = mockTransactions.filter(
    (tx) => tx.status === "pending" && tx.type === "return",
  );
  const pendingTransactions = [...pendingBorrows, ...pendingReturns];

  let activeTransactions = mockTransactions.filter(
    (tx) => tx.status === "active" || tx.status === "overdue",
  );

  let historyTransactions = mockTransactions.filter(
    (tx) => tx.status === "approved",
  );

  // Filter and sort for active and history tabs
  if (activeTab === "active" || activeTab === "history") {
    const txList =
      activeTab === "active" ? activeTransactions : historyTransactions;

    const filtered = txList.filter((tx) => {
      const matchesSearch =
        tx.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.book.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.bookId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        activeTab === "history"
          ? true
          : statusFilter === "all" || tx.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    if (sortBy === "member") {
      filtered.sort((a, b) => a.member.localeCompare(b.member));
    } else {
      filtered.sort(
        (a, b) =>
          new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime(),
      );
    }

    if (activeTab === "active") {
      activeTransactions = filtered;
    } else {
      historyTransactions = filtered;
    }
  }

  const isOverdue = (dueDate: string) => {
    return (
      new Date(dueDate) < new Date() &&
      new Date().toDateString() !== new Date(dueDate).toDateString()
    );
  };

  const TransactionCard = ({
    tx,
    isOverdue,
  }: {
    tx: (typeof mockTransactions)[0];
    isOverdue: (date: string) => boolean;
  }) => (
    <div
      className={`border rounded-sm p-3 sm:p-4 transition-all ink-text ${
        tx.status === "overdue"
          ? "bg-[#ede0cd] border-[#8e7c68] shadow-sm"
          : "bg-[#f6ecdd] border-[#b9a58b] shadow-xs hover:bg-[#f2e6d4]"
      }`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex-1 w-full">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-sm bg-[#efe4d1] text-[#3f3328] border border-[#8f7f6c] shrink-0">
              {tx.type === "borrow" ? "Borrow" : "Return"}
            </span>
            {tx.status === "overdue" && (
              <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-sm bg-[#eadac3] text-[#5a3d2c] border border-[#9b856d] shrink-0">
                Overdue
              </span>
            )}
          </div>
          <p className="font-semibold text-[#2b2119] truncate text-sm">
            {tx.member}
          </p>
          <p className="text-xs sm:text-sm text-[#5a4b3f] truncate mt-0.5">
            {tx.book}{" "}
            <span className="font-mono text-xs text-[#6a5a4c]">
              ({tx.bookId})
            </span>
          </p>
          <div className="mt-2 flex flex-col xs:flex-row gap-2 xs:gap-4 sm:gap-6 text-xs text-[#5a4b3f]">
            <span className="shrink-0">
              Req: {new Date(tx.requestDate).toLocaleDateString()}
            </span>
            {tx.type === "borrow" && tx.dueDate && (
              <span
                className={
                  isOverdue(tx.dueDate) && tx.status !== "approved"
                    ? "text-[#2b2119] font-medium shrink-0"
                    : "shrink-0"
                }
              >
                Due: {new Date(tx.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {tx.status === "pending" ? (
          <div className="flex gap-2 pt-2 border-t border-[#cfbba1]">
            <button
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-[#4f4134] bg-[#eadcc8] hover:bg-[#e4d2bb] rounded-sm transition-colors border border-[#b79e81] cursor-pointer"
              title="Approve"
            >
              <FaCheck className="w-4 h-4" />
              <span>Approve</span>
            </button>
            <button
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-[#4f4134] bg-[#eadcc8] hover:bg-[#e4d2bb] rounded-sm transition-colors border border-[#b79e81] cursor-pointer"
              title="Reject"
            >
              <FaTimes className="w-4 h-4" />
              <span>Reject</span>
            </button>
          </div>
        ) : (
          <span className="text-[#a08f7b] text-xs pt-2 border-t border-[#cfbba1] inline-block">
            —
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
          Transactions
        </h1>
        <p className="text-xs sm:text-sm text-[#5a4b3f] mt-1 ink-text">
          Manage borrow and return requests
        </p>
      </div>

      {/* Tabs */}
      <div className="dashboard-surface tron-border rounded-sm border border-[#5f4f40] shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row border-b border-[#7c6d5d] bg-[#eadcc8]">
          <button
            onClick={() => {
              setActiveTab("pending");
              setSearchTerm("");
            }}
            className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium transition-colors ink-text ${
              activeTab === "pending"
                ? "text-[#221910] border-b-2 sm:border-b-2 border-[#3f3328] bg-[#f0e3cf]"
                : "text-[#5a4b3f] hover:text-[#2f251d] border-b border-[#cfbba1] sm:border-b-0"
            }`}
          >
            Pending
            <span className="hidden sm:inline-block sm:ml-1">Approvals</span>
            <span className="ml-1 text-xs text-[#7a6a5a]">
              ({pendingTransactions.length})
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("active");
              setSearchTerm("");
              setStatusFilter("all");
            }}
            className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium transition-colors ink-text ${
              activeTab === "active"
                ? "text-[#221910] border-b-2 border-[#3f3328] bg-[#f0e3cf]"
                : "text-[#5a4b3f] hover:text-[#2f251d] border-b border-[#cfbba1] sm:border-b-0"
            }`}
          >
            Active
            <span className="hidden sm:inline-block sm:ml-1">Borrows</span>
            <span className="ml-1 text-xs text-[#7a6a5a]">
              ({activeTransactions.length})
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              setSearchTerm("");
            }}
            className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium transition-colors ink-text ${
              activeTab === "history"
                ? "text-[#221910] border-b-2 border-[#3f3328] bg-[#f0e3cf]"
                : "text-[#5a4b3f] hover:text-[#2f251d]"
            }`}
          >
            History
            <span className="ml-1 text-xs text-[#7a6a5a]">
              ({historyTransactions.length})
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === "pending" ? (
            /* Pending Approvals - 2 Column Layout */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Borrow Requests Column */}
                <div className="border border-[#b9a58b] rounded-sm p-3 sm:p-4 bg-[#f6ecdd] shadow-sm">
                  <h3 className="text-sm sm:text-base font-semibold text-[#2b2119] mb-1 ink-title">
                    Borrow Requests
                  </h3>
                  <p className="text-xs text-[#6a5a4c] mb-3 font-medium ink-text">
                    {pendingBorrows.length} request
                    {pendingBorrows.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-[#5a4b3f] mb-4 ink-text">
                    Approving marks the book as borrowed by the member
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    {pendingBorrows.length === 0 ? (
                      <p className="text-sm text-[#6a5a4c] text-center py-6 ink-text">
                        No pending borrow requests
                      </p>
                    ) : (
                      pendingBorrows.map((tx) => (
                        <TransactionCard
                          key={tx.id}
                          tx={tx}
                          isOverdue={isOverdue}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Return Requests Column */}
                <div className="border border-[#b9a58b] rounded-sm p-3 sm:p-4 bg-[#f6ecdd] shadow-sm">
                  <h3 className="text-sm sm:text-base font-semibold text-[#2b2119] mb-1 ink-title">
                    Return Requests
                  </h3>
                  <p className="text-xs text-[#6a5a4c] mb-3 font-medium ink-text">
                    {pendingReturns.length} request
                    {pendingReturns.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-[#5a4b3f] mb-4 ink-text">
                    Approving marks the book as available again
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    {pendingReturns.length === 0 ? (
                      <p className="text-sm text-[#6a5a4c] text-center py-6 ink-text">
                        No pending return requests
                      </p>
                    ) : (
                      pendingReturns.map((tx) => (
                        <TransactionCard
                          key={tx.id}
                          tx={tx}
                          isOverdue={isOverdue}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Active Borrows and History - with Search/Sort */
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-2.5 text-[#7a6a5a]" />
                  <input
                    type="text"
                    placeholder="Search member, book, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {activeTab === "active" && (
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(
                          e.target.value as "all" | "active" | "overdue",
                        )
                      }
                      className="px-3 py-2 text-xs sm:text-sm border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  )}

                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "date" | "member")
                    }
                    className="px-3 py-2 text-xs sm:text-sm border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
                  >
                    <option value="date">Newest</option>
                    <option value="member">Member</option>
                  </select>
                </div>
              </div>

              {activeTab === "active" ? (
                /* Active Borrows - Card Layout */
                <div className="space-y-2 sm:space-y-3">
                  {activeTransactions.length === 0 ? (
                    <div className="text-center py-12 text-[#6a5a4c] ink-text">
                      <p>No active borrows.</p>
                    </div>
                  ) : (
                    activeTransactions.map((tx) => (
                      <TransactionCard
                        key={tx.id}
                        tx={tx}
                        isOverdue={isOverdue}
                      />
                    ))
                  )}
                </div>
              ) : (
                /* History - Table Layout */
                <div className="overflow-x-auto border border-[#b9a58b] rounded-sm shadow-sm">
                  <table className="w-full text-xs sm:text-sm ink-text">
                    <thead>
                      <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                          Member
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                          Book
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                          ID
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                          Type
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyTransactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 sm:px-6 py-6 sm:py-8 text-center text-[#6a5a4c] text-xs sm:text-sm"
                          >
                            No completed transactions.
                          </td>
                        </tr>
                      ) : (
                        historyTransactions.map((tx) => (
                          <tr
                            key={tx.id}
                            className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                          >
                            <td className="px-3 sm:px-6 py-2 sm:py-3 font-medium text-[#2b2119] truncate">
                              {tx.member}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-3 text-[#5a4b3f] truncate">
                              {tx.book}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-3 text-[#5a4b3f]">
                              <span className="font-mono text-xs bg-[#efe4d1] text-[#3f3328] border border-[#8f7f6c] px-2 py-1 rounded-sm">
                                {tx.bookId}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-3">
                              <span className="inline-block px-2 py-1 text-xs font-semibold rounded-sm bg-[#f0e3cf] text-[#47392d] border border-[#9a8975] whitespace-nowrap">
                                {tx.type === "borrow" ? "Borrow" : "Return"}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-3 text-[#5a4b3f] text-xs sm:text-sm whitespace-nowrap">
                              {new Date(tx.requestDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="dashboard-surface tron-border rounded-sm p-4 sm:p-6 border border-[#b9a58b] transition-colors hover:bg-[#f4ebdc]">
          <p className="text-xs sm:text-sm text-[#5a4b3f] mb-2 font-medium ink-text">
            Awaiting Approval
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-[#221910] ink-title">
            {pendingTransactions.length}
          </p>
        </div>
        <div className="dashboard-surface tron-border rounded-sm p-4 sm:p-6 border border-[#b9a58b] transition-colors hover:bg-[#f4ebdc]">
          <p className="text-xs sm:text-sm text-[#5a4b3f] mb-2 font-medium ink-text">
            Active Borrows
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-[#221910] ink-title">
            {activeTransactions.filter((tx) => tx.status === "active").length}
          </p>
        </div>
        <div className="dashboard-surface tron-border rounded-sm p-4 sm:p-6 border border-[#b9a58b] transition-colors hover:bg-[#f4ebdc]">
          <p className="text-xs sm:text-sm text-[#5a4b3f] mb-2 font-medium ink-text">
            Overdue
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-[#221910] ink-title">
            {activeTransactions.filter((tx) => tx.status === "overdue").length}
          </p>
        </div>
      </div>
    </div>
  );
}
