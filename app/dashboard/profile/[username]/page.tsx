import { getProfileByUsername } from "@/server/geo";
import { getUserStats } from "@/server/library";
import { getClaims } from "@/server/user";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
  FaShieldAlt,
} from "react-icons/fa";
import ProfileUserActions from "./ProfileUserActions";

export default async function DashboardUserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const claims = await getClaims();
  if (!claims) redirect("/login");

  const [profile, stats] = await Promise.all([
    getProfileByUsername(username),
    // Stats fetched after profile is known
    getProfileByUsername(username).then((p) => (p ? getUserStats(p.id) : null)),
  ]);

  if (!profile) notFound();

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    moderator: "Moderator",
    member: "Member",
  };

  const roleColors: Record<string, string> = {
    admin: "bg-amber-100 text-amber-800 border-amber-400",
    moderator: "bg-teal-100 text-teal-800 border-teal-400",
    member: "bg-stone-100 text-stone-700 border-stone-400",
  };

  const joinedDate = new Date(profile.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const locationParts = [
    profile.upazila?.name,
    profile.district?.name,
    profile.division?.name,
  ].filter(Boolean);

  const syllabusPercent =
    stats && stats.syllabusTotal > 0
      ? Math.round((stats.syllabusCompleted / stats.syllabusTotal) * 100)
      : 0;

  return (
    <div className="p-2 sm:p-0 max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-[#5a4b3f] hover:text-[#221910] transition-colors ink-text"
      >
        <FaArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      {/* Hero */}
      <section className="dashboard-surface tron-border rounded-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              className="w-20 h-20 rounded-full object-cover border-2 border-[#8a7966] shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#d9cbb7] border-2 border-[#8a7966] flex items-center justify-center text-2xl font-bold text-[#4a3e33] shrink-0 ink-title">
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
                  title="Verified"
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
              {profile.rank !== "None" && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-semibold border bg-[#ede0cc] text-[#4a3825] border-[#b59f86] ink-text">
                  {profile.rank}
                </span>
              )}
              {profile.is_verified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-semibold border bg-[#eef5e9] text-[#3d5c2e] border-[#a3b994] ink-text">
                  <FaCheckCircle className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-semibold border bg-[#fdf5e4] text-[#7a5e2a] border-[#c9b48a] ink-text">
                  <FaClock className="w-3 h-3" /> Unverified
                </span>
              )}
            </div>

            <p className="text-xs text-[#7a6a5c] ink-text mt-3">
              Joined on: <b>{joinedDate}</b>
            </p>
          </div>
        </div>
      </section>

      {/* Reading progress */}
      {stats && (
        <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
          <h2 className="text-base font-bold text-[#221910] ink-title mb-4 border-b border-[#c9b89a] pb-2">
            Reading Progress
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm ink-text text-[#4a3e33]">
              <span>
                {stats.syllabusCompleted} / {stats.syllabusTotal} syllabus books
              </span>
              <span className="font-bold text-[#221910]">
                {syllabusPercent}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#e4d4bf] border border-[#ccb79b] overflow-hidden">
              <div
                className="h-full bg-[#5a4d40] transition-all"
                style={{ width: `${syllabusPercent}%` }}
              />
            </div>
            <div className="flex gap-4 text-xs ink-text text-[#5a4b3f]">
              <span>
                Active borrows:{" "}
                <span className="font-semibold text-[#221910]">
                  {stats.activeBorrows}
                </span>
              </span>
              <span>
                Pending requests:{" "}
                <span className="font-semibold text-[#221910]">
                  {stats.pendingRequests}
                </span>
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Contact & Location */}
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <h2 className="text-base font-bold text-[#221910] ink-title mb-4 border-b border-[#c9b89a] pb-2">
          Contact &amp; Location
        </h2>
        {profile.hide_sensitive_info ? (
          <p className="text-sm text-[#7a6a5c] ink-text italic">
            This member has chosen to keep their contact information private.
          </p>
        ) : (
          <dl className="space-y-3 ink-text">
            <div className="flex items-start gap-3">
              <FaEnvelope className="w-4 h-4 text-[#7a6a5c] mt-0.5 shrink-0" />
              <div>
                <dt className="text-xs text-[#7a6a5c] uppercase tracking-wider mb-0.5">
                  Email
                </dt>
                <dd className="text-[#2b2119]">{profile.email}</dd>
              </div>
            </div>
            {profile.phone && (
              <div className="flex items-start gap-3">
                <FaPhone className="w-4 h-4 text-[#7a6a5c] mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-[#7a6a5c] uppercase tracking-wider mb-0.5">
                    Phone
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
                    Location
                  </dt>
                  <dd className="text-[#2b2119]">{locationParts.join(", ")}</dd>
                </div>
              </div>
            )}
          </dl>
        )}
      </section>

      {/* Admin actions */}
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <h2 className="text-base font-bold text-[#221910] ink-title mb-1 border-b border-[#c9b89a] pb-2">
          Admin Actions
        </h2>
        <p className="text-sm text-[#5a4b3f] ink-text mb-4 mt-3">
          Verification grants the member full library access.
        </p>
        <ProfileUserActions
          userId={profile.id}
          isVerified={profile.is_verified}
          userName={profile.full_name}
        />
      </section>
    </div>
  );
}
