import { getClaims } from "@/server/user";
import { getProfile } from "@/server/geo";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get claims first (no RLS involved — reads JWT)
  const claims = await getClaims();

  // Get profile for display name — own-row select, no recursion risk
  const profile = claims ? await getProfile(claims.sub) : null;

  // Role comes from the profile row; fall back to "member"
  const userRole = profile?.role ?? "member";
  const userName = profile?.full_name ?? claims?.email ?? "User";
  const userAvatar = profile?.avatar_url ?? null;

  return (
    <DashboardShell
      userName={userName}
      userRole={userRole}
      userAvatar={userAvatar}
    >
      {children}
    </DashboardShell>
  );
}
