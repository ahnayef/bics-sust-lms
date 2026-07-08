"use client";

import StatusBadge from "@/app/components/StatusBadge";
import { useTranslation } from "@/lib/i18n/context";
import { submitPdfReport } from "@/server/transaction-actions";
import "@/styles/components.css";
import "@/styles/typography.css";
import type { Book, PdfSubmission } from "@/types/library";
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
  FaFilter,
  FaSearch,
  FaSortAmountDown,
  FaTimes
} from "react-icons/fa";

type SortKey = "title-asc" | "title-desc" | "pages-asc" | "pages-desc" | "copies-asc" | "copies-desc";
type TypeFilter = "all" | "syllabus" | "additional";
type AvailabilityFilter = "all" | "available" | "borrowed" | "damaged";

interface Props {
  books: Book[];
  userId: string;
  activeBorrowCopyIds: string[];
  pdfSubmissions: PdfSubmission[];
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
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslation();

  // Filter / sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
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
        // Map common server errors to translated strings
        if (result.error.includes("already have a pending or approved report")) {
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
          typeFilter === "all" ||
          (typeFilter === "syllabus" ? book.is_syllabus : !book.is_syllabus);

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
          (a.pages ?? 0) - (b.pages ?? 0) || a.title.localeCompare(b.title, "bn")
        );
      if (sortBy === "pages-desc")
        return (
          (b.pages ?? 0) - (a.pages ?? 0) || a.title.localeCompare(b.title, "bn")
        );
      if (sortBy === "copies-asc")
        return (
          a.copies.length - b.copies.length || a.title.localeCompare(b.title, "bn")
        );
      return (
        b.copies.length - a.copies.length || a.title.localeCompare(b.title, "bn")
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
    <>

      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        {/* ── Header + Filters ──────────────────────────────────────────────── */}
        <div className="dashboard-surface border border-[#7d6d5a] rounded-sm p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
                {t.bookList.header.title}
              </h1>
              <p className="text-sm text-[#5c4f42] mt-1 ink-text italic">
                {t.bookList.header.subtitle}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d6d5a] w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder={t.bookList.header.searchPlaceholder}
                  className="w-full pl-9 pr-4 py-2 bg-[#f8f1e6] border border-[#b9a58b] rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-[#7d6d5a] ink-text placeholder:text-[#a6917c]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="bg-[#f8f1e6] border border-[#b9a58b] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#7d6d5a] ink-text"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              >
                <option value="all">{t.bookList.filters.type.all}</option>
                <option value="syllabus">{t.bookList.filters.type.syllabus}</option>
                <option value="additional">{t.bookList.filters.type.additional}</option>
              </select>
              <select
                className="bg-[#f8f1e6] border border-[#b9a58b] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#7d6d5a] ink-text"
                value={availabilityFilter}
                onChange={(e) =>
                  setAvailabilityFilter(e.target.value as AvailabilityFilter)
                }
              >
                <option value="all">{t.bookList.filters.availability.all}</option>
                <option value="available">{t.bookList.filters.availability.available}</option>
                <option value="borrowed">{t.bookList.copyStatus.borrowed}</option>
                <option value="damaged">{t.bookList.copyStatus.damaged}</option>
              </select>
              <button
                className="flex items-center gap-2 px-3 py-2 bg-[#eadcc8] border border-[#7d6d5a] rounded-sm text-sm font-bold text-[#221910] hover:bg-[#d9cbb7] transition-colors"
                onClick={() => {
                  setSortBy(sortBy === "title-asc" ? "title-desc" : "title-asc");
                }}
              >
                {t.bookList.sorting.title}
                {sortBy === "title-asc" ? <FaSortAmountDown className="w-3 h-3" /> : <FaSortAmountDown className="w-3 h-3 rotate-180" />}
              </button>
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-2 px-3 py-2 bg-[#eadcc8] border border-[#7d6d5a] rounded-sm text-xs font-bold text-[#221910] hover:bg-[#d9cbb7] transition-colors uppercase tracking-wider"
                  onClick={clearFilters}
                >
                  <FaTimes className="w-3 h-3" /> {t.bookList.empty.clearFilters}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Book table */}
        <section
          className="book-list-surface tron-border rounded-lg overflow-hidden border border-[#5f4f40]"
        >
          {filteredBooks.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-[#5c4f42] ink-text">
                {t.bookList.empty.noBooks}
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-180 text-sm ink-text">
                <thead>
                  <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                    {[
                      t.bookList.table.book,
                      t.bookList.table.author,
                      t.bookList.table.pages,
                      t.bookList.table.type,
                      t.bookList.table.copies,
                      t.bookList.table.available,
                      t.bookList.table.pdf,
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 sm:px-4 py-2 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]"
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
                          <td className="px-3 sm:px-4 py-2">
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 h-6 w-6 shrink-0 rounded-sm border border-[#b59f84] bg-[#f6ecdd] text-[#4e4033] text-xs font-bold inline-flex items-center justify-center">
                                {isExpanded ? "−" : "+"}
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-[#221910] leading-snug text-sm">
                                  {book.title}
                                </p>
                                <p className="text-[10px] text-[#6a5a4c] mt-0.5">
                                  {book.copies.length} {t.bookList.bookCard.copies}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-2 text-[#5a4b3f] text-sm">
                            {book.author}
                          </td>
                          <td className="px-3 sm:px-4 py-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm border border-[#8f7f6c] bg-[#efe4d1] text-[#3f3328] text-[11px] font-semibold">
                              {book.pages ?? "—"}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-[#8f7f6c] bg-[#efe4d1] text-[#3f3328] text-[11px] font-semibold">
                              <FaBookOpen className="w-3 h-3 text-[#4e4033]" />
                              {book.category?.name ?? (book.is_syllabus ? t.bookList.bookCard.syllabus : t.bookList.bookCard.additional)}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 text-sm">
                            {book.copies.length}
                          </td>
                          <td className="px-3 sm:px-4 py-2 text-sm">
                            {availableCount}
                          </td>
                          <td className="px-3 sm:px-4 py-2 text-sm">
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
                          </td>
                        </tr>

                        {/* Expanded copies */}
                        {isExpanded && (
                          <tr className="bg-[#f8f1e5] border-b border-[#d2bfa5]">
                            <td colSpan={7} className="px-3 sm:px-4 py-2">
                              <div className="w-full overflow-x-auto">
                                <table className="w-full min-w-150 text-[11px] sm:text-xs">
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
                                          <td className="py-1.5 pr-2 font-mono text-[#3f3328]">
                                            {copy.id}
                                          </td>
                                          <td className="py-1.5 pr-2 text-[#5b4a3c]">
                                            #{copy.copy_number}
                                          </td>
                                          <td className="py-1.5 pr-2">
                                            <CopyStatusBadge
                                              status={copy.status}
                                            />
                                          </td>
                                          <td className="py-1.5 pr-2">
                                            <div className="flex gap-1 flex-wrap">
                                              {copy.status === "available" ? (
                                                <Link
                                                  href={`/dashboard/borrow?copyId=${encodeURIComponent(copy.id)}`}
                                                  className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-sm border border-[#4f4134] bg-[#3f3328] text-[#f4e8d4] hover:bg-[#4a3d31] transition-colors font-medium text-[10px] whitespace-nowrap"
                                                >
                                                  {t.dashboard.sidebar.borrow}
                                                </Link>
                                              ) : isMyBorrow ? (
                                                <Link
                                                  href="/dashboard/return"
                                                  className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-sm border border-[#4f4134] bg-[#5a4d40] text-[#f4e8d4] hover:bg-[#4a3d31] transition-colors font-medium text-[10px] whitespace-nowrap"
                                                >
                                                  {t.dashboard.sidebar.return}
                                                </Link>
                                              ) : (
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-sm border border-[#9b8a75] bg-[#e3d2bf] text-[#6f6256] font-medium text-[10px] whitespace-nowrap">
                                                  {copy.status === "damaged"
                                                    ? t.bookList.copyStatus.damaged
                                                    : t.bookList.copyStatus.borrowed}
                                                </span>
                                              )}

                                              {/* PDF report button */}
                                              {pdfStatus === "pending" ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-[#b49d6f] bg-[#f4ecd8] text-[#6b5428] font-medium text-[10px] whitespace-nowrap">
                                                  {t.bookList.bookCard.pdfStatus.pending}
                                                </span>
                                              ) : pdfStatus === "approved" ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-[#8aa06f] bg-[#eef5e9] text-[#3d5c2e] font-medium text-[10px] whitespace-nowrap">
                                                  {t.bookList.bookCard.pdfStatus.approved}
                                                </span>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    openPdfModal(book);
                                                  }}
                                                  className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-sm border border-[#6b5d4f] bg-[#5a4d40] text-[#f4e8d4] hover:bg-[#4a3d31] transition-colors font-medium text-[10px] whitespace-nowrap"
                                                >
                                                  <FaFileAlt className="w-3 h-3" />
                                                  {t.bookList.bookCard.pdfReport}
                                                </button>
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
          )}
        </section>
      </div>

      {/* PDF Submission Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="book-list-surface tron-border rounded-lg w-full max-w-md bg-[#f1e7d8] border border-[#5f4d42] p-6 shadow-xl"
          >
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
                    className="w-full px-3 py-2 bg-[#f8f1e6] border border-[#b9a58b] rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-[#7d6d5a] ink-text"
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
                    className="w-full px-3 py-2 bg-[#f8f1e6] border border-[#b9a58b] rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-[#7d6d5a] ink-text resize-none"
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
                  className="w-full py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm text-sm font-bold hover:bg-[#4a3d31] transition-colors disabled:opacity-50 uppercase tracking-wider"
                >
                  {isPending ? t.bookList.pdfModal.submitting : t.bookList.pdfModal.submit}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
