"use client";

import { useState } from "react";
import { FaEdit, FaPlus, FaSearch, FaTimes, FaTrash } from "react-icons/fa";

export default function BookManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [books, setBooks] = useState([
    {
      id: 1,
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      isSyllabus: true,
      copiesCount: 3,
    },
    {
      id: 2,
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      isSyllabus: true,
      copiesCount: 4,
    },
    {
      id: 3,
      title: "1984",
      author: "George Orwell",
      isSyllabus: true,
      copiesCount: 3,
    },
    {
      id: 4,
      title: "Pride and Prejudice",
      author: "Jane Austen",
      isSyllabus: true,
      copiesCount: 2,
    },
    {
      id: 5,
      title: "Jane Eyre",
      author: "Charlotte Brontë",
      isSyllabus: true,
      copiesCount: 2,
    },
    {
      id: 6,
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      isSyllabus: false,
      copiesCount: 5,
    },
  ]);

  const [formData, setFormData] = useState({
    id: 0,
    title: "",
    author: "",
    isSyllabus: true,
    copiesCount: 0,
  });

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const syllabusCount = books.filter((b) => b.isSyllabus).length;
  const additionalCount = books.filter((b) => !b.isSyllabus).length;

  const handleAdd = () => {
    if (formData.title && formData.author) {
      const newBook = {
        id: Math.max(...books.map((b) => b.id), 0) + 1,
        title: formData.title,
        author: formData.author,
        isSyllabus: formData.isSyllabus,
        copiesCount: 0,
      };
      setBooks([...books, newBook]);
      setFormData({
        id: 0,
        title: "",
        author: "",
        isSyllabus: true,
        copiesCount: 0,
      });
      setShowAddModal(false);
    }
  };

  const handleEdit = (id: number) => {
    const book = books.find((b) => b.id === id);
    if (book) {
      setFormData(book);
      setEditingId(id);
      setShowAddModal(true);
    }
  };

  const handleUpdate = () => {
    if (editingId && formData.title && formData.author) {
      setBooks(
        books.map((b) =>
          b.id === editingId
            ? {
                ...b,
                title: formData.title,
                author: formData.author,
                isSyllabus: formData.isSyllabus,
              }
            : b,
        ),
      );
      setFormData({
        id: 0,
        title: "",
        author: "",
        isSyllabus: true,
        copiesCount: 0,
      });
      setEditingId(null);
      setShowAddModal(false);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this book?")) {
      setBooks(books.filter((b) => b.id !== id));
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setFormData({
      id: 0,
      title: "",
      author: "",
      isSyllabus: true,
      copiesCount: 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
            Book Management
          </h1>
          <p className="text-[#5a4b3f] mt-1 ink-text">
            Manage library books and classify them as syllabus or additional
            reading
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              id: 0,
              title: "",
              author: "",
              isSyllabus: true,
              copiesCount: 0,
            });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium ink-text"
        >
          <FaPlus className="w-4 h-4" />
          Add Book
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
          <p className="text-xs text-[#5c4f42] tracking-[0.08em] uppercase mb-1 ink-text">
            Total Books
          </p>
          <p className="text-3xl font-bold text-[#221910] ink-title">
            {books.length}
          </p>
        </div>
        <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
          <p className="text-xs text-[#5c4f42] tracking-[0.08em] uppercase mb-1 ink-text">
            Syllabus Books
          </p>
          <p className="text-3xl font-bold text-[#221910] ink-title">
            {syllabusCount}
          </p>
        </div>
        <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
          <p className="text-xs text-[#5c4f42] tracking-[0.08em] uppercase mb-1 ink-text">
            Additional Books
          </p>
          <p className="text-3xl font-bold text-[#221910] ink-title">
            {additionalCount}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="dashboard-surface tron-border rounded-sm p-4 border border-[#5f4f40]">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-[#7a6a5a]" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
          />
        </div>
      </div>

      {/* Books Table */}
      <div className="dashboard-surface tron-border rounded-sm overflow-hidden">
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
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-sm bg-[#efe4d1] text-[#46382c] border border-[#8f7f6c]">
                      {book.copiesCount}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-sm border ${
                        book.isSyllabus
                          ? "bg-[#efe4d1] text-[#3f3328] border-[#8f7f6c]"
                          : "bg-[#f0e3cf] text-[#47392d] border-[#9a8975]"
                      }`}
                    >
                      {book.isSyllabus ? "Syllabus" : "Additional"}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(book.id)}
                        className="p-2 text-[#5b4c3f] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
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

        {filteredBooks.length === 0 && (
          <div className="text-center py-12 text-[#6a5a4c] ink-text">
            <p>No books found matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-4 z-80">
          <div className="dashboard-surface tron-border rounded-sm max-w-md w-full p-6">
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
                {editingId ? "Update" : "Add"} Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
