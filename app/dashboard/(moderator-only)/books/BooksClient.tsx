"use client";
import StatusBadge from "@/app/components/StatusBadge";
import { InventoryNav } from "@/app/dashboard/components/StaffHubNav";
import ConfirmModal from "@/components/ui/confirm-modal";
import { ModalPortal } from "@/components/ui/modal-portal";
import { useTranslation } from "@/lib/i18n/context";
import {
  addBook,
  editBook,
  getActiveBorrowersForBook,
  removeBook,
} from "@/server/library-actions";
import type { Book, Category } from "@/types/library";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  FaDownload,
  FaEdit,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

type BookTypeFilter = "all" | string;

interface BookForm {
  title: string;
  author: string;
  category_id: string;
  is_syllabus: boolean;
  pages: string;
  pdf_link: string;
  first_copy_id: string;
}

const EMPTY_FORM: BookForm = {
  title: "",
  author: "",
  category_id: "",
  is_syllabus: true,
  pages: "",
  pdf_link: "",
  first_copy_id: "",
};

function isValidUrl(urlString: string) {
  // const prefix = urlString.startsWith("http") ? "" : "http://";
  return URL.canParse(urlString);
}

interface Props {
  initialBooks: Book[];
  categories: Category[];
}

type PendingAction =
  | { type: "add" }
  | { type: "update" }
  | { type: "delete"; id: string; title: string; author: string };

type BookSortKey =
  | "title-asc"
  | "title-desc"
  | "copies-desc"
  | "copies-asc"
  | "pages-desc"
  | "pages-asc";

export default function BooksClient({ initialBooks, categories }: Props) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<BookTypeFilter>("all");
  const [sortBy, setSortBy] = useState<BookSortKey>("title-asc");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookForm>(EMPTY_FORM);
  const [copyIdError, setCopyIdError] = useState<string | null>(null);
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

  const counts = useMemo(() => {
    const categoryCounts = new Map<string, number>();
    categories.forEach((c) => categoryCounts.set(c.id, 0));
    books.forEach((b) => {
      if (b.category_id && categoryCounts.has(b.category_id)) {
        categoryCounts.set(
          b.category_id,
          (categoryCounts.get(b.category_id) ?? 0) + 1,
        );
      }
    });
    return {
      total: books.length,
      categoryCounts,
      copies: books.reduce((sum, b) => sum + (b.copies?.length ?? 0), 0),
    };
  }, [books, categories]);

  const filteredBooks = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    const result = books.filter((book) => {
      const matchesSearch =
        book.id.toLowerCase().includes(query) ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query);
      const matchesType =
        typeFilter === "all" || book.category_id === typeFilter;
      return matchesSearch && matchesType;
    });

    result.sort((a, b) => {
      if (sortBy === "title-asc") return a.title.localeCompare(b.title, "bn");
      if (sortBy === "title-desc") return b.title.localeCompare(a.title, "bn");
      if (sortBy === "copies-desc")
        return (b.copies?.length ?? 0) - (a.copies?.length ?? 0);
      if (sortBy === "copies-asc")
        return (a.copies?.length ?? 0) - (b.copies?.length ?? 0);
      if (sortBy === "pages-desc") return (b.pages ?? 0) - (a.pages ?? 0);
      if (sortBy === "pages-asc") return (a.pages ?? 0) - (b.pages ?? 0);
      return 0;
    });

    return result;
  }, [books, searchTerm, typeFilter, sortBy]);

  const filteredCopiesCount = useMemo(() => {
    return filteredBooks.reduce((sum, b) => sum + (b.copies?.length ?? 0), 0);
  }, [filteredBooks]);

  const hasActiveFilters =
    searchTerm.trim() !== "" || typeFilter !== "all" || sortBy !== "title-asc";

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setSortBy("title-asc");
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      ...EMPTY_FORM,
      category_id: categories.find((c) => c.name === "Syllabus")?.id || "",
    });
    setCopyIdError(null);
    setShowAddModal(true);
  };

  const handleAdd = () => {
    if (!formData.title.trim() || !formData.author.trim()) return;
    if (formData.pdf_link.trim() && !isValidUrl(formData.pdf_link)) {
      showFlash("error", "Please enter a valid PDF Link URL");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", formData.title.trim());
      fd.set("author", formData.author.trim());
      fd.set("category_id", formData.category_id);
      fd.set("is_syllabus", formData.is_syllabus ? "true" : "false");
      if (formData.pages) fd.set("pages", formData.pages);
      if (formData.pdf_link.trim())
        fd.set("pdf_link", formData.pdf_link.trim());
      if (formData.first_copy_id.trim())
        fd.set("first_copy_id", formData.first_copy_id.trim());

      const result = await addBook(fd);
      if (result.error) {
        if (result.error.toLowerCase().includes("already exists")) {
          setCopyIdError(result.error);
        } else {
          showFlash("error", result.error);
        }
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
      title: book.title,
      author: book.author,
      category_id: book.category_id ?? "",
      is_syllabus: book.is_syllabus,
      pages: book.pages?.toString() ?? "",
      pdf_link: book.pdf_link ?? "",
      first_copy_id: "",
    });
    setEditingId(id);
    setShowAddModal(true);
  };

  const handleUpdate = () => {
    if (!formData.title.trim() || !formData.author.trim()) return;
    if (formData.pdf_link.trim() && !isValidUrl(formData.pdf_link)) {
      showFlash("error", "Please enter a valid PDF Link URL");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      if (editingId) fd.set("id", editingId);
      fd.set("title", formData.title.trim());
      fd.set("author", formData.author.trim());
      fd.set("category_id", formData.category_id);
      fd.set("is_syllabus", formData.is_syllabus ? "true" : "false");
      if (formData.pages) fd.set("pages", formData.pages);
      if (formData.pdf_link.trim())
        fd.set("pdf_link", formData.pdf_link.trim());

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

    // Check active borrow count first
    const count = await getActiveBorrowersForBook(id);
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
    setCopyIdError(null);
  };

  return (
    <div className="space-y-6">
      {/* Inventory Hub Sub-Navigation */}
      <InventoryNav />

      {/* Flash Messages */}
      {flash && (
        <div
          className={`fixed top-20 right-4 z-100 p-4 rounded-sm shadow-xl border animate-in fade-in slide-in-from-right-4 duration-300 ${
            flash.type === "success"
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
          {categories.slice(0, 2).map((cat) => (
            <div
              key={cat.id}
              className="bg-[#f6ecdd] border border-[#b9a58b] p-3 rounded-sm"
            >
              <p className="text-[10px] uppercase tracking-wider text-[#5c4f42] ink-text">
                {cat.name}
              </p>
              <p className="text-xl font-bold text-[#221910] ink-title">
                {counts.categoryCounts.get(cat.id) ?? 0}
              </p>
            </div>
          ))}
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
        <div className="p-4 sm:p-5 border-b border-[#7d6d5a] bg-[#eadcc8]/40 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7966] w-3.5 h-3.5" />
              <input
                type="text"
                placeholder={t.books.filters.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-lg focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text text-xs sm:text-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7d6d5a] hover:text-[#221910] p-1 transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <FaTimes className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Select */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs sm:text-sm font-medium border bg-[#f6ecdd] text-[#5c4f42] border-[#b9a58b] hover:bg-[#ece0ce] transition-all cursor-pointer"
            >
              <option value="all">{t.books.filters.all}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as BookSortKey)}
              className="px-3 py-2 rounded-lg text-xs sm:text-sm font-medium border bg-[#f6ecdd] text-[#5c4f42] border-[#b9a58b] hover:bg-[#ece0ce] transition-all cursor-pointer"
            >
              <option value="title-asc">
                {language === "bn" ? "শিরোনাম (A-Z)" : "Title (A-Z)"}
              </option>
              <option value="title-desc">
                {language === "bn" ? "শিরোনাম (Z-A)" : "Title (Z-A)"}
              </option>
              <option value="copies-desc">
                {language === "bn"
                  ? "কপি সংখ্যা (বেশি থেকে কম)"
                  : "Copies (High to Low)"}
              </option>
              <option value="copies-asc">
                {language === "bn"
                  ? "কপি সংখ্যা (কম থেকে বেশি)"
                  : "Copies (Low to High)"}
              </option>
              <option value="pages-desc">
                {language === "bn"
                  ? "পৃষ্ঠা সংখ্যা (বেশি থেকে কম)"
                  : "Pages (High to Low)"}
              </option>
              <option value="pages-asc">
                {language === "bn"
                  ? "পৃষ্ঠা সংখ্যা (কম থেকে বেশি)"
                  : "Pages (Low to High)"}
              </option>
            </select>
          </div>

          {/* Results Counter & Active Filters Bar */}
          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-[#d8c7b2] flex-wrap text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Live Count Badge */}
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#e6d7c3] text-[#3f3328] font-bold text-xs border border-[#c4b39c] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#2d4a35] shrink-0" />
                {hasActiveFilters ? (
                  language === "bn" ? (
                    <span>
                      <strong className="text-[#221910] font-bold text-sm">
                        {filteredBooks.length}
                      </strong>
                      টি বই পাওয়া গেছে{" "}
                      <span className="text-[#5a4b3f]">
                        ({filteredCopiesCount}টি কপি)
                      </span>
                      <span className="text-[#7a6a5a] font-normal ml-1">
                        (মোট {books.length}টি বইয়ের মধ্যে)
                      </span>
                    </span>
                  ) : (
                    <span>
                      Showing{" "}
                      <strong className="text-[#221910] font-bold text-sm">
                        {filteredBooks.length}
                      </strong>{" "}
                      of {books.length} books{" "}
                      <span className="text-[#5a4b3f]">
                        ({filteredCopiesCount} copies)
                      </span>
                    </span>
                  )
                ) : language === "bn" ? (
                  <span>
                    মোট{" "}
                    <strong className="text-[#221910] font-bold text-sm">
                      {filteredBooks.length}
                    </strong>
                    টি বই (
                    <strong className="text-[#221910] font-bold text-sm">
                      {filteredCopiesCount}
                    </strong>
                    টি কপি) প্রদর্শিত হচ্ছে
                  </span>
                ) : (
                  <span>
                    Showing{" "}
                    <strong className="text-[#221910] font-bold text-sm">
                      {filteredBooks.length}
                    </strong>{" "}
                    books{" "}
                    <span className="text-[#5a4b3f]">
                      ({filteredCopiesCount} copies)
                    </span>
                  </span>
                )}
              </span>

              {/* Active Sort Indicator */}
              <span className="text-[11px] text-[#6a5a4c] bg-[#f0e4d2] px-2.5 py-1 rounded-md border border-[#dac8b1]">
                {language === "bn" ? "সাজানো:" : "Sort:"}{" "}
                <strong className="text-[#3f3328]">
                  {sortBy === "title-asc" &&
                    (language === "bn" ? "নাম (A-Z)" : "Title (A-Z)")}
                  {sortBy === "title-desc" &&
                    (language === "bn" ? "নাম (Z-A)" : "Title (Z-A)")}
                  {sortBy === "copies-desc" &&
                    (language === "bn" ? "কপি (বেশি)" : "Copies (High)")}
                  {sortBy === "copies-asc" &&
                    (language === "bn" ? "কপি (কম)" : "Copies (Low)")}
                  {sortBy === "pages-desc" &&
                    (language === "bn" ? "পৃষ্ঠা (বেশি)" : "Pages (High)")}
                  {sortBy === "pages-asc" &&
                    (language === "bn" ? "পৃষ্ঠা (কম)" : "Pages (Low)")}
                </strong>
              </span>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#8b2c1a] bg-[#fdf0ec] hover:bg-[#fae2dc] border border-[#e8b5ab] rounded-lg transition-colors cursor-pointer ml-auto"
              >
                <FaTimes className="w-3 h-3" />
                {language === "bn" ? "ফিল্টার রিসেট করুন" : "Reset Filters"}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="p-3 space-y-2.5 md:hidden">
          {filteredBooks.length === 0 ? (
            <div className="text-center py-10 text-[#6a5a4c] ink-text space-y-3">
              <p>{t.books.empty}</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3f3328] text-[#f4e8d4] text-xs font-semibold rounded-lg hover:bg-[#4a3d31] transition-colors cursor-pointer"
                >
                  <FaTimes className="w-3 h-3" />
                  {language === "bn" ? "ফিল্টার মুছে দিন" : "Clear Filters"}
                </button>
              )}
            </div>
          ) : (
            filteredBooks.map((book) => (
              <article
                key={book.id}
                className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-3.5 ink-text shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[#2b2119] text-sm leading-snug">
                      {book.title}
                    </h3>
                    <p className="text-xs text-[#5a4b3f] mt-0.5">
                      {book.author}
                    </p>
                  </div>
                  <StatusBadge tone="neutral" size="xs" className="shrink-0">
                    {book.category?.name ??
                      (book.is_syllabus
                        ? t.books.filters.syllabus
                        : t.books.filters.additional)}
                  </StatusBadge>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#dfceb9] flex items-center justify-between text-xs text-[#5c4f42]">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#eadcc8] px-2 py-0.5 rounded-xs font-semibold">
                      {book.copies?.length ?? 0} {t.books.table.copies}
                    </span>
                    {book.pages && (
                      <span className="opacity-75">
                        {book.pages} {t.books.table.pages}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {book.pdf_link && (
                      <a
                        href={book.pdf_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-[#4e4033] hover:bg-[#eadcc8] rounded-sm border border-[#c4ad91]"
                        title={t.books.actions.downloadPdf}
                      >
                        <FaDownload className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleEdit(book.id)}
                      disabled={isPending}
                      className="p-1.5 text-[#5b4c3f] hover:bg-[#eadcc8] rounded-sm border border-[#c4ad91] cursor-pointer"
                      title={t.books.actions.edit}
                    >
                      <FaEdit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(book.id)}
                      disabled={isPending}
                      className="p-1.5 text-[#8b2c1a] hover:bg-[#eadcc8] rounded-sm border border-[#c4ad91] cursor-pointer"
                      title={t.books.actions.delete}
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm ink-text text-left min-w-[700px]">
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
                  Created At
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
                      {book.category?.name ??
                        (book.is_syllabus
                          ? t.books.filters.syllabus
                          : t.books.filters.additional)}
                    </StatusBadge>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <span
                      className="text-[#5a4b3f]"
                      title={new Date(book.created_at).toLocaleString()}
                    >
                      {new Date(book.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
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
          <div className="text-center py-12 text-[#6a5a4c] ink-text space-y-3">
            <p className="text-sm font-medium">{t.books.empty}</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3f3328] text-[#f4e8d4] text-xs font-semibold rounded-lg hover:bg-[#4a3d31] transition-colors cursor-pointer"
              >
                <FaTimes className="w-3 h-3" />
                {language === "bn" ? "ফিল্টার মুছে দিন" : "Clear Filters"}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Add / Edit modal */}
      {showAddModal && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-80 flex justify-center overflow-y-auto bg-[#1f170f]/42 p-4 backdrop-blur-[1px] sm:p-6"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <div
              className="dashboard-surface tron-border my-auto h-fit w-full max-w-md rounded-sm p-4 sm:p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#221910] ink-title">
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

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingId) {
                    handleUpdate();
                  } else {
                    handleAdd();
                  }
                }}
                className="space-y-3 sm:space-y-4 ink-text"
              >
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#4f4134] mb-1">
                    {t.books.modal.labels.title} *
                  </label>
                  <input
                    type="text"
                    placeholder={t.books.modal.placeholders.title}
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#4f4134] mb-1">
                    {t.books.modal.labels.author} *
                  </label>
                  <input
                    type="text"
                    placeholder={t.books.modal.placeholders.author}
                    value={formData.author}
                    onChange={(e) =>
                      setFormData({ ...formData, author: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                  />
                </div>
                {/* select & page number */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between">
                  <div className="flex-1">
                    <label className="block text-xs sm:text-sm font-medium text-[#4f4134] mb-1">
                      {t.books.modal.labels.type} *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category_id: e.target.value,
                        })
                      }
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-1/3">
                    <label className="block text-xs sm:text-sm font-medium text-[#4f4134] mb-1">
                      {t.books.modal.labels.pages}
                    </label>
                    <input
                      type="number"
                      placeholder={t.books.modal.placeholders.pages}
                      value={formData.pages}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pages: Math.max(Number(e.target.value), 0).toString(),
                        })
                      }
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#4f4134] mb-1">
                    {t.books.modal.labels.pdfLink}
                  </label>
                  <input
                    type="url"
                    placeholder={t.books.modal.placeholders.pdfLink}
                    value={formData.pdf_link}
                    onChange={(e) =>
                      setFormData({ ...formData, pdf_link: e.target.value })
                    }
                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border rounded-sm focus:ring-2 focus:border-transparent outline-none transition-colors ${
                      formData.pdf_link.trim() && !isValidUrl(formData.pdf_link)
                        ? "border-red-500 focus:ring-red-500 bg-[#fdf2f2] text-red-900"
                        : "border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] focus:ring-[#6e5d4a]"
                    }`}
                  />
                  {formData.pdf_link.trim() &&
                    !isValidUrl(formData.pdf_link) && (
                      <p className="text-[10px] sm:text-xs text-red-600 mt-1 font-medium">
                        Please enter a valid URL (e.g.,
                        https://example.com/file.pdf)
                      </p>
                    )}
                </div>

                {!editingId && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[#4f4134] mb-1">
                      First Copy ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. C001"
                      value={formData.first_copy_id}
                      onChange={(e) => {
                        if (copyIdError) setCopyIdError(null);
                        setFormData({
                          ...formData,
                          first_copy_id: e.target.value.toUpperCase(),
                        });
                      }}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border rounded-sm focus:ring-2 focus:border-transparent outline-none transition-colors ${
                        copyIdError
                          ? "border-red-500 focus:ring-red-500 bg-[#fdf2f2] text-red-900"
                          : "border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] focus:ring-[#6e5d4a]"
                      }`}
                    />
                    {copyIdError ? (
                      <p className="text-[10px] sm:text-xs text-red-600 mt-1 font-medium">
                        {copyIdError}
                      </p>
                    ) : (
                      <p className="text-[10px] text-[#8a7966] mt-1">
                        Leave blank if you don't want to add a copy right now.
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2 sm:pt-4 flex gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isPending}
                    className="flex-1 py-2 sm:py-2.5 px-4 text-sm bg-[#f4e8d4] text-[#4a3825] border border-[#c9b99a] font-bold rounded-sm hover:bg-[#ece0ce] transition-colors disabled:opacity-55"
                  >
                    {t.books.modal.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-2 sm:py-2.5 px-4 text-sm bg-[#3f3328] text-[#f4e8d4] font-bold rounded-sm hover:bg-[#221910] transition-colors disabled:opacity-55"
                  >
                    {isPending
                      ? "..."
                      : editingId
                        ? t.books.modal.save
                        : t.books.modal.add}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Confirm modal only for delete */}
      <ConfirmModal
        open={pendingAction?.type === "delete"}
        onClose={() => {
          setPendingAction(null);
          setRefCount(null);
        }}
        onConfirm={
          refCount === null || refCount > 0 ? undefined : confirmDelete
        }
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
            {refCount === null ? (
              <p className="text-[#7a6a5c] text-xs">
                Checking borrow status...
              </p>
            ) : refCount > 0 ? (
              <p className="text-red-700 text-sm font-semibold bg-red-50 p-2.5 border border-red-200 rounded-sm">
                🚫{" "}
                {t.books.confirmDelete.blocked.replace(
                  "{count}",
                  refCount.toString(),
                )}
              </p>
            ) : (
              <p className="text-red-700 font-medium">
                {t.books.confirmDelete.message}
              </p>
            )}
          </div>
        }
      />
    </div>
  );
}
