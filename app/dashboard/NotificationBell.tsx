"use client";

import { useTranslation } from "@/lib/i18n/context";
import { getRelativeTime } from "@/lib/utils";
import type { NotificationItem } from "@/types/library";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaMapMarkerAlt, FaShieldAlt, FaTimesCircle, FaUserCheck, FaUserPlus, FaUserTimes } from "react-icons/fa";
import { useNotificationStore } from "./useNotificationStore";

interface Props {
  userId: string;
  notifications: NotificationItem[];
}

export default function NotificationBell({ userId, notifications }: Props) {
  const { t, language } = useTranslation();
  const { readIds, markAsRead, markAllAsRead, isLoaded } = useNotificationStore(userId, notifications);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

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
      case "thana_deleted":
        return <FaMapMarkerAlt className="text-orange-600 w-4 h-4 mt-0.5" />;
      default:
        return <FaInfoCircle className="text-gray-600 w-4 h-4 mt-0.5" />;
    }
  };

  const sortedNotifications = [...notifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const recentNotifications = sortedNotifications.slice(0, 3);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#5a4b3f] hover:text-[#221910] hover:bg-[#ece0ce] rounded-full transition-colors"
        title={t.notifications.title}
      >
        <FaBell className="w-4 h-4 lg:w-5 lg:h-5" />
        {isLoaded && unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 w-4 lg:h-5 lg:w-5 items-center justify-center rounded-full bg-red-600 text-[9px] lg:text-[10px] font-bold text-white shadow-sm ring-2 ring-[#f1e7d8]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 bg-[#f4ebdf] border border-[#bfa687] rounded-sm shadow-lg z-50 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#e8d9c4] flex items-center justify-between">
            <h3 className="text-sm font-bold ink-title text-[#221910]">{t.notifications.title}</h3>
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="text-xs font-semibold text-[#5a4b3f] hover:text-[#221910] ink-text transition-colors"
              >
                {t.notifications.markAllRead}
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {recentNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-[#7a6a5c] ink-text">{t.notifications.empty}</p>
              </div>
            ) : (
              <ul className="">
                {recentNotifications.map((notif) => {
                  const isUnread = !readIds.includes(notif.id);
                  return (
                    <li
                      key={notif.id}
                      className={`p-4 border-b transition-colors cursor-pointer relative ${isUnread
                        ? "bg-[#efe9dc] border-[#d3c1a9] shadow-sm"
                        : "bg-[#efdec2]/50 border-[#e4d4bf] opacity-80"
                        }`}
                      onClick={() => {
                        if (isUnread) markAsRead(notif.id);
                        if (notif.link) {
                          window.location.href = notif.link;
                          setIsOpen(false);
                        }
                      }}
                    >
                      {isUnread && (
                        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 shadow-sm" />
                      )}
                      <div className="flex items-start gap-3 pr-6">
                        <div className="shrink-0">{getIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`text-sm font-semibold ink-title ${isUnread ? "text-[#221910]" : "text-[#3f3328]"
                              }`}>
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-[#8a7a6c] ink-text whitespace-nowrap shrink-0">
                              {getRelativeTime(notif.date)}
                            </span>
                          </div>
                          <p className={`text-xs ink-text mb-1 ${isUnread ? "text-[#4a3e33]" : "text-[#5a4b3f]"
                            }`}>
                            {notif.message}
                          </p>
                          {notif.reason && (
                            <div className="text-[10px] text-[#5a4b3f] ink-text italic">
                              {notif.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="p-3 border-t border-[#e8d9c4] bg-[#f4ede0]">
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-xs font-semibold text-[#5a4b3f] hover:text-[#221910] ink-text transition-colors"
            >
              {t.notifications.seeAll || "See all notifications"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
