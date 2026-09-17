import PageTransition from "@/components/PageTransition";
import { USER_ROLES } from "@/lib/constants";
import { getMyProfile } from "@/server/auth-utils";
import { getBooks, getCategories, getCopies } from "@/server/library";
import { redirect } from "next/navigation";
import CopiesClient from "./CopiesClient";

export default async function CopiesPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  if (
    profile.role !== USER_ROLES.ADMIN &&
    profile.role !== USER_ROLES.MODERATOR
  ) {
    redirect("/dashboard");
  }

  const [copies, books, categories] = await Promise.all([
    getCopies(),
    getBooks(),
    getCategories(),
  ]);
  return (
    <PageTransition>
      <CopiesClient
        initialCopies={copies}
        books={books}
        categories={categories}
      />
    </PageTransition>
  );
}
