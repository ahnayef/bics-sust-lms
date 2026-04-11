"use client";

import { useState } from "react";
import { FaEdit, FaPlus, FaSearch, FaTrash } from "react-icons/fa";

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
    return "bg-gray-100 text-gray-900";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage library users</p>
        </div>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          <FaPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-gray-700 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {member.name}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{member.email}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getRankColor(member.rank)}`}
                    >
                      {member.rank}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(member)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(member.id)}
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

        {filteredMembers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No members found matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingMemberId ? "Edit Member" : "Add New Member"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rank
                </label>
                <select
                  value={formData.rank}
                  onChange={(e) =>
                    setFormData({ ...formData, rank: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
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
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
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
