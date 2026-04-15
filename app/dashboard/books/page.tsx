"use client";

import StatusBadge from "@/app/components/StatusBadge";
import { useMemo, useState } from "react";
import {
  FaDownload,
  FaEdit,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

type BookTypeFilter = "all" | "syllabus" | "additional";

interface Book {
  id: number;
  title: string;
  author: string;
  isSyllabus: boolean;
  copiesCount: number;
  pages: number;
  pdfLink?: string;
}

interface BookForm {
  id: number;
  title: string;
  author: string;
  isSyllabus: boolean;
  copiesCount: number;
  pages: number;
  pdfLink: string;
}

const EMPTY_FORM: BookForm = {
  id: 0,
  title: "",
  author: "",
  isSyllabus: true,
  copiesCount: 0,
  pages: 0,
  pdfLink: "",
};

export default function BookManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<BookTypeFilter>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [books, setBooks] = useState<Book[]>([
    {
      id: 1,
      title: "ইসলামের সামাজিক বিধান",
      author: "আল্লামা জামাল আল বাদাবী",
      isSyllabus: true,
      copiesCount: 3,
      pages: 284,
      pdfLink: "https://example.com/pdfs/book-001.pdf",
    },
    {
      id: 2,
      title: "পর্দা ও ইসলাম",
      author: "সাইয়েদ আবুল আ’লা মওদূদী",
      isSyllabus: true,
      copiesCount: 4,
      pages: 156,
      pdfLink: "https://example.com/pdfs/book-002.pdf",
    },
    {
      id: 3,
      title: "আদাবে জিন্দেগী",
      author: "আল্লামা ইউসুফ ইসলাহী",
      isSyllabus: true,
      copiesCount: 3,
      pages: 320,
      pdfLink: "https://example.com/pdfs/book-003.pdf",
    },
    {
      id: 4,
      title: "ইসলামী ব্যাংকিং ও অর্থায়ন পদ্ধতি: সমস্যা ও সমাধান",
      author: "মুফতি তাকি উসমানি",
      isSyllabus: true,
      copiesCount: 2,
      pages: 448,
      pdfLink: "https://example.com/pdfs/book-004.pdf",
    },
    {
      id: 5,
      title: "ইসলামী অর্থনীতি",
      author: "সাইয়েদ আবুল আ’লা মওদূদী",
      isSyllabus: true,
      copiesCount: 2,
      pages: 256,
      pdfLink: "https://example.com/pdfs/book-005.pdf",
    },
    {
      id: 6,
      title: "ইসলামী অর্থ ব্যবস্থায় যাকাত",
      author: "ড. জাবের মোহাম্মদ (ইসলামিক সেন্টার)",
      isSyllabus: true,
      copiesCount: 5,
      pages: 192,
      pdfLink: "https://example.com/pdfs/book-006.pdf",
    },
    {
      id: 7,
      title: "খেলাফত ও রাজতন্ত্র",
      author: "সাইয়েদ আবুল আ’লা মওদূদী",
      isSyllabus: false,
      copiesCount: 2,
      pages: 224,
      pdfLink: "https://example.com/pdfs/book-007.pdf",
    },
    {
      id: 8,
      title: "ইসলামী রাষ্ট্রে অমুসলিমদের অধিকার",
      author: "সাইয়েদ আবুল আ’লা মওদূদী",
      isSyllabus: false,
      copiesCount: 2,
      pages: 176,
      pdfLink: "https://example.com/pdfs/book-008.pdf",
    },
    {
      id: 9,
      title: "একটি সত্যনিষ্ঠ দলের প্রয়োজন",
      author: "সাইয়েদ আবুল আ’লা মওদূদী",
      isSyllabus: false,
      copiesCount: 3,
      pages: 128,
      pdfLink: "https://example.com/pdfs/book-009.pdf",
    },
    {
      id: 10,
      title: "ইসলামী রাষ্ট্রব্যবস্থা : তত্ত্ব ও প্রয়োগ",
      author: "ড. ইউসুফ আল-কারযাভী",
      isSyllabus: false,
      copiesCount: 2,
      pages: 352,
      pdfLink: "https://example.com/pdfs/book-010.pdf",
    },
    {
      id: 11,
      title: "ইসলামী রাষ্ট্র ও সংবিধান",
      author: "উল্লেখ নেই",
      isSyllabus: false,
      copiesCount: 1,
      pages: 240,
      pdfLink: "https://example.com/pdfs/book-011.pdf",
    },
    {
      id: 12,
      title: "গণতন্ত্র: ইসলামী দৃষ্টিকোণ",
      author: "ড. আহমদ আলী",
      isSyllabus: false,
      copiesCount: 1,
      pages: 168,
      pdfLink: "https://example.com/pdfs/book-012.pdf",
    },
  ]);

  const [formData, setFormData] = useState<BookForm>(EMPTY_FORM);

  const counts = useMemo(
    () => ({
      total: books.length,
      syllabus: books.filter((b) => b.isSyllabus).length,
      additional: books.filter((b) => !b.isSyllabus).length,
    }),
    [books],
  );

  const filteredBooks = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query);

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "syllabus" ? book.isSyllabus : !book.isSyllabus);

      return matchesSearch && matchesType;
    });
  }, [books, searchTerm, typeFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setShowAddModal(true);
  };

  const handleAdd = () => {
    if (!formData.title.trim() || !formData.author.trim()) {
      return;
    }

    const newBook: Book = {
      id: Math.max(...books.map((b) => b.id), 0) + 1,
      title: formData.title.trim(),
      author: formData.author.trim(),
      isSyllabus: formData.isSyllabus,
      copiesCount: 0,
      pages: formData.pages,
      pdfLink: formData.pdfLink.trim() || undefined,
    };

    setBooks((prev) => [...prev, newBook]);
    setFormData(EMPTY_FORM);
    setShowAddModal(false);
  };

  const handleEdit = (id: number) => {
    const book = books.find((b) => b.id === id);
    if (!book) return;

    setFormData({ ...book, pdfLink: book.pdfLink ?? "" });
    setEditingId(id);
    setShowAddModal(true);
  };

  const handleUpdate = () => {
    if (!editingId || !formData.title.trim() || !formData.author.trim()) {
      return;
    }

    setBooks((prev) =>
      prev.map((book) =>
        book.id === editingId
          ? {
              ...book,
              title: formData.title.trim(),
              author: formData.author.trim(),
              isSyllabus: formData.isSyllabus,
              pages: formData.pages,
              pdfLink: formData.pdfLink.trim() || undefined,
            }
          : book,
      ),
    );

    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowAddModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this book?")) {
      setBooks((prev) => prev.filter((book) => book.id !== id));
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  return (
    <div className="space-y-6">
      <section
        className="dashboard-surface tron-border rounded-sm p-5 sm:p-6"
        data-aos="fade-up"
        data-aos-duration="800"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
              Books Control Room
            </h1>
            <p className="text-[#5a4b3f] mt-1 ink-text">
              Keep catalog records clean and quickly classify syllabus vs
              additional reading.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium ink-text"
          >
            <FaPlus className="w-4 h-4" />
            Add Book
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-5">
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-2 sm:p-3">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight text-nowrap">
              Total Books
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title mt-1 leading-none">
              {counts.total}
            </p>
          </div>
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-2 sm:p-3">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
              Syllabus
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title mt-1 leading-none">
              {counts.syllabus}
            </p>
          </div>
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-2 sm:p-3">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
              Additional
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title mt-1 leading-none">
              {counts.additional}
            </p>
          </div>
        </div>
      </section>

      <section
        className="dashboard-surface tron-border rounded-sm p-4 sm:p-5 border border-[#5f4f40]"
        data-aos="fade-up"
        data-aos-duration="800"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="relative lg:col-span-2">
            <FaSearch className="absolute left-3 top-3 text-[#7a6a5a]" />
            <input
              type="text"
              placeholder="Search by title or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as BookTypeFilter)}
            className="px-3 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
          >
            <option value="all">All Types</option>
            <option value="syllabus">Syllabus</option>
            <option value="additional">Additional</option>
          </select>
        </div>
      </section>

      <section
        className="dashboard-surface tron-border rounded-sm overflow-hidden border border-[#5f4f40]"
        data-aos="fade-up"
        data-aos-duration="800"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm ink-text min-w-160">
            <thead>
              <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Title
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Author
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Pages
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Copies
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Type
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book) => (
                <tr
                  key={book.id}
                  className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 font-medium text-[#2b2119]">
                    {book.title}
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-[#5a4b3f]">
                    {book.author}
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <StatusBadge tone="neutral">{book.pages}</StatusBadge>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <StatusBadge tone="muted">{book.copiesCount}</StatusBadge>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <StatusBadge tone="neutral">
                      {book.isSyllabus ? "Syllabus" : "Additional"}
                    </StatusBadge>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-2">
                      {book.pdfLink ? (
                        <a
                          href={book.pdfLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-[#4e4033] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                          aria-label={`Download PDF for ${book.title}`}
                          title="Download PDF"
                        >
                          <FaDownload className="w-4 h-4" />
                        </a>
                      ) : null}
                      <button
                        onClick={() => handleEdit(book.id)}
                        className="p-2 text-[#5b4c3f] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                        aria-label={`Edit ${book.title}`}
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
                        className="p-2 text-[#6a4e3d] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                        aria-label={`Delete ${book.title}`}
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBooks.length === 0 && (
          <div className="text-center py-12 text-[#6a5a4c] ink-text">
            <p>No books match this search/filter combination.</p>
          </div>
        )}
      </section>

      {showAddModal && (
        <div className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-4 z-80">
          <div
            className="dashboard-surface tron-border rounded-sm max-w-md w-full p-6"
            data-aos="zoom-in"
            data-aos-duration="200"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-[#221910] ink-title">
                {editingId ? "Edit Book" : "Add New Book"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-[#655648] hover:bg-[#e7d8c3] rounded-sm transition-colors"
                aria-label="Close book modal"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 ink-text">
              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter book title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  Author *
                </label>
                <input
                  type="text"
                  placeholder="Enter author name"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  Book Type *
                </label>
                <select
                  value={formData.isSyllabus ? "syllabus" : "additional"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isSyllabus: e.target.value === "syllabus",
                    })
                  }
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                >
                  <option value="syllabus">Syllabus Book</option>
                  <option value="additional">Additional Book</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  Number of Pages *
                </label>
                <input
                  type="number"
                  placeholder="Enter number of pages"
                  value={formData.pages || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pages: parseInt(e.target.value) || 0,
                    })
                  }
                  min="1"
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  PDF Link (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/book.pdf"
                  value={formData.pdfLink}
                  onChange={(e) =>
                    setFormData({ ...formData, pdfLink: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                />
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
                disabled={!formData.title.trim() || !formData.author.trim()}
                className="flex-1 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] disabled:opacity-55 disabled:cursor-not-allowed transition-colors font-medium ink-text"
              >
                {editingId ? "Update" : "Add"} Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
