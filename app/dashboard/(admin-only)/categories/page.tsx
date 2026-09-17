import PageTransition from "@/components/PageTransition";
import { USER_ROLES } from "@/lib/constants";
import { getMyProfile } from "@/server/auth-utils";
import { getCategories } from "@/server/library";
import { redirect } from "next/navigation";
import CategoriesClient from "./CategoriesClient";

export default async function CategoriesPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  if (
    profile.role !== USER_ROLES.ADMIN &&
    profile.role !== USER_ROLES.SUPERADMIN &&
    profile.role !== "moderator"
  ) {
    redirect("/dashboard");
  }

  const categories = await getCategories();

  return (
    <PageTransition>
      <div className="space-y-6">
        <CategoriesClient initialCategories={categories} />
      </div>
    </PageTransition>
  );
}
