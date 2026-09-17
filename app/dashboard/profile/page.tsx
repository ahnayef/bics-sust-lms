import Avatar from "@/components/Avatar";
import PageTransition from "@/components/PageTransition";
import { RankBadge } from "@/components/ui/rank-badge";
import { getTranslation } from "@/lib/i18n/server";
import { getUserChecklistProgress } from "@/server/checklists";
import { getProfile } from "@/server/geo";
import {
  getPdfSubmissions,
  getUserStats,
  getUserTransactions,
} from "@/server/library";
import { getClaims } from "@/server/user";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FaCheckCircle,
  FaEdit,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
  FaShieldAlt,
} from "react-icons/fa";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (
    (parts[0][0]?.toUpperCase() ?? "") +
    (parts[parts.length - 1][0]?.toUpperCase() ?? "")
  );
}

export default async function DashboardProfilePage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");
  const { t, language } = await getTranslation();
  const [profile, stats, checklistProgress, transactions, pdfSubmissions] =
    await Promise.all([
      getProfile(claims.sub),
      getUserStats(claims.sub),
      getUserChecklistProgress(claims.sub),
      getUserTransactions(claims.sub),
      getPdfSubmissions({ userId: claims.sub }),
    ]);
  if (!profile) redirect("/login");

  const roleColors: Record<string, string> = {
    admin: "bg-amber-100 text-amber-800 border-amber-400",
    moderator: "bg-teal-100 text-teal-800 border-teal-400",
    member: "bg-stone-100 text-stone-800 border-stone-400",
  };

  const joinedDate = new Date(profile.created_at).toLocaleDateString(
    language === "bn" ? "bn-BD" : "en-GB",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
  const locationParts = [profile.thana?.name].filter(Boolean);
  return (
    <PageTransition className="p-2 sm:p-0 space-y-5">
      {/* ── Hero card ── */}
      <section className="dashboard-surface tron-border rounded-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <Avatar
            src={profile.avatar_url}
            alt={profile.full_name}
            initials={getInitials(profile.full_name)}
            size="xl"
            className="border-2"
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
                {profile.full_name}
              </h1>
              {profile.is_verified && (
                <FaCheckCircle
                  className="w-5 h-5 text-teal-600"
                  title={t.profile.header.verified}
                />
              )}
            </div>
            <p className="text-[#6a5a4c] ink-text mb-3">@{profile.username}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold border ink-text ${roleColors[profile.role]}`}
              >
                <FaShieldAlt className="w-3 h-3" />
                {t.profile.roles[profile.role as keyof typeof t.profile.roles]}
              </span>
              <RankBadge name={profile.rank?.name} />
            </div>
            <p className="text-xs text-[#7a6a5c] ink-text mt-3">
              {t.profile.header.joinedOn}: <b>{joinedDate}</b>
            </p>
            <div className="mt-4 flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-6 text-sm text-[#4f4134]">
              <div
                className="flex items-center gap-1.5"
                title={t.profile.info.email}
              >
                <FaEnvelope className="w-3.5 h-3.5 text-[#8a7966]" />
                <span className="break-all">{profile.email}</span>
              </div>
              <div
                className="flex items-center gap-1.5"
                title={t.profile.info.phone}
              >
                <FaPhone className="w-3.5 h-3.5 text-[#8a7966]" />
                <span>{profile.phone || t.profile.info.noPhone}</span>
              </div>
              <div
                className="flex items-center gap-1.5"
                title={t.profile.info.location}
              >
                <FaMapMarkerAlt className="w-3.5 h-3.5 text-[#8a7966]" />
                <span className="truncate max-w-[200px]">
                  {locationParts.length > 0
                    ? locationParts.join(", ")
                    : t.profile.info.noLocation}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {/* commented for now */}
            {/* <Link
              href={`/dashboard/report?user=${profile.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-stone-100 border border-stone-600 rounded-sm hover:bg-stone-700 transition-colors text-sm font-semibold ink-text shrink-0"
            >
              <FaFileAlt className="w-3.5 h-3.5 text-stone-300" />
              {t.profile.header.report || "View Report"}
            </Link> */}
            <Link
              href="/dashboard/profile/edit"
              className="flex items-center gap-2 px-4 py-2 bg-[#eadcc8] text-[#4e4033] border border-[#b5a490] rounded-sm hover:bg-[#e1d0ba] transition-colors text-sm font-semibold ink-text shrink-0"
            >
              <FaEdit className="w-3.5 h-3.5" />
              {t.profile.header.editProfile}
            </Link>
          </div>
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-5 items-stretch">
        {/* ── Reading Progress ── */}
        <section className="dashboard-surface tron-border rounded-sm p-6 flex-1 flex flex-col">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#6a5a4c] ink-text mb-4 border-b border-[#c9b89a] pb-2">
            {t.profile.sections.readingProgress}
          </h2>
          <div className="space-y-6">
            {stats.categoryProgress.map((cp) => {
              const percent =
                cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
              return (
                <div key={cp.categoryId}>
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-sm font-bold text-[#221910] ink-title">
                      {cp.categoryName}
                    </p>
                    <p className="text-sm font-bold text-[#221910] ink-title">
                      {percent}%
                    </p>
                  </div>
                  <div className="w-full h-3 bg-[#d9cbb7] rounded-full overflow-hidden border border-[#8a7966] shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                    <div
                      className="h-full bg-teal-700 transition-all duration-500 shadow-[0_0_10px_rgba(13,148,136,0.3)]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#6a5a4c] mt-2 ink-text text-right">
                    {cp.completed} / {cp.total} {t.profile.stats.booksRead}
                  </p>
                </div>
              );
            })}

            <div className="pt-2 border-t border-[#d9cbb7]/50">
              <div className="flex justify-between items-center py-2 border-b border-[#d9cbb7]/50">
                <span className="text-xs text-[#6a5a4c] font-medium uppercase tracking-tight">
                  {t.profile.stats.activeBorrows}
                </span>
                <span className="text-sm font-bold text-[#221910]">
                  {stats.activeBorrows}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#d9cbb7]/50">
                <span className="text-xs text-[#6a5a4c] font-medium uppercase tracking-tight">
                  {t.profile.stats.overdueItems}
                </span>
                <span
                  className={`text-sm font-bold ${stats.overdueBorrows > 0 ? "text-red-700" : "text-[#221910]"}`}
                >
                  {stats.overdueBorrows}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-[#6a5a4c] font-medium uppercase tracking-tight">
                  {t.profile.stats.pendingRequests}
                </span>
                <span className="text-sm font-bold text-[#221910]">
                  {stats.pendingRequests}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Checklist Progress ── */}
        {checklistProgress.length > 0 && (
          <section className="dashboard-surface tron-border rounded-sm p-6 flex-1 flex flex-col">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#6a5a4c] ink-text mb-4 border-b border-[#c9b89a] pb-2">
              {t.profile.sections.checklistProgress}
            </h2>
            <div className="space-y-6 flex-1">
              {checklistProgress.map((cp) => {
                const percent =
                  cp.total > 0
                    ? Math.round((cp.completed / cp.total) * 100)
                    : 0;
                return (
                  <div key={cp.checklistId}>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-sm font-bold text-[#221910] ink-title">
                        {cp.checklistName}
                      </p>
                      <p className="text-sm font-bold text-[#221910] ink-title">
                        {percent}%
                      </p>
                    </div>
                    <div className="w-full h-3 bg-[#d9cbb7] rounded-full overflow-hidden border border-[#8a7966] shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                      <div
                        className="h-full bg-[#4a7c59] transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#6a5a4c] mt-2 ink-text text-right">
                      {cp.completed} / {cp.total}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </PageTransition>
  );
}
