import { getTranslation } from "@/lib/i18n/server";
import { getUserChecklistProgress } from "@/server/checklists";
import { getProfile } from "@/server/geo";
import { getPdfSubmissions, getUserStats, getUserTransactions } from "@/server/library";
import { getClaims, getCurrentProfile } from "@/server/user";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ReportClient from "./ReportClient";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0]?.toUpperCase() ?? "") + (parts[parts.length - 1][0]?.toUpperCase() ?? "");
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const { user: userId } = await searchParams;
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const currentProfile = await getCurrentProfile();

  // If no user ID provided, redirect to own report
  if (!userId) {
    redirect(`/dashboard/report?user=${claims.sub}`);
  }

  const isOwnReport = claims.sub === userId;
  const isAdminOrMod = currentProfile?.role === "admin" || currentProfile?.role === "moderator";

  // Check permissions
  if (!isOwnReport && !isAdminOrMod) notFound();

  // Get profile
  const profile = await getProfile(userId);
  if (!profile) {
    // User not found, show friendly message instead of 404
    const { t } = await getTranslation();
    return (
      <div className="max-w-2xl mx-auto mt-12 space-y-6">
        <div className="dashboard-surface tron-border rounded-sm p-8 text-center">
          <h2 className="text-xl font-bold text-[#221910] ink-title mb-2">
            User Not Found
          </h2>
          <p className="text-[#5c4f42] ink-text mb-6">
            The user you're looking for doesn't exist.
          </p>
          <Link
            href={isAdminOrMod ? "/dashboard/users" : "/dashboard/profile"}
            className="px-4 py-2 bg-[#5a4d40] text-[#f4e8d4] rounded-sm hover:bg-[#4a3d30] transition-colors font-medium"
          >
            {t.report.back || "Go Back"}
          </Link>
        </div>
      </div>
    );
  }

  // Get all data
  const { t, language } = await getTranslation();
  const [stats, checklistProgress, transactions, pdfSubmissions] = await Promise.all([
    getUserStats(userId),
    getUserChecklistProgress(userId),
    getUserTransactions(userId),
    getPdfSubmissions({ userId }),
  ]);

  // Format dates
  const joinedDate = new Date(profile.created_at).toLocaleDateString(
    language === "bn" ? "bn-BD" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" }
  );
  const reportDate = new Date().toLocaleDateString(
    language === "bn" ? "bn-BD" : "en-GB",
    { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }
  );

  // Pass data to client component
  return (
    <ReportClient
      t={t}
      language={language}
      profile={profile}
      stats={stats}
      checklistProgress={checklistProgress}
      transactions={transactions}
      reportDate={reportDate}
      joinedDate={joinedDate}
      isOwnReport={isOwnReport}
      isAdminOrMod={isAdminOrMod}
      backUrl={isAdminOrMod ? `/dashboard/users/${userId}` : "/dashboard/profile"}
    />
  );
}
