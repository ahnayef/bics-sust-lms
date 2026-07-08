import { getUserTransactions } from "@/server/library";
import { getClaims, getCurrentProfile } from "@/server/user";
import { redirect } from "next/navigation";
import ReturnClient from "./ReturnClient";

export default async function ReturnPage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");
  const [transactions, profile] = await Promise.all([
    getUserTransactions(claims.sub),
    getCurrentProfile()
  ]);
  // Filter active/overdue borrows
  const currentBorrows = transactions.filter(
    (tx) =>
      tx.type === "borrow" && ["active", "overdue"].includes(tx.status),
  );
  // Find pending return copy IDs
  const pendingReturnCopyIds = new Set(
    transactions
      .filter(
        (tx) => tx.type === "return" && tx.status === "pending"
      )
      .map((tx) => tx.copy_id.toUpperCase())
  );
  return (
    <ReturnClient 
      currentBorrows={currentBorrows} 
      userId={claims.sub} 
      pendingReturnCopyIds={pendingReturnCopyIds}
      isVerified={profile?.is_verified ?? false}
    />
  );
}
