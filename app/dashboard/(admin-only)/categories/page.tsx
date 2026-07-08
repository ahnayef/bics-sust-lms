import { getCategories } from "@/server/library";
import { getMyProfile } from "@/server/auth-utils";
import { USER_ROLES } from "@/lib/constants";
import { redirect } from "next/navigation";
import CategoriesClient from "./CategoriesClient";

export default async function CategoriesPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  if (profile.role !== USER_ROLES.ADMIN) {
    redirect("/dashboard");
  }

  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
          Book Categories
        </h1>
        <p className="text-[#5a4b3f] mt-1 ink-text text-sm">
          Manage book categories. Books assigned to categories with "Count in Progress" enabled
          will show up in user reading progress bars.
        </p>
      </section>

      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
