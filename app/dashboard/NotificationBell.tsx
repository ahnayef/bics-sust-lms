"use client";

import { FaBell } from "react-icons/fa";
import Link from "next/link";
import { useNotificationStore } from "./useNotificationStore";
import type { NotificationItem } from "@/types/library";

interface Props {
  userId: string;
  notifications: NotificationItem[];
}

export default function NotificationBell({ userId, notifications }: Props) {
  const { unreadCount, isLoaded } = useNotificationStore(userId, notifications);

  return (
    <Link
      href="/dashboard/notifications"
      className="relative p-2 text-[#5a4b3f] hover:text-[#221910] hover:bg-[#ece0ce] rounded-full transition-colors"
      title="Notifications"
    >
      <FaBell className="w-4 h-4 lg:w-5 lg:h-5" />
      {isLoaded && unreadCount > 0 && (
        <span className="absolute top-0.5 right-0.5 flex h-4 w-4 lg:h-5 lg:w-5 items-center justify-center rounded-full bg-red-600 text-[9px] lg:text-[10px] font-bold text-white shadow-sm ring-2 ring-[#f1e7d8]">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
