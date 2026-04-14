"use client";

import { useState } from "react";
import { FaEdit, FaPlus, FaSearch, FaTimes, FaTrash } from "react-icons/fa";

type CopyStatus = "available" | "borrowed" | "damaged";
type StatusFilter = "all" | CopyStatus;

interface BookRef {
  id: number;
  title: string;
  author: string;
}

interface BookCopy {
  bookId: string;
  book: number;
  status: CopyStatus;
  borrowerName: string | null;
}

interface CopyForm {
  bookId: string;
  book: string;
}

export default function BookCopiesManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const availableBooks: BookRef[] = [
    {
      id: 1,
      title: "ইসলামের সামাজিক বিধান",
      author: "আল্লামা জামাল আল বাদাবী",
    },
    { id: 2, title: "পর্দা ও ইসলাম", author: "সাইয়েদ আবুল আ’লা মওদূদী" },
    { id: 3, title: "আদাবে জিন্দেগী", author: "আল্লামা ইউসুফ ইসলাহী" },
    {
      id: 4,
      title: "ইসলামী ব্যাংকিং ও অর্থায়ন পদ্ধতি: সমস্যা ও সমাধান",
      author: "মুফতি তাকি উসমানি",
    },
    { id: 5, title: "ইসলামী অর্থনীতি", author: "সাইয়েদ আবুল আ’লা মওদূদী" },
    {
      id: 6,
      title: "ইসলামী অর্থ ব্যবস্থায় যাকাত",
      author: "ড. জাবের মোহাম্মদ (ইসলামিক সেন্টার)",
    },
    { id: 7, title: "খেলাফত ও রাজতন্ত্র", author: "সাইয়েদ আবুল আ’লা মওদূদী" },
    {
      id: 8,
      title: "ইসলামী রাষ্ট্রে অমুসলিমদের অধিকার",
      author: "সাইয়েদ আবুল আ’লা মওদূদী",
    },
    {
      id: 9,
      title: "একটি সত্যনিষ্ঠ দলের প্রয়োজন",
      author: "সাইয়েদ আবুল আ’লা মওদূদী",
    },
    {
      id: 10,
      title: "ইসলামী রাষ্ট্রব্যবস্থা : তত্ত্ব ও প্রয়োগ",
      author: "ড. ইউসুফ আল-কারযাভী",
    },
    { id: 11, title: "ইসলামী রাষ্ট্র ও সংবিধান", author: "উল্লেখ নেই" },
    { id: 12, title: "গণতন্ত্র: ইসলামী দৃষ্টিকোণ", author: "ড. আহমদ আলী" },
  ];

  const [bookCopies, setBookCopies] = useState<BookCopy[]>([
    {
      bookId: "BOOK-001",
      book: 1,
      status: "available",
      borrowerName: null,
    },
    {
      bookId: "BOOK-002",
      book: 1,
      status: "borrowed",
      borrowerName: "John Smith",
    },
    {
      bookId: "BOOK-003",
      book: 1,
      status: "borrowed",
      borrowerName: "Sarah Johnson",
    },
    {
      bookId: "BOOK-004",
      book: 2,
      status: "available",
      borrowerName: null,
    },
    {
      bookId: "BOOK-005",
      book: 4,
      status: "borrowed",
      borrowerName: "Michael Brown",
    },
    {
      bookId: "BOOK-006",
      book: 5,
      status: "borrowed",
      borrowerName: "Emily Davis",
    },
    {
      bookId: "BOOK-007",
      book: 6,
      status: "available",
      borrowerName: null,
    },
    {
      bookId: "BOOK-008",
      book: 7,
      status: "borrowed",
      borrowerName: "James Wilson",
    },
    {
      bookId: "BOOK-009",
      book: 8,
      status: "available",
      borrowerName: null,
    },
  ]);

  const [formData, setFormData] = useState<CopyForm>({
    bookId: "",
    book: "",
  });

  const getNextBookId = () => {
    const bookIds = bookCopies.map((copy) =>
      parseInt(copy.bookId.split("-")[1], 10),
    );
    const maxId = bookIds.length > 0 ? Math.max(...bookIds) : 0;
    return `BOOK-${String(maxId + 1).padStart(3, "0")}`;
  };

  const getBookById = (bookId: number) => {
    return availableBooks.find((book) => book.id === bookId);
  };

  const query = searchTerm.toLowerCase().trim();

  const filteredCopies = bookCopies.filter((copy) => {
    const book = getBookById(copy.book);
    const matchesSearch =
      (book?.title.toLowerCase().includes(query) ?? false) ||
      (book?.author.toLowerCase().includes(query) ?? false) ||
      copy.bookId.toLowerCase().includes(query) ||
      (copy.borrowerName?.toLowerCase().includes(query) ?? false);

    const matchesStatus =
      statusFilter === "all" || copy.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const counts = {
    total: bookCopies.length,
    available: bookCopies.filter((copy) => copy.status === "available").length,
    borrowed: bookCopies.filter((copy) => copy.status === "borrowed").length,
  };

  const getStatusBadge = (status: CopyStatus) => {
    switch (status) {
      case "available":
        return "bg-[#efe4d1] text-[#3f3328] border border-[#8f7f6c]";
      case "borrowed":
        return "bg-[#f0e3cf] text-[#47392d] border border-[#9a8975]";
      case "damaged":
        return "bg-[#eadac3] text-[#5a3d2c] border border-[#9b856d]";
      default:
        return "bg-[#f3e9d8] text-[#3f3328] border border-[#8f7f6c]";
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ bookId: getNextBookId(), book: "" });
    setShowAddModal(true);
  };

  const handleAdd = () => {
    if (!formData.bookId.trim() || !formData.book) {
      return;
    }

    const newCopy: BookCopy = {
      bookId: formData.bookId.trim(),
      book: parseInt(formData.book, 10),
      status: "available",
      borrowerName: null,
    };

    setBookCopies((prev) => [...prev, newCopy]);
    setFormData({ bookId: "", book: "" });
    setShowAddModal(false);
  };

  const handleEdit = (bookId: string) => {
    const copy = bookCopies.find((item) => item.bookId === bookId);
    if (!copy) return;

    setFormData({ bookId: copy.bookId, book: copy.book.toString() });
    setEditingId(bookId);
    setShowAddModal(true);
  };

  const handleUpdate = () => {
    if (!editingId || !formData.bookId.trim() || !formData.book) {
      return;
    }

    setBookCopies((prev) =>
      prev.map((copy) =>
        copy.bookId === editingId
          ? {
              ...copy,
              bookId: formData.bookId.trim(),
              book: parseInt(formData.book, 10),
            }
          : copy,
      ),
    );

    setFormData({ bookId: "", book: "" });
    setEditingId(null);
    setShowAddModal(false);
  };

  const handleDelete = (bookId: string) => {
    if (confirm("Are you sure you want to remove this copy?")) {
      setBookCopies((prev) => prev.filter((copy) => copy.bookId !== bookId));
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setFormData({ bookId: "", book: "" });
  };

  return (
    <div className="space-y-6">
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
              Copies Control Room
            </h1>
            <p className="text-[#5a4b3f] mt-1 ink-text">
              Track every physical copy clearly by ID, status, and borrower at a
              glance.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium ink-text"
          >
            <FaPlus className="w-4 h-4" />
            Add Copy
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-5">
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-2 sm:p-3">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
              Total
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title leading-none mt-1">
              {counts.total}
            </p>
          </div>
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-2 sm:p-3">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
              Available
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title leading-none mt-1">
              {counts.available}
            </p>
          </div>
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-2 sm:p-3">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
              Borrowed
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title leading-none mt-1">
              {counts.borrowed}
            </p>
          </div>
        </div>
      </section>

      <section className="dashboard-surface tron-border rounded-sm p-4 sm:p-5 border border-[#5f4f40]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="relative lg:col-span-2">
            <FaSearch className="absolute left-3 top-3 text-[#7a6a5a]" />
            <input
              type="text"
              placeholder="Search title, author, copy ID, or borrower..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="borrowed">Borrowed</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>
      </section>

      <section className="dashboard-surface tron-border rounded-sm overflow-hidden border border-[#5f4f40]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm ink-text min-w-160">
            <thead>
              <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Copy ID
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Book
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Author
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Borrower
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCopies.map((copy) => {
                const book = getBookById(copy.book);
                return (
                  <tr
                    key={copy.bookId}
                    className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 font-mono font-medium text-[#2b2119]">
                      {copy.bookId}
                    </td>
                    <td className="px-4 sm:px-6 py-3 font-medium text-[#2b2119]">
                      {book?.title || "Unknown"}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-[#5a4b3f]">
                      {book?.author || "Unknown"}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-sm ${getStatusBadge(
                          copy.status,
                        )}`}
                      >
                        {copy.status.charAt(0).toUpperCase() +
                          copy.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-[#5a4b3f]">
                      {copy.borrowerName || "-"}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(copy.bookId)}
                          className="p-2 text-[#5b4c3f] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                          aria-label={`Edit ${copy.bookId}`}
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(copy.bookId)}
                          className="p-2 text-[#6a4e3d] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                          aria-label={`Delete ${copy.bookId}`}
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCopies.length === 0 && (
          <div className="text-center py-12 text-[#6a5a4c] ink-text">
            <p>No copies match the current search/filter.</p>
          </div>
        )}
      </section>

      {showAddModal && (
        <div className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-4 z-80">
          <div className="dashboard-surface tron-border rounded-sm max-w-md w-full p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-[#221910] ink-title">
                {editingId ? "Edit Copy" : "Add New Copy"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-[#655648] hover:bg-[#e7d8c3] rounded-sm transition-colors"
                aria-label="Close copy modal"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 ink-text">
              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  Select Book *
                </label>
                <select
                  value={formData.book}
                  onChange={(e) =>
                    setFormData({ ...formData, book: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                >
                  <option value="">Choose a book</option>
                  {availableBooks.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} by {book.author}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  Copy ID *
                </label>
                <input
                  type="text"
                  value={formData.bookId}
                  onChange={(e) =>
                    setFormData({ ...formData, bookId: e.target.value })
                  }
                  placeholder={getNextBookId()}
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                />
                <p className="text-xs text-[#6a5a4c] mt-1">
                  e.g., BOOK-001, BOOK-002
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 border border-[#8a7966] text-[#4f4134] rounded-sm hover:bg-[#eadcc8] transition-colors font-medium ink-text"
              >
                Cancel
              </button>
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                disabled={!formData.bookId.trim() || !formData.book}
                className="flex-1 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] disabled:opacity-55 disabled:cursor-not-allowed transition-colors font-medium ink-text"
              >
                {editingId ? "Update" : "Add"} Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
