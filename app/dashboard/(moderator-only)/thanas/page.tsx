import { createClient } from "@/lib/supabase/server";
import ThanaAddForm from "./ThanaAddForm";
import ThanasClient from "./ThanasClient";

export default async function ThanasPage() {
  const supabase = await createClient();
  const { data: thanas } = await supabase
    .from("thanas")
    .select("id, name")
    .order("name", { ascending: true });

  const list = thanas ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
          Thanas
        </h1>
        <p className="text-[#5a4b3f] mt-1 ink-text text-sm">
          Members choose a thana during setup and in their profile. Add, rename,
          or remove entries here ({list.length} total).
        </p>
      </section>

      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c4f42] ink-text">
          Add thana
        </h2>
        <ThanaAddForm />
      </section>

      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5c4f42] ink-text">
          All thanas
        </h2>
        <ThanasClient thanas={list} />
      </section>
    </div>
  );
}
