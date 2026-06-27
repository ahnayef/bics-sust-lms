import HistoryClient from "@/app/dashboard/history/HistoryClient";
import { RankBadge } from "@/components/ui/rank-badge";
import Avatar from "@/components/Avatar";
import { getTranslation } from "@/lib/i18n/server";
import { getChecklists, getUserChecklistCompletions, getUserChecklistProgress } from "@/server/checklists";
import { getProfile, getRanks } from "@/server/geo";
import { getPdfSubmissions, getUserStats, getUserTransactions } from "@/server/library";

import { moderatorPermissions } from "@/server/profiles";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaCheckSquare,
  FaClock,
  FaExclamationTriangle,
  FaFileAlt,
  FaSquare
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

  const [profile, stats, perms, ranksResponse, transactions, pdfSubmissions, checklistProgress, checklists, completedItemIds] = await Promise.all([
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

  const joinedDate = new Date(profile.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/users"
          className="inline-flex items-center gap-2 text-sm text-[#5a4b3f] hover:text-[#221910] transition-colors ink-text"
        >
          <FaArrowLeft className="w-3.5 h-3.5" />
          {t.users.details.backToUsers}
        </Link>
        <Link
          href={`/dashboard/profile/${profile.username}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#8a7966] text-[#4e4033] bg-[#eadcca] hover:bg-[#d6c4b0] transition-colors text-xs font-semibold rounded-sm ink-text"
        >
          {t.users.details.viewPublicProfile} <FaArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Header card — avatar + name + badges */}
      <div className="dashboard-surface tron-border rounded-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={profile.avatar_url}
              alt={profile.full_name}
              initials={getInitials(profile.full_name)}
              size="md"
              className="border-2 select-none"
            />

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
                {profile.full_name}
              </h1>
              <p className="text-[#5a4b3f] ink-text mt-0.5">
                @{profile.username}
              </p>
              <div className="mt-4">
                <Link
                  href={`/dashboard/report?user=${profile.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-stone-100 border border-stone-600 rounded-sm hover:bg-stone-700 transition-colors text-sm font-semibold ink-text shrink-0 w-fit"
                >
                  <FaFileAlt className="w-3.5 h-3.5 text-stone-300" />
                  {t.profile.header.report || "View Report"}
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {profile.is_verified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm border border-[#a3b994] bg-[#eef5e9] text-[#3d5c2e] ink-text">
                <FaCheckCircle className="w-3.5 h-3.5" />
                {t.users.badges.verified}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm border border-[#c9b48a] bg-[#fdf5e4] text-[#7a5e2a] ink-text">
                <FaClock className="w-3.5 h-3.5" />
                {t.users.badges.unverified}
              </span>
            )}

            <span className="inline-block px-3 py-1.5 text-xs font-semibold rounded-sm border border-[#b9a58b] bg-[#f6ecdd] text-[#4f4134] ink-text capitalize">
              {t.profile.roles[profile.role as keyof typeof t.profile.roles] || profile.role}
            </span>
          </div>
        </div>
      </div>

      {/* Reading progress + borrow stats */}
      <div className="dashboard-surface tron-border rounded-sm p-6">
        <h2 className="text-base font-semibold text-[#3b3026] ink-title mb-4 uppercase tracking-[0.06em]">
          {t.users.details.libraryActivity}
        </h2>

        <div className="space-y-6">
          {/* Category progress bars */}
          {stats.categoryProgress.map((cp) => {
            const percent = cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
            return (
              <div key={cp.categoryId} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm text-[#5a4b3f] ink-text">
                  <span className="font-medium">
                    {cp.categoryName}: {cp.completed} / {cp.total}
                  </span>
                  <span className="font-bold text-[#2b2119]">{percent}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-[#e4d4bf] border border-[#ccb79b] overflow-hidden">
                  <div
                    className="h-full bg-[#5a4d40] transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Quick borrow counts */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] mb-1 ink-text">
                {t.users.details.activeBorrows}
              </p>
              <p className="text-2xl font-bold text-[#221910] ink-title leading-none">
                {stats.activeBorrows}
              </p>
            </div>
            {stats.overdueBorrows > 0 ? (
              <div className="border border-[#c4614a] bg-[#fdf0ec] rounded-sm p-3">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#8b2c1a] mb-1 ink-text">
                  {t.users.details.overdue}
                </p>
                <p className="text-2xl font-bold text-[#9b3a25] ink-title leading-none">
                  {stats.overdueBorrows}
                </p>
              </div>
            ) : (
              <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] mb-1 ink-text">
                  {t.users.details.overdue}
                </p>
                <p className="text-2xl font-bold text-[#221910] ink-title leading-none">
                  0
                </p>
              </div>
            )}
            <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] mb-1 ink-text">
                {t.users.details.pendingRequests}
              </p>
              <p className="text-2xl font-bold text-[#221910] ink-title leading-none">
                {stats.pendingRequests}
              </p>
            </div>
          </div>

          {/* Current borrows list */}
          {stats.currentBorrows.length > 0 && (
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-[#3b3026] ink-title mb-2 uppercase tracking-[0.06em]">
                {t.users.details.currentlyBorrowed}
              </h3>
              <div className="space-y-2">
                {stats.currentBorrows.map((tx) => {
                  const isOverdue = tx.status === "overdue" || (tx.due_date && new Date(tx.due_date) < new Date());
                  const daysOver = tx.due_date
                    ? Math.max(0, Math.floor((Date.now() - new Date(tx.due_date).getTime()) / 86_400_000))
                    : 0;
                  return (
                    <div
                      key={tx.id}
                      className={`flex items-center justify-between p-3 border rounded-sm text-sm ${isOverdue
                        ? "border-[#c4614a] bg-[#fdf0ec]"
                        : "border-[#b9a58b] bg-[#f6ecdd]"
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isOverdue && (
                          <FaExclamationTriangle className="w-3.5 h-3.5 text-[#c4614a] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-[#2b2119] truncate ink-text">
                            {tx.book?.title ?? t.dashboard.recentBorrows.unknownBook}
                          </p>
                          <p className="text-xs text-[#5a4b3f] ink-text">
                            {t.bookList.table.copyNum.replace("#", "")} #{tx.copy?.copy_number ?? "?"}
                            {tx.due_date && (
                              <> &middot; {t.users.details.dueOn.replace("{date}", new Date(tx.due_date).toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric" }))}</>
                            )}
                          </p>
                        </div>
                      </div>
                      {isOverdue && daysOver > 0 && (
                        <span className="text-xs font-bold text-[#9b3a25] shrink-0 ml-2">
                          {t.users.details.overdueBy.replace("{days}", daysOver.toString())}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checklist progress and details */}
      {checklistProgress.length > 0 && (
        <div className="dashboard-surface tron-border rounded-sm p-6">
          <h2 className="text-base font-semibold text-[#3b3026] ink-title mb-4 uppercase tracking-[0.06em]">
            {t.profile.sections.checklistProgress}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {checklists.map((checklist) => {
              const progress = checklistProgress.find(p => p.checklistId === checklist.id);
              if (!progress) return null;
              const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

              return (
                <div key={checklist.id} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm text-[#5a4b3f] ink-text">
                      <span className="font-bold text-[#221910]">
                        {checklist.name}
                      </span>
                      <span className="font-bold text-[#2b2119]">{percent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#e4d4bf] border border-[#ccb79b] overflow-hidden">
                      <div
                        className="h-full bg-[#4a7c59] transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 pl-1">
                    {checklist.items.map((item) => {
                      const isCompleted = completedItemIds.has(item.id);
                      return (
                        <div key={item.id} className="flex items-center gap-2 text-xs">
                          {isCompleted ? (
                            <FaCheckSquare className="w-3.5 h-3.5 text-[#4a7c59] shrink-0" />
                          ) : (
                            <FaSquare className="w-3.5 h-3.5 text-[#ccb79b] shrink-0" />
                          )}
                          <span className={`${isCompleted ? "text-[#2b2119] font-medium" : "text-[#8a7966]"}`}>
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

      {/* Transaction History */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-[#3b3026] ink-title uppercase tracking-[0.06em]">
          Transaction History
        </h2>
        <HistoryClient
          transactions={transactions}
          pdfSubmissions={pdfSubmissions}
          initialFilter="all"
        />
      </div>

      {/* Details grid */}
      <div className="dashboard-surface tron-border rounded-sm p-6">
        <h2 className="text-base font-semibold text-[#3b3026] ink-title mb-4 uppercase tracking-[0.06em]">
          {t.users.details.profileDetails}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ink-text">
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] mb-1">
              {t.profile.info.email}
            </p>
            <p className="text-sm font-medium text-[#221910] break-all">
              {profile.email}
            </p>
          </div>

          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] mb-1">
              {t.profile.info.phone}
            </p>
            <p className="text-sm font-medium text-[#221910]">
              {profile.phone ?? (
                <span className="text-[#8a7966] italic">{t.users.details.notProvided}</span>
              )}
            </p>
          </div>

          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] mb-1">
              {t.profile.editForm.rank}
            </p>
            <RankBadge name={profile.rank?.name} />
          </div>

          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] mb-1">
              {t.profile.info.location}
            </p>
            <p className="text-sm font-medium text-[#221910]">
              {profile.thana?.name ? (
                profile.thana.name
              ) : (
                <span className="text-[#8a7966] italic">{t.users.details.notAssigned}</span>
              )}
            </p>
          </div>

          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] mb-1">
              {t.profile.header.joinedOn}
            </p>
            <p className="text-sm font-medium text-[#221910]">{joinedDate}</p>
          </div>

          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] mb-1">
              {t.users.details.verificationStatus}
            </p>
            <p className="text-sm font-medium text-[#221910]">
              {profile.is_verified ? "Verified" : "Not yet verified"}
            </p>
          </div>
        </div>
      </div>

      {/* Admin actions — verify + unverify */}
      <div className="dashboard-surface tron-border rounded-sm p-6">
        <h2 className="text-base font-semibold text-[#3b3026] ink-title mb-2 uppercase tracking-[0.06em]">
          Admin Actions
        </h2>
        <p className="text-sm text-[#5a4b3f] ink-text mb-4">
          Verifying a user confirms their membership and grants full library
          access. Unverifying suspends that access.
        </p>

        <UserActions
          userId={id}
          isVerified={profile.is_verified}
          userName={profile.full_name}
          userRole={profile.role}
          isAdmin={perms.role === "admin"}
          currentRankId={profile.rank_id}
          availableRanks={ranksResponse.data}
        />
      </div>
    </div>
  );
}
