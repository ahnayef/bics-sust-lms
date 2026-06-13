import { getAdminLogs } from "@/server/library";
import { getClaims } from "@/server/user";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogsClient from "./LogsClient";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const supabase = await createClient();
  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.sub)
    .single();

  if (caller?.role !== "admin" && caller?.role !== "moderator") {
    redirect("/dashboard");
  }

  const { days } = await searchParams;
  const filterDays = days ? parseInt(days, 10) : 30;

  const logs = await getAdminLogs(filterDays);

  return (
    <div className="p-2 sm:p-0 space-y-6">
      <LogsClient initialLogs={logs} currentDays={filterDays} />
    </div>
  );
}
