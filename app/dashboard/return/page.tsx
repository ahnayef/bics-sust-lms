import { getClaims } from "@/server/user";
import { getUserStats } from "@/server/library";
import { redirect } from "next/navigation";
import ReturnClient from "./ReturnClient";

export default async function ReturnPage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");
  const stats = await getUserStats(claims.sub);
  return (
    <ReturnClient currentBorrows={stats.currentBorrows} userId={claims.sub} />
  );
}
