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

    let filtered = txList.filter((tx) => {
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

  const displayedTransactions = {
    pending: pendingTransactions,
    active: activeTransactions,
    history: historyTransactions,
  }[activeTab];

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
      className={`border rounded-lg p-3 sm:p-4 transition-all ${
        tx.status === "overdue"
          ? "bg-gray-50 border-gray-300 shadow-sm"
          : "bg-white border-gray-200 shadow-xs hover:shadow-sm"
      } hover:border-gray-300`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex-1 w-full">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-900 flex-shrink-0">
              {tx.type === "borrow" ? "Borrow" : "Return"}
            </span>
            {tx.status === "overdue" && (
              <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-400 text-white flex-shrink-0">
                Overdue
              </span>
            )}
          </div>
          <p className="font-semibold text-gray-900 truncate text-sm">
            {tx.member}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">
            {tx.book}{" "}
            <span className="font-mono text-xs text-gray-500">
              ({tx.bookId})
            </span>
          </p>
          <div className="mt-2 flex flex-col xs:flex-row gap-2 xs:gap-4 sm:gap-6 text-xs text-gray-600">
            <span className="flex-shrink-0">
              Req: {new Date(tx.requestDate).toLocaleDateString()}
            </span>
            {tx.type === "borrow" && tx.dueDate && (
              <span
                className={
                  isOverdue(tx.dueDate) && tx.status !== "approved"
                    ? "text-gray-900 font-medium flex-shrink-0"
                    : "flex-shrink-0"
                }
              >
                Due: {new Date(tx.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {tx.status === "pending" ? (
          <div className="flex gap-2 sm:gap-1 pt-2 border-t border-gray-100">
            <button
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-0 px-3 sm:px-2.5 py-2 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 sm:bg-gray-50 hover:bg-gray-200 sm:hover:bg-gray-100 rounded transition-colors border-none cursor-pointer active:bg-gray-300 sm:active:bg-gray-200"
              title="Approve"
            >
              <FaCheck className="w-4 h-4" />
              <span className="sm:hidden">Approve</span>
            </button>
            <button
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-0 px-3 sm:px-2.5 py-2 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 sm:bg-gray-50 hover:bg-gray-200 sm:hover:bg-gray-100 rounded transition-colors border-none cursor-pointer active:bg-gray-300 sm:active:bg-gray-200"
              title="Reject"
            >
              <FaTimes className="w-4 h-4" />
              <span className="sm:hidden">Reject</span>
            </button>
          </div>
        ) : (
          <span className="text-gray-300 text-xs pt-2 border-t border-gray-100 inline-block">
            —
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Transactions
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Manage borrow and return requests
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row border-b border-gray-100">
          <button
            onClick={() => {
              setActiveTab("pending");
              setSearchTerm("");
            }}
            className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "pending"
                ? "text-gray-900 border-b-2 sm:border-b-2 border-gray-900"
                : "text-gray-600 hover:text-gray-900 border-b border-gray-200 sm:border-b-0"
            }`}
          >
            Pending
            <span className="hidden sm:inline-block sm:ml-1">Approvals</span>
            <span className="ml-1 text-xs text-gray-500">
              ({pendingTransactions.length})
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("active");
              setSearchTerm("");
              setStatusFilter("all");
            }}
            className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "active"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-600 hover:text-gray-900 border-b border-gray-200 sm:border-b-0"
            }`}
          >
            Active
            <span className="hidden sm:inline-block sm:ml-1">Borrows</span>
            <span className="ml-1 text-xs text-gray-500">
              ({activeTransactions.length})
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              setSearchTerm("");
            }}
            className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            History
            <span className="ml-1 text-xs text-gray-500">
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
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white shadow-sm">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                    Borrow Requests
                  </h3>
                  <p className="text-xs text-gray-500 mb-3 font-medium">
                    {pendingBorrows.length} request
                    {pendingBorrows.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-600 mb-4">
                    Approving marks the book as borrowed by the member
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    {pendingBorrows.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-6">
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
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white shadow-sm">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                    Return Requests
                  </h3>
                  <p className="text-xs text-gray-500 mb-3 font-medium">
                    {pendingReturns.length} request
                    {pendingReturns.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-600 mb-4">
                    Approving marks the book as available again
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    {pendingReturns.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-6">
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
                  <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search member, book, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
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
                      className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
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
                    className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
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
                    <div className="text-center py-12 text-gray-500">
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
                <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-gray-700 font-semibold">
                          Member
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-gray-700 font-semibold">
                          Book
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-gray-700 font-semibold">
                          ID
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-gray-700 font-semibold">
                          Type
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-gray-700 font-semibold">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyTransactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 sm:px-6 py-6 sm:py-8 text-center text-gray-500 text-xs sm:text-sm"
                          >
                            No completed transactions.
                          </td>
                        </tr>
                      ) : (
                        historyTransactions.map((tx) => (
                          <tr
                            key={tx.id}
                            className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-3 sm:px-6 py-2 sm:py-3 font-medium text-gray-900 truncate">
                              {tx.member}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-3 text-gray-600 truncate">
                              {tx.book}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-3 text-gray-600">
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {tx.bookId}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-3">
                              <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-gray-200 text-gray-900 whitespace-nowrap">
                                {tx.type === "borrow" ? "Borrow" : "Return"}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-3 text-gray-600 text-xs sm:text-sm whitespace-nowrap">
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
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs sm:text-sm text-gray-600 mb-2 font-medium">
            Awaiting Approval
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-gray-900">
            {pendingTransactions.length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs sm:text-sm text-gray-600 mb-2 font-medium">
            Active Borrows
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-gray-900">
            {activeTransactions.filter((tx) => tx.status === "active").length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs sm:text-sm text-gray-600 mb-2 font-medium">
            Overdue
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-gray-900">
            {activeTransactions.filter((tx) => tx.status === "overdue").length}
          </p>
        </div>
      </div>
    </div>
  );
}
