import PageTransition from "@/components/PageTransition";
import { getModeratorsAndAdmin } from "@/server/geo";
import { moderatorPermissions } from "@/server/profiles";
import { getClaims } from "@/server/user";
import { redirect } from "next/navigation";
import AdminsClient from "./AdminsClient";

export default async function AdminsPage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const perms = await moderatorPermissions();
  if (!perms.canManageAdmins) redirect("/dashboard");

  // Superadmin is strictly excluded inside getModeratorsAndAdmin
  const people = await getModeratorsAndAdmin();

  return (
    <PageTransition>
      <AdminsClient
        initialAdmins={people}
        currentUserId={claims.sub as string}
      />
    </PageTransition>
  );
}
