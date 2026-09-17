"use client";

import StatusBadge from "@/app/components/StatusBadge";
import ConfirmModal from "@/components/ui/confirm-modal";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  addChecklistItem,
  createChecklist,
  deleteChecklist,
  deleteChecklistItem,
  updateChecklist,
  updateChecklistItem,
} from "@/server/checklist-actions";
import type { ChecklistWithItems } from "@/server/checklists";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaEdit,
  FaPlus,
  FaTrash,
} from "react-icons/fa";

interface Props {
  initialChecklists: ChecklistWithItems[];
}

export default function ChecklistsManageClient({ initialChecklists }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [flash, setFlash] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [expandedChecklists, setExpandedChecklists] = useState<Set<string>>(
    new Set(initialChecklists.map((c) => c.id)),
  );

  // Modal states
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [editingChecklist, setEditingChecklist] =
    useState<ChecklistWithItems | null>(null);
  const [checklistFormData, setChecklistFormData] = useState({
    name: "",
    visible: true,
  });

  const [showItemModal, setShowItemModal] = useState(false);
  const [currentChecklistId, setCurrentChecklistId] = useState<string | null>(
    null,
  );
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemFormData, setItemFormData] = useState({ name: "" });

  const [deleteId, setDeleteId] = useState<{
    type: "checklist" | "item";
    id: string;
  } | null>(null);

  const showFlash = (type: "success" | "error", text: string) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), 4500);
  };

  const toggleExpanded = (id: string) => {
    const next = new Set(expandedChecklists);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedChecklists(next);
  };

  const handleAddChecklist = () => {
    setEditingChecklist(null);
    setChecklistFormData({ name: "", visible: true });
    setShowChecklistModal(true);
  };

  const handleEditChecklist = (checklist: ChecklistWithItems) => {
    setEditingChecklist(checklist);
    setChecklistFormData({ name: checklist.name, visible: checklist.visible });
    setShowChecklistModal(true);
  };

  const handleSubmitChecklist = async () => {
    if (!checklistFormData.name.trim()) return;

    startTransition(async () => {
      try {
        let result;
        if (editingChecklist) {
          result = await updateChecklist(
            editingChecklist.id,
            checklistFormData.name,
            checklistFormData.visible,
          );
        } else {
          result = await createChecklist(
            checklistFormData.name,
            checklistFormData.visible,
          );
        }

        if (result?.error) {
          showFlash("error", result.error);
          return;
        }

        showFlash(
          "success",
          editingChecklist ? "Checklist updated" : "Checklist added",
        );
        setShowChecklistModal(false);
        router.refresh();
      } catch (err: any) {
        showFlash("error", err.message || "Something went wrong");
      }
    });
  };

  const handleAddItem = (checklistId: string) => {
    setCurrentChecklistId(checklistId);
    setEditingItem(null);
    setItemFormData({ name: "" });
    setShowItemModal(true);
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setItemFormData({ name: item.name });
    setShowItemModal(true);
  };

  const handleSubmitItem = async () => {
    if (!itemFormData.name.trim() || !currentChecklistId) return;

    startTransition(async () => {
      try {
        let result;
        if (editingItem) {
          result = await updateChecklistItem(editingItem.id, itemFormData.name);
        } else {
          result = await addChecklistItem(
            currentChecklistId,
            itemFormData.name,
          );
        }

        if (result?.error) {
          showFlash("error", result.error);
          return;
        }

        showFlash("success", editingItem ? "Item updated" : "Item added");
        setShowItemModal(false);
        router.refresh();
      } catch (err: any) {
        showFlash("error", err.message || "Something went wrong");
      }
    });
  };

  const handleDeleteClick = (type: "checklist" | "item", id: string) => {
    setDeleteId({ type, id });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    startTransition(async () => {
      try {
        let result;
        if (deleteId.type === "checklist") {
          result = await deleteChecklist(deleteId.id);
        } else {
          result = await deleteChecklistItem(deleteId.id);
        }

        if (result?.error) {
          showFlash("error", result.error);
          return;
        }

        showFlash(
          "success",
          deleteId.type === "checklist" ? "Checklist deleted" : "Item deleted",
        );
        setDeleteId(null);
        router.refresh();
      } catch (err: any) {
        showFlash("error", err.message || "Something went wrong");
      }
    });
  };

  return (
    <div className="space-y-6">
      {flash && (
        <div
          className={`fixed top-20 right-4 z-50 p-4 rounded-sm shadow-xl border ${
            flash.type === "success"
              ? "bg-[#eef5e9] border-[#a3b994] text-[#3d5c2e]"
              : "bg-[#fdf0ec] border-[#d0604a] text-[#8b2c1a]"
          }`}
        >
          <p className="text-sm font-bold">{flash.text}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleAddChecklist}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#3f3328] text-[#f4e8d4] hover:bg-[#221910] transition-colors rounded-sm font-bold text-sm"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Add Checklist
        </button>
      </div>

      <div className="space-y-4">
        {initialChecklists.map((checklist) => (
          <section
            key={checklist.id}
            className="dashboard-surface tron-border rounded-sm overflow-hidden"
          >
            <div
              className="flex items-center justify-between px-6 py-4 bg-[#eadcc8] cursor-pointer hover:bg-[#e3d3bc] transition-colors"
              onClick={() => toggleExpanded(checklist.id)}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(checklist.id);
                  }}
                  className="p-1 text-[#5b4c3f]"
                >
                  {expandedChecklists.has(checklist.id) ? (
                    <FaChevronUp className="w-4 h-4" />
                  ) : (
                    <FaChevronDown className="w-4 h-4" />
                  )}
                </button>
                <h3 className="text-lg font-bold text-[#221910]">
                  {checklist.name}
                </h3>
                {checklist.visible ? (
                  <StatusBadge tone="success">Visible</StatusBadge>
                ) : (
                  <StatusBadge tone="neutral">Hidden</StatusBadge>
                )}
              </div>
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleAddItem(checklist.id)}
                  className="p-2 text-[#5b4c3f] hover:bg-[#e3d3bc] rounded-sm transition-colors"
                >
                  <FaPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditChecklist(checklist)}
                  className="p-2 text-[#5b4c3f] hover:bg-[#e3d3bc] rounded-sm transition-colors"
                >
                  <FaEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick("checklist", checklist.id)}
                  className="p-2 text-[#6a4e3d] hover:bg-[#e3d3bc] rounded-sm transition-colors"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
            </div>

            {expandedChecklists.has(checklist.id) && (
              <div className="divide-y divide-[#d2bfa5]">
                {checklist.items.length === 0 ? (
                  <div className="px-6 py-8 text-center text-[#5a4b3f]">
                    No items yet. Click + to add one!
                  </div>
                ) : (
                  checklist.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-[#f4ebdc] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#eadcc8] text-[#3f3328] font-bold text-sm">
                          {index + 1}
                        </span>
                        <span className="text-[#2b2119] font-medium">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-2 text-[#5b4c3f] hover:bg-[#eadcc8] rounded-sm transition-colors"
                          title="Edit item"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick("item", item.id)}
                          className="p-2 text-[#6a4e3d] hover:bg-[#eadcc8] rounded-sm transition-colors"
                          title="Delete item"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        ))}
      </div>

      {showChecklistModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4 z-50">
            <div className="dashboard-surface tron-border rounded-sm max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-[#221910] mb-4">
                {editingChecklist ? "Edit Checklist" : "Add Checklist"}
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitChecklist();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-[#4f4134] mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={checklistFormData.name}
                    onChange={(e) =>
                      setChecklistFormData({
                        ...checklistFormData,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-[#8a7966] bg-[#f6ecdd] rounded-sm outline-none"
                    placeholder="e.g. বই নোট"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="visible"
                    checked={checklistFormData.visible}
                    onChange={(e) =>
                      setChecklistFormData({
                        ...checklistFormData,
                        visible: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#3f3328]"
                  />
                  <label
                    htmlFor="visible"
                    className="text-sm font-medium text-[#4f4134]"
                  >
                    Visible to users
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowChecklistModal(false)}
                    className="px-4 py-2 text-[#5a4b3f] hover:bg-[#ece0ce] rounded-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 bg-[#3f3328] text-[#f4e8d4] rounded-sm font-bold disabled:opacity-50"
                  >
                    {editingChecklist ? "Update" : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {showItemModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4 z-50">
            <div className="dashboard-surface tron-border rounded-sm max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-[#221910] mb-4">
                {editingItem ? "Edit Item" : "Add Item"}
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitItem();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-[#4f4134] mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={itemFormData.name}
                    onChange={(e) =>
                      setItemFormData({ ...itemFormData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-[#8a7966] bg-[#f6ecdd] rounded-sm outline-none"
                    placeholder="e.g. চরিত্র গঠনের মৌলিক উপাদান"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowItemModal(false)}
                    className="px-4 py-2 text-[#5a4b3f] hover:bg-[#ece0ce] rounded-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 bg-[#3f3328] text-[#f4e8d4] rounded-sm font-bold disabled:opacity-50"
                  >
                    {editingItem ? "Update" : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={
          deleteId?.type === "checklist" ? "Delete Checklist" : "Delete Item"
        }
        description={
          deleteId?.type === "checklist"
            ? "This will delete the checklist and all its items. This cannot be undone."
            : "This will delete the item. This cannot be undone."
        }
        danger
        loading={isPending}
      />
    </div>
  );
}
