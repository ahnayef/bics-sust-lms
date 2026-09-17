import PageTransition from "@/components/PageTransition";
import { getPdfSubmissions, getUserTransactions } from "@/server/library";
import { getClaims } from "@/server/user";
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
  const validFilters = [
    "all",
    "active",
    "completed",
    "overdue",
    "pending",
    "rejected",
  ];
  const initialFilter = validFilters.includes(filter ?? "") ? filter : "all";

  return (
    <PageTransition>
      <HistoryClient
        transactions={transactions}
        pdfSubmissions={pdfSubmissions}
        initialFilter={initialFilter as any}
      />
    </PageTransition>
  );
}
