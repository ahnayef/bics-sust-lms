"use client";

import { useState } from "react";
import { FaEdit, FaPlus, FaSearch, FaTimes, FaTrash } from "react-icons/fa";

export default function MembersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rank: "Member",
  });
  const [members, setMembers] = useState([
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

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleAddClick = () => {
    setEditingMemberId(null);
    setFormData({ name: "", email: "", rank: "Member" });
    setShowAddModal(true);
  };

  const handleEditClick = (member: (typeof members)[0]) => {
    setEditingMemberId(member.id);
    setFormData({ name: member.name, email: member.email, rank: member.rank });
    setShowAddModal(true);
  };

  const handleDeleteClick = (memberId: number) => {
    if (confirm("Are you sure you want to delete this member?")) {
      setMembers(members.filter((m) => m.id !== memberId));
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      alert("Please fill in all fields");
      return;
    }

    if (editingMemberId) {
      // Update existing member
      setMembers(
        members.map((m) =>
          m.id === editingMemberId ? { ...m, ...formData } : m,
        ),
      );
    } else {
      // Add new member
      const newMember = {
        id: Math.max(...members.map((m) => m.id), 0) + 1,
        ...formData,
      };
      setMembers([...members, newMember]);
    }

    setShowAddModal(false);
    setFormData({ name: "", email: "", rank: "Member" });
  };

  const getRankColor = (rank: string) => {
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
      {/* Header */}
      <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
            Users
          </h1>
          <p className="text-[#5a4b3f] mt-1 ink-text">Manage library users</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium ink-text"
        >
          <FaPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="dashboard-surface tron-border rounded-sm p-4 border border-[#5f4f40]">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-[#7a6a5a]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="dashboard-surface tron-border rounded-sm overflow-hidden">
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
              {filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 font-medium text-[#2b2119]">
                    {member.name}
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-[#5a4b3f]">
                    {member.email}
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-sm ${getRankColor(member.rank)}`}
                    >
                      {member.rank}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(member)}
                        className="p-2 text-[#5b4c3f] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(member.id)}
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

        {filteredMembers.length === 0 && (
          <div className="text-center py-12 text-[#6a5a4c] ink-text">
            <p>No members found matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-4 z-80">
          <div className="dashboard-surface tron-border rounded-sm max-w-md w-full p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-[#221910] ink-title">
                {editingMemberId ? "Edit Member" : "Add New Member"}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-[#655648] hover:bg-[#e7d8c3] rounded-sm transition-colors"
                aria-label="Close member modal"
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
                    setFormData({ ...formData, rank: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                >
                  <option>Activist</option>
                  <option>Associate</option>
                  <option>Member</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-[#8a7966] text-[#4f4134] rounded-sm hover:bg-[#eadcc8] transition-colors font-medium ink-text"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium ink-text"
              >
                {editingMemberId ? "Update Member" : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
