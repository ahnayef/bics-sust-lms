"use client";

import { useState } from "react";
import { FaEdit, FaPlus, FaSearch, FaTrash } from "react-icons/fa";

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
      parseInt(copy.bookId.split("-")[1]),
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
        return "bg-gray-200 text-gray-900";
      case "borrowed":
        return "bg-gray-300 text-gray-900";
      case "damaged":
        return "bg-gray-400 text-gray-900";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleAdd = () => {
    if (formData.bookId && formData.book) {
      const newCopy = {
        bookId: formData.bookId,
        book: parseInt(formData.book),
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
            ? { ...c, bookId: formData.bookId, book: parseInt(formData.book) }
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Book Copies</h1>
          <p className="text-gray-600 mt-1">
            Manage individual physical copies of books with unique IDs
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          <FaPlus className="w-4 h-4" />
          Add Copy
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Copies</p>
          <p className="text-3xl font-bold text-gray-900">
            {bookCopies.length}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <p className="text-sm text-gray-700 mb-1">Available</p>
          <p className="text-3xl font-bold text-gray-900">
            {countByStatus("available")}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <p className="text-sm text-gray-700 mb-1">Borrowed</p>
          <p className="text-3xl font-bold text-gray-900">
            {countByStatus("borrowed")}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by book title, author, or Book ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Book Copies Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Book ID
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Book Title
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Borrower Name
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCopies.map((copy) => (
                <tr
                  key={copy.bookId}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3 font-mono font-medium text-gray-900">
                    {copy.bookId}
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {getBookTitle(copy.book)}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {getBookAuthor(copy.book)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(copy.status)}`}
                    >
                      {copy.status.charAt(0).toUpperCase() +
                        copy.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {copy.borrowerName || "—"}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(copy.bookId)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(copy.bookId)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
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
          <div className="text-center py-12 text-gray-500">
            <p>No copies found matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Add Copy Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? "Edit Copy" : "Add New Copy"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Book *
                </label>
                <select
                  value={formData.book}
                  onChange={(e) =>
                    setFormData({ ...formData, book: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Book ID *
                </label>
                <input
                  type="text"
                  value={formData.bookId}
                  onChange={(e) =>
                    setFormData({ ...formData, bookId: e.target.value })
                  }
                  placeholder={getNextBookId()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  e.g., BOOK-001, BOOK-002
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
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
