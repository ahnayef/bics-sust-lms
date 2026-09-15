import { getBookByQR, getUserTransactions } from "@/server/library";
import { getClaims, getCurrentProfile } from "@/server/user";
import { redirect } from "next/navigation";
import BorrowClient from "./BorrowClient";

export default async function BorrowPage({
  searchParams,
}: {
  searchParams: Promise<{ copyId?: string }>;
}) {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const params = await searchParams;
  const copyId = params.copyId?.trim().toUpperCase() ?? "";

  const [allTxns, initialCopy, profile] = await Promise.all([
    getUserTransactions(claims.sub),
    copyId ? getBookByQR(copyId) : Promise.resolve(null),
    getCurrentProfile()
  ]);

  // Copy IDs the user currently has in active / pending borrow status
  const activeBorrowCopyIds = allTxns
    .filter(
      (tx) =>
        tx.type === "borrow" &&
        ["active", "overdue", "pending"].includes(tx.status),
    )
    .map((tx) => tx.copy_id.toUpperCase());

  // Books the user has already physically completed (for the "already read" warning)
  const completedBooks = allTxns
    .filter((tx) => tx.type === "borrow" && tx.status === "completed")
    .map((tx) => ({
      bookId: String(tx.book_id),
      completedOn: tx.updated_at,
      copyId: tx.copy_id.toUpperCase(),
    }));

  return (
    <BorrowClient
      initialCopyId={copyId}
      initialCopy={initialCopy}
      activeBorrowCopyIds={activeBorrowCopyIds}
      completedBooks={completedBooks}
      isVerified={profile?.is_verified ?? false}
    />
  );
}
