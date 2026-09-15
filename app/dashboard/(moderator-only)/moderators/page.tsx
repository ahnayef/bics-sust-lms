import { getModeratorsAndAdmin } from "@/server/geo";
import { getClaims } from "@/server/user";
import { getProfile } from "@/server/geo";
import { redirect } from "next/navigation";
import { moderatorPermissions } from "@/server/profiles";
import ModeratorsClient from "./ModeratorsClient";

export default async function ModeratorsPage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const perms = await moderatorPermissions();
  if (!perms.canManageModerators) redirect("/dashboard");

  const people = await getModeratorsAndAdmin();

  return <ModeratorsClient initialModerators={people} />;
}
