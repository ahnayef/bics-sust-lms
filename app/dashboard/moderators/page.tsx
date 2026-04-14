"use client";

import { FormEvent, useMemo, useState } from "react";
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

interface ModeratorForm {
  name: string;
  email: string;
}

const EMPTY_FORM: ModeratorForm = {
  name: "",
  email: "",
};

export default function ModeratorsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ModeratorForm>(EMPTY_FORM);
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

  const filteredModerators = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return moderators.filter(
      (moderator) =>
        moderator.name.toLowerCase().includes(query) ||
        moderator.email.toLowerCase().includes(query),
    );
  }, [moderators, searchTerm]);

  const resetFormState = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setError("");
  };

  const openAddModal = () => {
    resetFormState();
    setShowModal(true);
  };

  const openEditModal = (moderator: Moderator) => {
    setEditingId(moderator.id);
    setFormData({ name: moderator.name, email: moderator.email });
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetFormState();
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!name) {
      setError("Name is required");
      return;
    }

    if (!email) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Invalid email format");
      return;
    }

    const emailExists = moderators.some(
      (moderator) => moderator.email === email && moderator.id !== editingId,
    );

    if (emailExists) {
      setError("This email is already registered as a moderator");
      return;
    }

    if (editingId) {
      setModerators((prev) =>
        prev.map((moderator) =>
          moderator.id === editingId
            ? { ...moderator, name, email }
            : moderator,
        ),
      );
      setSuccess("Moderator updated successfully");
    } else {
      const newModerator: Moderator = {
        id: Math.max(...moderators.map((moderator) => moderator.id), 0) + 1,
        name,
        email,
        createdDate: new Date().toISOString().split("T")[0],
      };
      setModerators((prev) => [...prev, newModerator]);
      setSuccess(`${name} has been added as a moderator`);
    }

    setShowModal(false);
    resetFormState();
  };

  const handleDeleteModerator = (id: number) => {
    if (confirm("Are you sure you want to remove this moderator?")) {
      const moderator = moderators.find((item) => item.id === id);
      setModerators((prev) => prev.filter((item) => item.id !== id));
      setSuccess(`${moderator?.name} has been removed from moderators`);
    }
  };

  return (
    <div className="min-h-full p-2 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-5">
        <section className="dashboard-surface tron-border rounded-sm p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] mb-2 ink-title">
                Moderators Control Room
              </h1>
              <p className="text-[#5a4b3f] ink-text">
                Keep moderator access clean and easy to audit with fast search
                and updates.
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium ink-text"
            >
              <FaPlus className="w-4 h-4" />
              Add Moderator
            </button>
          </div>
        </section>

        {success && (
          <div className="p-4 bg-[#efe4d1] border border-[#8d7a66] rounded-sm flex items-center gap-3 dashboard-surface ink-text text-[#3f3328]">
            <FaCheck className="w-5 h-5 text-[#5b4a3b]" />
            <span>{success}</span>
          </div>
        )}

        <section className="dashboard-surface tron-border rounded-sm p-3 sm:p-5 border border-[#5f4f40]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 w-5 h-5 text-[#7a6a5a]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#6e5d4a] ink-text"
            />
          </div>
        </section>

        <section className="dashboard-surface tron-border rounded-sm overflow-hidden border border-[#5f4f40]">
          <div className="overflow-x-auto hidden sm:block">
            <table className="w-full text-sm ink-text min-w-160">
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
                            onClick={() => openEditModal(moderator)}
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

          <div className="sm:hidden space-y-3 p-2">
            {filteredModerators.length > 0 ? (
              filteredModerators.map((moderator) => (
                <div
                  key={moderator.id}
                  className="dashboard-surface tron-border rounded-sm p-3"
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
                        onClick={() => openEditModal(moderator)}
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
                    Added:{" "}
                    {new Date(moderator.createdDate).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="dashboard-surface rounded-sm p-8 text-center text-[#6a5a4c] ink-text">
                No moderators found
              </div>
            )}
          </div>
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-4 z-80">
          <div className="dashboard-surface tron-border rounded-sm shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-[#221910] ink-title">
                  {editingId ? "Edit Moderator" : "Add New Moderator"}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-[#655648] hover:bg-[#e7d8c3] rounded-sm transition-colors"
                  aria-label="Close moderator modal"
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

              <form onSubmit={handleSubmit} className="space-y-4 ink-text">
                <div>
                  <label className="block text-sm font-medium text-[#4f4134] mb-1">
                    Full Name <span className="text-[#7a4c37]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData({ ...formData, name: event.target.value })
                    }
                    placeholder="Enter moderator's full name"
                    className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#6e5d4a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4f4134] mb-1">
                    Email <span className="text-[#7a4c37]">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      setFormData({ ...formData, email: event.target.value })
                    }
                    placeholder="Enter moderator's email"
                    className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#6e5d4a]"
                  />
                </div>

                <div className="flex gap-2 pt-3 sm:gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-2 py-2 sm:px-4 sm:py-2.5 border border-[#8a7966] text-[#4f4134] rounded-sm hover:bg-[#eadcc8] transition-colors font-medium text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-2 py-2 sm:px-4 sm:py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium text-sm sm:text-base"
                  >
                    {editingId ? "Update" : "Add Moderator"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
