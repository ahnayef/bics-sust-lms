"use client";

import StatusBadge from "@/app/components/StatusBadge";
import { ModalPortal } from "@/components/ui/modal-portal";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { submitPdfReport } from "@/server/transaction-actions";
import "@/styles/components.css";
import "@/styles/typography.css";
import type { Book, Category, PdfSubmission } from "@/types/library";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState, useTransition } from "react";
import {
  FaBookOpen,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaExclamationTriangle,
  FaFileAlt,
  FaQrcode,
  FaSearch,
  FaSortAmountDown,
  FaTimes,
  FaUndoAlt,
} from "react-icons/fa";

type SortKey =
  | "title-asc"
  | "title-desc"
  | "pages-asc"
  | "pages-desc"
  | "copies-asc"
  | "copies-desc";
type TypeFilter = "all" | string; // category id
type AvailabilityFilter = "all" | "available" | "borrowed" | "damaged";

interface Props {
  books: Book[];
  userId: string;
  activeBorrowCopyIds: string[];
  pdfSubmissions: PdfSubmission[];
  categories: Category[];
}

// ── Copy status badge ──────────────────────────────────────────────────────

function CopyStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  if (status === "available") {
    return (
      <StatusBadge tone="success" size="xs" icon={FaCheckCircle}>
        {t.bookList.copyStatus.available}
      </StatusBadge>
    );
  }
  if (status === "damaged") {
    return (
      <StatusBadge tone="danger" size="xs" icon={FaExclamationTriangle}>
        {t.bookList.copyStatus.damaged}
      </StatusBadge>
    );
  }
  return (
    <StatusBadge tone="warning" size="xs" icon={FaClock}>
      {t.bookList.copyStatus.borrowed}
    </StatusBadge>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function BookListClient({
  books,
  activeBorrowCopyIds,
  pdfSubmissions,
  categories,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t, language } = useTranslation();

  // Filter / sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("title-asc");
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);

  // PDF modal state
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedBookForPdf, setSelectedBookForPdf] = useState<Book | null>(
    null,
  );
  const [pdfReadDate, setPdfReadDate] = useState("");
  const [pdfNote, setPdfNote] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [pdfSuccess, setPdfSuccess] = useState(false);

  // ── PDF submission helpers ───────────────────────────────────────────────

  const getPdfStatus = (
    bookId: string,
  ): "pending" | "approved" | "rejected" | null => {
    const latest = pdfSubmissions
      .filter((ps) => ps.book_id === bookId)
      .sort(
        (a, b) =>
          new Date(b.submitted_at).getTime() -
          new Date(a.submitted_at).getTime(),
      )[0];
    return latest?.status ?? null;
  };

  const openPdfModal = (book: Book) => {
    setSelectedBookForPdf(book);
    setPdfReadDate("");
    setPdfNote("");
    setPdfError("");
    setPdfSuccess(false);
    setShowPdfModal(true);
  };

  const closePdfModal = () => {
    setShowPdfModal(false);
    setSelectedBookForPdf(null);
  };

  const handlePdfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForPdf || !pdfReadDate) return;

    const pdfStatus = getPdfStatus(selectedBookForPdf.id);
    if (pdfStatus === "pending" || pdfStatus === "approved") {
      setPdfError(t.bookList.pdfModal.errors.alreadySubmitted);
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("book_id", selectedBookForPdf.id);
      fd.set("read_date", pdfReadDate);
      if (pdfNote.trim()) fd.set("note", pdfNote.trim());

      const result = await submitPdfReport(fd);
      if (result.error) {
        if (
          result.error.includes("already have a pending or approved report")
        ) {
          setPdfError(t.bookList.pdfModal.errors.alreadySubmitted);
        } else {
          setPdfError(result.error || t.bookList.pdfModal.errors.generic);
        }
      } else {
        setPdfSuccess(true);
        setTimeout(() => {
          closePdfModal();
          router.refresh();
        }, 1500);
      }
    });
  };

  // ── Stats ────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalCopies = books.reduce((n, b) => n + (b.copies?.length ?? 0), 0);
    const available = books.reduce(
      (n, b) =>
        n + (b.copies?.filter((c) => c.status === "available").length ?? 0),
      0,
    );
    return { books: books.length, copies: totalCopies, available };
  }, [books]);

  // ── Filtering + sorting ──────────────────────────────────────────────────

  const filteredBooks = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    const result = books
      .map((book) => {
        const matchesType =
          typeFilter === "all" || book.category_id === typeFilter;

        const copies = (book.copies ?? []).filter((copy) => {
          const matchesAvailability =
            availabilityFilter === "all" || copy.status === availabilityFilter;

          const matchesQuery =
            !query ||
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query) ||
            copy.id.toLowerCase().includes(query) ||
            String(copy.copy_number).includes(query);

          return matchesAvailability && matchesQuery;
        });

        return { ...book, copies, matchesType };
      })
      .filter((book) => book.matchesType && book.copies.length > 0);

    result.sort((a, b) => {
      if (sortBy === "title-asc") return a.title.localeCompare(b.title, "bn");
      if (sortBy === "title-desc") return b.title.localeCompare(a.title, "bn");
      if (sortBy === "pages-asc")
        return (
          (a.pages ?? 0) - (b.pages ?? 0) ||
          a.title.localeCompare(b.title, "bn")
        );
      if (sortBy === "pages-desc")
        return (
          (b.pages ?? 0) - (a.pages ?? 0) ||
          a.title.localeCompare(b.title, "bn")
        );
      if (sortBy === "copies-asc")
        return (
          a.copies.length - b.copies.length ||
          a.title.localeCompare(b.title, "bn")
        );
      return (
        b.copies.length - a.copies.length ||
        a.title.localeCompare(b.title, "bn")
      );
    });

    return result;
  }, [books, searchTerm, typeFilter, availabilityFilter, sortBy]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    typeFilter !== "all" ||
    availabilityFilter !== "all" ||
    sortBy !== "title-asc";

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setAvailabilityFilter("all");
    setSortBy("title-asc");
    setExpandedBookId(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* ── Search & Filter Controls ────────────────────────────────────────── */}
      <div className="dashboard-surface tron-border rounded-xl p-3.5 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#221910] ink-title">
              {t.bookList.header.title}
            </h1>
            <p className="text-xs text-[#5c4f42] mt-0.5 ink-text">
              {filteredBooks.length} {t.bookList.table.book.toLowerCase()} •{" "}
              {stats.available} available
            </p>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-72">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d6d5a] w-3.5 h-3.5" />
            <input
              type="text"
              placeholder={t.bookList.header.searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 bg-[#fbf5ed] border border-[#b9a58b] rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#7d6d5a] ink-text placeholder:text-[#a6917c]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a7966] hover:text-[#221910] p-1"
              >
                <FaTimes className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Category Filter Chips (Native App Pattern) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          <button
            onClick={() => setTypeFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer shadow-xs",
              typeFilter === "all"
                ? "bg-[#3f3328] text-[#f4e8d4]"
                : "bg-[#eadcc8] text-[#4e4033] hover:bg-[#dfcfb9]",
            )}
          >
            {t.bookList.filters.type.all}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setTypeFilter(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer shadow-xs",
                typeFilter === cat.id
                  ? "bg-[#3f3328] text-[#f4e8d4]"
                  : "bg-[#eadcc8] text-[#4e4033] hover:bg-[#dfcfb9]",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Secondary Filter Row (Availability, Sort, Live Count, Clear) */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1.5 border-t border-[#e4d4bf]">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="bg-[#fbf5ed] border border-[#b9a58b] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#7d6d5a] ink-text cursor-pointer"
              value={availabilityFilter}
              onChange={(e) =>
                setAvailabilityFilter(e.target.value as AvailabilityFilter)
              }
            >
              <option value="all">{t.bookList.filters.availability.all}</option>
              <option value="available">
                {t.bookList.filters.availability.available}
              </option>
              <option value="borrowed">{t.bookList.copyStatus.borrowed}</option>
              <option value="damaged">{t.bookList.copyStatus.damaged}</option>
            </select>

            <button
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#fbf5ed] border border-[#b9a58b] rounded-lg text-xs font-bold text-[#221910] hover:bg-[#ece0ce] transition-colors cursor-pointer"
              onClick={() => {
                setSortBy(sortBy === "title-asc" ? "title-desc" : "title-asc");
              }}
            >
              <span>{t.bookList.sorting.title}</span>
              <FaSortAmountDown
                className={cn(
                  "w-3 h-3 transition-transform",
                  sortBy === "title-desc" && "rotate-180",
                )}
              />
            </button>

            {/* Live Count Pill */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#e6d7c3] text-[#3f3328] font-bold text-xs border border-[#c4b39c] shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2d4a35] shrink-0" />
              {hasActiveFilters ? (
                language === "bn" ? (
                  <span>
                    <strong className="text-[#221910]">
                      {filteredBooks.length}
                    </strong>
                    টি বই পাওয়া গেছে{" "}
                    <span className="text-[#7a6a5a] font-normal">
                      (মোট {books.length}টির মধ্যে)
                    </span>
                  </span>
                ) : (
                  <span>
                    Showing{" "}
                    <strong className="text-[#221910]">
                      {filteredBooks.length}
                    </strong>{" "}
                    of {books.length} books
                  </span>
                )
              ) : language === "bn" ? (
                <span>
                  মোট{" "}
                  <strong className="text-[#221910]">
                    {filteredBooks.length}
                  </strong>
                  টি বই
                </span>
              ) : (
                <span>
                  Showing{" "}
                  <strong className="text-[#221910]">
                    {filteredBooks.length}
                  </strong>{" "}
                  books
                </span>
              )}
            </span>
          </div>

          {hasActiveFilters && (
            <button
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#fdf0ec] border border-[#d0604a]/40 text-[#8b2c1a] rounded-lg text-xs font-bold hover:bg-[#f9e6e1] transition-colors cursor-pointer ml-auto"
              onClick={clearFilters}
            >
              <FaTimes className="w-2.5 h-2.5" />
              <span>{t.bookList.empty.clearFilters}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Empty State ────────────────────────────────────────────────────── */}
      {filteredBooks.length === 0 ? (
        <div className="dashboard-surface tron-border rounded-xl p-8 text-center space-y-3 shadow-xs">
          <FaBookOpen className="w-10 h-10 text-[#7d6d5a] mx-auto" />
          <p className="text-sm font-semibold text-[#221910] ink-title">
            {t.bookList.empty.noBooks}
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-lg bg-[#3f3328] text-[#f4e8d4] text-xs font-bold hover:bg-[#4a3d31] transition-colors"
          >
            {t.bookList.empty.clearFilters}
          </button>
        </div>
      ) : (
        <>
          {/* ── MOBILE VIEW: Native Book Cards (< lg screens) ────────────────── */}
          <div className="block lg:hidden space-y-3">
            {filteredBooks.map((book) => {
              const availableCopies = book.copies.filter(
                (c) => c.status === "available",
              );
              const availableCount = availableCopies.length;
              const firstAvailableCopy = availableCopies[0];
              const isExpanded = expandedBookId === book.id;
              const pdfStatus = getPdfStatus(book.id);

              return (
                <div
                  key={book.id}
                  className="dashboard-surface tron-border rounded-xl p-4 shadow-xs space-y-3 bg-[#fbf5ed]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#efe4d1] border border-[#8f7f6c] text-[10px] font-semibold text-[#3f3328]">
                          <FaBookOpen className="w-2.5 h-2.5" />
                          {book.category?.name ??
                            (book.is_syllabus
                              ? t.bookList.bookCard.syllabus
                              : t.bookList.bookCard.additional)}
                        </span>
                        {book.pages && (
                          <span className="text-[10px] text-[#7a6a5c]">
                            {book.pages} {t.bookList.table.pages}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-[#221910] ink-title leading-snug">
                        {book.title}
                      </h3>
                      <p className="text-xs text-[#6a5a4c] ink-text mt-0.5">
                        {book.author}
                      </p>
                    </div>

                    {/* Availability Badge */}
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0",
                        availableCount > 0
                          ? "bg-teal-50 text-teal-800 border-teal-300"
                          : "bg-red-50 text-red-700 border-red-300",
                      )}
                    >
                      {availableCount > 0
                        ? `${availableCount} Available`
                        : "All Borrowed"}
                    </span>
                  </div>

                  {/* 1-Tap Mobile Action Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-[#e4d4bf]">
                    {/* ── Primary actions row ── */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {firstAvailableCopy ? (
                        <Link
                          href={`/dashboard/borrow?copyId=${encodeURIComponent(firstAvailableCopy.id)}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#3f3328] text-[#f4e8d4] text-xs font-bold hover:bg-[#4a3d31] active:scale-95 transition-all shadow-xs"
                        >
                          <FaQrcode className="w-3 h-3" />
                          <span>Borrow Copy</span>
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg bg-[#e4d4bf] text-[#8a7966] text-xs font-bold cursor-not-allowed"
                        >
                          All Borrowed
                        </button>
                      )}

                      {book.pdf_link && (
                        <a
                          href={book.pdf_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-[#7d6d5a] bg-[#fbf5ed] text-[#3f3328] text-xs font-bold hover:bg-[#ece0ce] transition-colors shadow-xs"
                        >
                          <FaDownload className="w-3 h-3" />
                          <span>PDF</span>
                        </a>
                      )}

                      {/* Toggle Copies Accordion */}
                      <button
                        onClick={() =>
                          setExpandedBookId(isExpanded ? null : book.id)
                        }
                        className="px-2.5 py-2 rounded-lg border border-[#8a7966]/40 bg-[#f8f1e6] text-[#4a3e33] text-xs font-semibold hover:bg-[#ecdcc8] transition-colors cursor-pointer"
                      >
                        {isExpanded ? "Hide" : `${book.copies.length} Copies`}
                      </button>
                    </div>

                    {/* ── Mark as Read ── */}
                    {pdfStatus === "approved" ? (
                      <div className="flex items-center justify-center gap-1.5 w-full px-2.5 py-1.5 rounded-lg bg-[#eef5e9] border border-[#8aa06f] text-[#3d5c2e] text-[11px] font-bold">
                        <FaCheckCircle className="w-3 h-3" />
                        <span>
                          {language === "bn" ? "পড়া সম্পন্ন ✓" : "Read ✓"}
                        </span>
                      </div>
                    ) : pdfStatus === "pending" ? (
                      <div className="flex items-center justify-center gap-1.5 w-full px-2.5 py-1.5 rounded-lg bg-[#f4ecd8] border border-[#b49d6f] text-[#6b5428] text-[11px] font-bold">
                        <FaClock className="w-3 h-3" />
                        <span>
                          {language === "bn"
                            ? "পর্যালোচনায় আছে"
                            : "Review Pending"}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => openPdfModal(book)}
                        className="flex items-center justify-center gap-1.5 w-full px-2.5 py-1.5 rounded-lg bg-[#2d5a3c] hover:bg-[#22442d] active:scale-[0.98] text-[#f4e8d4] text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <FaFileAlt className="w-3 h-3" />
                        <span>
                          {language === "bn"
                            ? "পড়া সম্পন্ন রিপোর্ট"
                            : "Mark as Read"}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Collapsible Copies List */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-[#e4d4bf] space-y-1.5 animate-in fade-in duration-200">
                      <p className="text-[11px] font-bold text-[#6a5a4c] uppercase tracking-wider">
                        Copies ({book.copies.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {book.copies.map((copy) => (
                          <div
                            key={copy.id}
                            className="flex items-center justify-between p-2 rounded-md bg-[#f4ebdc] border border-[#d2bfa5] text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#221910]">
                                #{copy.id}
                              </span>
                              <span className="text-[10px] text-[#7a6a5c]">
                                Copy {copy.copy_number}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CopyStatusBadge status={copy.status} />
                              {copy.status === "available" && (
                                <Link
                                  href={`/dashboard/borrow?copyId=${encodeURIComponent(copy.id)}`}
                                  className="px-2 py-0.5 rounded-sm bg-[#3f3328] text-[#f4e8d4] text-[10px] font-bold hover:bg-[#4a3d31]"
                                >
                                  Borrow
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── DESKTOP VIEW: Data Table (lg screens and above) ─────────────── */}
          <section className="hidden lg:block book-list-surface tron-border rounded-xl overflow-hidden border border-[#5f4f40] shadow-xs">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm ink-text">
                <thead>
                  <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                    {[
                      t.bookList.table.book,
                      t.bookList.table.author,
                      t.bookList.table.pages,
                      t.bookList.table.type,
                      t.bookList.table.copies,
                      t.bookList.table.available,
                      language === "bn" ? "পড়া" : "Read",
                      t.bookList.table.pdf,
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredBooks.map((book) => {
                    const availableCount = book.copies.filter(
                      (c) => c.status === "available",
                    ).length;
                    const isExpanded = expandedBookId === book.id;
                    const pdfStatus = getPdfStatus(book.id);

                    return (
                      <Fragment key={book.id}>
                        {/* Book row */}
                        <tr
                          className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors align-top cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            setExpandedBookId(isExpanded ? null : book.id)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setExpandedBookId(isExpanded ? null : book.id);
                            }
                          }}
                          aria-expanded={isExpanded}
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 h-6 w-6 shrink-0 rounded-sm border border-[#b59f84] bg-[#f6ecdd] text-[#4e4033] text-xs font-bold inline-flex items-center justify-center">
                                {isExpanded ? "−" : "+"}
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-[#221910] leading-snug text-sm">
                                  {book.title}
                                </p>
                                <p className="text-[10px] text-[#6a5a4c] mt-0.5">
                                  {book.copies.length}{" "}
                                  {t.bookList.bookCard.copies}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-[#5a4b3f] text-sm">
                            {book.author}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm border border-[#8f7f6c] bg-[#efe4d1] text-[#3f3328] text-[11px] font-semibold">
                              {book.pages ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-[#8f7f6c] bg-[#efe4d1] text-[#3f3328] text-[11px] font-semibold">
                              <FaBookOpen className="w-3 h-3 text-[#4e4033]" />
                              {book.category?.name ??
                                (book.is_syllabus
                                  ? t.bookList.bookCard.syllabus
                                  : t.bookList.bookCard.additional)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-sm font-semibold">
                            {book.copies.length}
                          </td>
                          <td className="px-4 py-2.5 text-sm">
                            <span
                              className={cn(
                                "font-bold",
                                availableCount > 0
                                  ? "text-[#2d4a35]"
                                  : "text-[#9b3a25]",
                              )}
                            >
                              {availableCount}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-sm">
                            {pdfStatus === "approved" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-[#8aa06f] bg-[#eef5e9] text-[#3d5c2e] text-[10px] font-bold whitespace-nowrap">
                                <FaCheckCircle className="w-3 h-3" />
                                {language === "bn" ? "সম্পন্ন" : "Done"}
                              </span>
                            ) : pdfStatus === "pending" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-[#b49d6f] bg-[#f4ecd8] text-[#6b5428] text-[10px] font-bold whitespace-nowrap">
                                <FaClock className="w-3 h-3" />
                                {language === "bn" ? "পর্যালোচনায়" : "Pending"}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPdfModal(book);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm border border-[#2d5a3c] bg-[#2d5a3c] text-[#f4e8d4] hover:bg-[#22442d] transition-colors text-[10px] font-bold whitespace-nowrap cursor-pointer"
                              >
                                <FaFileAlt className="w-3 h-3" />
                                {language === "bn"
                                  ? "পড়া রিপোর্ট"
                                  : "Mark Read"}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-sm">
                            <div className="flex items-center gap-1.5">
                              {book.pdf_link ? (
                                <a
                                  href={book.pdf_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-[#4f4134] bg-[#3f3328] text-[#f4e8d4] hover:bg-[#4a3d31] transition-colors text-[10px] font-semibold whitespace-nowrap"
                                >
                                  <FaDownload className="w-3 h-3" />
                                  {t.bookList.table.pdf}
                                </a>
                              ) : (
                                <span className="text-[#7b6d5f] text-[10px]">
                                  —
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded copies */}
                        {isExpanded && (
                          <tr className="bg-[#f8f1e5] border-b border-[#d2bfa5]">
                            <td colSpan={8} className="px-4 py-3">
                              <div className="w-full">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-[#6a5a4c] uppercase tracking-[0.08em] border-b border-[#d9c6ab]">
                                      <th className="py-1.5 pr-2 text-left font-semibold">
                                        {t.bookList.table.copyId}
                                      </th>
                                      <th className="py-1.5 pr-2 text-left font-semibold">
                                        {t.bookList.table.copyNum}
                                      </th>
                                      <th className="py-1.5 pr-2 text-left font-semibold">
                                        {t.bookList.table.status}
                                      </th>
                                      <th className="py-1.5 pr-2 text-left font-semibold">
                                        {t.bookList.table.actions}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {book.copies.map((copy) => {
                                      const isMyBorrow =
                                        activeBorrowCopyIds.includes(copy.id);
                                      return (
                                        <tr
                                          key={copy.id}
                                          className="border-b border-[#e4d4bf] last:border-b-0"
                                        >
                                          <td className="py-2 pr-2 font-mono font-bold text-[#3f3328]">
                                            #{copy.id}
                                          </td>
                                          <td className="py-2 pr-2 text-[#5b4a3c]">
                                            Copy {copy.copy_number}
                                          </td>
                                          <td className="py-2 pr-2">
                                            <CopyStatusBadge
                                              status={copy.status}
                                            />
                                          </td>
                                          <td className="py-2 pr-2">
                                            <div className="flex gap-1.5 flex-wrap">
                                              {copy.status === "available" ? (
                                                <Link
                                                  href={`/dashboard/borrow?copyId=${encodeURIComponent(copy.id)}`}
                                                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-sm border border-[#4f4134] bg-[#3f3328] text-[#f4e8d4] hover:bg-[#4a3d31] transition-colors font-bold text-[11px] whitespace-nowrap"
                                                >
                                                  <FaQrcode className="w-3 h-3" />
                                                  {t.dashboard.sidebar.borrow}
                                                </Link>
                                              ) : isMyBorrow ? (
                                                <Link
                                                  href={`/dashboard/return?copyId=${encodeURIComponent(copy.id)}`}
                                                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-sm border border-[#4f4134] bg-[#5a4d40] text-[#f4e8d4] hover:bg-[#4a3d31] transition-colors font-bold text-[11px] whitespace-nowrap"
                                                >
                                                  <FaUndoAlt className="w-3 h-3" />
                                                  {t.dashboard.sidebar.return}
                                                </Link>
                                              ) : (
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-sm border border-[#9b8a75] bg-[#e3d2bf] text-[#6f6256] font-medium text-[10px] whitespace-nowrap">
                                                  {copy.status === "damaged"
                                                    ? t.bookList.copyStatus
                                                        .damaged
                                                    : t.bookList.copyStatus
                                                        .borrowed}
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* PDF Submission Modal */}
      {showPdfModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="book-list-surface tron-border rounded-xl w-full max-w-md bg-[#f1e7d8] border border-[#5f4d42] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#221910] ink-title">
                  {t.bookList.pdfModal.title}
                </h2>
                <button
                  onClick={closePdfModal}
                  className="p-1 text-[#6f6256] hover:text-[#3f352d] transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              {pdfSuccess ? (
                <div className="text-center py-6">
                  <div className="flex justify-center mb-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#e8f1e7] border border-[#8faa8f]">
                      <FaCheckCircle className="w-6 h-6 text-[#4e4033]" />
                    </div>
                  </div>
                  <p className="text-[#221910] font-semibold mb-1 ink-title">
                    {t.bookList.pdfModal.submitted}
                  </p>
                  <p className="text-sm text-[#5c4f42] ink-text">
                    {t.bookList.pdfModal.description}
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePdfSubmit} className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-[#4e4033] mb-1 ink-text">
                      {t.bookList.pdfModal.bookLabel}
                    </p>
                    <p className="text-sm text-[#221910] ink-title font-semibold">
                      {selectedBookForPdf?.title}
                    </p>
                    <p className="text-xs text-[#6f6256] ink-text">
                      {selectedBookForPdf?.author}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#4e4033] mb-1 ink-text">
                      {t.bookList.pdfModal.dateLabel}
                    </label>
                    <input
                      type="date"
                      required
                      max={new Date().toISOString().split("T")[0]}
                      value={pdfReadDate}
                      onChange={(e) => setPdfReadDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f8f1e6] border border-[#b9a58b] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#7d6d5a] ink-text"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#4e4033] mb-1 ink-text">
                      {t.bookList.pdfModal.noteLabel}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={t.bookList.pdfModal.notePlaceholder}
                      value={pdfNote}
                      onChange={(e) => setPdfNote(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f8f1e6] border border-[#b9a58b] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#7d6d5a] ink-text resize-none"
                    />
                  </div>

                  {pdfError && (
                    <p className="text-xs text-[#9b3a25] font-semibold italic">
                      {pdfError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-lg text-sm font-bold hover:bg-[#4a3d31] transition-colors disabled:opacity-50 uppercase tracking-wider"
                  >
                    {isPending
                      ? t.bookList.pdfModal.submitting
                      : t.bookList.pdfModal.submit}
                  </button>
                </form>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
