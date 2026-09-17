import PageTransition from "@/components/PageTransition";
import { USER_ROLES } from "@/lib/constants";
import { getMyProfile } from "@/server/auth-utils";
import {
  getBooks,
  getCategories,
  getCopies,
  getTransactions,
  getUsers,
} from "@/server/library";
import { redirect } from "next/navigation";
import ExportsClient from "./ExportsClient";

export default async function ExportsPage() {
  const profile = await getMyProfile();
  if (!profile) {
    redirect("/login");
  }

  if (
    profile.role !== USER_ROLES.ADMIN &&
    profile.role !== USER_ROLES.MODERATOR
  ) {
    redirect("/dashboard");
  }

  const [books, copies, users, transactions, categories] = await Promise.all([
    getBooks(),
    getCopies(),
    getUsers(),
    getTransactions(),
    getCategories(),
  ]);

  return (
    <PageTransition>
      <ExportsClient
        currentStaff={{
          name: profile?.full_name || "Staff Member",
          email: profile?.email || "",
          role: profile?.role || "moderator",
        }}
        books={books}
        copies={copies}
        users={users}
        transactions={transactions}
        categories={categories}
      />
    </PageTransition>
  );
}
