import { CommunityNav } from "@/app/dashboard/components/StaffHubNav";
import { USER_ROLES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/server/auth-utils";
import { redirect } from "next/navigation";
import RankAddForm from "./RankAddForm";
import RanksClient from "./RanksClient";

export default async function RanksPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  if (profile.role !== USER_ROLES.ADMIN) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: ranks } = await supabase
    .from("ranks")
    .select("id, name")
    .order("name", { ascending: true });

  const list = ranks ?? [];

  return (
    <div className="space-y-6">
      {/* Community Hub Sub-Navigation */}
      <CommunityNav />

      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
          Ranks
        </h1>
        <p className="text-[#5a4b3f] mt-1 ink-text text-sm">
          Members choose a rank (e.g., Quran, Hadith) during setup and in their
          profile. Add, rename, or remove entries here ({list.length} total).
        </p>
      </section>

      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c4f42] ink-text">
          Add rank
        </h2>
        <RankAddForm />
      </section>

      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c4f42] ink-text">
          All ranks
        </h2>
        <RanksClient ranks={list} />
      </section>
    </div>
  );
}
