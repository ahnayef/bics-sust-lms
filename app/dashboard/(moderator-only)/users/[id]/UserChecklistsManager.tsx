"use client";

import { toggleChecklistItemForUser } from "@/server/checklist-actions";
import type { ChecklistWithItems } from "@/server/checklists";
import { useState, useTransition } from "react";
import { FaCheckSquare, FaSpinner, FaSquare, FaTasks } from "react-icons/fa";

interface Props {
  userId: string;
  userName: string;
  checklists: ChecklistWithItems[];
  initialCompletedItemIds: string[];
  language?: string;
}

export default function UserChecklistsManager({
  userId,
  userName,
  checklists,
  initialCompletedItemIds,
  language = "en",
}: Props) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set(initialCompletedItemIds),
  );
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (itemId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setLoadingItemId(itemId);

    // Optimistic update
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (nextStatus) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });

    startTransition(async () => {
      const res = await toggleChecklistItemForUser(userId, itemId, nextStatus);
      setLoadingItemId(null);
      if (res?.error) {
        // Rollback on error
        setCompletedIds((prev) => {
          const revert = new Set(prev);
          if (currentStatus) {
            revert.add(itemId);
          } else {
            revert.delete(itemId);
          }
          return revert;
        });
      }
    });
  };

  return (
    <div className="dashboard-surface tron-border rounded-sm p-5 sm:p-6 shadow-xs space-y-5">
      <div className="border-b border-[#c9b89a] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-[#221910] ink-title uppercase tracking-[0.05em] flex items-center gap-2">
            <FaTasks className="w-4 h-4 text-[#6e5d4a]" />
            <span>
              {language === "bn"
                ? "চেকলিস্ট অগ্রগতি ও অ্যাকশন"
                : "Checklist Progress & Management"}
            </span>
          </h2>
          <p className="text-xs text-[#6e5d4a] mt-0.5 ink-text">
            {language === "bn"
              ? "সরাসরি যেকোনো টাস্কে ক্লিক করে সম্পন্ন বা অসম্পন্ন হিসেবে চিহ্নিত করুন।"
              : "Click any item checkbox to toggle completion directly for this member."}
          </p>
        </div>
        <span className="text-xs font-mono font-semibold text-[#6e5d4a] bg-[#eadcc8] border border-[#d2bfa5] px-2.5 py-1 rounded-md shrink-0 w-fit">
          {checklists.length} {language === "bn" ? "টি চেকলিস্ট" : "Checklists"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
        {checklists.map((checklist) => {
          const totalItems = checklist.items.length;
          const completedCount = checklist.items.filter((item) =>
            completedIds.has(item.id),
          ).length;
          const percent =
            totalItems > 0
              ? Math.round((completedCount / totalItems) * 100)
              : 0;

          return (
            <div
              key={checklist.id}
              className="p-4 bg-[#f6ecdd] border border-[#b9a58b] rounded-sm space-y-3.5 shadow-2xs"
            >
              {/* Checklist Header */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm text-[#4a3a2c] ink-text">
                  <span className="font-bold text-base text-[#221910] truncate">
                    {checklist.name}
                  </span>
                  <span className="font-bold text-sm text-[#2d521f] shrink-0 ml-2">
                    {percent}% ({completedCount}/{totalItems})
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#e4d4bf] border border-[#ccb79b] overflow-hidden">
                  <div
                    className="h-full bg-[#4a7c59] transition-all rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Checklist Items List (Interactive) */}
              <div className="space-y-1.5 pt-2 border-t border-[#e2d5c3] max-h-80 overflow-y-auto pr-1">
                {checklist.items.map((item) => {
                  const isCompleted = completedIds.has(item.id);
                  const isItemLoading = loadingItemId === item.id && isPending;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isItemLoading}
                      onClick={() => handleToggle(item.id, isCompleted)}
                      className={`w-full text-left flex items-start gap-2.5 p-2 rounded-lg text-xs sm:text-sm transition-colors cursor-pointer ${
                        isCompleted
                          ? "bg-[#eef5e9]/70 hover:bg-[#e3edd9] border border-[#c4dab9]"
                          : "bg-[#fffaf2] hover:bg-[#f2e7d7] border border-[#e2d5c3]"
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {isItemLoading ? (
                          <FaSpinner className="w-4 h-4 text-[#7a6a5c] animate-spin" />
                        ) : isCompleted ? (
                          <FaCheckSquare className="w-4 h-4 text-[#4a7c59]" />
                        ) : (
                          <FaSquare className="w-4 h-4 text-[#b9a58b]" />
                        )}
                      </div>
                      <span
                        className={`ink-text flex-1 min-w-0 break-words ${
                          isCompleted
                            ? "text-[#2b2119] font-medium"
                            : "text-[#6e5d4a]"
                        }`}
                      >
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
