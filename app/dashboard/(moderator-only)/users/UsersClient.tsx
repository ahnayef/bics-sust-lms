"use client";

import { useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaTimes,
  FaTimesCircle,
} from "react-icons/fa";
import Link from "next/link";
import type { UserWithStats } from "@/types/library";

type Tab = "all" | "verified" | "unverified";
type SortField = "joinDate" | "progress" | "rank";
type SortDir = "asc" | "desc";
type RankFilter = "all" | "None" | "Supporter" | "Associate" | "Member";

const RANK_ORDER: Record<string, number> = {
  None: 0,
  Supporter: 1,
  Associate: 2,
  Member: 3,
};

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

function VerificationBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <FaCheckCircle
      className="w-3.5 h-3.5 text-[#5a8a3e] shrink-0"
      title="Verified"
    />
  ) : (
    <FaTimesCircle
      className="w-3.5 h-3.5 text-[#b07a2a] shrink-0"
      title="Unverified"
    />
  );
}

export default function UsersClient({ users }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [rankFilter, setRankFilter] = useState<RankFilter>("all");
  const [thanaFilter, setThanaFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("joinDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const uniqueThanas = useMemo(() => {
    const thanas = new Map<string, string>();
    for (const u of users) {
      if (u.thana?.id) thanas.set(u.thana.id, u.thana.name);
    }
    return Array.from(thanas.entries()).sort((a, b) =>
      a[1].localeCompare(b[1]),
    );
  }, [users]);

  const verifiedUsers = useMemo(
    () => users.filter((u) => u.is_verified),
    [users],
  );
  const unverifiedUsers = useMemo(
    () => users.filter((u) => !u.is_verified),
    [users],
  );
  const baseUsers =
    tab === "verified"
      ? verifiedUsers
      : tab === "unverified"
        ? unverifiedUsers
        : users;

  const filteredUsers = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    const filtered = baseUsers.filter((user) => {
      if (
        query &&
        !user.full_name.toLowerCase().includes(query) &&
        !user.email.toLowerCase().includes(query) &&
        !user.username.toLowerCase().includes(query)
      )
        return false;
      if (rankFilter !== "all" && user.rank !== rankFilter) return false;
      if (thanaFilter !== "all" && user.thana?.id !== thanaFilter) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "joinDate") {
        cmp =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === "progress") {
        const pa =
          a.syllabusTotal > 0 ? a.syllabusCompleted / a.syllabusTotal : 0;
        const pb =
          b.syllabusTotal > 0 ? b.syllabusCompleted / b.syllabusTotal : 0;
        cmp = pa - pb;
      } else if (sortField === "rank") {
        cmp = (RANK_ORDER[a.rank] ?? 0) - (RANK_ORDER[b.rank] ?? 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [baseUsers, searchTerm, rankFilter, thanaFilter, sortField, sortDir]);

  const tabCounts = {
    all: users.length,
    verified: verifiedUsers.length,
    unverified: unverifiedUsers.length,
  };

  const selectClass =
    "px-3 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-sm cursor-pointer";

  const hasActiveFilters =
    searchTerm !== "" ||
    rankFilter !== "all" ||
    thanaFilter !== "all" ||
    sortField !== "joinDate" ||
    sortDir !== "desc";

  const resetFilters = () => {
    setSearchTerm("");
    setRankFilter("all");
    setThanaFilter("all");
    setSortField("joinDate");
    setSortDir("desc");
  };

  return (
    <div className="space-y-5">
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
          Users
        </h1>
        <p className="text-[#5a4b3f] mt-1 ink-text text-sm">
          Manage and monitor all registered members.
        </p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
          {[
            { label: "Total", value: users.length },
            { label: "Verified", value: verifiedUsers.length },
            { label: "Unverified", value: unverifiedUsers.length },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-2 sm:p-3"
            >
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
                {label}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title leading-none mt-1">
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex border-b border-[#b9a58b] gap-0">
        {(["all", "verified", "unverified"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 sm:px-6 py-2.5 text-sm font-medium ink-text transition-colors flex items-center gap-2 border-b-2 -mb-px cursor-pointer ${
              tab === t
                ? "border-[#5a4d40] text-[#2b2119]"
                : "border-transparent text-[#6a5a4c] hover:text-[#2b2119] hover:border-[#b9a58b]"
            }`}
          >
            {t === "all"
              ? "All Users"
              : t === "verified"
                ? "✓ Verified"
                : "✗ Unverified"}
            <span className="px-1.5 py-0.5 text-[10px] rounded-sm bg-[#e4d4bf] text-[#4f4134]">
              {tabCounts[t]}
            </span>
          </button>
        ))}
      </div>

      <section className="dashboard-surface tron-border rounded-sm p-4 sm:p-5 border border-[#5f4f40] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5c4f42] ink-text">
            Filters &amp; Sort
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#7a4c37] border border-[#c4a882] bg-[#f6ecdd] rounded-sm hover:bg-[#ede3d4] hover:border-[#b0906a] transition-colors ink-text cursor-pointer"
            >
              <FaTimes className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a6a5a] w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search name, email, username…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-sm"
            />
          </div>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className={selectClass}
          >
            <option value="joinDate">Sort: Join Date</option>
            <option value="progress">Sort: Progress</option>
            <option value="rank">Sort: Rank</option>
          </select>
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="flex items-center justify-center gap-2 px-3 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm hover:bg-[#ede3d4] transition-colors ink-text text-sm cursor-pointer"
          >
            {sortDir === "desc" ? (
              <FaChevronDown className="w-3.5 h-3.5" />
            ) : (
              <FaChevronUp className="w-3.5 h-3.5" />
            )}
            {sortDir === "desc" ? "Descending" : "Ascending"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <select
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value as RankFilter)}
            className={selectClass}
          >
            <option value="all">All Ranks</option>
            <option value="None">None</option>
            <option value="Supporter">Supporter</option>
            <option value="Associate">Associate</option>
            <option value="Member">Member</option>
          </select>

          <select
            value={thanaFilter}
            onChange={(e) => setThanaFilter(e.target.value)}
            className={selectClass}
          >
            <option value="all">All Thanas</option>
            {uniqueThanas.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="dashboard-surface tron-border rounded-sm overflow-hidden border border-[#5f4f40]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm ink-text min-w-160">
            <thead>
              <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                {[
                  "Name",
                  "Email",
                  "Rank",
                  "Progress",
                  "Borrows",
                  "Joined",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const progress =
                  user.syllabusTotal > 0
                    ? Math.round(
                        (user.syllabusCompleted / user.syllabusTotal) * 100,
                      )
                    : 0;
                const joinedDate = new Date(user.created_at).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "short", year: "numeric" },
                );

                return (
                  <tr
                    key={user.id}
                    className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        {user.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
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
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/dashboard/users/${user.id}`}
                              className="font-medium text-[#2b2119] hover:underline hover:text-[#3f3328] transition-colors truncate"
                            >
                              {user.full_name}
                            </Link>
                            <VerificationBadge verified={user.is_verified} />
                          </div>
                          <p className="text-xs text-[#7a6a5a] truncate">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 sm:px-6 py-3 text-[#5a4b3f]">
                      {user.email}
                    </td>

                    <td className="px-4 sm:px-6 py-3">
                      <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-sm border border-[#b9a58b] bg-[#f6ecdd] text-[#4f4134] ink-text">
                        {user.rank}
                      </span>
                    </td>

                    <td className="px-4 sm:px-6 py-3 min-w-48">
                      <div className="space-y-1">
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

                    <td className="px-4 sm:px-6 py-3 text-xs text-[#5a4b3f] whitespace-nowrap">
                      {joinedDate}
                    </td>

                    <td className="px-4 sm:px-6 py-3">
                      <Link
                        href={`/dashboard/users/${user.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4d4034] border border-[#8a7966] rounded-sm hover:bg-[#eadcc8] hover:border-[#c4ad91] transition-colors ink-text"
                      >
                        View
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
            No users match the current filters.
          </div>
        )}

        {filteredUsers.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-[#d2bfa5] text-xs text-[#6a5a4c] ink-text">
            Showing {filteredUsers.length} of {baseUsers.length}{" "}
            {tab === "all"
              ? "users"
              : tab === "verified"
                ? "verified users"
                : "unverified users"}
          </div>
        )}
      </section>
    </div>
  );
}
