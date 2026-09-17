import PageTransition from "@/components/PageTransition";
import {
  getChecklists,
  getUserChecklistCompletions,
} from "@/server/checklists";
import { getClaims } from "@/server/user";
import ChecklistsClient from "./ChecklistsClient";

export default async function ChecklistsPage() {
  const claims = await getClaims();
  if (!claims?.sub) return null;

  const checklists = await getChecklists(true);
  const completedItemIds = await getUserChecklistCompletions(claims.sub);

  return (
    <PageTransition>
      <div className="space-y-6">
        <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
            Checklists
          </h1>
          <p className="text-[#5a4b3f] mt-1 ink-text text-sm">
            Track your progress on required readings and tasks.
          </p>
        </section>

        <ChecklistsClient
          initialChecklists={checklists}
          userId={claims.sub}
          initialCompletedItemIds={Array.from(completedItemIds)}
        />
      </div>
    </PageTransition>
  );
}
