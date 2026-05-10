"use client";

import { useMemo, useState } from "react";
import { FaEdit, FaSearch } from "react-icons/fa";
import Link from "next/link";
import type { UserWithStats } from "@/types/library";

type RankFilter = "all" | "None" | "Supporter" | "Associate" | "Member";

interface Props {
  users: UserWithStats[];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (
    (parts[0][0]?.toUpperCase() ?? "") +
    (parts[parts.length - 1][0]?.toUpperCase() ?? "")
  );
}

function getProgressPercent(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export default function UsersClient({ users }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [rankFilter, setRankFilter] = useState<RankFilter>("all");

  const counts = useMemo(
    () => ({
      total: users.length,
      supporters: users.filter((u) => u.rank === "Supporter").length,
      associates: users.filter((u) => u.rank === "Associate").length,
      members: users.filter((u) => u.rank === "Member").length,
    }),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return users.filter((user) => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query);
      const matchesRank = rankFilter === "all" || user.rank === rankFilter;
      return matchesSearch && matchesRank;
    });
  }, [users, rankFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header + stats */}
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
              Supporters
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title leading-none mt-1">
              {counts.supporters}
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

      {/* Search + filter */}
      <section className="dashboard-surface tron-border rounded-sm p-4 sm:p-5 border border-[#5f4f40]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="relative lg:col-span-2">
            <FaSearch className="absolute left-3 top-3 text-[#7a6a5a]" />
            <input
              type="text"
              placeholder="Search by name, username, or email..."
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
            <option value="None">None</option>
            <option value="Supporter">Supporter</option>
            <option value="Associate">Associate</option>
            <option value="Member">Member</option>
          </select>
        </div>
      </section>

      {/* Table */}
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
                const progress = getProgressPercent(
                  user.syllabusCompleted,
                  user.syllabusTotal,
                );

                return (
                  <tr
                    key={user.id}
                    className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                  >
                    {/* Name + avatar */}
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={user.avatar_url}
                            alt={user.full_name}
                            className="w-8 h-8 rounded-full object-cover border border-[#8a7966] shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#d9cbb7] border border-[#8a7966] flex items-center justify-center text-xs font-bold text-[#4a3e33] shrink-0 ink-title select-none">
                            {getInitials(user.full_name)}
                          </div>
                        )}
                        <Link
                          href={`/dashboard/users/${user.id}`}
                          className="font-medium text-[#2b2119] hover:underline hover:text-[#3f3328] transition-colors"
                        >
                          {user.full_name}
                        </Link>
                      </div>
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
                      <Link
                        href={`/dashboard/users/${user.id}`}
                        className="inline-flex p-2 text-[#5b4c3f] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                        aria-label={`View ${user.full_name}`}
                      >
                        <FaEdit className="w-4 h-4" />
                      </Link>
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
    </div>
  );
}
