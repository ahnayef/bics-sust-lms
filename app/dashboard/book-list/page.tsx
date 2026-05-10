import { redirect } from "next/navigation";
import { getClaims } from "@/server/user";
import {
  getBooks,
  getUserTransactions,
  getPdfSubmissions,
} from "@/server/library";
import BookListClient from "./BookListClient";

export default async function BookListPage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const [books, allTxns, pdfSubmissions] = await Promise.all([
    getBooks(),
    getUserTransactions(claims.sub),
    getPdfSubmissions({ userId: claims.sub }),
  ]);

  // Copy IDs the user has active / pending borrows for
  const activeBorrowCopyIds = allTxns
    .filter(
      (tx) =>
        tx.type === "borrow" &&
        ["active", "overdue", "pending"].includes(tx.status),
    )
    .map((tx) => tx.copy_id);

  return (
    <BookListClient
      books={books}
      userId={claims.sub}
      activeBorrowCopyIds={activeBorrowCopyIds}
      pdfSubmissions={pdfSubmissions}
    />
  );
}
