import PageTransition from "@/components/PageTransition";
import { USER_ROLES } from "@/lib/constants";
import { getMyProfile } from "@/server/auth-utils";
import { getBooks, getCategories } from "@/server/library";
import { redirect } from "next/navigation";
import BooksClient from "./BooksClient";

export default async function BooksPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  if (
    profile.role !== USER_ROLES.ADMIN &&
    profile.role !== USER_ROLES.MODERATOR
  ) {
    redirect("/dashboard");
  }

  const [books, categories] = await Promise.all([getBooks(), getCategories()]);
  return (
    <PageTransition>
      <BooksClient initialBooks={books} categories={categories} />
    </PageTransition>
  );
}
