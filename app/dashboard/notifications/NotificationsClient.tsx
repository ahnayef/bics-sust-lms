"use client";

import type { NotificationItem } from "@/types/library";
import { useNotificationStore } from "../useNotificationStore";
import { 
  FaBell, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationTriangle, 
  FaInfoCircle,
  FaShieldAlt,
  FaUserCheck,
  FaUserTimes,
  FaUserPlus
} from "react-icons/fa";
import Link from "next/link";
import { useEffect } from "react";

interface Props {
  userId: string;
  notifications: NotificationItem[];
}

export default function NotificationsClient({ userId, notifications }: Props) {
  const { readIds, markAsRead, markAllAsRead, isLoaded } = useNotificationStore(userId, notifications);

  // Automatically mark as read if they click the link
  // But wait, they might just view it on the page. Let's add a explicit button or mark as read on click.
  
  const getIcon = (type: string) => {
    switch (type) {
      case "transaction_approved":
      case "pdf_approved":
      case "transaction_completed":
        return <FaCheckCircle className="text-teal-600 w-5 h-5 mt-0.5" />;
      case "transaction_rejected":
      case "pdf_rejected":
        return <FaTimesCircle className="text-red-600 w-5 h-5 mt-0.5" />;
      case "transaction_overdue":
        return <FaExclamationTriangle className="text-orange-600 w-5 h-5 mt-0.5" />;
      case "user_verified":
        return <FaUserCheck className="text-blue-600 w-5 h-5 mt-0.5" />;
      case "user_unverified":
        return <FaUserTimes className="text-red-500 w-5 h-5 mt-0.5" />;
      case "role_changed":
        return <FaShieldAlt className="text-purple-600 w-5 h-5 mt-0.5" />;
      case "user_joined":
        return <FaUserPlus className="text-green-600 w-5 h-5 mt-0.5" />;
      default:
        return <FaInfoCircle className="text-gray-600 w-5 h-5 mt-0.5" />;
    }
  };

  if (!isLoaded) {
    return <div className="text-center py-8 text-[#5a4b3f]">Loading...</div>;
  }

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  return (
    <section className="dashboard-surface tron-border rounded-sm p-4 sm:p-6 -mx-2 sm:mx-0">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#c9b89a]">
        <div>
          <h2 className="text-xl font-bold text-[#221910] ink-title">History</h2>
          <p className="text-sm text-[#5a4b3f] ink-text">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-semibold px-3 py-1.5 bg-[#f4e8d4] text-[#3f3328] border border-[#c9b89a] hover:bg-[#ece0ce] rounded-sm transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm text-[#6a5a4c] ink-text text-center py-8">
          You don't have any notifications yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {notifications.map((notif) => {
            const isUnread = !readIds.includes(notif.id);
            return (
              <li
                key={notif.id}
                className={`p-4 border rounded-sm transition-colors relative ${
                  isUnread 
                    ? "bg-[#fcf9f4] border-[#d3c1a9] shadow-sm" 
                    : "bg-[#f4e8d4]/50 border-[#e4d4bf] opacity-80"
                }`}
                onClick={() => {
                  if (isUnread) markAsRead(notif.id);
                }}
              >
                {isUnread && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 shadow-sm" />
                )}
                <div className="flex items-start gap-3 sm:gap-4 pr-6">
                  <div className="shrink-0">{getIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                      <h3 className={`text-base font-bold ink-title ${isUnread ? "text-[#221910]" : "text-[#3f3328]"}`}>
                        {notif.title}
                      </h3>
                      <span 
                        className="text-[10px] sm:text-[11px] text-[#8a7a6c] font-semibold whitespace-nowrap"
                      >
                        {new Date(notif.date).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true
                        })}
                      </span>
                    </div>
                    
                    <p className={`text-sm ink-text leading-relaxed ${isUnread ? "text-[#4a3e33]" : "text-[#5a4b3f]"}`}>
                      {notif.message}
                    </p>
                    
                    {notif.reason && (
                      <div className="mt-3 bg-[#f0e4d1] border border-[#c9b89a] rounded-sm p-3 inline-block w-full sm:w-auto shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[11px] font-bold text-[#4a3e33] uppercase tracking-wider">
                            Moderator Note
                          </p>
                        </div>
                        <p className="text-sm text-[#2f251d] font-medium ink-text">
                          "{notif.reason}"
                        </p>
                      </div>
                    )}
                    
                    {notif.link && (
                      <div className="mt-3 flex items-center gap-4">
                        <Link
                          href={notif.link}
                          onClick={(e) => {
                            if (isUnread) markAsRead(notif.id);
                            e.stopPropagation();
                          }}
                          className="text-xs font-bold text-[#221910] uppercase tracking-wide underline underline-offset-4 hover:text-[#5a4b3f] transition-colors"
                        >
                          View Details &rarr;
                        </Link>
                        {isUnread && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif.id);
                            }}
                            className="text-[11px] font-semibold text-[#6a5a4c] hover:text-[#221910] uppercase tracking-wide transition-colors"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
