import PageTransition from "@/components/PageTransition";
import { getModeratorsAndAdmin } from "@/server/geo";
import { moderatorPermissions } from "@/server/profiles";
import { getClaims } from "@/server/user";
import { redirect } from "next/navigation";
import ModeratorsClient from "./ModeratorsClient";

export default async function ModeratorsPage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const perms = await moderatorPermissions();
  if (!perms.canManageModerators) redirect("/dashboard");

  const people = await getModeratorsAndAdmin();

  return (
    <PageTransition>
      <ModeratorsClient initialModerators={people} />
    </PageTransition>
  );
}
