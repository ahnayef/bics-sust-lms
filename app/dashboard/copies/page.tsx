"use client";

import { useState } from "react";
import { FaEdit, FaPlus, FaSearch, FaTimes, FaTrash } from "react-icons/fa";

export default function BookCopiesManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Available books from the system
  const availableBooks = [
    { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
    { id: 2, title: "To Kill a Mockingbird", author: "Harper Lee" },
    { id: 3, title: "1984", author: "George Orwell" },
    { id: 4, title: "Pride and Prejudice", author: "Jane Austen" },
    { id: 5, title: "Jane Eyre", author: "Charlotte Brontë" },
    { id: 6, title: "The Hobbit", author: "J.R.R. Tolkien" },
  ];

  // Book copies with individual IDs
  const [bookCopies, setBookCopies] = useState([
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
      book: 2,
      status: "available",
      borrowerName: null,
    },
    {
      bookId: "BOOK-006",
      book: 2,
      status: "borrowed",
      borrowerName: "Michael Brown",
    },
    {
      bookId: "BOOK-007",
      book: 3,
      status: "borrowed",
      borrowerName: "Emily Davis",
    },
    {
      bookId: "BOOK-008",
      book: 3,
      status: "borrowed",
      borrowerName: "James Wilson",
    },
    {
      bookId: "BOOK-009",
      book: 3,
      status: "available",
      borrowerName: null,
    },
  ]);

  const [formData, setFormData] = useState({
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

  const filteredCopies = bookCopies.filter((copy) => {
    const book = availableBooks.find((b) => b.id === copy.book);
    const matchesSearch =
      (book?.title.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (book?.author.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false) ||
      copy.bookId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getBookTitle = (bookId: number) => {
    return availableBooks.find((b) => b.id === bookId)?.title || "Unknown";
  };

  const getBookAuthor = (bookId: number) => {
    return availableBooks.find((b) => b.id === bookId)?.author || "Unknown";
  };

  const getStatusBadge = (status: string) => {
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

  const handleAdd = () => {
    if (formData.bookId && formData.book) {
      const newCopy = {
        bookId: formData.bookId,
        book: parseInt(formData.book, 10),
        status: "available",
        borrowerName: null,
      };
      setBookCopies([...bookCopies, newCopy]);
      setFormData({ bookId: "", book: "" });
      setShowAddModal(false);
    }
  };

  const handleEdit = (bookId: string) => {
    const copy = bookCopies.find((c) => c.bookId === bookId);
    if (copy) {
      setFormData({ bookId: copy.bookId, book: copy.book.toString() });
      setEditingId(bookId);
      setShowAddModal(true);
    }
  };

  const handleUpdate = () => {
    if (editingId && formData.bookId && formData.book) {
      setBookCopies(
        bookCopies.map((c) =>
          c.bookId === editingId
            ? {
                ...c,
                bookId: formData.bookId,
                book: parseInt(formData.book, 10),
              }
            : c,
        ),
      );
      setFormData({ bookId: "", book: "" });
      setEditingId(null);
      setShowAddModal(false);
    }
  };

  const handleDelete = (bookId: string) => {
    if (confirm("Are you sure you want to remove this copy?")) {
      setBookCopies(bookCopies.filter((c) => c.bookId !== bookId));
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setFormData({ bookId: "", book: "" });
  };

  const countByStatus = (status: string) => {
    return bookCopies.filter((c) => c.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
            Book Copies
          </h1>
          <p className="text-[#5a4b3f] mt-1 ink-text">
            Manage individual physical copies of books with unique IDs
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ bookId: getNextBookId(), book: "" });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium ink-text"
        >
          <FaPlus className="w-4 h-4" />
          Add Copy
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
          <p className="text-xs text-[#5c4f42] tracking-[0.08em] uppercase mb-1 ink-text">
            Total Copies
          </p>
          <p className="text-3xl font-bold text-[#221910] ink-title">
            {bookCopies.length}
          </p>
        </div>
        <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
          <p className="text-xs text-[#5c4f42] tracking-[0.08em] uppercase mb-1 ink-text">
            Available
          </p>
          <p className="text-3xl font-bold text-[#221910] ink-title">
            {countByStatus("available")}
          </p>
        </div>
        <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
          <p className="text-xs text-[#5c4f42] tracking-[0.08em] uppercase mb-1 ink-text">
            Borrowed
          </p>
          <p className="text-3xl font-bold text-[#221910] ink-title">
            {countByStatus("borrowed")}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="dashboard-surface tron-border rounded-sm p-4 border border-[#5f4f40]">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-[#7a6a5a]" />
          <input
            type="text"
            placeholder="Search by book title, author, or Book ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
          />
        </div>
      </div>

      {/* Book Copies Table */}
      <div className="dashboard-surface tron-border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm ink-text min-w-max">
            <thead>
              <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Book ID
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Book Title
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Author
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Borrower Name
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCopies.map((copy) => (
                <tr
                  key={copy.bookId}
                  className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 font-mono font-medium text-[#2b2119]">
                    {copy.bookId}
                  </td>
                  <td className="px-4 sm:px-6 py-3 font-medium text-[#2b2119]">
                    {getBookTitle(copy.book)}
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-[#5a4b3f]">
                    {getBookAuthor(copy.book)}
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-sm ${getStatusBadge(copy.status)}`}
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
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(copy.bookId)}
                        className="p-2 text-[#6a4e3d] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
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

        {filteredCopies.length === 0 && (
          <div className="text-center py-12 text-[#6a5a4c] ink-text">
            <p>No copies found matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Add Copy Modal */}
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
                  Book ID *
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
                className="flex-1 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium ink-text"
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
