"use client";

import { useState } from "react";
import { FaEdit, FaPlus, FaSearch, FaTrash } from "react-icons/fa";

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Book Management</h1>
          <p className="text-gray-600 mt-1">
            Manage library books and classify them as syllabus or additional
            reading
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          <FaPlus className="w-4 h-4" />
          Add Book
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Books</p>
          <p className="text-3xl font-bold text-gray-900">{books.length}</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Syllabus Books</p>
          <p className="text-3xl font-bold text-gray-900">{syllabusCount}</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Additional Books</p>
          <p className="text-3xl font-bold text-gray-900">{additionalCount}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Copies
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book) => (
                <tr
                  key={book.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {book.title}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{book.author}</td>
                  <td className="px-6 py-3">
                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-900">
                      {book.copiesCount}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                        book.isSyllabus
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {book.isSyllabus ? "Syllabus" : "Additional"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(book.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
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
          <div className="text-center py-12 text-gray-500">
            <p>No books found matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? "Edit Book" : "Add New Book"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter book title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Author *
                </label>
                <input
                  type="text"
                  placeholder="Enter author name"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                >
                  <option value="syllabus">Syllabus Book</option>
                  <option value="additional">Additional Book</option>
                </select>
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
                {editingId ? "Update" : "Add"} Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
