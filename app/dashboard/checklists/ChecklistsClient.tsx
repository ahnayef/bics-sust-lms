"use client";

import ConfirmModal from "@/components/ui/confirm-modal";
import { toggleChecklistItem } from "@/server/checklist-actions";
import type { ChecklistWithItems } from "@/server/checklists";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface Props {
  initialChecklists: ChecklistWithItems[];
  userId: string;
  initialCompletedItemIds: string[];
}

interface ConfirmationState {
  itemId: string;
  currentChecked: boolean;
  itemName: string;
}

export default function ChecklistsClient({
  initialChecklists,
  initialCompletedItemIds,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [completedItemIds, setCompletedItemIds] = useState<Set<string>>(
    new Set(initialCompletedItemIds)
  );
  const [flash, setFlash] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);

  const showFlash = (type: "success" | "error", text: string) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), 4500);
  };

  const handleConfirmToggle = async () => {
    if (!confirmation) return;

    // Optimistic update
    const next = new Set(completedItemIds);
    if (confirmation.currentChecked) next.delete(confirmation.itemId);
    else next.add(confirmation.itemId);
    setCompletedItemIds(next);

    startTransition(async () => {
      try {
        const result = await toggleChecklistItem(confirmation.itemId, !confirmation.currentChecked);
        
        if (result?.error) {
          // Revert optimistic update on error
          setCompletedItemIds(new Set(initialCompletedItemIds));
          showFlash("error", result.error);
          setConfirmation(null);
          return;
        }
        
        showFlash("success", confirmation.currentChecked ? "Item marked as incomplete" : "Item marked as complete!");
        setConfirmation(null);
        router.refresh();
      } catch (err: any) {
        // Revert optimistic update on error
        setCompletedItemIds(new Set(initialCompletedItemIds));
        showFlash("error", err.message || "Something went wrong");
        setConfirmation(null);
      }
    });
  };

  const handleToggleClick = (itemId: string, currentChecked: boolean, itemName: string) => {
    setConfirmation({ itemId, currentChecked, itemName });
  };

  return (
    <div className="space-y-6">
      {flash && (
        <div
          className={`fixed top-20 right-4 z-50 p-4 rounded-sm shadow-xl border ${flash.type === "success"
              ? "bg-[#eef5e9] border-[#a3b994] text-[#3d5c2e]"
              : "bg-[#fdf0ec] border-[#d0604a] text-[#8b2c1a]"
            }`}
        >
          <p className="text-sm font-bold">{flash.text}</p>
        </div>
      )}

      {initialChecklists.length === 0 ? (
        <section className="dashboard-surface tron-border rounded-sm p-8 text-center">
          <p className="text-[#5a4b3f]">No checklists available yet.</p>
        </section>
      ) : (
        initialChecklists.map((checklist) => {
          const total = checklist.items.length;
          const completed = checklist.items.filter((item) =>
            completedItemIds.has(item.id)
          ).length;
          const progress = total > 0 ? (completed / total) * 100 : 0;

          return (
            <section
              key={checklist.id}
              className="dashboard-surface tron-border rounded-sm overflow-hidden"
            >
              <div className="px-6 py-4 bg-[#eadcc8]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-[#221910]">{checklist.name}</h3>
                  <span className="text-sm font-medium text-[#5a4b3f]">
                    {completed}/{total}
                  </span>
                </div>
                <div className="h-2 bg-[#d2bfa5] rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-[#4a7c59] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="divide-y divide-[#d2bfa5]">
                {checklist.items.map((item) => {
                  const isChecked = completedItemIds.has(item.id);
                  return (
                    <label
                      key={item.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-[#f4ebdc] transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleClick(item.id, isChecked, item.name)}
                        className="w-5 h-5 accent-[#4a7c59] cursor-pointer"
                      />
                      <span
                        className={`text-[#2b2119] ${isChecked ? "line-through text-[#8a7966]" : ""
                          }`}
                      >
                        {item.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      <ConfirmModal
        open={!!confirmation}
        onClose={() => setConfirmation(null)}
        onConfirm={handleConfirmToggle}
        title={confirmation?.currentChecked ? "Mark as Incomplete?" : "Mark as Complete?"}
        description={`Are you sure you want to mark "${confirmation?.itemName}" as ${confirmation?.currentChecked ? "incomplete" : "complete"}?`}
        confirmLabel={confirmation?.currentChecked ? "Mark Incomplete" : "Mark Complete"}
        loading={isPending}
      />
    </div>
  );
}
