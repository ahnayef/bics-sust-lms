import { getProfile } from "@/server/geo";
import { getUserNotifications } from "@/server/library";
import { getClaims, shellHintsFromClaims } from "@/server/user";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import DashboardShell from "./DashboardShell";

function DashboardRootFallback() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      aria-busy
      aria-label="Loading dashboard"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function DashboardPageFallback() {
  return (
    <div
      className="flex flex-1 items-center justify-center p-8"
      aria-busy
      aria-label="Loading content"
    >
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardRootFallback />}>
      <DashboardLayoutAsync>{children}</DashboardLayoutAsync>
    </Suspense>
  );
}

async function DashboardLayoutAsync({
  children,
}: {
  children: React.ReactNode;
}) {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const profile = await getProfile(claims.sub as string);

  // If user hasn't completed setup, force them to the setup page
  if (!profile?.profile_completed) {
    redirect("/setup");
  }

  const hints = shellHintsFromClaims(claims);

  const userRole = profile?.role ?? hints.role ?? "member";
  const userName = profile?.full_name ?? hints.displayName ?? "User";
  const userAvatar = profile?.avatar_url ?? hints.avatarUrl ?? null;
  const notifications = claims?.sub ? await getUserNotifications(claims.sub) : [];

  return (
    <DashboardShell
      userId={claims?.sub as string}
      userName={userName}
      userRole={userRole}
      userAvatar={userAvatar}
      initialNotifications={notifications}
    >
      <Suspense fallback={<DashboardPageFallback />}>{children}</Suspense>
    </DashboardShell>
  );
}
