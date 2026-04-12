"use client";

import { useState } from "react";
import {
  FaCheck,
  FaEdit,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

interface Moderator {
  id: number;
  name: string;
  email: string;
  createdDate: string;
}

export default function ModeratorsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [moderators, setModerators] = useState<Moderator[]>([
    {
      id: 1,
      name: "Admin Moderator",
      email: "admin.mod@example.com",
      createdDate: "2025-01-15",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      createdDate: "2025-02-10",
    },
  ]);

  const filteredModerators = moderators.filter(
    (mod) =>
      mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mod.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleAddModerator = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    if (!validateEmail(formData.email)) {
      setError("Invalid email format");
      return;
    }

    // Check if email already exists
    if (moderators.some((mod) => mod.email === formData.email)) {
      setError("This email is already registered as a moderator");
      return;
    }

    // Add new moderator
    const newModerator: Moderator = {
      id: Math.max(...moderators.map((m) => m.id), 0) + 1,
      name: formData.name,
      email: formData.email,
      createdDate: new Date().toISOString().split("T")[0],
    };

    setModerators([...moderators, newModerator]);
    setSuccess(`${formData.name} has been added as a moderator`);
    setFormData({ name: "", email: "" });
    setTimeout(() => {
      setShowAddModal(false);
      setSuccess("");
    }, 2000);
  };

  const handleDeleteModerator = (id: number) => {
    if (confirm("Are you sure you want to remove this moderator?")) {
      const moderator = moderators.find((m) => m.id === id);
      setModerators(moderators.filter((m) => m.id !== id));
      setSuccess(`${moderator?.name} has been removed from moderators`);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleEditClick = (moderator: Moderator) => {
    setEditingId(moderator.id);
    setFormData({ name: moderator.name, email: moderator.email });
    setShowEditModal(true);
    setError("");
  };

  const handleUpdateModerator = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    if (!validateEmail(formData.email)) {
      setError("Invalid email format");
      return;
    }

    // Check if email already exists (excluding current moderator)
    if (
      moderators.some(
        (mod) => mod.email === formData.email && mod.id !== editingId,
      )
    ) {
      setError("This email is already registered as a moderator");
      return;
    }

    // Update moderator
    setModerators(
      moderators.map((mod) =>
        mod.id === editingId
          ? { ...mod, name: formData.name, email: formData.email }
          : mod,
      ),
    );
    setSuccess("Moderator updated successfully");
    setFormData({ name: "", email: "" });
    setEditingId(null);
    setTimeout(() => {
      setShowEditModal(false);
      setSuccess("");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Manage Moderators
            </h1>
            <p className="text-gray-600">
              Add and manage moderators who can access the dashboard
            </p>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{moderators.length}</span> total
            moderators
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <FaCheck className="w-5 h-5 text-green-600" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {/* Search and Add Button Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Add Moderator Button */}
          <button
            onClick={() => {
              setShowAddModal(true);
              setError("");
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            <FaPlus className="w-4 h-4" />
            <span>Add Moderator</span>
          </button>
        </div>

        {/* Add Moderator Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Add New Moderator
                </h2>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <FaTimes className="w-4 h-4 text-red-600" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                )}

                <form onSubmit={handleAddModerator} className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter moderator's full name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Enter moderator's email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setError("");
                        setFormData({ name: "", email: "" });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
                    >
                      Add Moderator
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Moderator Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Edit Moderator
                </h2>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <FaTimes className="w-4 h-4 text-red-600" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateModerator} className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter moderator's full name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Enter moderator's email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setError("");
                        setEditingId(null);
                        setFormData({ name: "", email: "" });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
                    >
                      Update
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Moderators Table - Desktop */}
        <div className="hidden sm:block bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">
                  Name
                </th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">
                  Email
                </th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">
                  Added Date
                </th>
                <th className="text-center py-3 px-6 font-semibold text-gray-900">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredModerators.length > 0 ? (
                filteredModerators.map((moderator) => (
                  <tr
                    key={moderator.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-6 font-medium text-gray-900">
                      {moderator.name}
                    </td>
                    <td className="py-3 px-6 text-gray-600">
                      {moderator.email}
                    </td>
                    <td className="py-3 px-6 text-gray-600">
                      {new Date(moderator.createdDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(moderator)}
                          className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit moderator"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteModerator(moderator.id)}
                          className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete moderator"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    No moderators found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Moderators Cards - Mobile */}
        <div className="sm:hidden space-y-3">
          {filteredModerators.length > 0 ? (
            filteredModerators.map((moderator) => (
              <div
                key={moderator.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {moderator.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {moderator.email}
                    </p>
                  </div>
                  <div className="ml-2 flex gap-1">
                    <button
                      onClick={() => handleEditClick(moderator)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteModerator(moderator.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Added: {new Date(moderator.createdDate).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No moderators found
            </div>
          )}
        </div>

        {/* Small Stats Footer */}
        {searchTerm && (
          <div className="mt-4 text-xs text-gray-500">
            Showing{" "}
            <span className="font-medium">{filteredModerators.length}</span> of{" "}
            <span className="font-medium">{moderators.length}</span> moderators
          </div>
        )}
      </div>
    </div>
  );
}
