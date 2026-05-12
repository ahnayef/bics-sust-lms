"use client";

import type { NotificationItem } from "@/types/library";
import Link from "next/link";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaShieldAlt,
  FaTimesCircle,
  FaUserCheck,
  FaUserPlus,
  FaUserTimes
} from "react-icons/fa";
import { getRelativeTime } from "@/lib/utils";
import { useNotificationStore } from "./useNotificationStore";

interface Props {
  userId: string;
  recentNotifications: NotificationItem[];
}

export default function RecentNotificationsClient({ userId, recentNotifications }: Props) {
  const { readIds, markAsRead, isLoaded } = useNotificationStore(userId, recentNotifications);

  const getIcon = (type: string) => {
    switch (type) {
      case "transaction_approved":
      case "pdf_approved":
      case "transaction_completed":
        return <FaCheckCircle className="text-teal-600 w-4 h-4 mt-0.5" />;
      case "transaction_rejected":
      case "pdf_rejected":
        return <FaTimesCircle className="text-red-600 w-4 h-4 mt-0.5" />;
      case "transaction_overdue":
        return <FaExclamationTriangle className="text-orange-600 w-4 h-4 mt-0.5" />;
      case "user_verified":
        return <FaUserCheck className="text-blue-600 w-4 h-4 mt-0.5" />;
      case "user_unverified":
        return <FaUserTimes className="text-red-500 w-4 h-4 mt-0.5" />;
      case "role_changed":
        return <FaShieldAlt className="text-purple-600 w-4 h-4 mt-0.5" />;
      case "user_joined":
        return <FaUserPlus className="text-green-600 w-4 h-4 mt-0.5" />;
      default:
        return <FaInfoCircle className="text-gray-600 w-4 h-4 mt-0.5" />;
    }
  };

  if (!isLoaded || recentNotifications.length === 0) return null;

  return (
    <section className="dashboard-surface tron-border rounded-sm p-4 sm:p-6 -mx-2 sm:mx-0">
      <div className="flex items-center justify-between mb-4 border-b border-[#c9b89a] pb-2">
        <h2 className="text-lg font-bold text-[#221910] ink-title">
          Recent Notifications
        </h2>
        <Link
          href="/dashboard/notifications"
          className="text-xs font-semibold text-[#6a5a4c] hover:text-[#221910] underline underline-offset-2"
        >
          View All
        </Link>
      </div>
      <ul className="space-y-3">
        {recentNotifications.map((notif) => {
          const isUnread = !readIds.includes(notif.id);
          return (
            <li
              key={notif.id}
              className={`py-3 px-2 sm:px-3 border rounded-sm last:border-b-0 transition-colors ${isUnread
                  ? "bg-[#fcf9f4] border-[#d3c1a9]"
                  : "bg-transparent border-transparent border-b-[#e4d4bf] opacity-80"
                }`}
              onClick={() => {
                if (isUnread) markAsRead(notif.id);
              }}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="shrink-0">{getIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ink-title ${isUnread ? "text-[#221910]" : "text-[#3f3328]"}`}>
                      {notif.title}
                    </p>
                    <p className={`text-xs ink-text mt-0.5 ${isUnread ? "text-[#4a3e33]" : "text-[#5a4b3f]"}`}>
                      {notif.message}
                    </p>
                    {notif.reason && (
                      <div className="mt-2 w-full bg-[#f0e4d1] border border-[#c9b89a] p-2 rounded-sm inline-block">
                        <div className="flex items-center justify-between mb-0.5 gap-2">
                          <span className="text-[10px] text-[#4a3e33] font-bold uppercase tracking-wider">
                            Reason
                          </span>
                        </div>
                        <p className="text-xs text-[#2f251d] font-medium ink-text">
                          {notif.reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span 
                    className="text-[10px] sm:text-xs text-[#8a7a6c] font-medium whitespace-nowrap border-b border-dashed border-[#bfa687] cursor-help"
                    title={new Date(notif.date).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true
                    })}
                  >
                    {getRelativeTime(notif.date)}
                  </span>
                  {isUnread && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1" />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
