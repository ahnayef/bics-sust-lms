import PageTransition from "@/components/PageTransition";
import { USER_ROLES } from "@/lib/constants";
import { getMyProfile } from "@/server/auth-utils";
import { getAdminLogs } from "@/server/library";
import { redirect } from "next/navigation";
import LogsClient from "./LogsClient";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  if (profile.role !== USER_ROLES.SUPERADMIN) {
    redirect("/dashboard");
  }

  const { days } = await searchParams;
  const filterDays = days ? parseInt(days, 10) : 30;

  const logs = await getAdminLogs(filterDays);

  return (
    <PageTransition>
      <div className="p-2 sm:p-0 space-y-6">
        <LogsClient initialLogs={logs} currentDays={filterDays} />
      </div>
    </PageTransition>
  );
}
