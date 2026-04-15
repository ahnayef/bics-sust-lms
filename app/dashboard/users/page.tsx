"use client";

import StatusBadge from "@/app/components/StatusBadge";
import { useMemo, useState } from "react";
import {
  FaBook,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaEnvelope,
  FaEye,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTrash,
  FaUser,
} from "react-icons/fa";

type RankFilter = "all" | "Activist" | "Associate" | "Member";

interface User {
  id: number;
  name: string;
  email: string;
  rank: "Activist" | "Associate" | "Member";
  syllabusCompleted: number;
  syllabusTotal: number;
  activeBorrows: number;
  pendingRequests: number;
}

interface UserForm {
  name: string;
  email: string;
  rank: "Activist" | "Associate" | "Member";
}

interface UserProfileExtra {
  recentActivities: {
    title: string;
    date: string;
    type: "borrow" | "return" | "progress" | "request";
  }[];
}

const EMPTY_FORM: UserForm = {
  name: "",
  email: "",
  rank: "Member",
};

const USER_PROFILE_EXTRAS: Record<number, UserProfileExtra> = {
  1: {
    recentActivities: [
      {
        title: "Submitted borrow request for QR005",
        date: "2026-04-13",
        type: "request",
      },
      {
        title: "Returned QR002 on time",
        date: "2026-04-11",
        type: "return",
      },
      {
        title: "Completed syllabus book: পর্দা ও ইসলাম",
        date: "2026-04-07",
        type: "progress",
      },
    ],
  },
  2: {
    recentActivities: [
      {
        title: "Borrowed QR003",
        date: "2026-04-12",
        type: "borrow",
      },
      {
        title: "Completed syllabus book: আদাবে জিন্দেগী",
        date: "2026-04-09",
        type: "progress",
      },
      {
        title: "Submitted borrow request for QR006",
        date: "2026-04-05",
        type: "request",
      },
    ],
  },
  3: {
    recentActivities: [
      {
        title: "Submitted borrow request for QR004",
        date: "2026-04-14",
        type: "request",
      },
      {
        title: "Borrowed QR001",
        date: "2026-04-10",
        type: "borrow",
      },
      {
        title: "Returned QR006",
        date: "2026-04-03",
        type: "return",
      },
    ],
  },
  4: {
    recentActivities: [
      {
        title: "Completed syllabus milestone: 70%",
        date: "2026-04-12",
        type: "progress",
      },
      {
        title: "Borrowed QR010",
        date: "2026-04-06",
        type: "borrow",
      },
      {
        title: "Returned QR008",
        date: "2026-04-01",
        type: "return",
      },
    ],
  },
  5: {
    recentActivities: [
      {
        title: "Submitted 2 pending borrow requests",
        date: "2026-04-13",
        type: "request",
      },
      {
        title: "Borrowed QR009",
        date: "2026-04-08",
        type: "borrow",
      },
      {
        title: "Completed syllabus book: ইসলামী অর্থনীতি",
        date: "2026-04-02",
        type: "progress",
      },
    ],
  },
};

export default function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [rankFilter, setRankFilter] = useState<RankFilter>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserForm>(EMPTY_FORM);

  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "Ahsan Habib",
      email: "ahnayef@duck.com",
      rank: "Associate",
      syllabusCompleted: 12,
      syllabusTotal: 80,
      activeBorrows: 2,
      pendingRequests: 1,
    },
    {
      id: 2,
      name: "Rakib Hasan",
      email: "rakib.hasan@duck.com",
      rank: "Activist",
      syllabusCompleted: 24,
      syllabusTotal: 80,
      activeBorrows: 1,
      pendingRequests: 0,
    },
    {
      id: 3,
      name: "Mahmudul Hasan",
      email: "mahmudul.hasan@duck.com",
      rank: "Associate",
      syllabusCompleted: 37,
      syllabusTotal: 80,
      activeBorrows: 3,
      pendingRequests: 1,
    },
    {
      id: 4,
      name: "Farhan Rahman",
      email: "farhan.rahman@duck.com",
      rank: "Member",
      syllabusCompleted: 56,
      syllabusTotal: 80,
      activeBorrows: 2,
      pendingRequests: 0,
    },
    {
      id: 5,
      name: "Tanvir Ahmed",
      email: "tanvir.ahmed@duck.com",
      rank: "Activist",
      syllabusCompleted: 9,
      syllabusTotal: 80,
      activeBorrows: 1,
      pendingRequests: 2,
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

  const handleViewProfileClick = (user: User) => {
    setSelectedUser(user);
    setShowProfileModal(true);
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
        syllabusCompleted: 0,
        syllabusTotal: 80,
        activeBorrows: 0,
        pendingRequests: 0,
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

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedUser(null);
  };

  const getProgressPercent = (user: User) => {
    if (user.syllabusTotal === 0) {
      return 0;
    }
    return Math.round((user.syllabusCompleted / user.syllabusTotal) * 100);
  };

  const getActivityTypeTone = (
    type: UserProfileExtra["recentActivities"][number]["type"],
  ): "info" | "success" | "warning" | "accent" => {
    if (type === "borrow") {
      return "info";
    }
    if (type === "return") {
      return "success";
    }
    if (type === "request") {
      return "warning";
    }
    return "accent";
  };

  const getActivityTypeIcon = (
    type: UserProfileExtra["recentActivities"][number]["type"],
  ) => {
    if (type === "borrow") {
      return FaBook;
    }
    if (type === "return") {
      return FaCheckCircle;
    }
    if (type === "request") {
      return FaClock;
    }
    return FaUser;
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
                  Name
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Email
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Rank
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Progress
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Borrow Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const progress = getProgressPercent(user);

                return (
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
                      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-sm border border-[#b9a58b] bg-[#f6ecdd] text-[#4f4134] ink-text">
                        {user.rank}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 min-w-56">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-[#5a4b3f]">
                          <span>
                            {user.syllabusCompleted}/{user.syllabusTotal}
                          </span>
                          <span className="font-semibold text-[#2b2119]">
                            {progress}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#e4d4bf] border border-[#ccb79b] overflow-hidden">
                          <div
                            className="h-full bg-[#5a4d40]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-xs text-[#5a4b3f]">
                      <p>
                        Active:{" "}
                        <span className="font-semibold text-[#2b2119]">
                          {user.activeBorrows}
                        </span>
                      </p>
                      <p>
                        Pending:{" "}
                        <span className="font-semibold text-[#2b2119]">
                          {user.pendingRequests}
                        </span>
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewProfileClick(user)}
                          className="p-2 text-[#5b4c3f] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                          aria-label={`View profile of ${user.name}`}
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
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
                );
              })}
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
          <div
            className="dashboard-surface tron-border rounded-sm max-w-md w-full p-6"
            data-aos="zoom-in"
            data-aos-duration="200"
          >
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

      {showProfileModal && selectedUser && (
        <div className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-4 z-80">
          <div
            className="dashboard-surface tron-border rounded-sm max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            data-aos="zoom-in"
            data-aos-duration="200"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#221910] ink-title">
                  User Profile
                </h2>
                <p className="text-sm text-[#5a4b3f] ink-text mt-1">
                  Detailed progress and activity overview
                </p>
              </div>
              <button
                onClick={closeProfileModal}
                className="p-2 text-[#655648] hover:bg-[#e7d8c3] rounded-sm transition-colors"
                aria-label="Close user profile modal"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5 ink-text">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42]">
                    Name
                  </p>
                  <p className="text-base font-semibold text-[#221910] mt-1 inline-flex items-center gap-2">
                    <FaUser className="w-3.5 h-3.5 text-[#5a4d40]" />
                    {selectedUser.name}
                  </p>
                </div>

                <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42]">
                    Email
                  </p>
                  <p className="text-sm font-medium text-[#221910] mt-1 inline-flex items-center gap-2 break-all">
                    <FaEnvelope className="w-3.5 h-3.5 text-[#5a4d40]" />
                    {selectedUser.email}
                  </p>
                </div>

                <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42]">
                    Rank
                  </p>
                  <p className="text-sm font-semibold text-[#221910] mt-1">
                    {selectedUser.rank}
                  </p>
                </div>
              </div>

              <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] mb-2">
                  Syllabus Progress
                </p>
                <div className="flex items-center justify-between text-sm text-[#5a4b3f] mb-2">
                  <span>
                    {selectedUser.syllabusCompleted}/
                    {selectedUser.syllabusTotal}
                  </span>
                  <span className="font-semibold text-[#221910]">
                    {getProgressPercent(selectedUser)}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#e4d4bf] border border-[#ccb79b] overflow-hidden">
                  <div
                    className="h-full bg-[#5a4d40]"
                    style={{ width: `${getProgressPercent(selectedUser)}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <p className="text-[#5a4b3f]">
                    Active borrows:{" "}
                    <span className="font-semibold text-[#221910]">
                      {selectedUser.activeBorrows}
                    </span>
                  </p>
                  <p className="text-[#5a4b3f]">
                    Pending requests:{" "}
                    <span className="font-semibold text-[#221910]">
                      {selectedUser.pendingRequests}
                    </span>
                  </p>
                </div>
              </div>

              <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] mb-2">
                  Recent Activities
                </p>
                <div className="space-y-2 text-sm text-[#5a4b3f]">
                  {(
                    USER_PROFILE_EXTRAS[selectedUser.id]?.recentActivities || []
                  ).map((activity) => (
                    <div
                      key={`${activity.type}-${activity.date}-${activity.title}`}
                      className="border border-[#d9c6ab] rounded-sm px-3 py-2 bg-[#f8efdf]"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <StatusBadge
                          tone={getActivityTypeTone(activity.type)}
                          size="xs"
                          icon={getActivityTypeIcon(activity.type)}
                        >
                          {activity.type}
                        </StatusBadge>
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#6a5a4c]">
                          <FaClock className="w-3 h-3" />
                          {activity.date}
                        </span>
                      </div>
                      <p>{activity.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={closeProfileModal}
                className="px-4 py-2.5 border border-[#8a7966] text-[#4f4134] rounded-sm hover:bg-[#eadcc8] transition-colors font-medium ink-text"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
