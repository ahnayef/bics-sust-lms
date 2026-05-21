"use client";
import StatusBadge from "@/app/components/StatusBadge";
import ConfirmModal from "@/components/ui/confirm-modal";
import { useTranslation } from "@/lib/i18n/context";
import { addBook, editBook, getBookRefCount, removeBook } from "@/server/library-actions";
import type { Book } from "@/types/library";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { FaDownload, FaEdit, FaPlus, FaSearch, FaTimes, FaTrash } from "react-icons/fa";

type BookTypeFilter = "all" | "syllabus" | "additional";

interface BookForm {
  id: string;
  title: string;
  author: string;
  is_syllabus: boolean;
  pages: string;
  pdf_link: string;
  auto_add_first_copy: boolean;
}

const EMPTY_FORM: BookForm = {
  id: "",
  title: "",
  author: "",
  is_syllabus: true,
  pages: "",
  pdf_link: "",
  auto_add_first_copy: false,
};

interface Props {
  initialBooks: Book[];
}

type PendingAction =
  | { type: "add" }
  | { type: "update" }
  | { type: "delete"; id: string; title: string; author: string };

export default function BooksClient({ initialBooks }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<BookTypeFilter>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookForm>(EMPTY_FORM);
  const [flash, setFlash] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [refCount, setRefCount] = useState<number | null>(null);

  useEffect(() => {
    if (!showAddModal) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showAddModal]);

  /* Keep local list in sync when the server component re-renders after router.refresh() */
  useEffect(() => {
    setBooks(initialBooks);
  }, [initialBooks]);

  const showFlash = (type: "success" | "error", text: string) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), 4500);
  };

  const counts = useMemo(
    () => ({
      total: books.length,
      syllabus: books.filter((b) => b.is_syllabus).length,
      additional: books.filter((b) => !b.is_syllabus).length,
      copies: books.reduce((sum, b) => sum + (b.copies?.length ?? 0), 0),
    }),
    [books],
  );

  const filteredBooks = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query);
      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "syllabus" ? book.is_syllabus : !book.is_syllabus);
      return matchesSearch && matchesType;
    });
  }, [books, searchTerm, typeFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setShowAddModal(true);
  };

  const handleAdd = () => {
    if (!formData.title.trim() || !formData.author.trim()) return;
    setPendingAction({ type: "add" });
  };

  const confirmAdd = () => {
    setPendingAction(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", formData.title.trim());
      fd.set("author", formData.author.trim());
      fd.set("is_syllabus", formData.is_syllabus ? "true" : "false");
      if (formData.pages) fd.set("pages", formData.pages);
      if (formData.pdf_link.trim()) fd.set("pdf_link", formData.pdf_link.trim());
      if (formData.auto_add_first_copy) fd.set("auto_add_first_copy", "true");

      const result = await addBook(fd);
      if (result.error) {
        showFlash("error", result.error);
      } else {
        showFlash("success", t.books.flash.addSuccess);
        closeModal();
        router.refresh();
      }
    });
  };

  const handleEdit = (id: string) => {
    const book = books.find((b) => b.id === id);
    if (!book) return;
    setFormData({
      id: book.id,
      title: book.title,
      author: book.author,
      is_syllabus: book.is_syllabus,
      pages: book.pages?.toString() ?? "",
      pdf_link: book.pdf_link ?? "",
      auto_add_first_copy: false,
    });
    setEditingId(id);
    setShowAddModal(true);
  };

  const handleUpdate = () => {
    if (!formData.title.trim() || !formData.author.trim()) return;
    setPendingAction({ type: "update" });
  };

  const confirmUpdate = () => {
    setPendingAction(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", formData.id);
      fd.set("title", formData.title.trim());
      fd.set("author", formData.author.trim());
      fd.set("is_syllabus", formData.is_syllabus ? "true" : "false");
      if (formData.pages) fd.set("pages", formData.pages);
      if (formData.pdf_link.trim()) fd.set("pdf_link", formData.pdf_link.trim());

      const result = await editBook(fd);
      if (result.error) {
        showFlash("error", result.error);
      } else {
        showFlash("success", t.books.flash.updateSuccess);
        closeModal();
        router.refresh();
      }
    });
  };

  const handleDelete = async (id: string) => {
    const book = books.find((b) => b.id === id);
    if (!book) return;

    // Check ref count
    const count = await getBookRefCount(id);
    setRefCount(count);
    setPendingAction({
      type: "delete",
      id,
      title: book.title,
      author: book.author,
    });
  };

  const confirmDelete = () => {
    if (pendingAction?.type !== "delete") return;
    const id = pendingAction.id;
    setPendingAction(null);
    setRefCount(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      const result = await removeBook(fd);
      if (result.error) {
        showFlash("error", result.error);
      } else {
        showFlash("success", t.books.flash.deleteSuccess);
        router.refresh();
      }
    });
  };

  const closeModal = () => {
    if (isPending) return;
    setShowAddModal(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  return (
    <div className="space-y-6">
      {/* Flash Messages */}
      {flash && (
        <div
          className={`fixed top-20 right-4 z-100 p-4 rounded-sm shadow-xl border animate-in fade-in slide-in-from-right-4 duration-300 ${flash.type === "success"
            ? "bg-[#eef5e9] border-[#a3b994] text-[#3d5c2e]"
            : "bg-[#fdf0ec] border-[#d0604a] text-[#8b2c1a]"
            }`}
        >
          <div className="flex items-center gap-2">
            {flash.type === "success" ? "✓" : "✕"}
            <p className="text-sm font-bold ink-text">{flash.text}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
              {t.books.title}
            </h1>
            <p className="text-sm text-[#5c4f42] mt-1 ink-text">
              {t.books.subtitle}
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#3f3328] text-[#f4e8d4] hover:bg-[#221910] transition-colors rounded-sm font-bold shadow-md ink-title"
          >
            <FaPlus className="w-4 h-4" />
            {t.books.actions.addBook}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-[#f6ecdd] border border-[#b9a58b] p-3 rounded-sm">
            <p className="text-[10px] uppercase tracking-wider text-[#5c4f42] ink-text">
              {t.books.stats.total}
            </p>
            <p className="text-xl font-bold text-[#221910] ink-title">
              {counts.total}
            </p>
          </div>
          <div className="bg-[#f6ecdd] border border-[#b9a58b] p-3 rounded-sm">
            <p className="text-[10px] uppercase tracking-wider text-[#5c4f42] ink-text">
              {t.books.stats.syllabus}
            </p>
            <p className="text-xl font-bold text-[#221910] ink-title">
              {counts.syllabus}
            </p>
          </div>
          <div className="bg-[#f6ecdd] border border-[#b9a58b] p-3 rounded-sm">
            <p className="text-[10px] uppercase tracking-wider text-[#5c4f42] ink-text">
              {t.books.stats.additional}
            </p>
            <p className="text-xl font-bold text-[#221910] ink-title">
              {counts.additional}
            </p>
          </div>
          <div className="bg-[#f6ecdd] border border-[#b9a58b] p-3 rounded-sm">
            <p className="text-[10px] uppercase tracking-wider text-[#5c4f42] ink-text">
              {t.books.stats.copies}
            </p>
            <p className="text-xl font-bold text-[#221910] ink-title">
              {counts.copies}
            </p>
          </div>
        </div>
      </section>

      {/* Main Table */}
      <section className="dashboard-surface tron-border rounded-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 sm:p-5 border-b border-[#7d6d5a] bg-[#eadcc8]/40 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7966] w-4 h-4" />
            <input
              type="text"
              placeholder={t.books.filters.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {(["all", "syllabus", "additional"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`px-4 py-2 rounded-sm text-xs font-bold whitespace-nowrap border transition-all ${typeFilter === f
                  ? "bg-[#3f3328] text-[#f4e8d4] border-[#3f3328]"
                  : "bg-[#f6ecdd] text-[#5c4f42] border-[#b9a58b] hover:bg-[#ece0ce]"
                  }`}
              >
                {t.books.filters[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm ink-text text-left">
            <thead>
              <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                <th className="px-4 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5c4f42]">
                  {t.books.table.title}
                </th>
                <th className="px-4 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5c4f42]">
                  {t.books.table.author}
                </th>
                <th className="px-4 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5c4f42]">
                  {t.books.table.pages}
                </th>
                <th className="px-4 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5c4f42]">
                  {t.books.table.copies}
                </th>
                <th className="px-4 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5c4f42]">
                  {t.books.table.type}
                </th>
                <th className="px-4 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5c4f42]">
                  {t.books.table.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book) => (
                <tr
                  key={book.id}
                  className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 font-medium text-[#2b2119]">
                    {book.title}
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-[#5a4b3f]">
                    {book.author}
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <StatusBadge tone="neutral">
                      {book.pages ?? "—"}
                    </StatusBadge>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <StatusBadge tone="muted">
                      {book.copies?.length ?? 0}
                    </StatusBadge>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <StatusBadge tone="neutral">
                      {book.is_syllabus ? t.books.filters.syllabus : t.books.filters.additional}
                    </StatusBadge>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-2">
                      {book.pdf_link ? (
                        <a
                          href={book.pdf_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-[#4e4033] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                          aria-label={`${t.books.actions.downloadPdf} ${book.title}`}
                          title={t.books.actions.downloadPdf}
                        >
                          <FaDownload className="w-4 h-4" />
                        </a>
                      ) : null}
                      <button
                        onClick={() => handleEdit(book.id)}
                        disabled={isPending}
                        className="p-2 text-[#5b4c3f] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors disabled:opacity-55"
                        aria-label={`${t.books.actions.edit} ${book.title}`}
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
                        disabled={isPending}
                        className="p-2 text-[#6a4e3d] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors disabled:opacity-55"
                        aria-label={`${t.books.actions.delete} ${book.title}`}
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredBooks.length === 0 && (
          <div className="text-center py-12 text-[#6a5a4c] ink-text">
            <p>{t.books.empty}</p>
          </div>
        )}
      </section>

      {/* Add / Edit modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-4 z-80"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div
            className="dashboard-surface tron-border rounded-sm max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-[#221910] ink-title">
                {editingId ? t.books.modal.editTitle : t.books.modal.addTitle}
              </h2>
              <button
                onClick={closeModal}
                disabled={isPending}
                className="p-2 text-[#655648] hover:bg-[#e7d8c3] rounded-sm transition-colors"
                aria-label="Close book modal"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 ink-text">
              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  {t.books.modal.labels.title} *
                </label>
                <input
                  type="text"
                  placeholder={t.books.modal.placeholders.title}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  {t.books.modal.labels.author} *
                </label>
                <input
                  type="text"
                  placeholder={t.books.modal.placeholders.author}
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  {t.books.modal.labels.type} *
                </label>
                <select
                  value={formData.is_syllabus ? "syllabus" : "additional"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_syllabus: e.target.value === "syllabus",
                    })
                  }
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                >
                  <option value="syllabus">{t.books.modal.types.syllabus}</option>
                  <option value="additional">{t.books.modal.types.additional}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  {t.books.modal.labels.pages}
                </label>
                <input
                  type="number"
                  placeholder={t.books.modal.placeholders.pages}
                  value={formData.pages}
                  onChange={(e) =>
                    setFormData({ ...formData, pages: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  {t.books.modal.labels.pdfLink}
                </label>
                <input
                  type="url"
                  placeholder={t.books.modal.placeholders.pdfLink}
                  value={formData.pdf_link}
                  onChange={(e) =>
                    setFormData({ ...formData, pdf_link: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                />
              </div>

              {!editingId && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="auto_add"
                    checked={formData.auto_add_first_copy}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        auto_add_first_copy: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded-sm border-[#8a7966] bg-[#f6ecdd] text-[#3f3328] focus:ring-[#6e5d4a]"
                  />
                  <label
                    htmlFor="auto_add"
                    className="text-sm font-medium text-[#4f4134]"
                  >
                    {t.books.modal.labels.autoAddCopy}
                  </label>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  onClick={closeModal}
                  disabled={isPending}
                  className="flex-1 py-2.5 px-4 bg-[#f4e8d4] text-[#4a3825] border border-[#c9b99a] font-bold rounded-sm hover:bg-[#ece0ce] transition-colors disabled:opacity-55"
                >
                  {t.books.modal.cancel}
                </button>
                <button
                  onClick={editingId ? handleUpdate : handleAdd}
                  disabled={isPending}
                  className="flex-1 py-2.5 px-4 bg-[#3f3328] text-[#f4e8d4] font-bold rounded-sm hover:bg-[#221910] transition-colors disabled:opacity-55"
                >
                  {isPending
                    ? "..."
                    : editingId
                      ? t.books.modal.save
                      : t.books.modal.add}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        open={pendingAction?.type === "add"}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmAdd}
        title={t.books.modal.addTitle}
        confirmLabel={t.books.modal.add}
        loading={isPending}
        preview={
          <div className="space-y-1">
            <p>
              <span className="text-[#7a6a5c]">{t.books.table.title}:</span>{" "}
              {formData.title}
            </p>
            <p>
              <span className="text-[#7a6a5c]">{t.books.table.author}:</span>{" "}
              {formData.author}
            </p>
            <p>
              <span className="text-[#7a6a5c]">{t.books.table.type}:</span>{" "}
              {formData.is_syllabus ? t.books.modal.types.syllabus : t.books.modal.types.additional}
            </p>
          </div>
        }
      />

      <ConfirmModal
        open={pendingAction?.type === "update"}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmUpdate}
        title={t.books.modal.editTitle}
        confirmLabel={t.books.modal.save}
        loading={isPending}
        preview={
          <div className="space-y-1">
            <p>
              <span className="text-[#7a6a5c]">{t.books.table.title}:</span>{" "}
              {formData.title}
            </p>
            <p>
              <span className="text-[#7a6a5c]">{t.books.table.author}:</span>{" "}
              {formData.author}
            </p>
          </div>
        }
      />

      <ConfirmModal
        open={pendingAction?.type === "delete"}
        onClose={() => {
          setPendingAction(null);
          setRefCount(null);
        }}
        onConfirm={confirmDelete}
        title={t.books.confirmDelete.title}
        confirmLabel={t.books.actions.delete}
        danger
        loading={isPending}
        preview={
          <div className="space-y-3">
            <div className="space-y-1">
              <p>
                <span className="text-[#7a6a5c]">{t.books.table.title}:</span>{" "}
                {pendingAction?.type === "delete" && pendingAction.title}
              </p>
              <p>
                <span className="text-[#7a6a5c]">{t.books.table.author}:</span>{" "}
                {pendingAction?.type === "delete" && pendingAction.author}
              </p>
            </div>
            <p className="text-red-700 font-medium">
              {t.books.confirmDelete.message}
            </p>
            {refCount !== null && refCount > 0 && (
              <p className="text-amber-700 text-xs font-bold bg-amber-50 p-2 border border-amber-200 rounded-sm">
                ⚠ {t.books.confirmDelete.warning.replace("{count}", refCount.toString())}
              </p>
            )}
          </div>
        }
      />
    </div>
  );
}
