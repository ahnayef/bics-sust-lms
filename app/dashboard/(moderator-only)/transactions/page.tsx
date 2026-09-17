import PageTransition from "@/components/PageTransition";
import { USER_ROLES } from "@/lib/constants";
import { getMyProfile } from "@/server/auth-utils";
import { getPdfSubmissions, getTransactions } from "@/server/library";
import { redirect } from "next/navigation";
import TransactionsClient from "./TransactionsClient";

export default async function TransactionsPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  if (
    profile.role !== USER_ROLES.ADMIN &&
    profile.role !== USER_ROLES.SUPERADMIN &&
    profile.role !== USER_ROLES.MODERATOR
  ) {
    redirect("/dashboard");
  }

  const [transactions, pdfSubmissions] = await Promise.all([
    getTransactions(),
    getPdfSubmissions(),
  ]);

  return (
    <PageTransition>
      <TransactionsClient
        transactions={transactions}
        pdfSubmissions={pdfSubmissions}
      />
    </PageTransition>
  );
}
