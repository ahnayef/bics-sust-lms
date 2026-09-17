import PageTransition from "@/components/PageTransition";
import { getUserNotifications } from "@/server/library";
import { getClaims } from "@/server/user";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FaBell, FaChevronLeft } from "react-icons/fa";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const claims = await getClaims();
  if (!claims) redirect("/login");

  const notifications = await getUserNotifications(claims.sub);

  return (
    <PageTransition>
      <div className="p-2 sm:p-0 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/dashboard"
            className="p-2 bg-[#f4e8d4] hover:bg-[#ece0ce] text-[#3f3328] rounded-sm transition-colors border border-[#d3c1a9]"
          >
            <FaChevronLeft className="w-3.5 h-3.5" />
          </Link>
          <h1 className="text-xl font-bold text-[#221910] ink-title flex items-center gap-2">
            <FaBell className="text-[#6a5a4c] w-5 h-5" />
            All Notifications
          </h1>
        </div>

        <NotificationsClient
          userId={claims.sub as string}
          notifications={notifications}
        />
      </div>
    </PageTransition>
  );
}
