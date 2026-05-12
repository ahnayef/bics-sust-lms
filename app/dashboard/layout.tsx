import { getClaims, shellHintsFromClaims } from "@/server/user";
import { getProfile } from "@/server/geo";
import DashboardShell from "./DashboardShell";
import { Suspense } from "react";

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
  const profile = claims ? await getProfile(claims.sub as string) : null;
  const hints = shellHintsFromClaims(claims);

  const userRole = profile?.role ?? hints.role ?? "member";
  const userName = profile?.full_name ?? hints.displayName ?? "User";
  const userAvatar = profile?.avatar_url ?? hints.avatarUrl ?? null;

  return (
    <DashboardShell
      userName={userName}
      userRole={userRole}
      userAvatar={userAvatar}
    >
      <Suspense fallback={<DashboardPageFallback />}>{children}</Suspense>
    </DashboardShell>
  );
}
