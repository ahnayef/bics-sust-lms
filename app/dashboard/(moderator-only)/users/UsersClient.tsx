"use client";

import { RankBadge } from "@/components/ui/rank-badge";
import Avatar from "@/components/Avatar";
import { useTranslation } from "@/lib/i18n/context";
import type { UserWithStats } from "@/types/library";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaChevronDown,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaTimes,
  FaTimesCircle
} from "react-icons/fa";

type Tab = "all" | "verified" | "unverified" | "overdue";
type SortField = "joinDate" | "progress" | "rank";
type SortDir = "asc" | "desc";

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
  const { t } = useTranslation();
  return verified ? (
    <FaCheckCircle
      className="w-3.5 h-3.5 text-[#5a8a3e] shrink-0"
      title={t.users.badges.verified}
    />
  ) : (
    <FaTimesCircle
      className="w-3.5 h-3.5 text-[#b07a2a] shrink-0"
      title={t.users.badges.unverified}
    />
  );
}

export default function UsersClient({ users }: Props) {
  const { t, language } = useTranslation();
  const progressCategories = useMemo(() => {
    const categories = new Map<string, string>();
    for (const u of users) {
      if (u.categoryProgress) {
        for (const cp of u.categoryProgress) {
          categories.set(cp.categoryId, cp.categoryName);
        }
      }
    }
    // Sort so Syllabus is first, then alphabetical
    return Array.from(categories.entries()).sort((a, b) => {
      if (a[1] === "Syllabus") return -1;
      if (b[1] === "Syllabus") return 1;
      return a[1].localeCompare(b[1]);
    });
  }, [users]);

  const syllabusId = useMemo(() => {
    return progressCategories.find((c) => c[1] === "Syllabus")?.[0] ?? "all";
  }, [progressCategories]);

  const [tab, setTab] = useState<Tab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [rankFilter, setRankFilter] = useState<string>("all");
  const [thanaFilter, setThanaFilter] = useState<string>("all");
  const [progressCategoryFilter, setProgressCategoryFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("joinDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Set default category to Syllabus once categories are loaded
  useEffect(() => {
    if (progressCategoryFilter === "all" && syllabusId !== "all") {
      setProgressCategoryFilter(syllabusId);
    }
  }, [syllabusId, progressCategoryFilter]);

  const uniqueRanks = useMemo(() => {
    const ranks = new Map<string, string>();
    for (const u of users) {
      if (u.rank?.id) {
        ranks.set(u.rank.id, u.rank.name);
      }
    }
    return Array.from(ranks.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [users]);

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
  const overdueUsers = useMemo(
    () => users.filter((u) => u.overdueBorrows > 0),
    [users],
  );
  const baseUsers =
    tab === "verified"
      ? verifiedUsers
      : tab === "unverified"
        ? unverifiedUsers
        : tab === "overdue"
          ? overdueUsers
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
      if (rankFilter !== "all") {
        if (rankFilter === "None") {
          if (user.rank?.id) return false;
        } else {
          if (user.rank?.id !== rankFilter) return false;
        }
      }
      if (thanaFilter !== "all" && user.thana?.id !== thanaFilter) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "joinDate") {
        cmp =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === "progress") {
        let pa = 0;
        let pb = 0;

        if (progressCategoryFilter === "all") {
          pa = a.syllabusTotal > 0 ? a.syllabusCompleted / a.syllabusTotal : 0;
          pb = b.syllabusTotal > 0 ? b.syllabusCompleted / b.syllabusTotal : 0;
        } else {
          const cpa = a.categoryProgress?.find((c) => c.categoryId === progressCategoryFilter);
          const cpb = b.categoryProgress?.find((c) => c.categoryId === progressCategoryFilter);
          pa = cpa && cpa.total > 0 ? cpa.completed / cpa.total : 0;
          pb = cpb && cpb.total > 0 ? cpb.completed / cpb.total : 0;
        }
        cmp = pa - pb;
      } else if (sortField === "rank") {
        const ra = a.rank?.name ?? t.users.filters.noRank;
        const rb = b.rank?.name ?? t.users.filters.noRank;
        cmp = ra.localeCompare(rb);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [baseUsers, searchTerm, rankFilter, thanaFilter, sortField, sortDir, t.users.filters.noRank]);

  const tabCounts = {
    all: users.length,
    verified: verifiedUsers.length,
    unverified: unverifiedUsers.length,
    overdue: overdueUsers.length,
  };

  const selectClass =
    "px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-sm cursor-pointer hover:bg-[#ece0ce] transition-colors appearance-none pr-8 relative";

  const SelectWrapper = ({ children, icon: Icon }: { children: React.ReactNode, icon?: any }) => (
    <div className="relative group">
      {children}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8a7966] group-hover:text-[#5a4b3f] transition-colors">
        <FaChevronDown className="w-3 h-3" />
      </div>
    </div>
  );

  const hasActiveFilters =
    searchTerm !== "" ||
    rankFilter !== "all" ||
    thanaFilter !== "all" ||
    progressCategoryFilter !== syllabusId ||
    sortField !== "joinDate" ||
    sortDir !== "desc";

  const resetFilters = () => {
    setSearchTerm("");
    setRankFilter("all");
    setThanaFilter("all");
    setProgressCategoryFilter(syllabusId);
    setSortField("joinDate");
    setSortDir("desc");
  };

  return (
    <div className="space-y-5">
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
          {t.users.title}
        </h1>
        <p className="text-[#5a4b3f] mt-1 ink-text text-sm">
          {t.users.subtitle}
        </p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
          {[
            { label: t.users.stats.total, value: users.length },
            { label: t.users.stats.verified, value: verifiedUsers.length },
            { label: t.users.stats.unverified, value: unverifiedUsers.length },
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

      <div className="flex border-b border-[#b9a58b] gap-0 overflow-x-auto overflow-y-hidden">
        {(["all", "verified", "unverified", "overdue"] as const).map((tabId) => (
          <button
            key={tabId}
            type="button"
            onClick={() => setTab(tabId)}
            className={`flex-1 shrink-0 whitespace-nowrap px-3 sm:px-6 py-2.5 text-xs sm:text-sm font-medium ink-text transition-colors flex items-center justify-center gap-1.5 border-b-[3px] -mb-px cursor-pointer ${tab === tabId
              ? "border-[#3f3328] text-[#221910] font-bold bg-[#f6ecdd]"
              : "border-transparent text-[#6a5a4c] hover:text-[#3f3328] hover:bg-[#eadcc8]/30"
              }`}
          >
            {t.users.tabs[tabId]}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${tab === tabId ? "bg-[#3f3328] text-[#f4e8d4]" : "bg-[#d2bfa5] text-[#4a3825]"
              }`}>
              {tabCounts[tabId]}
            </span>
          </button>
        ))}
      </div>

      <section className="dashboard-surface tron-border rounded-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#7d6d5a] bg-[#eadcc8]/40 space-y-4">
          <div className="flex flex-col gap-4">
            <div className="relative w-full">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7966] w-4 h-4" />
              <input
                type="text"
                placeholder={t.users.filters.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SelectWrapper>
                <select
                  value={rankFilter}
                  onChange={(e) => setRankFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="all">{t.users.filters.allRanks}</option>
                  <option value="None">{t.users.filters.noRank}</option>
                  {uniqueRanks.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </SelectWrapper>

              <SelectWrapper>
                <select
                  value={thanaFilter}
                  onChange={(e) => setThanaFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="all">{t.users.filters.allThanas}</option>
                  {uniqueThanas.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </SelectWrapper>

              <SelectWrapper>
                <select
                  value={progressCategoryFilter}
                  onChange={(e) => setProgressCategoryFilter(e.target.value)}
                  className={selectClass}
                >
                  {progressCategories.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </SelectWrapper>

              <div className="flex items-center gap-2">
                <SelectWrapper>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className={selectClass}
                  >
                    <option value="joinDate">{t.users.filters.sortBy.joinDate}</option>
                    <option value="progress">{t.users.filters.sortBy.progress}</option>
                    <option value="rank">{t.users.filters.sortBy.rank}</option>
                  </select>
                </SelectWrapper>

                <button
                  onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                  className="p-2.5 bg-[#f6ecdd] border border-[#8a7966] text-[#4e4033] rounded-sm hover:bg-[#ece0ce] transition-colors flex items-center justify-center min-w-[42px]"
                  title={sortDir === "asc" ? t.common.sort.ascending : t.common.sort.descending}
                >
                  {sortDir === "asc" ? (
                    <FaSortAmountUp className="w-4 h-4" />
                  ) : (
                    <FaSortAmountDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-[#8b2c1a] hover:text-[#9b3a25] flex items-center gap-1.5 transition-colors uppercase tracking-wider h-10 px-2"
                >
                  <FaTimes className="w-3 h-3" /> {t.users.filters.reset}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm ink-text text-left">
            <thead>
              <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                <th className="px-4 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5c4f42]">
                  {t.users.table.member}
                </th>
                <th className="px-4 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5c4f42]">
                  {t.users.table.rank}
                </th>
                <th className="px-4 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5c4f42]">
                  {t.users.table.progress}
                </th>
                <th className="px-4 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5c4f42]">
                  {t.users.table.overdue}
                </th>
                <th className="px-4 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5c4f42]">
                  {t.users.table.joined}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                let pct = 0;
                let completed = 0;
                let total = 0;

                if (progressCategoryFilter === "all") {
                  pct = user.syllabusTotal > 0 ? Math.round((user.syllabusCompleted / user.syllabusTotal) * 100) : 0;
                  completed = user.syllabusCompleted;
                  total = user.syllabusTotal;
                } else {
                  const cp = user.categoryProgress?.find((c) => c.categoryId === progressCategoryFilter);
                  pct = cp && cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
                  completed = cp?.completed ?? 0;
                  total = cp?.total ?? 0;
                }

                return (
                  <tr
                    key={user.id}
                    className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 relative">
                          <Avatar
                            src={user.avatar_url}
                            alt={user.full_name}
                            initials={getInitials(user.full_name)}
                            size="sm"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                            <VerificationBadge verified={user.is_verified} />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/users/${user.id}`}
                            className="font-bold text-[#2b2119] truncate leading-tight hover:underline hover:text-[#5a4b3f] transition-colors"
                          >
                            {user.full_name}
                          </Link>
                          <p className="text-[11px] text-[#7a6a5a]">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <RankBadge name={user.rank?.name} />
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <div className="space-y-1 w-24">
                        <div className="flex justify-between text-[10px] font-bold text-[#5c4f42]">
                          <span>{pct}%</span>
                          <span className="opacity-70">
                            {completed}/{total}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#d2bfa5]/40 rounded-full overflow-hidden border border-[#c9b89a]/30">
                          <div
                            className="h-full bg-[#5a4d40] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      {user.overdueBorrows > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#fce8e4] text-[#8b2c1a] border border-[#d0604a] text-[10px] font-bold">
                          <FaTimesCircle className="w-2.5 h-2.5" />
                          {user.overdueBorrows}
                        </span>
                      ) : (
                        <span className="text-[#8a7966] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-xs text-[#5a4b3f] whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-[#6a5a4c] ink-text">
            <p>{t.users.empty}</p>
          </div>
        )}
        {filteredUsers.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-[#d2bfa5] text-xs text-[#6a5a4c] ink-text">
            {t.common.pagination.showing} {filteredUsers.length} {t.common.pagination.of} {baseUsers.length}{" "}
            {tab === "all"
              ? t.users.tabs.all
              : t.users.tabs[tab]}
          </div>
        )}
      </section>
    </div>
  );
}
