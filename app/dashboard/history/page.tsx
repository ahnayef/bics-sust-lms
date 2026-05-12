import { getClaims } from "@/server/user";
import { getUserTransactions, getPdfSubmissions } from "@/server/library";
import { redirect } from "next/navigation";
import HistoryClient from "./HistoryClient";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const [transactions, pdfSubmissions] = await Promise.all([
    getUserTransactions(claims.sub),
    getPdfSubmissions({ userId: claims.sub }),
  ]);

  const { filter } = await searchParams;
  const validFilters = ["all", "active", "completed", "overdue", "pending", "rejected"];
  const initialFilter = validFilters.includes(filter ?? "") ? filter : "all";

  return (
    <HistoryClient
      transactions={transactions}
      pdfSubmissions={pdfSubmissions}
      initialFilter={initialFilter as any}
    />
  );
}
