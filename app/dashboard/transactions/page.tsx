"use client";

import { useState } from "react";
import { FaCheck, FaSearch, FaTimes } from "react-icons/fa";

export default function TransactionsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const mockTransactions = [
    {
      id: 1,
      member: "John Doe",
      type: "borrow",
      book: "The Great Gatsby",
      copyId: "QR001",
      date: "2026-04-11",
      dueDate: "2026-04-18",
      status: "active",
    },
    {
      id: 2,
      member: "Jane Smith",
      type: "return",
      book: "To Kill a Mockingbird",
      copyId: "QR002",
      date: "2026-04-10",
      dueDate: "2026-04-10",
      status: "pending",
    },
    {
      id: 3,
      member: "Mike Johnson",
      type: "borrow",
      book: "1984",
      copyId: "QR003",
      date: "2026-04-09",
      dueDate: "2026-04-16",
      status: "active",
    },
    {
      id: 4,
      member: "Sarah Williams",
      type: "return",
      book: "Pride and Prejudice",
      copyId: "QR004",
      date: "2026-04-08",
      dueDate: "2026-04-08",
      status: "approved",
    },
    {
      id: 5,
      member: "John Doe",
      type: "borrow",
      book: "The Hobbit",
      copyId: "QR005",
      date: "2026-04-05",
      dueDate: "2026-04-12",
      status: "overdue",
    },
    {
      id: 6,
      member: "Emma Davis",
      type: "return",
      book: "Wuthering Heights",
      copyId: "QR006",
      date: "2026-04-03",
      dueDate: "2026-04-03",
      status: "pending",
    },
  ];

  const filteredTransactions = mockTransactions.filter((tx) => {
    const matchesSearch =
      tx.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.book.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.copyId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || tx.status === selectedStatus;
    const matchesType = selectedType === "all" || tx.type === selectedType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    return "bg-gray-100 text-gray-900";
  };

  const getTypeIcon = (type: string) => {
    return type === "borrow" ? "📤" : "📥";
  };

  const isOverdue = (dueDate: string) => {
    return (
      new Date(dueDate) < new Date() &&
      new Date().toDateString() !== new Date(dueDate).toDateString()
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600 mt-1">
          Track and manage all borrow and return operations
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative md:col-span-1">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by member, book, or copy ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">All Types</option>
            <option value="borrow">Borrow</option>
            <option value="return">Return</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Book
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Copy ID
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className={`border-b border-gray-200 ${isOverdue(tx.dueDate) && tx.type === "borrow" ? "bg-red-50" : "hover:bg-gray-50"} transition-colors`}
                >
                  <td className="px-6 py-3 text-center text-lg">
                    {getTypeIcon(tx.type)}
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {tx.member}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{tx.book}</td>
                  <td className="px-6 py-3 text-gray-600">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {tx.copyId}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {new Date(tx.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    <span
                      className={
                        isOverdue(tx.dueDate) && tx.type === "borrow"
                          ? "text-red-600 font-medium"
                          : ""
                      }
                    >
                      {new Date(tx.dueDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(tx.status)}`}
                    >
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {tx.status === "pending" && tx.type === "return" && (
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Approve"
                        >
                          <FaCheck className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Reject"
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {tx.status !== "pending" && (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No transactions found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Active Borrows</p>
          <p className="text-2xl font-bold text-gray-900">
            {mockTransactions.filter((tx) => tx.status === "active").length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Pending Approvals</p>
          <p className="text-2xl font-bold text-gray-900">
            {mockTransactions.filter((tx) => tx.status === "pending").length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Overdue</p>
          <p className="text-2xl font-bold text-gray-900">
            {mockTransactions.filter((tx) => tx.status === "overdue").length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Approved Returns</p>
          <p className="text-2xl font-bold text-gray-900">
            {mockTransactions.filter((tx) => tx.status === "approved").length}
          </p>
        </div>
      </div>
    </div>
  );
}
