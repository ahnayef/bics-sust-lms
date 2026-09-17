"use client";

import StatusBadge from "@/app/components/StatusBadge";
import { InventoryNav } from "@/app/dashboard/components/StaffHubNav";
import ConfirmModal from "@/components/ui/confirm-modal";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  addCategory,
  editCategory,
  getCategoryRefCount,
  removeCategory,
} from "@/server/library-actions";
import type { Category } from "@/types/library";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";

interface Props {
  initialCategories: Category[];
}

export default function CategoriesClient({ initialCategories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    count_in_progress: false,
  });
  const [flash, setFlash] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [refCount, setRefCount] = useState<{
    books: number;
    profiles: number;
  } | null>(null);

  const showFlash = (type: "success" | "error", text: string) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), 4500);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ name: "", count_in_progress: false });
    setShowAddModal(true);
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, count_in_progress: cat.count_in_progress });
    setShowAddModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    startTransition(async () => {
      const fd = new FormData();
      if (editingCategory) fd.set("id", editingCategory.id);
      fd.set("name", formData.name.trim());
      fd.set(
        "count_in_progress",
        formData.count_in_progress ? "true" : "false",
      );

      const result = editingCategory
        ? await editCategory(fd)
        : await addCategory(fd);

      if (result.error) {
        showFlash("error", result.error);
      } else {
        showFlash(
          "success",
          editingCategory ? "Category updated" : "Category added",
        );
        setShowAddModal(false);
        router.refresh();
      }
    });
  };

  const handleDeleteClick = async (id: string) => {
    setDeleteId(id);
    const counts = await getCategoryRefCount(id);
    setRefCount(counts);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", deleteId);
      const result = await removeCategory(fd);
      if (result.error) {
        showFlash("error", result.error);
      } else {
        showFlash("success", "Category deleted");
        setDeleteId(null);
        setRefCount(null);
        router.refresh();
      }
    });
  };

  const deleteDescription = refCount ? (
    <span>
      This category is referenced by{" "}
      <b className="font-bold">{refCount.books}</b> books and{" "}
      <b className="font-bold">{refCount.profiles}</b> profiles. Deleting it
      will move these books and profiles to the <b>Additional</b> category. This
      cannot be undone.
    </span>
  ) : (
    "Checking references..."
  );

  return (
    <div className="space-y-6">
      {/* Inventory Hub Sub-Navigation */}
      <InventoryNav />

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
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
          Book Categories
        </h1>
        <p className="text-[#5a4b3f] mt-1 ink-text text-sm">
          Manage book categories. Books assigned to categories with "Count in
          Progress&quot; enabled will show up in user reading progress bars.
        </p>
      </section>
      <div className="flex justify-end">
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#3f3328] text-[#f4e8d4] hover:bg-[#221910] transition-colors rounded-sm font-bold text-sm"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Add Category
        </button>
      </div>

      <section className="dashboard-surface tron-border rounded-sm overflow-hidden">
        <table className="w-full text-sm text-left ink-text">
          <thead>
            <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
              <th className="px-6 py-3 font-bold uppercase tracking-wider text-[#5c4f42]">
                Name
              </th>
              <th className="px-6 py-3 font-bold uppercase tracking-wider text-[#5c4f42]">
                Count Progress
              </th>
              <th className="px-6 py-3 font-bold uppercase tracking-wider text-[#5c4f42] text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d2bfa5]">
            {initialCategories.map((cat) => (
              <tr key={cat.id} className="hover:bg-[#f4ebdc] transition-colors">
                <td className="px-6 py-4 font-medium text-[#2b2119]">
                  {cat.name}
                </td>
                <td className="px-6 py-4">
                  {cat.count_in_progress ? (
                    <StatusBadge tone="success">Enabled</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Disabled</StatusBadge>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-2 text-[#5b4c3f] hover:bg-[#eadcc8] rounded-sm transition-colors"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(cat.id)}
                      className="p-2 text-[#6a4e3d] hover:bg-[#eadcc8] rounded-sm transition-colors"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {showAddModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center p-4 z-50">
            <div className="dashboard-surface tron-border rounded-sm max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-[#221910] mb-4">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4f4134] mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-[#8a7966] bg-[#f6ecdd] rounded-sm outline-none"
                    placeholder="e.g. Quran, Hadith"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="count_in_progress"
                    checked={formData.count_in_progress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        count_in_progress: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#3f3328]"
                  />
                  <label
                    htmlFor="count_in_progress"
                    className="text-sm font-medium text-[#4f4134]"
                  >
                    Count in reading progress
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-[#5a4b3f] hover:bg-[#ece0ce] rounded-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="px-4 py-2 bg-[#3f3328] text-[#f4e8d4] rounded-sm font-bold disabled:opacity-50"
                  >
                    {editingCategory ? "Update" : "Add"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Category"
        description={deleteDescription}
        danger
        loading={isPending}
      />
    </div>
  );
}
