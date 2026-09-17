import PageTransition from "@/components/PageTransition";
import {
  getBooks,
  getCategories,
  getPdfSubmissions,
  getUserTransactions,
} from "@/server/library";
import { getClaims } from "@/server/user";
import { redirect } from "next/navigation";
import BookListClient from "./BookListClient";

export default async function BookListPage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const [books, allTxns, pdfSubmissions, categories] = await Promise.all([
    getBooks(),
    getUserTransactions(claims.sub),
    getPdfSubmissions({ userId: claims.sub }),
    getCategories(),
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
    <PageTransition>
      <BookListClient
        books={books}
        userId={claims.sub}
        activeBorrowCopyIds={activeBorrowCopyIds}
        pdfSubmissions={pdfSubmissions}
        categories={categories}
      />
    </PageTransition>
  );
}
