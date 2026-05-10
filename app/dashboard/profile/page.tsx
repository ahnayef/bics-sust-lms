import { getClaims } from "@/server/user";
import { getProfile } from "@/server/geo";
import { getUserStats } from "@/server/library";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FaBook,
  FaCheckCircle,
  FaEdit,
  FaEnvelope,
  FaHistory,
  FaMapMarkerAlt,
  FaPhone,
  FaQrcode,
  FaShieldAlt,
  FaUndoAlt,
} from "react-icons/fa";
import type { Transaction } from "@/types/library";

export default async function DashboardProfilePage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const [profile, stats] = await Promise.all([
    getProfile(claims.sub),
    getUserStats(claims.sub),
  ]);

  if (!profile) redirect("/login");

  const syllabusPercent =
    stats.syllabusTotal > 0
      ? Math.round((stats.syllabusCompleted / stats.syllabusTotal) * 100)
      : 0;

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

  return (
    <div className="p-2 sm:p-0">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* ── Hero card ── */}
        <section
          className="dashboard-surface tron-border rounded-sm p-6 sm:p-8"
          data-aos="fade-up"
          data-aos-duration="600"
        >
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
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
                    title="Verified"
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
                  {roleLabels[profile.role]}
                </span>
                {profile.rank !== "None" && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-semibold border bg-[#ede0cc] text-[#4a3825] border-[#b59f86] ink-text">
                    {profile.rank}
                  </span>
                )}
              </div>

              <p className="text-xs text-[#7a6a5c] ink-text mt-3">
                Member since {joinedDate}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 pt-4 border-t border-[#d9c8b0] flex flex-wrap gap-3 justify-end">
            <Link
              href={`/dashboard/profile/${profile.username}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#4d4034] border border-[#8a7966] rounded-sm hover:bg-[#eadcc8] transition-colors ink-text"
            >
              View Public Profile
            </Link>
            <Link
              href="/dashboard/profile/edit"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#4d4034] border border-[#8a7966] rounded-sm hover:bg-[#eadcc8] transition-colors ink-text"
            >
              <FaEdit className="w-3.5 h-3.5" />
              Edit Profile
            </Link>
          </div>
        </section>

        {/* ── Quick Actions ── */}
        <section data-aos="fade-up" data-aos-duration="600" data-aos-delay="60">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6a5a4c] ink-text mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(
              [
                {
                  href: "/dashboard/book-list",
                  icon: FaBook,
                  label: "Book List",
                  sub: "Browse &amp; request",
                },
                {
                  href: "/dashboard/borrow",
                  icon: FaQrcode,
                  label: "Scan QR",
                  sub: "Borrow via QR code",
                },
                {
                  href: "/dashboard/return",
                  icon: FaUndoAlt,
                  label: "Return",
                  sub: "Return a copy",
                },
                {
                  href: "/dashboard/history",
                  icon: FaHistory,
                  label: "History",
                  sub: "Your borrow history",
                },
              ] as const
            ).map(({ href, icon: Icon, label, sub }) => (
              <Link
                key={href}
                href={href}
                className="dashboard-surface tron-border rounded-sm p-4 flex flex-col items-center gap-2.5 hover:bg-[#ece0ce] transition-colors text-center group"
              >
                <div className="w-11 h-11 rounded-full bg-[#3f3328] flex items-center justify-center group-hover:bg-[#4a3d31] transition-colors">
                  <Icon className="w-5 h-5 text-[#f4e8d4]" />
                </div>
                <span className="text-sm font-semibold text-[#221910] ink-title">
                  {label}
                </span>
                <span
                  className="text-xs text-[#7a6a5c] ink-text leading-snug hidden sm:block"
                  dangerouslySetInnerHTML={{ __html: sub }}
                />
              </Link>
            ))}
          </div>
        </section>

        {/* ── Reading Progress ── */}
        <section
          className="dashboard-surface tron-border rounded-sm p-5 sm:p-6"
          data-aos="fade-up"
          data-aos-duration="600"
          data-aos-delay="80"
        >
          <h2 className="text-lg font-bold text-[#221910] ink-title mb-4 border-b border-[#c9b89a] pb-2">
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
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: "Completed", value: stats.syllabusCompleted },
                { label: "Borrowing", value: stats.activeBorrows },
                { label: "Pending", value: stats.pendingRequests },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-2 text-center"
                >
                  <p className="text-xl font-bold text-[#221910] ink-title leading-none">
                    {value}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-[#6a5a4c] ink-text mt-1">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Contact & Location ── */}
        <section
          className="dashboard-surface tron-border rounded-sm p-5 sm:p-6"
          data-aos="fade-up"
          data-aos-duration="600"
          data-aos-delay="100"
        >
          <h2 className="text-lg font-bold text-[#221910] ink-title mb-4 border-b border-[#c9b89a] pb-2">
            Contact &amp; Location
          </h2>
          <dl className="space-y-4 ink-text">
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

          {profile.hide_sensitive_info && (
            <p className="mt-4 text-xs text-[#7a6a5c] ink-text bg-[#ede0cc] border border-[#c9b89a] rounded-sm px-3 py-2">
              🔒 Your email and location are hidden from your public profile.
            </p>
          )}
        </section>

        {/* ── Currently Borrowing ── */}
        {stats.currentBorrows.length > 0 && (
          <section
            className="dashboard-surface tron-border rounded-sm p-5 sm:p-6"
            data-aos="fade-up"
            data-aos-duration="600"
            data-aos-delay="120"
          >
            <h2 className="text-lg font-bold text-[#221910] ink-title mb-4 border-b border-[#c9b89a] pb-2">
              Currently Borrowing
            </h2>
            <ul className="space-y-3">
              {stats.currentBorrows.map((tx: Transaction) => {
                const isOverdue =
                  tx.due_date && new Date(tx.due_date) < new Date();
                return (
                  <li
                    key={tx.id}
                    className="flex items-start justify-between gap-3 py-2 border-b border-[#e4d4bf] last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#221910] ink-title truncate">
                        {(tx as any).book?.title ?? "Unknown book"}
                      </p>
                      <p className="text-xs text-[#7a6a5c] ink-text">
                        Copy:{" "}
                        <span className="font-mono font-semibold">
                          {tx.copy_id}
                        </span>
                        {tx.due_date && (
                          <>
                            {" "}
                            · Due:{" "}
                            {new Date(tx.due_date).toLocaleDateString("en-GB")}
                          </>
                        )}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold border shrink-0 ink-text ${
                        isOverdue
                          ? "bg-red-50 text-red-700 border-red-300"
                          : "bg-teal-50 text-teal-700 border-teal-300"
                      }`}
                    >
                      {isOverdue ? "Overdue" : "Active"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
