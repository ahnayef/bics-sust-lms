import { getUsers, getCategories } from "@/server/library";
import { getMyProfile } from "@/server/auth-utils";
import { USER_ROLES } from "@/lib/constants";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  if (profile.role !== USER_ROLES.ADMIN && profile.role !== USER_ROLES.MODERATOR) {
    redirect("/dashboard");
  }

  const [users, categories] = await Promise.all([
    getUsers(),
    getCategories(),
  ]);

  return <UsersClient users={users} categories={categories} />;
}
