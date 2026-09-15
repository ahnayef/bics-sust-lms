import { getBooks, getCopies, getCategories } from "@/server/library";
import { getMyProfile } from "@/server/auth-utils";
import { USER_ROLES } from "@/lib/constants";
import { redirect } from "next/navigation";
import CopiesClient from "./CopiesClient";

export default async function CopiesPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  if (profile.role !== USER_ROLES.ADMIN && profile.role !== USER_ROLES.MODERATOR) {
    redirect("/dashboard");
  }

  const [copies, books, categories] = await Promise.all([getCopies(), getBooks(), getCategories()]);
  return <CopiesClient initialCopies={copies} books={books} categories={categories} />;
}
