import HistoryClient from "@/app/dashboard/history/HistoryClient";
import Avatar from "@/components/Avatar";
import { RankBadge } from "@/components/ui/rank-badge";
import { getTranslation } from "@/lib/i18n/server";
import {
  getChecklists,
  getUserChecklistCompletions,
  getUserChecklistProgress,
} from "@/server/checklists";
import { getProfile, getRanks } from "@/server/geo";
import {
  getPdfSubmissions,
  getUserStats,
  getUserTransactions,
} from "@/server/library";
import { moderatorPermissions } from "@/server/profiles";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FaArrowLeft,
  FaBookOpen,
  FaCalendarAlt,
  FaCheckCircle,
  FaCheckSquare,
  FaClock,
  FaEnvelope,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaFileAlt,
  FaMapMarkerAlt,
  FaPhone,
  FaShieldAlt,
  FaSquare,
  FaTasks,
  FaUserTag,
} from "react-icons/fa";
import UserActions from "./UserActions";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (
    (parts[0][0]?.toUpperCase() ?? "") +
    (parts[parts.length - 1][0]?.toUpperCase() ?? "")
  );
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { t, language } = await getTranslation();

  const [
    profile,
    stats,
    perms,
    ranksResponse,
    transactions,
    pdfSubmissions,
    checklistProgress,
    checklists,
    completedItemIds,
  ] = await Promise.all([
    getProfile(id),
    getUserStats(id),
    moderatorPermissions(),
    getRanks(),
    getUserTransactions(id),
    getPdfSubmissions({ userId: id }),
    getUserChecklistProgress(id),
    getChecklists(true),
    getUserChecklistCompletions(id),
  ]);

  if (!profile) {
    notFound();
  }

  const joinedDate = new Date(profile.created_at).toLocaleDateString(
    language === "bn" ? "bn-BD" : "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  const roleColors: Record<string, string> = {
    admin: "bg-amber-100 text-amber-900 border-amber-300",
    moderator: "bg-teal-100 text-teal-900 border-teal-300",
    member: "bg-[#f1e7d8] text-[#4a3b2c] border-[#bda68c]",
  };

  const hasChecklists = checklistProgress.length > 0;

  return (
    <div className="space-y-6">
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/dashboard/users"
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-[#8a7966] text-[#3b2e23] bg-[#f6ecdd] hover:bg-[#eadcc8] transition-colors text-sm font-semibold rounded-sm ink-text shadow-xs w-fit"
        >
          <FaArrowLeft className="w-3.5 h-3.5" />
          {t.users.details.backToUsers}
        </Link>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href={`/dashboard/report?user=${profile.id}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-[#8a7966] text-[#3b2e23] bg-[#f6ecdd] hover:bg-[#eadcc8] transition-colors text-sm font-semibold rounded-sm ink-text shadow-xs"
          >
            <FaFileAlt className="w-3.5 h-3.5 text-[#6e5d4a]" />
            {t.profile.header.report || "View Report"}
          </Link>
          <Link
            href={`/dashboard/profile/${profile.username}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-[#4e4033] text-[#f4e8d4] bg-[#3f3328] hover:bg-[#4a3d31] transition-colors text-sm font-semibold rounded-sm ink-text shadow-xs"
          >
            {t.users.details.viewPublicProfile}{" "}
            <FaExternalLinkAlt className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── Unified Top Name Card (Profile Details + Admin Actions) ──────── */}
      <div className="dashboard-surface tron-border rounded-sm p-6 sm:p-7 shadow-xs space-y-6">
        {/* User Identity Banner */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar
            src={profile.avatar_url}
            alt={profile.full_name}
            initials={getInitials(profile.full_name)}
            size="lg"
            className="border-2 border-[#8a7966] shadow-sm select-none shrink-0"
          />

          <div className="flex-1 text-center sm:text-left min-w-0 space-y-2.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#221910] ink-title tracking-tight break-words">
                {profile.full_name}
              </h1>
              {profile.is_verified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-sm border border-[#82a76f] bg-[#eef5e9] text-[#2d521f] ink-text shadow-2xs">
                  <FaCheckCircle className="w-3.5 h-3.5 text-[#2d521f]" />
                  {t.users.badges.verified}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-sm border border-[#c9b48a] bg-[#fdf5e4] text-[#7a5e2a] ink-text shadow-2xs">
                  <FaClock className="w-3.5 h-3.5 text-[#7a5e2a]" />
                  {t.users.badges.unverified}
                </span>
              )}
            </div>

            <p className="text-base font-mono text-[#5a4b3f]">
              @{profile.username}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-bold border ink-text uppercase tracking-wider ${
                  roleColors[profile.role] || roleColors.member
                }`}
              >
                <FaShieldAlt className="w-3 h-3" />
                {t.profile.roles[
                  profile.role as keyof typeof t.profile.roles
                ] || profile.role}
              </span>

              <RankBadge name={profile.rank?.name} />

              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5c4a3b] ink-text px-2 py-1">
                <FaCalendarAlt className="w-3.5 h-3.5 text-[#7b6957]" />
                {t.profile.header.joinedOn}:{" "}
                <span className="text-[#221910] font-bold">{joinedDate}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="border-t border-[#c9b89a] pt-5 space-y-3.5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#5c4a3b] ink-title flex items-center gap-2">
            <FaUserTag className="w-4 h-4 text-[#7b6957]" />
            {t.users.details.profileDetails}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Email */}
            <div className="flex items-start gap-3 p-3.5 bg-[#f6ecdd] border border-[#b9a58b] rounded-sm">
              <FaEnvelope className="w-4 h-4 text-[#7a6755] mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#635243] mb-0.5">
                  {t.profile.info.email}
                </p>
                <a
                  href={`mailto:${profile.email}`}
                  className="text-sm sm:text-base font-semibold text-[#221910] hover:text-[#5a4331] underline decoration-dotted break-all ink-text"
                >
                  {profile.email}
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3 p-3.5 bg-[#f6ecdd] border border-[#b9a58b] rounded-sm">
              <FaPhone className="w-4 h-4 text-[#7a6755] mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#635243] mb-0.5">
                  {t.profile.info.phone}
                </p>
                <p className="text-sm sm:text-base font-semibold text-[#221910] ink-text">
                  {profile.phone ? (
                    <a
                      href={`tel:${profile.phone}`}
                      className="hover:underline"
                    >
                      {profile.phone}
                    </a>
                  ) : (
                    <span className="text-[#8a7966] italic font-normal text-sm">
                      {t.users.details.notProvided}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Thana / Location */}
            <div className="flex items-start gap-3 p-3.5 bg-[#f6ecdd] border border-[#b9a58b] rounded-sm">
              <FaMapMarkerAlt className="w-4 h-4 text-[#7a6755] mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#635243] mb-0.5">
                  {t.profile.info.location}
                </p>
                <p className="text-sm sm:text-base font-semibold text-[#221910] ink-text">
                  {profile.thana?.name ? (
                    profile.thana.name
                  ) : (
                    <span className="text-[#8a7966] italic font-normal text-sm">
                      {t.users.details.notAssigned}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Rank */}
            <div className="flex items-start gap-3 p-3.5 bg-[#f6ecdd] border border-[#b9a58b] rounded-sm">
              <FaUserTag className="w-4 h-4 text-[#7a6755] mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#635243] mb-1">
                  {t.profile.editForm.rank}
                </p>
                <div>
                  <RankBadge name={profile.rank?.name} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions Bar */}
        <div className="border-t border-[#c9b89a] pt-5 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#5c4a3b] ink-title flex items-center gap-2">
              <FaShieldAlt className="w-4 h-4 text-[#7b6957]" />
              Admin Actions
            </h2>
            <p className="text-xs text-[#6e5d4a] ink-text">
              Manage verification, update member rank, or adjust administrative
              roles.
            </p>
          </div>

          <UserActions
            userId={id}
            isVerified={profile.is_verified}
            userName={profile.full_name}
            userRole={profile.role}
            isAdmin={perms.role === "admin"}
            canManageModerators={perms.canManageModerators}
            currentRankId={profile.rank_id}
            availableRanks={ranksResponse.data}
          />
        </div>
      </div>

      {/* ── Library Activity ────────────────────────────────────────────── */}
      <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6 shadow-xs space-y-6">
        <div className="border-b border-[#c9b89a] pb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#221910] ink-title uppercase tracking-[0.05em] flex items-center gap-2">
            <FaBookOpen className="w-4 h-4 text-[#6e5d4a]" />
            {t.users.details.libraryActivity}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Quick Counts + Currently Borrowed (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Quick borrow counts */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3.5 text-center transition-all hover:bg-[#efe3d1]">
                <p className="text-xs uppercase tracking-wider font-bold text-[#5c4f42] mb-1 ink-text truncate">
                  {t.users.details.activeBorrows}
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#221910] ink-title leading-none">
                  {stats.activeBorrows}
                </p>
              </div>

              {stats.overdueBorrows > 0 ? (
                <div className="border border-[#c4614a] bg-[#fdf0ec] rounded-sm p-3.5 text-center transition-all">
                  <p className="text-xs uppercase tracking-wider font-bold text-[#8b2c1a] mb-1 ink-text truncate flex items-center justify-center gap-1">
                    <FaExclamationTriangle className="w-3 h-3 shrink-0" />
                    {t.users.details.overdue}
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#9b3a25] ink-title leading-none">
                    {stats.overdueBorrows}
                  </p>
                </div>
              ) : (
                <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3.5 text-center transition-all hover:bg-[#efe3d1]">
                  <p className="text-xs uppercase tracking-wider font-bold text-[#5c4f42] mb-1 ink-text truncate">
                    {t.users.details.overdue}
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#221910] ink-title leading-none">
                    0
                  </p>
                </div>
              )}

              <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3.5 text-center transition-all hover:bg-[#efe3d1]">
                <p className="text-xs uppercase tracking-wider font-bold text-[#5c4f42] mb-1 ink-text truncate">
                  {t.users.details.pendingRequests}
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#221910] ink-title leading-none">
                  {stats.pendingRequests}
                </p>
              </div>
            </div>

            {/* Currently Borrowed Books */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#3b3026] ink-title uppercase tracking-wider flex items-center justify-between">
                <span>{t.users.details.currentlyBorrowed}</span>
                <span className="text-xs font-mono font-normal text-[#6f5e4e]">
                  ({stats.currentBorrows.length})
                </span>
              </h3>

              {stats.currentBorrows.length === 0 ? (
                <div className="p-4 border border-dashed border-[#ccb79b] rounded-sm text-center text-sm text-[#7a6a5c] ink-text bg-[#fbf5eb]/60">
                  No books currently borrowed.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {stats.currentBorrows.map((tx) => {
                    const isOverdue =
                      tx.status === "overdue" ||
                      (tx.due_date && new Date(tx.due_date) < new Date());
                    const daysOver = tx.due_date
                      ? Math.max(
                          0,
                          Math.floor(
                            (Date.now() - new Date(tx.due_date).getTime()) /
                              86_400_000,
                          ),
                        )
                      : 0;

                    return (
                      <div
                        key={tx.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-sm gap-2 transition-colors ${
                          isOverdue
                            ? "border-[#c4614a] bg-[#fdf0ec]"
                            : "border-[#b9a58b] bg-[#f6ecdd] hover:bg-[#ede0cc]"
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                          {isOverdue ? (
                            <FaExclamationTriangle className="w-4 h-4 text-[#c4614a] shrink-0 mt-0.5 sm:mt-0" />
                          ) : (
                            <FaBookOpen className="w-4 h-4 text-[#6e5d4a] shrink-0 mt-0.5 sm:mt-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-[#2b2119] truncate ink-text">
                              {tx.book?.title ??
                                t.dashboard.recentBorrows.unknownBook}
                            </p>
                            <p className="text-xs text-[#5a4b3f] ink-text mt-0.5">
                              {t.bookList.table.copyNum.replace("#", "")} #
                              {tx.copy?.copy_number ?? "?"}
                              {tx.due_date && (
                                <>
                                  {" "}
                                  &middot;{" "}
                                  {t.users.details.dueOn.replace(
                                    "{date}",
                                    new Date(tx.due_date).toLocaleDateString(
                                      language === "bn" ? "bn-BD" : "en-GB",
                                      {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      },
                                    ),
                                  )}
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {isOverdue && daysOver > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-xs font-bold bg-[#f6d7d0] text-[#9b3a25] border border-[#e5a89b] shrink-0 self-start sm:self-auto">
                            {t.users.details.overdueBy.replace(
                              "{days}",
                              daysOver.toString(),
                            )}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Category / Syllabus Progress Bars (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-3.5">
            <h3 className="text-sm font-bold text-[#3b3026] ink-title uppercase tracking-wider">
              {t.profile.sections.readingProgress}
            </h3>

            {stats.categoryProgress.length === 0 ? (
              <div className="p-4 border border-dashed border-[#ccb79b] rounded-sm text-center text-sm text-[#7a6a5c] ink-text bg-[#fbf5eb]/60">
                No syllabus reading progress recorded.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.categoryProgress.map((cp) => {
                  const percent =
                    cp.total > 0
                      ? Math.round((cp.completed / cp.total) * 100)
                      : 0;
                  return (
                    <div
                      key={cp.categoryId}
                      className="space-y-1.5 p-3 rounded-sm bg-[#f6ecdd] border border-[#b9a58b]"
                    >
                      <div className="flex items-center justify-between text-sm text-[#4a3a2c] ink-text">
                        <span className="font-bold">{cp.categoryName}</span>
                        <span className="font-mono text-xs font-semibold">
                          {cp.completed} / {cp.total} books ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-[#e4d4bf] border border-[#ccb79b] overflow-hidden">
                        <div
                          className="h-full bg-[#5a4d40] transition-all rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Checklist Progress Section (2 to 3 Columns) ───────────────────── */}
      {hasChecklists && (
        <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-[#c9b89a] pb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#221910] ink-title uppercase tracking-[0.05em] flex items-center gap-2">
              <FaTasks className="w-4 h-4 text-[#6e5d4a]" />
              {t.profile.sections.checklistProgress}
            </h2>
            <span className="text-xs font-mono font-semibold text-[#6e5d4a]">
              {checklists.length} Checklists
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
            {checklists.map((checklist) => {
              const progress = checklistProgress.find(
                (p) => p.checklistId === checklist.id,
              );
              if (!progress) return null;
              const percent =
                progress.total > 0
                  ? Math.round((progress.completed / progress.total) * 100)
                  : 0;

              return (
                <div
                  key={checklist.id}
                  className="p-4 bg-[#f6ecdd] border border-[#b9a58b] rounded-sm space-y-3.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm text-[#4a3a2c] ink-text">
                      <span className="font-bold text-base text-[#221910] truncate">
                        {checklist.name}
                      </span>
                      <span className="font-bold text-sm text-[#2d521f] shrink-0 ml-2">
                        {percent}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#e4d4bf] border border-[#ccb79b] overflow-hidden">
                      <div
                        className="h-full bg-[#4a7c59] transition-all rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#e2d5c3] max-h-80 overflow-y-auto pr-1.5 print:max-h-none">
                    {checklist.items.map((item) => {
                      const isCompleted = completedItemIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className="flex items-start gap-2.5 text-xs sm:text-sm"
                        >
                          {isCompleted ? (
                            <FaCheckSquare className="w-4 h-4 text-[#4a7c59] shrink-0 mt-0.5" />
                          ) : (
                            <FaSquare className="w-4 h-4 text-[#ccb79b] shrink-0 mt-0.5" />
                          )}
                          <span
                            className={`ink-text ${
                              isCompleted
                                ? "text-[#2b2119] font-medium"
                                : "text-[#7a6a5c]"
                            }`}
                          >
                            {item.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Transaction & PDF Submission History (Full Width) ─────────────── */}
      <div className="pt-2">
        <HistoryClient
          transactions={transactions}
          pdfSubmissions={pdfSubmissions}
          initialFilter="all"
        />
      </div>
    </div>
  );
}
