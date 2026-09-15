import { getTransactions, getPdfSubmissions } from "@/server/library";
import { getMyProfile } from "@/server/auth-utils";
import { USER_ROLES } from "@/lib/constants";
import { redirect } from "next/navigation";
import TransactionsClient from "./TransactionsClient";

export default async function TransactionsPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/login");

  if (profile.role !== USER_ROLES.ADMIN && profile.role !== USER_ROLES.MODERATOR) {
    redirect("/dashboard");
  }

  const [transactions, pdfSubmissions] = await Promise.all([
    getTransactions(),
    getPdfSubmissions(),
  ]);

  return (
    <TransactionsClient
      transactions={transactions}
      pdfSubmissions={pdfSubmissions}
    />
  );
}
