"use client";

import { useMemo, useState } from "react";
import { FaEdit, FaPlus, FaSearch, FaTimes, FaTrash } from "react-icons/fa";

type RankFilter = "all" | "Activist" | "Associate" | "Member";

interface User {
  id: number;
  name: string;
  email: string;
  rank: "Activist" | "Associate" | "Member";
}

interface UserForm {
  name: string;
  email: string;
  rank: "Activist" | "Associate" | "Member";
}

const EMPTY_FORM: UserForm = {
  name: "",
  email: "",
  rank: "Member",
};

export default function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [rankFilter, setRankFilter] = useState<RankFilter>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserForm>(EMPTY_FORM);

  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      rank: "Member",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      rank: "Activist",
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike@example.com",
      rank: "Associate",
    },
    {
      id: 4,
      name: "Sarah Williams",
      email: "sarah@example.com",
      rank: "Member",
    },
    {
      id: 5,
      name: "Emma Davis",
      email: "emma@example.com",
      rank: "Activist",
    },
  ]);

  const counts = useMemo(
    () => ({
      total: users.length,
      activists: users.filter((user) => user.rank === "Activist").length,
      associates: users.filter((user) => user.rank === "Associate").length,
      members: users.filter((user) => user.rank === "Member").length,
    }),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);

      const matchesRank = rankFilter === "all" || user.rank === rankFilter;

      return matchesSearch && matchesRank;
    });
  }, [users, rankFilter, searchTerm]);

  const openAddModal = () => {
    setEditingUserId(null);
    setFormData(EMPTY_FORM);
    setShowAddModal(true);
  };

  const handleEditClick = (user: User) => {
    setEditingUserId(user.id);
    setFormData({ name: user.name, email: user.email, rank: user.rank });
    setShowAddModal(true);
  };

  const handleDeleteClick = (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    }
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      return;
    }

    if (editingUserId) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUserId
            ? {
                ...user,
                name: formData.name.trim(),
                email: formData.email.trim(),
                rank: formData.rank,
              }
            : user,
        ),
      );
    } else {
      const newUser: User = {
        id: Math.max(...users.map((user) => user.id), 0) + 1,
        name: formData.name.trim(),
        email: formData.email.trim(),
        rank: formData.rank,
      };
      setUsers((prev) => [...prev, newUser]);
    }

    setShowAddModal(false);
    setEditingUserId(null);
    setFormData(EMPTY_FORM);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingUserId(null);
    setFormData(EMPTY_FORM);
  };

  const getRankColor = (rank: User["rank"]) => {
    if (rank === "Activist") {
      return "bg-[#f3e9d8] text-[#3f3328] border border-[#8f7f6c]";
    }
    if (rank === "Associate") {
      return "bg-[#f0e3cf] text-[#47392d] border border-[#9a8975]";
    }
    return "bg-[#efe4d1] text-[#46382c] border border-[#8f7f6c]";
  };

  return (
    <div className="space-y-6">
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
              Users Control Room
            </h1>
            <p className="text-[#5a4b3f] mt-1 ink-text">
              Manage user records quickly with a clear rank overview and focused
              actions.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium ink-text"
          >
            <FaPlus className="w-4 h-4" />
            Add User
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-5">
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
              Activists
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title leading-none mt-1">
              {counts.activists}
            </p>
          </div>
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-2 sm:p-3">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
              Associates
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title leading-none mt-1">
              {counts.associates}
            </p>
          </div>
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-2 sm:p-3">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
              Members
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title leading-none mt-1">
              {counts.members}
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
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
            />
          </div>

          <select
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value as RankFilter)}
            className="px-3 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
          >
            <option value="all">All Ranks</option>
            <option value="Activist">Activist</option>
            <option value="Associate">Associate</option>
            <option value="Member">Member</option>
          </select>
        </div>
      </section>

      <section className="dashboard-surface tron-border rounded-sm overflow-hidden border border-[#5f4f40]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm ink-text min-w-160">
            <thead>
              <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Name
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Email
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Rank
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 font-medium text-[#2b2119]">
                    {user.name}
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-[#5a4b3f]">
                    {user.email}
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-sm ${getRankColor(
                        user.rank,
                      )}`}
                    >
                      {user.rank}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="p-2 text-[#5b4c3f] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                        aria-label={`Edit ${user.name}`}
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user.id)}
                        className="p-2 text-[#6a4e3d] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                        aria-label={`Delete ${user.name}`}
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

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-[#6a5a4c] ink-text">
            <p>No users match this search/filter combination.</p>
          </div>
        )}
      </section>

      {showAddModal && (
        <div className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-4 z-80">
          <div className="dashboard-surface tron-border rounded-sm max-w-md w-full p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-[#221910] ink-title">
                {editingUserId ? "Edit User" : "Add New User"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-[#655648] hover:bg-[#e7d8c3] rounded-sm transition-colors"
                aria-label="Close user modal"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 ink-text">
              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  Rank
                </label>
                <select
                  value={formData.rank}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rank: e.target.value as User["rank"],
                    })
                  }
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                >
                  <option value="Activist">Activist</option>
                  <option value="Associate">Associate</option>
                  <option value="Member">Member</option>
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
                onClick={handleSave}
                disabled={!formData.name.trim() || !formData.email.trim()}
                className="flex-1 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] disabled:opacity-55 disabled:cursor-not-allowed transition-colors font-medium ink-text"
              >
                {editingUserId ? "Update User" : "Add User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
