import PageTransition from "@/components/PageTransition";
import { USER_ROLES } from "@/lib/constants";
import { getMyProfile } from "@/server/auth-utils";
import { getCategories, getUsers } from "@/server/library";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  if (
    profile.role !== USER_ROLES.ADMIN &&
    profile.role !== USER_ROLES.SUPERADMIN &&
    profile.role !== USER_ROLES.MODERATOR
  ) {
    redirect("/dashboard");
  }

  const [users, categories] = await Promise.all([getUsers(), getCategories()]);

  return (
    <PageTransition>
      <UsersClient users={users} categories={categories} />
    </PageTransition>
  );
}
