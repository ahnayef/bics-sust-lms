"use client";

import { CommunityNav } from "@/app/dashboard/components/StaffHubNav";
import Avatar from "@/components/Avatar";
import { RankBadge } from "@/components/ui/rank-badge";
import { useTranslation } from "@/lib/i18n/context";
import { verifyUser } from "@/server/profiles";
import type { Category, UserWithStats } from "@/types/library";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  FaCheck,
  FaCheckCircle,
  FaChevronDown,
  FaPhone,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaTimes,
  FaTimesCircle,
} from "react-icons/fa";

type Tab = "all" | "verified" | "unverified" | "overdue";
type SortField = "joinDate" | "progress" | "rank";
type SortDir = "asc" | "desc";

interface Props {
  users: UserWithStats[];
  categories: Category[];
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

export default function UsersClient({ users, categories }: Props) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [tab, setTab] = useState<Tab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [rankFilter, setRankFilter] = useState<string>("all");
  const [thanaFilter, setThanaFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("joinDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [progressView, setProgressView] = useState<string>("overall");
  const [showFilters, setShowFilters] = useState(false);

  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifiedIds, setVerifiedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function isUserVerified(u: UserWithStats) {
    return u.is_verified || verifiedIds.has(u.id);
  }

  function handleInlineVerify(userId: string, userName: string) {
    const confirmMsg =
      language === "bn"
        ? `সদস্য "${userName}" কে কি যাচাইকৃত (Verified) করতে চান?`
        : `Verify member "${userName}"?`;
    if (!window.confirm(confirmMsg)) return;

    setVerifyingId(userId);
    startTransition(async () => {
      const res = await verifyUser(userId);
      setVerifyingId(null);
      if (!res.error) {
        setVerifiedIds((prev) => new Set([...prev, userId]));
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  }

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
    () => users.filter((u) => isUserVerified(u)),
    [users, verifiedIds],
  );
  const unverifiedUsers = useMemo(
    () => users.filter((u) => !isUserVerified(u)),
    [users, verifiedIds],
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

  function getProgressStats(u: UserWithStats, view: string) {
    if (view === "overall") {
      const completed = u.categoryProgress.reduce(
        (sum, c) => sum + c.completed,
        0,
      );
      const total = u.categoryProgress.reduce((sum, c) => sum + c.total, 0);
      return { completed, total };
    }
    if (view === "syllabus") {
      return { completed: u.syllabusCompleted, total: u.syllabusTotal };
    }
    const cat = u.categoryProgress.find((c) => c.categoryId === view);
    return { completed: cat?.completed ?? 0, total: cat?.total ?? 0 };
  }

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
        const statsA = getProgressStats(a, progressView);
        const statsB = getProgressStats(b, progressView);
        const pa = statsA.total > 0 ? statsA.completed / statsA.total : 0;
        const pb = statsB.total > 0 ? statsB.completed / statsB.total : 0;

        // If percentages are equal, sort by actual completed count
        if (Math.abs(pa - pb) < 0.001) {
          cmp = statsA.completed - statsB.completed;
        } else {
          cmp = pa - pb;
        }
      } else if (sortField === "rank") {
        const ra = a.rank?.name ?? t.users.filters.noRank;
        const rb = b.rank?.name ?? t.users.filters.noRank;
        cmp = ra.localeCompare(rb);
      }
      if (cmp === 0) {
        return a.full_name.localeCompare(
          b.full_name,
          language === "bn" ? "bn" : "en",
        );
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [
    baseUsers,
    searchTerm,
    rankFilter,
    thanaFilter,
    sortField,
    sortDir,
    t.users.filters.noRank,
    progressView,
  ]);

  const tabCounts = {
    all: users.length,
    verified: verifiedUsers.length,
    unverified: unverifiedUsers.length,
    overdue: overdueUsers.length,
  };

  const selectClass =
    "w-full px-2.5 sm:px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-lg focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-xs sm:text-sm cursor-pointer hover:bg-[#ece0ce] transition-colors appearance-none pr-7 sm:pr-8 relative truncate";

  const SelectWrapper = ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={`relative group w-full ${className}`}>
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
    progressView !== "overall" ||
    sortField !== "joinDate" ||
    sortDir !== "desc";

  const resetFilters = () => {
    setSearchTerm("");
    setRankFilter("all");
    setThanaFilter("all");
    setProgressView("overall");
    setSortField("joinDate");
    setSortDir("desc");
  };

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* Community Hub Sub-Navigation (Desktop/Tablet) */}
      <div className="hidden md:block">
        <CommunityNav />
      </div>

      {/* Header & Quick Filter Tabs */}
      <section className="dashboard-surface tron-border rounded-xl p-3 sm:p-5">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-base sm:text-2xl font-bold text-[#221910] ink-title">
              {t.users.title}
            </h1>
            <p className="text-[11px] sm:text-sm text-[#5a4b3f] mt-0.5 ink-text">
              {t.users.subtitle}
            </p>
          </div>

          {/* 100% Viewport-Fitting 2x2 Segmented Grid on Mobile, 4-Column on Desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 p-1 bg-[#eadcc8] rounded-xl border border-[#8a7966]/40 w-full">
            {(["all", "unverified", "verified", "overdue"] as const).map(
              (tabId) => {
                const count = tabCounts[tabId];
                const isActive = tab === tabId;
                const isUrgent =
                  (tabId === "unverified" && count > 0) ||
                  (tabId === "overdue" && count > 0);
                return (
                  <button
                    key={tabId}
                    type="button"
                    onClick={() => setTab(tabId)}
                    className={`flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#3f3328] text-[#f4e8d4] shadow-xs font-bold"
                        : "text-[#5a4a3a] hover:bg-[#dfcfb9] hover:text-[#221910]"
                    }`}
                  >
                    <span>
                      {tabId === "unverified"
                        ? "⏳"
                        : tabId === "overdue"
                          ? "⚠️"
                          : tabId === "verified"
                            ? "✓"
                            : "👥"}
                    </span>
                    <span className="truncate">{t.users.tabs[tabId]}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                        isActive
                          ? "bg-[#5a4d40] text-[#fdf6ec]"
                          : isUrgent && tabId === "overdue"
                            ? "bg-[#8b2c1a] text-[#fdf0ec]"
                            : isUrgent && tabId === "unverified"
                              ? "bg-[#b07a2a] text-[#fff7e6]"
                              : "bg-[#d2bfa5] text-[#3f2f20]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-surface tron-border rounded-xl overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-[#7d6d5a] bg-[#eadcc8]/40 space-y-3">
          {/* Search bar */}
          <div className="relative w-full">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7966] w-3.5 h-3.5" />
            <input
              type="text"
              placeholder={t.users.filters.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 sm:py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-lg focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-xs sm:text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a7966] hover:text-[#221910] p-1 cursor-pointer transition-colors"
                aria-label="Clear search"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Aggressively Responsive 2-col (mobile) / 4-col (desktop) Filter Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {/* 1. Rank Filter */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#6a5a4c] pl-0.5 truncate">
                {t.users.table.rank}
              </label>
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
            </div>

            {/* 2. Thana Filter */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#6a5a4c] pl-0.5 truncate">
                {language === "bn" ? "থানা" : "Thana"}
              </label>
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
            </div>

            {/* 3. Progress Metric Filter */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#6a5a4c] pl-0.5 truncate">
                {t.users.table.progress}
              </label>
              <SelectWrapper>
                <select
                  value={progressView}
                  onChange={(e) => {
                    setProgressView(e.target.value);
                    setSortField("progress");
                  }}
                  className={selectClass}
                >
                  <option value="overall">
                    {language === "bn" ? "সার্বিক অগ্রগতি" : "Overall Progress"}
                  </option>
                  <option value="syllabus">
                    {language === "bn" ? "সিলেবাস" : "Syllabus"}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {t.users.filters.sortBy.progress}
                    </option>
                  ))}
                </select>
              </SelectWrapper>
            </div>

            {/* 4. Sort Field & Direction */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#6a5a4c] pl-0.5 truncate">
                {language === "bn" ? "সাজান" : "Sort By"}
              </label>
              <div className="flex items-center gap-1.5 w-full">
                <div className="flex-1 min-w-0">
                  <SelectWrapper>
                    <select
                      value={sortField}
                      onChange={(e) =>
                        setSortField(e.target.value as SortField)
                      }
                      className={selectClass}
                    >
                      <option value="joinDate">
                        {t.users.filters.sortBy.joinDate}
                      </option>
                      <option value="progress">
                        {t.users.filters.sortBy.progress}
                      </option>
                      <option value="rank">
                        {t.users.filters.sortBy.rank}
                      </option>
                    </select>
                  </SelectWrapper>
                </div>
                <button
                  type="button"
                  onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                  className="p-2 sm:py-2 sm:px-2.5 bg-[#f6ecdd] border border-[#8a7966] text-[#4e4033] rounded-lg hover:bg-[#ece0ce] transition-colors flex items-center justify-center shrink-0 min-w-[36px] h-[36px] sm:h-[38px] cursor-pointer shadow-2xs"
                  title={
                    sortDir === "asc"
                      ? t.common.sort.ascending
                      : t.common.sort.descending
                  }
                  aria-label={
                    sortDir === "asc"
                      ? t.common.sort.ascending
                      : t.common.sort.descending
                  }
                >
                  {sortDir === "asc" ? (
                    <FaSortAmountUp className="w-3.5 h-3.5" />
                  ) : (
                    <FaSortAmountDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Active Status & Results Counter Bar */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#d2bfa5]/60 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#eadcc8] border border-[#d2bfa5] text-[11px] font-semibold text-[#4e4033]">
              <span>
                {t.common.pagination.showing}{" "}
                <strong className="text-[#221910]">
                  {filteredUsers.length}
                </strong>{" "}
                {t.common.pagination.of} {baseUsers.length}{" "}
                {tab === "all" ? t.users.tabs.all : t.users.tabs[tab]}
              </span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8b2c1a] hover:text-[#f4e8d4] hover:bg-[#8b2c1a] bg-[#fce8e4] border border-[#d0604a] rounded-lg px-2.5 py-1 transition-all uppercase tracking-wider cursor-pointer ml-auto shadow-2xs"
              >
                <FaTimes className="w-3 h-3" />
                <span>{t.users.filters.reset}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="p-2.5 sm:p-3 space-y-2 md:hidden">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-[#6a5a4c] ink-text">
              <p>{t.users.empty}</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const stats = getProgressStats(user, progressView);
              const completed = stats.completed;
              const total = stats.total;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              const isVerified = isUserVerified(user);
              const working = verifyingId === user.id && isPending;

              return (
                <article
                  key={user.id}
                  className="border border-[#b9a58b] bg-[#f6ecdd] rounded-xl p-3 sm:p-3.5 ink-text shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="shrink-0 relative">
                        <Avatar
                          src={user.avatar_url}
                          alt={user.full_name}
                          initials={getInitials(user.full_name)}
                          size="md"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs">
                          <VerificationBadge verified={isVerified} />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/users/${user.id}`}
                          className="font-bold text-[#2b2119] truncate block text-sm hover:underline hover:text-[#5a4b3f]"
                        >
                          {user.full_name}
                        </Link>
                        <p className="text-[11px] text-[#7a6a5a] truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>

                    {user.overdueBorrows > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#fce8e4] text-[#8b2c1a] border border-[#d0604a] text-[10px] font-bold shrink-0">
                        <FaTimesCircle className="w-2.5 h-2.5" />
                        <span>
                          {user.overdueBorrows} {t.users.table.overdue}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    <RankBadge name={user.rank?.name} />
                    {user.thana && (
                      <span className="text-[11px] font-medium text-[#5a4b3f] bg-[#e8decf] px-2 py-0.5 rounded-md border border-[#c5b49d]">
                        {user.thana.name}
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#dfceb9]">
                    <div className="flex items-center justify-between text-xs text-[#5c4f42] mb-1">
                      <span className="font-semibold text-[11px]">
                        {progressView === "overall"
                          ? language === "bn"
                            ? "সার্বিক অগ্রগতি"
                            : "Overall Progress"
                          : progressView === "syllabus"
                            ? language === "bn"
                              ? "সিলেবাস"
                              : "Syllabus"
                            : (categories.find((c) => c.id === progressView)
                                ?.name ?? t.users.table.progress)}
                      </span>
                      <span className="font-bold">
                        {pct}% ({completed}/{total})
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#d2bfa5]/50 rounded-full overflow-hidden border border-[#c9b89a]/40">
                      <div
                        className="h-full bg-[#5a4d40] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#dfceb9] flex items-center justify-between gap-2 flex-wrap">
                    {user.phone ? (
                      <a
                        href={`tel:${user.phone}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#e8decf] hover:bg-[#d9ccba] text-[#4a3e33] border border-[#bfae99] transition-colors cursor-pointer"
                        title={`Call ${user.phone}`}
                      >
                        <FaPhone className="w-2.5 h-2.5 text-[#5a4b3f]" />
                        <span>{user.phone}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-[#8a7966] italic">
                        {language === "bn" ? "ফোন নম্বর নেই" : "No phone"}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto">
                      {!isVerified && (
                        <button
                          type="button"
                          onClick={() =>
                            handleInlineVerify(user.id, user.full_name)
                          }
                          disabled={working}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#f6ecdd] bg-[#2d5a3c] hover:bg-[#22442d] rounded-lg transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          <FaCheck className="w-2.5 h-2.5" />
                          <span>
                            {working
                              ? language === "bn"
                                ? "যাচাই হচ্ছে..."
                                : "Verifying..."
                              : language === "bn"
                                ? "ভেরিফাই"
                                : "Verify"}
                          </span>
                        </button>
                      )}

                      <Link
                        href={`/dashboard/users/${user.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#f0e4d2] hover:bg-[#e4d6c1] text-[#3f3328] border border-[#c4b39b] transition-colors"
                      >
                        <span>
                          {language === "bn" ? "প্রোফাইল" : "Profile"}
                        </span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-b-xl">
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
                  {progressView === "overall"
                    ? language === "bn"
                      ? "সার্বিক অগ্রগতি"
                      : "Overall Progress"
                    : progressView === "syllabus"
                      ? language === "bn"
                        ? "সিলেবাস"
                        : "Syllabus"
                      : (categories.find((c) => c.id === progressView)?.name ??
                        t.users.table.progress)}
                </th>
                <th className="px-4 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5c4f42]">
                  {t.users.table.overdue}
                </th>
                <th className="px-4 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5c4f42]">
                  {t.users.table.joined}
                </th>
                <th className="px-4 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5c4f42] text-right">
                  {t.users.table.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const stats = getProgressStats(user, progressView);
                const completed = stats.completed;
                const total = stats.total;
                const pct =
                  total > 0 ? Math.round((completed / total) * 100) : 0;
                const isVerified = isUserVerified(user);
                const working = verifyingId === user.id && isPending;

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
                            <VerificationBadge verified={isVerified} />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/users/${user.id}`}
                            className="font-bold text-[#2b2119] truncate leading-tight hover:underline hover:text-[#5a4b3f] transition-colors block"
                          >
                            {user.full_name}
                          </Link>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#7a6a5a]">
                              @{user.username}
                            </span>
                            {user.phone && (
                              <a
                                href={`tel:${user.phone}`}
                                className="text-[10px] text-[#6a5a4c] hover:underline flex items-center gap-0.5"
                                title={`Call ${user.phone}`}
                              >
                                <FaPhone className="w-2 h-2" />
                                <span>{user.phone}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <div className="space-y-1">
                        <RankBadge name={user.rank?.name} />
                        {user.thana && (
                          <p className="text-[10px] text-[#6a5a4c]">
                            {user.thana.name}
                          </p>
                        )}
                      </div>
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
                      {new Date(user.created_at).toLocaleDateString(
                        language === "bn" ? "bn-BD" : "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isVerified && (
                          <button
                            type="button"
                            onClick={() =>
                              handleInlineVerify(user.id, user.full_name)
                            }
                            disabled={working}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#f6ecdd] bg-[#2d5a3c] hover:bg-[#22442d] rounded-sm transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            <FaCheck className="w-2.5 h-2.5" />
                            <span>
                              {working
                                ? "..."
                                : language === "bn"
                                  ? "ভেরিফাই"
                                  : "Verify"}
                            </span>
                          </button>
                        )}
                        <Link
                          href={`/dashboard/users/${user.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-sm bg-[#f0e4d2] hover:bg-[#e4d6c1] text-[#3f3328] border border-[#c4b39b] transition-colors"
                        >
                          <span>
                            {language === "bn" ? "প্রোফাইল" : "Profile"}
                          </span>
                          <span>→</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="hidden md:block text-center py-12 text-[#6a5a4c] ink-text">
            <p>{t.users.empty}</p>
          </div>
        )}
        {filteredUsers.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-[#d2bfa5] text-xs text-[#6a5a4c] ink-text">
            {t.common.pagination.showing} {filteredUsers.length}{" "}
            {t.common.pagination.of} {baseUsers.length}{" "}
            {tab === "all" ? t.users.tabs.all : t.users.tabs[tab]}
          </div>
        )}
      </section>
    </div>
  );
}
