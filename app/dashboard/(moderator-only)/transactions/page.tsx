import { getTransactions, getPdfSubmissions } from "@/server/library";
import TransactionsClient from "./TransactionsClient";

export default async function TransactionsPage() {
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
