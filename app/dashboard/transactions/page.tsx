"use client";

import { useMemo, useState } from "react";
import { FaCheck, FaClock, FaSearch, FaTimes } from "react-icons/fa";

type TabKey = "pending" | "active" | "history";
type SortKey = "date" | "member";
type StatusFilter = "all" | "active" | "overdue";
type TxType = "borrow" | "return";
type TxStatus = "pending" | "active" | "overdue" | "approved";

interface Transaction {
  id: number;
  member: string;
  type: TxType;
  book: string;
  bookId: string;
  requestDate: string;
  dueDate?: string;
  borrowedDate?: string;
  status: TxStatus;
}

const TRANSACTIONS: Transaction[] = [
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

function isOverdueDate(dueDate: string) {
  return (
    new Date(dueDate) < new Date() &&
    new Date().toDateString() !== new Date(dueDate).toDateString()
  );
}

function sortTransactions(list: Transaction[], sortBy: SortKey) {
  const clone = [...list];
  if (sortBy === "member") {
    clone.sort((a, b) => a.member.localeCompare(b.member));
    return clone;
  }

  clone.sort(
    (a, b) =>
      new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime(),
  );
  return clone;
}

export default function TransactionsManagement() {
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const pendingBorrows = useMemo(
    () =>
      TRANSACTIONS.filter(
        (tx) => tx.status === "pending" && tx.type === "borrow",
      ),
    [],
  );

  const pendingReturns = useMemo(
    () =>
      TRANSACTIONS.filter(
        (tx) => tx.status === "pending" && tx.type === "return",
      ),
    [],
  );

  const pendingTransactions = useMemo(
    () => [...pendingBorrows, ...pendingReturns],
    [pendingBorrows, pendingReturns],
  );

  const activeTransactions = useMemo(() => {
    const base = TRANSACTIONS.filter(
      (tx) => tx.status === "active" || tx.status === "overdue",
    );

    const filtered = base.filter((tx) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        tx.member.toLowerCase().includes(query) ||
        tx.book.toLowerCase().includes(query) ||
        tx.bookId.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all" || tx.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return sortTransactions(filtered, sortBy);
  }, [searchTerm, sortBy, statusFilter]);

  const historyTransactions = useMemo(() => {
    const base = TRANSACTIONS.filter((tx) => tx.status === "approved");

    const filtered = base.filter((tx) => {
      const query = searchTerm.toLowerCase();
      return (
        tx.member.toLowerCase().includes(query) ||
        tx.book.toLowerCase().includes(query) ||
        tx.bookId.toLowerCase().includes(query)
      );
    });

    return sortTransactions(filtered, sortBy);
  }, [searchTerm, sortBy]);

  const summary = useMemo(
    () => ({
      pending: pendingTransactions.length,
      active: TRANSACTIONS.filter((tx) => tx.status === "active").length,
      overdue: TRANSACTIONS.filter((tx) => tx.status === "overdue").length,
      completed: TRANSACTIONS.filter((tx) => tx.status === "approved").length,
    }),
    [pendingTransactions.length],
  );

  const clearFiltersForTab = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchTerm("");
    setSortBy("date");
    if (tab !== "active") {
      setStatusFilter("all");
    }
  };

  const PendingCard = ({ tx }: { tx: Transaction }) => (
    <article className="border border-[#b9a58b] rounded-sm bg-[#f6ecdd] p-4 ink-text">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-[#2b2119]">{tx.member}</p>
          <p className="text-xs text-[#5a4b3f] mt-0.5">
            {tx.book} <span className="font-mono">({tx.bookId})</span>
          </p>
        </div>
        <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-sm bg-[#efe4d1] text-[#3f3328] border border-[#8f7f6c] shrink-0">
          {tx.type === "borrow" ? "Borrow" : "Return"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#5a4b3f]">
        <p>Requested: {formatDate(tx.requestDate)}</p>
        {tx.type === "borrow" && tx.dueDate ? (
          <p>Due: {formatDate(tx.dueDate)}</p>
        ) : (
          <p>Borrowed: {tx.borrowedDate ? formatDate(tx.borrowedDate) : "-"}</p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-[#cfbba1]">
        <button className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-[#4f4134] bg-[#eadcc8] hover:bg-[#e4d2bb] rounded-sm transition-colors border border-[#b79e81]">
          <FaCheck className="w-3.5 h-3.5" />
          Approve
        </button>
        <button className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-[#4f4134] bg-[#eadcc8] hover:bg-[#e4d2bb] rounded-sm transition-colors border border-[#b79e81]">
          <FaTimes className="w-3.5 h-3.5" />
          Reject
        </button>
      </div>
    </article>
  );

  return (
    <div className="space-y-6">
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
          Transactions Command Desk
        </h1>
        <p className="text-sm text-[#5a4b3f] mt-1 ink-text">
          Review requests quickly, monitor live borrows, and track completed
          returns.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text">
              Pending
            </p>
            <p className="text-2xl font-bold text-[#221910] ink-title">
              {summary.pending}
            </p>
          </div>
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text">
              Active
            </p>
            <p className="text-2xl font-bold text-[#221910] ink-title">
              {summary.active}
            </p>
          </div>
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text">
              Overdue
            </p>
            <p className="text-2xl font-bold text-[#221910] ink-title">
              {summary.overdue}
            </p>
          </div>
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text">
              Completed
            </p>
            <p className="text-2xl font-bold text-[#221910] ink-title">
              {summary.completed}
            </p>
          </div>
        </div>
      </section>

      <section className="dashboard-surface tron-border rounded-sm border border-[#5f4f40] overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 bg-[#eadcc8] border-b border-[#7c6d5d]">
          <button
            onClick={() => clearFiltersForTab("pending")}
            className={`px-4 py-3 text-left text-sm transition-colors ink-text border-b sm:border-b-0 border-[#cfbba1] sm:border-r sm:border-[#cfbba1] ${
              activeTab === "pending"
                ? "bg-[#f0e3cf] text-[#221910] font-semibold"
                : "text-[#5a4b3f] hover:text-[#2f251d]"
            }`}
          >
            Pending Queue ({pendingTransactions.length})
          </button>
          <button
            onClick={() => clearFiltersForTab("active")}
            className={`px-4 py-3 text-left text-sm transition-colors ink-text border-b sm:border-b-0 border-[#cfbba1] sm:border-r sm:border-[#cfbba1] ${
              activeTab === "active"
                ? "bg-[#f0e3cf] text-[#221910] font-semibold"
                : "text-[#5a4b3f] hover:text-[#2f251d]"
            }`}
          >
            Active Borrows ({summary.active + summary.overdue})
          </button>
          <button
            onClick={() => clearFiltersForTab("history")}
            className={`px-4 py-3 text-left text-sm transition-colors ink-text ${
              activeTab === "history"
                ? "bg-[#f0e3cf] text-[#221910] font-semibold"
                : "text-[#5a4b3f] hover:text-[#2f251d]"
            }`}
          >
            History ({summary.completed})
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === "pending" ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <section className="space-y-3">
                <header className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-[#2b2119] ink-title">
                    Borrow Requests
                  </h2>
                  <span className="text-xs text-[#6a5a4c] ink-text">
                    {pendingBorrows.length} item
                    {pendingBorrows.length === 1 ? "" : "s"}
                  </span>
                </header>
                {pendingBorrows.length === 0 ? (
                  <div className="border border-[#cfbba1] rounded-sm p-6 text-center text-[#6a5a4c] ink-text">
                    No borrow approvals waiting.
                  </div>
                ) : (
                  pendingBorrows.map((tx) => (
                    <PendingCard key={tx.id} tx={tx} />
                  ))
                )}
              </section>

              <section className="space-y-3">
                <header className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-[#2b2119] ink-title">
                    Return Requests
                  </h2>
                  <span className="text-xs text-[#6a5a4c] ink-text">
                    {pendingReturns.length} item
                    {pendingReturns.length === 1 ? "" : "s"}
                  </span>
                </header>
                {pendingReturns.length === 0 ? (
                  <div className="border border-[#cfbba1] rounded-sm p-6 text-center text-[#6a5a4c] ink-text">
                    No return approvals waiting.
                  </div>
                ) : (
                  pendingReturns.map((tx) => (
                    <PendingCard key={tx.id} tx={tx} />
                  ))
                )}
              </section>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="relative lg:col-span-2">
                  <FaSearch className="absolute left-3 top-2.5 text-[#7a6a5a]" />
                  <input
                    type="text"
                    placeholder="Search member, book title, or book ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
                  />
                </div>

                <div className="flex gap-2">
                  {activeTab === "active" && (
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(
                          e.target.value as "all" | "active" | "overdue",
                        )
                      }
                      className="w-full px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
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
                    className="w-full px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
                  >
                    <option value="date">Newest</option>
                    <option value="member">Member Name</option>
                  </select>
                </div>
              </div>

              {activeTab === "active" ? (
                <div className="space-y-2">
                  {activeTransactions.length === 0 ? (
                    <div className="border border-[#cfbba1] rounded-sm p-8 text-center text-[#6a5a4c] ink-text">
                      No active records match current filters.
                    </div>
                  ) : (
                    activeTransactions.map((tx) => (
                      <article
                        key={tx.id}
                        className="border border-[#b9a58b] rounded-sm bg-[#f6ecdd] p-4 ink-text"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <p className="font-semibold text-[#2b2119]">
                              {tx.member}
                            </p>
                            <p className="text-sm text-[#5a4b3f]">
                              {tx.book}{" "}
                              <span className="font-mono">({tx.bookId})</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-sm bg-[#efe4d1] text-[#3f3328] border border-[#8f7f6c]">
                              <FaClock className="w-3 h-3" />
                              {tx.status === "overdue" ? "Overdue" : "Active"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-[#5a4b3f] grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <p>Requested: {formatDate(tx.requestDate)}</p>
                          <p
                            className={
                              tx.dueDate && isOverdueDate(tx.dueDate)
                                ? "font-semibold text-[#2b2119]"
                                : ""
                            }
                          >
                            Due: {tx.dueDate ? formatDate(tx.dueDate) : "-"}
                          </p>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#b9a58b] rounded-sm">
                  <table className="w-full text-sm ink-text min-w-160">
                    <thead>
                      <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                        <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                          Member
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                          Book
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                          ID
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                          Type
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyTransactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 sm:px-6 py-8 text-center text-[#6a5a4c]"
                          >
                            No completed transactions match current filters.
                          </td>
                        </tr>
                      ) : (
                        historyTransactions.map((tx) => (
                          <tr
                            key={tx.id}
                            className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                          >
                            <td className="px-4 sm:px-6 py-3 font-medium text-[#2b2119]">
                              {tx.member}
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-[#5a4b3f]">
                              {tx.book}
                            </td>
                            <td className="px-4 sm:px-6 py-3">
                              <span className="font-mono text-xs bg-[#efe4d1] text-[#3f3328] border border-[#8f7f6c] px-2 py-1 rounded-sm">
                                {tx.bookId}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3">
                              <span className="inline-block px-2 py-1 text-xs font-semibold rounded-sm bg-[#f0e3cf] text-[#47392d] border border-[#9a8975]">
                                {tx.type === "borrow" ? "Borrow" : "Return"}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3 text-[#5a4b3f] whitespace-nowrap">
                              {formatDate(tx.requestDate)}
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
      </section>
    </div>
  );
}
