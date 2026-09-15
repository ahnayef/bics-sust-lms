"use client";

import { useEffect, useState } from "react";
import type { NotificationItem } from "@/types/library";

const STORAGE_KEY = "bics_lms_read_notifications";

type ReadMap = Record<string, string[]>; // { [userId]: [notificationId1, notificationId2] }

export function useNotificationStore(userId: string, notifications: NotificationItem[]) {
  const [readIds, setReadIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    if (!userId) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ReadMap;
        setReadIds(parsed[userId] || []);
      }
    } catch (err) {
      console.error("Failed to load notifications from local storage", err);
    }
    setIsLoaded(true);
  }, [userId]);

  // Derived state
  const unreadCount = isLoaded
    ? notifications.filter((n) => !readIds.includes(n.id)).length
    : 0;

  const markAsRead = (id: string) => {
    if (readIds.includes(id)) return;
    const newReadIds = [...readIds, id];
    setReadIds(newReadIds);
    updateStorage(newReadIds);
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const newReadIds = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(newReadIds);
    updateStorage(newReadIds);
  };

  const updateStorage = (newIds: string[]) => {
    if (!userId) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed: ReadMap = stored ? JSON.parse(stored) : {};
      parsed[userId] = newIds;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      
      // Dispatch custom event for cross-component sync
      window.dispatchEvent(new Event("notifications_updated"));
    } catch (err) {
      console.error("Failed to save notifications to local storage", err);
    }
  };

  // Listen for updates from other components
  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ReadMap;
          setReadIds(parsed[userId] || []);
        }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener("notifications_updated", handleSync);
    return () => window.removeEventListener("notifications_updated", handleSync);
  }, [userId]);

  return {
    readIds,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoaded,
  };
}
