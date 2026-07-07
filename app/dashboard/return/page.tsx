import { getClaims } from "@/server/user";
import { getUserTransactions } from "@/server/library";
import { redirect } from "next/navigation";
import ReturnClient from "./ReturnClient";

export default async function ReturnPage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");
  const transactions = await getUserTransactions(claims.sub);
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
    />
  );
}
