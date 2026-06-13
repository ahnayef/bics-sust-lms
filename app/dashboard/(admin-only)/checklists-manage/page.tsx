import { getChecklists } from "@/server/checklists";
import ChecklistsManageClient from "./ChecklistsManageClient";

export default async function ChecklistsManagePage() {
  const checklists = await getChecklists();

  return (
    <div className="space-y-6">
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
          Manage Checklists
        </h1>
        <p className="text-[#5a4b3f] mt-1 ink-text text-sm">
          Create and manage checklists that users can complete. Checklists marked "Visible"
          will appear on users' checklist pages and in their profile progress.
        </p>
      </section>

      <ChecklistsManageClient initialChecklists={checklists} />
    </div>
  );
}
