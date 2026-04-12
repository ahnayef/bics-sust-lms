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
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] mb-2 ink-title">
              Manage Moderators
            </h1>
            <p className="text-[#5a4b3f] ink-text">
              Add and manage moderators who can access the dashboard
            </p>
          </div>
          <div className="text-sm text-[#5a4b3f] ink-text">
            <span className="font-semibold text-[#2b2119]">
              {moderators.length}
            </span>{" "}
            total moderators
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-[#efe4d1] border border-[#8d7a66] rounded-sm flex items-center gap-3 dashboard-surface ink-text text-[#3f3328]">
            <FaCheck className="w-5 h-5 text-[#5b4a3b]" />
            <span>{success}</span>
          </div>
        )}

        {/* Search and Add Button Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 dashboard-surface tron-border rounded-sm p-4 sm:p-5">
          {/* Search Bar */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 w-5 h-5 text-[#7a6a5a]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#6e5d4a] ink-text"
            />
          </div>

          {/* Add Moderator Button */}
          <button
            onClick={() => {
              setShowAddModal(true);
              setError("");
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium ink-text"
          >
            <FaPlus className="w-4 h-4" />
            <span>Add Moderator</span>
          </button>
        </div>

        {/* Add Moderator Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-4 z-80">
            <div className="dashboard-surface tron-border rounded-sm shadow-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#221910] ink-title">
                    Add New Moderator
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setError("");
                      setFormData({ name: "", email: "" });
                    }}
                    className="p-2 text-[#655648] hover:bg-[#e7d8c3] rounded-sm transition-colors"
                    aria-label="Close add moderator modal"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-[#efe4d1] border border-[#8d7a66] rounded-sm flex items-center gap-2 ink-text">
                    <FaTimes className="w-4 h-4 text-[#664a38]" />
                    <span className="text-[#4a3b2f] text-sm">{error}</span>
                  </div>
                )}

                <form
                  onSubmit={handleAddModerator}
                  className="space-y-4 ink-text"
                >
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-[#4f4134] mb-1">
                      Full Name <span className="text-[#7a4c37]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter moderator's full name"
                      className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#6e5d4a]"
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-[#4f4134] mb-1">
                      Email <span className="text-[#7a4c37]">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Enter moderator's email"
                      className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#6e5d4a]"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setError("");
                        setFormData({ name: "", email: "" });
                      }}
                      className="flex-1 px-4 py-2.5 border border-[#8a7966] text-[#4f4134] rounded-sm hover:bg-[#eadcc8] transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium"
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
          <div className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-4 z-80">
            <div className="dashboard-surface tron-border rounded-sm shadow-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#221910] ink-title">
                    Edit Moderator
                  </h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setError("");
                      setEditingId(null);
                      setFormData({ name: "", email: "" });
                    }}
                    className="p-2 text-[#655648] hover:bg-[#e7d8c3] rounded-sm transition-colors"
                    aria-label="Close edit moderator modal"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-[#efe4d1] border border-[#8d7a66] rounded-sm flex items-center gap-2 ink-text">
                    <FaTimes className="w-4 h-4 text-[#664a38]" />
                    <span className="text-[#4a3b2f] text-sm">{error}</span>
                  </div>
                )}

                <form
                  onSubmit={handleUpdateModerator}
                  className="space-y-4 ink-text"
                >
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-[#4f4134] mb-1">
                      Full Name <span className="text-[#7a4c37]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter moderator's full name"
                      className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#6e5d4a]"
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-[#4f4134] mb-1">
                      Email <span className="text-[#7a4c37]">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Enter moderator's email"
                      className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#6e5d4a]"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setError("");
                        setEditingId(null);
                        setFormData({ name: "", email: "" });
                      }}
                      className="flex-1 px-4 py-2.5 border border-[#8a7966] text-[#4f4134] rounded-sm hover:bg-[#eadcc8] transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium"
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
        <div className="hidden sm:block dashboard-surface tron-border rounded-sm overflow-hidden">
          <table className="w-full text-sm ink-text">
            <thead className="bg-[#eadcc8] border-b border-[#7d6d5a]">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-[#3b3026] uppercase tracking-[0.08em] text-xs">
                  Name
                </th>
                <th className="text-left py-3 px-6 font-semibold text-[#3b3026] uppercase tracking-[0.08em] text-xs">
                  Email
                </th>
                <th className="text-left py-3 px-6 font-semibold text-[#3b3026] uppercase tracking-[0.08em] text-xs">
                  Added Date
                </th>
                <th className="text-center py-3 px-6 font-semibold text-[#3b3026] uppercase tracking-[0.08em] text-xs">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredModerators.length > 0 ? (
                filteredModerators.map((moderator) => (
                  <tr
                    key={moderator.id}
                    className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                  >
                    <td className="py-3 px-6 font-medium text-[#2b2119]">
                      {moderator.name}
                    </td>
                    <td className="py-3 px-6 text-[#5a4b3f]">
                      {moderator.email}
                    </td>
                    <td className="py-3 px-6 text-[#5a4b3f]">
                      {new Date(moderator.createdDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(moderator)}
                          className="inline-flex items-center justify-center w-8 h-8 text-[#5b4c3f] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                          title="Edit moderator"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteModerator(moderator.id)}
                          className="inline-flex items-center justify-center w-8 h-8 text-[#6a4e3d] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
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
                  <td
                    colSpan={4}
                    className="py-8 text-center text-[#6a5a4c] ink-text"
                  >
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
                className="dashboard-surface tron-border rounded-sm p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#2b2119] truncate ink-title">
                      {moderator.name}
                    </h3>
                    <p className="text-sm text-[#5a4b3f] truncate ink-text">
                      {moderator.email}
                    </p>
                  </div>
                  <div className="ml-2 flex gap-1">
                    <button
                      onClick={() => handleEditClick(moderator)}
                      className="p-2 text-[#5b4c3f] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteModerator(moderator.id)}
                      className="p-2 text-[#6a4e3d] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#6a5a4c] ink-text">
                  Added: {new Date(moderator.createdDate).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <div className="dashboard-surface rounded-sm p-8 text-center text-[#6a5a4c] ink-text">
              No moderators found
            </div>
          )}
        </div>

        {/* Small Stats Footer */}
        {searchTerm && (
          <div className="text-xs text-[#6a5a4c] ink-text">
            Showing{" "}
            <span className="font-semibold text-[#3f3328]">
              {filteredModerators.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[#3f3328]">
              {moderators.length}
            </span>{" "}
            moderators
          </div>
        )}
      </div>
    </div>
  );
}
