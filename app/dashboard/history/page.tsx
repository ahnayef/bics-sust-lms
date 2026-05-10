import { getClaims } from "@/server/user";
import { getUserTransactions, getPdfSubmissions } from "@/server/library";
import { redirect } from "next/navigation";
import HistoryClient from "./HistoryClient";

export default async function HistoryPage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const [transactions, pdfSubmissions] = await Promise.all([
    getUserTransactions(claims.sub),
    getPdfSubmissions({ userId: claims.sub }),
  ]);

  return (
    <HistoryClient
      transactions={transactions}
      pdfSubmissions={pdfSubmissions}
    />
  );
}
