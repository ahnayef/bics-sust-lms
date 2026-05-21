import { RankBadge } from "@/components/ui/rank-badge";
import { getProfile } from "@/server/geo";
import { getUserStats } from "@/server/library";
import { getClaims } from "@/server/user";
import Image from "next/image";
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
import { getTranslation } from "@/lib/i18n/server";

export default async function DashboardProfilePage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");
  const { t, language } = await getTranslation();
  const [profile, stats] = await Promise.all([
    getProfile(claims.sub),
    getUserStats(claims.sub),
  ]);
  if (!profile) redirect("/login");
  const syllabusPercent =
    stats.syllabusTotal > 0
      ? Math.round((stats.syllabusCompleted / stats.syllabusTotal) * 100)
      : 0;

  const roleColors: Record<string, string> = {
    admin: "bg-amber-100 text-amber-800 border-amber-400",
    moderator: "bg-teal-100 text-teal-800 border-teal-400",
    member: "bg-stone-100 text-stone-700 border-stone-400",
  };
  const joinedDate = new Date(profile.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const locationParts = [profile.thana?.name].filter(Boolean);
  return (
    <div className="p-2 sm:p-0">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* ── Hero card ── */}
        <section className="dashboard-surface tron-border rounded-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover border-2 border-[#8a7966] shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#d9cbb7] border-2 border-[#8a7966] flex items-center justify-center text-3xl font-bold text-[#4a3e33] shrink-0 ink-title">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
            )}
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
              <p className="text-[#6a5a4c] ink-text mb-3">
                @{profile.username}
              </p>
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
            </div>
            <Link
              href="/dashboard/profile/edit"
              className="flex items-center gap-2 px-4 py-2 bg-[#eadcc8] text-[#4e4033] border border-[#b5a490] rounded-sm hover:bg-[#e1d0ba] transition-colors text-sm font-semibold ink-text shrink-0"
            >
              <FaEdit className="w-3.5 h-3.5" />
              {t.profile.header.editProfile}
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* ── Contact Info ── */}
          <section className="dashboard-surface tron-border rounded-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#6a5a4c] ink-text mb-4 border-b border-[#c9b89a] pb-2">
              {t.profile.sections.contactInfo}
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FaEnvelope className="w-4 h-4 text-[#8a7966] mt-0.5" />
                <div>
                  <p className="text-[10px] text-[#8a7966] uppercase font-bold tracking-tight">
                    {t.profile.info.email}
                  </p>
                  <p className="text-sm text-[#221910] font-medium break-all">
                    {profile.email}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaPhone className="w-4 h-4 text-[#8a7966] mt-0.5" />
                <div>
                  <p className="text-[10px] text-[#8a7966] uppercase font-bold tracking-tight">
                    {t.profile.info.phone}
                  </p>
                  <p className="text-sm text-[#221910] font-medium">
                    {profile.phone || t.profile.info.noPhone}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="w-4 h-4 text-[#8a7966] mt-0.5" />
                <div>
                  <p className="text-[10px] text-[#8a7966] uppercase font-bold tracking-tight">
                    {t.profile.info.location}
                  </p>
                  <p className="text-sm text-[#221910] font-medium">
                    {locationParts.length > 0
                      ? locationParts.join(", ")
                      : t.profile.info.noLocation}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Reading Progress ── */}
          <section className="dashboard-surface tron-border rounded-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#6a5a4c] ink-text mb-4 border-b border-[#c9b89a] pb-2">
              {t.profile.sections.readingProgress}
            </h2>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-sm font-bold text-[#221910] ink-title">
                    {t.profile.stats.syllabusProgress}
                  </p>
                  <p className="text-sm font-bold text-[#221910] ink-title">
                    {syllabusPercent}%
                  </p>
                </div>
                <div className="w-full h-3 bg-[#d9cbb7] rounded-full overflow-hidden border border-[#8a7966] shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                  <div
                    className="h-full bg-teal-700 transition-all duration-500 shadow-[0_0_10px_rgba(13,148,136,0.3)]"
                    style={{ width: `${syllabusPercent}%` }}
                  />
                </div>
                <p className="text-xs text-[#6a5a4c] mt-2 ink-text text-right">
                  {stats.syllabusCompleted} / {stats.syllabusTotal}{" "}
                  {t.profile.stats.booksRead}
                </p>
              </div>

              <div className="pt-2">
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
        </div>
      </div>
    </div>
  );
}
