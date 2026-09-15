import HistoryClient from "@/app/dashboard/history/HistoryClient";
import Avatar from "@/components/Avatar";
import { RankBadge } from "@/components/ui/rank-badge";
import { getTranslation } from "@/lib/i18n/server";
import { getUserChecklistProgress } from "@/server/checklists";
import { getProfileByUsername } from "@/server/geo";
import { getPdfSubmissions, getUserStats, getUserTransactions } from "@/server/library";
import { getClaims, getCurrentProfile } from "@/server/user";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaFileAlt,
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

import { Suspense } from "react";

export default async function DashboardUserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-4 sm:p-8 flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <DashboardUserProfileContent params={params} />
    </Suspense>
  );
}

async function DashboardUserProfileContent({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const { t, language } = await getTranslation();

  const claims = await getClaims();
  if (!claims) redirect("/login");

  const [profile, currentUserProfile] = await Promise.all([
    getProfileByUsername(username),
    getCurrentProfile(),
  ]);

  if (!profile) notFound();

  const isAdminOrMod =
    currentUserProfile?.role === "admin" || currentUserProfile?.role === "moderator";

  const [stats, transactions, pdfSubmissions, checklistProgress] = await Promise.all([
    getUserStats(profile.id),
    isAdminOrMod ? getUserTransactions(profile.id) : [],
    isAdminOrMod ? getPdfSubmissions({ userId: profile.id }) : [],
    getUserChecklistProgress(profile.id),
  ]);

  const roleLabels: Record<string, string> = {
    admin: t.profile.roles.admin,
    moderator: t.profile.roles.moderator,
    member: t.profile.roles.member,
  };

  const roleColors: Record<string, string> = {
    admin: "bg-amber-100 text-amber-800 border-amber-400",
    moderator: "bg-teal-100 text-teal-800 border-teal-400",
    member: "bg-stone-100 text-stone-700 border-stone-400",
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
    <div className="p-2 sm:p-0 space-y-5">
      {/* Back */}
      <Link
        href="/dashboard/profile"
        className="inline-flex items-center gap-2 text-sm text-[#5a4b3f] hover:text-[#221910] transition-colors ink-text"
      >
        <FaArrowLeft className="w-3.5 h-3.5" />
        {t.profile.publicProfile.back}
      </Link>

      {/* Hero */}
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <Avatar
            src={profile.avatar_url}
            alt={profile.full_name}
            initials={getInitials(profile.full_name)}
            size="lg"
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
                {roleLabels[profile.role]}
              </span>
              <RankBadge name={profile.rank?.name} />
              {profile.is_verified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-semibold border bg-[#eef5e9] text-[#3d5c2e] border-[#a3b994] ink-text">
                  <FaCheckCircle className="w-3 h-3" /> {t.profile.publicProfile.verified}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-semibold border bg-[#fdf5e4] text-[#7a5e2a] border-[#c9b48a] ink-text">
                  <FaClock className="w-3 h-3" /> {t.profile.publicProfile.unverified}
                </span>
              )}
            </div>

            <p className="text-xs text-[#7a6a5c] ink-text mt-3">
              {t.profile.header.joinedOn}: <b>{joinedDate}</b>
            </p>

            <div className="mt-4">
              <Link
                href={`/dashboard/report?user=${profile.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-stone-800 text-stone-100 border border-stone-600 rounded-sm hover:bg-stone-700 transition-colors text-sm font-semibold ink-text shrink-0"
              >
                <FaFileAlt className="w-3.5 h-3.5 text-stone-300" />
                {t.profile.header.report || "View Report"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Reading progress */}
      {stats && (
        <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
          <h2 className="text-base font-bold text-[#221910] ink-title mb-4 border-b border-[#c9b89a] pb-2">
            {t.profile.publicProfile.readingProgress}
          </h2>
          <div className="space-y-6">
            {stats.categoryProgress.map((cp) => {
              const percent =
                cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
              return (
                <div key={cp.categoryId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm ink-text text-[#4a3e33]">
                    <span className="font-medium">
                      {cp.categoryName}: {cp.completed} / {cp.total}
                    </span>
                    <span className="font-bold text-[#221910]">{percent}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#e4d4bf] border border-[#ccb79b] overflow-hidden">
                    <div
                      className="h-full bg-[#5a4d40] transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="pt-2 flex gap-4 text-xs ink-text text-[#5a4b3f] border-t border-[#dcd0bc]">
              <span>
                {t.profile.stats.activeBorrows}:{" "}
                <span className="font-semibold text-[#221910]">
                  {stats.activeBorrows}
                </span>
              </span>
              <span>
                {t.profile.stats.pendingRequests}:{" "}
                <span className="font-semibold text-[#221910]">
                  {stats.pendingRequests}
                </span>
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Checklist progress */}
      {checklistProgress.length > 0 && (
        <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
          <h2 className="text-base font-bold text-[#221910] ink-title mb-4 border-b border-[#c9b89a] pb-2">
            {t.profile.sections.checklistProgress}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checklistProgress.map((cp) => {
              const percent =
                cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
              return (
                <div key={cp.checklistId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm ink-text text-[#4a3e33]">
                    <span className="font-medium">
                      {cp.checklistName}: {cp.completed} / {cp.total}
                    </span>
                    <span className="font-bold text-[#221910]">{percent}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#e4d4bf] border border-[#ccb79b] overflow-hidden">
                    <div
                      className="h-full bg-[#4a7c59] transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Contact & Location */}
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <h2 className="text-base font-bold text-[#221910] ink-title mb-4 border-b border-[#c9b89a] pb-2">
          {t.profile.publicProfile.contactLocation}
        </h2>
        {profile.hide_sensitive_info ? (
          <p className="text-sm text-[#7a6a5c] ink-text italic">
            {t.profile.publicProfile.privateInfo}
          </p>
        ) : (
          <dl className="space-y-3 ink-text">
            <div className="flex items-start gap-3">
              <FaEnvelope className="w-4 h-4 text-[#7a6a5c] mt-0.5 shrink-0" />
              <div>
                <dt className="text-xs text-[#7a6a5c] uppercase tracking-wider mb-0.5">
                  {t.profile.info.email}
                </dt>
                <dd className="text-[#2b2119]">{profile.email}</dd>
              </div>
            </div>
            {profile.phone && (
              <div className="flex items-start gap-3">
                <FaPhone className="w-4 h-4 text-[#7a6a5c] mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-[#7a6a5c] uppercase tracking-wider mb-0.5">
                    {t.profile.info.phone}
                  </dt>
                  <dd className="text-[#2b2119]">{profile.phone}</dd>
                </div>
              </div>
            )}
            {locationParts.length > 0 && (
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="w-4 h-4 text-[#7a6a5c] mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-[#7a6a5c] uppercase tracking-wider mb-0.5">
                    {t.profile.editForm.thana}
                  </dt>
                  <dd className="text-[#2b2119]">{locationParts.join(", ")}</dd>
                </div>
              </div>
            )}
          </dl>
        )}
      </section>

      {/* Transaction History (Admins & Mods only) */}
      {isAdminOrMod && (
        <section className="space-y-4">
          <h2 className="text-base font-bold text-[#221910] ink-title">
            Transaction History
          </h2>
          <HistoryClient
            transactions={transactions}
            pdfSubmissions={pdfSubmissions}
            initialFilter="all"
          />
        </section>
      )}
    </div>
  );
}
