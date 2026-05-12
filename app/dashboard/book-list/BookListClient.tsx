"use client";

import StatusBadge from "@/app/components/StatusBadge";
import { submitPdfReport } from "@/server/transaction-actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState, useTransition } from "react";
import {
  FaBook,
  FaBookOpen,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaExclamationTriangle,
  FaFileAlt,
  FaFilter,
  FaSearch,
  FaSortAmountDown,
  FaTimes,
} from "react-icons/fa";
import type { Book, PdfSubmission } from "@/types/library";

type SortKey =
  | "title"
  | "pages-asc"
  | "pages-desc"
  | "copies-asc"
  | "copies-desc";
type TypeFilter = "all" | "syllabus" | "additional";
type AvailabilityFilter = "all" | "available" | "unavailable";

interface Props {
  books: Book[];
  userId: string;
  activeBorrowCopyIds: string[];
  pdfSubmissions: PdfSubmission[];
}

// ── Copy status badge ──────────────────────────────────────────────────────

function CopyStatusBadge({ status }: { status: string }) {
  if (status === "available") {
    return (
      <StatusBadge tone="success" size="xs" icon={FaCheckCircle}>
        Available
      </StatusBadge>
    );
  }
  if (status === "damaged") {
    return (
      <StatusBadge tone="danger" size="xs" icon={FaExclamationTriangle}>
        Damaged
      </StatusBadge>
    );
  }
  return (
    <StatusBadge tone="warning" size="xs" icon={FaClock}>
      Borrowed
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

  // Filter / sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("title");
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
      setPdfError(
        "You already have a pending or approved submission for this book.",
      );
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("book_id", selectedBookForPdf.id);
      fd.set("read_date", pdfReadDate);
      if (pdfNote.trim()) fd.set("note", pdfNote.trim());

      const result = await submitPdfReport(fd);
      if (result.error) {
        setPdfError(result.error);
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
            availabilityFilter === "all" ||
            (availabilityFilter === "available"
              ? copy.status === "available"
              : copy.status !== "available");

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
      if (sortBy === "title") return a.title.localeCompare(b.title, "bn");
      if (sortBy === "pages-asc")
        return (
          (a.pages ?? 0) - (b.pages ?? 0) || a.title.localeCompare(b.title)
        );
      if (sortBy === "pages-desc")
        return (
          (b.pages ?? 0) - (a.pages ?? 0) || a.title.localeCompare(b.title)
        );
      if (sortBy === "copies-asc")
        return (
          a.copies.length - b.copies.length || a.title.localeCompare(b.title)
        );
      return (
        b.copies.length - a.copies.length || a.title.localeCompare(b.title)
      );
    });

    return result;
  }, [books, searchTerm, typeFilter, availabilityFilter, sortBy]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    typeFilter !== "all" ||
    availabilityFilter !== "all" ||
    sortBy !== "title";

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setAvailabilityFilter("all");
    setSortBy("title");
    setExpandedBookId(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <style>{bookListStyles}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <section
          className="book-list-surface tron-border rounded-lg p-3 sm:p-4"
        >
          <div className="flex flex-col gap-1.5">
            <div className="inline-flex w-fit items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#8a7966] bg-[#f6ecdd] text-[#4e4033] ink-text text-[9px] uppercase tracking-[0.12em]">
              <FaBook className="w-3 h-3" />
              Library Catalogue
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
              <h1 className="text-lg sm:text-xl font-bold text-[#221910] leading-tight ink-title">
                Book List
              </h1>
              <p className="text-[11px] sm:text-xs text-[#5c4f42] ink-text sm:text-right">
                {stats.books} books · {stats.copies} copies · {stats.available}{" "}
                available
              </p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section
          className="book-list-surface tron-border rounded-lg p-3 sm:p-4"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-6 gap-2.5">
            <div className="relative xl:col-span-2">
              <FaSearch className="absolute left-3 top-3 text-[#7a6a5a]" />
              <input
                type="text"
                placeholder="Search title, author, copy ID…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-sm"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-sm"
            >
              <option value="all">All Types</option>
              <option value="syllabus">Syllabus</option>
              <option value="additional">Additional</option>
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) =>
                setAvailabilityFilter(e.target.value as AvailabilityFilter)
              }
              className="px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-sm"
            >
              <option value="all">All Copies</option>
              <option value="available">Available Only</option>
              <option value="unavailable">Borrowed / Damaged</option>
            </select>

            <div className="relative xl:col-span-2">
              <FaSortAmountDown className="absolute left-3 top-3 text-[#7a6a5a]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="w-full pl-10 pr-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-sm"
              >
                <option value="title">Sort by Title</option>
                <option value="pages-asc">Pages: Low → High</option>
                <option value="pages-desc">Pages: High → Low</option>
                <option value="copies-desc">Copies: Most First</option>
                <option value="copies-asc">Copies: Fewest First</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#6b5c4e] ink-text">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[#c2b09a] bg-[#f6ecdd] text-[11px]">
              <FaFilter className="w-3 h-3" />
              {filteredBooks.length} books shown
            </span>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#8a7966] bg-[#f6ecdd] text-[#4e4033] text-[11px] hover:bg-[#eadcca] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaTimes className="w-2.5 h-2.5" /> Clear filters
            </button>
          </div>
        </section>

        {/* Book table */}
        <section
          className="book-list-surface tron-border rounded-lg overflow-hidden border border-[#5f4f40]"
        >
          {filteredBooks.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-[#5c4f42] ink-text">
                No books match the current filters.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-180 text-sm ink-text">
                <thead>
                  <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                    {[
                      "Book",
                      "Author",
                      "Pages",
                      "Type",
                      "Copies",
                      "Open",
                      "PDF",
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
                                  {book.copies.length} copies total
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
                              {book.is_syllabus ? "Syllabus" : "Additional"}
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
                                PDF
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
                                        Copy ID
                                      </th>
                                      <th className="py-1.5 pr-2 text-left font-semibold">
                                        Copy #
                                      </th>
                                      <th className="py-1.5 pr-2 text-left font-semibold">
                                        Status
                                      </th>
                                      <th className="py-1.5 pr-2 text-left font-semibold">
                                        Action
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
                                                  Borrow
                                                </Link>
                                              ) : isMyBorrow ? (
                                                <Link
                                                  href="/dashboard/return"
                                                  className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-sm border border-[#4f4134] bg-[#5a4d40] text-[#f4e8d4] hover:bg-[#4a3d31] transition-colors font-medium text-[10px] whitespace-nowrap"
                                                >
                                                  Return
                                                </Link>
                                              ) : (
                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-sm border border-[#9b8a75] bg-[#e3d2bf] text-[#6f6256] font-medium text-[10px] whitespace-nowrap">
                                                  {copy.status === "damaged"
                                                    ? "Damaged"
                                                    : "Borrowed"}
                                                </span>
                                              )}

                                              {/* PDF report button */}
                                              {pdfStatus === "pending" ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-[#b49d6f] bg-[#f4ecd8] text-[#6b5428] font-medium text-[10px] whitespace-nowrap">
                                                  PDF Pending
                                                </span>
                                              ) : pdfStatus === "approved" ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-[#8aa06f] bg-[#eef5e9] text-[#3d5c2e] font-medium text-[10px] whitespace-nowrap">
                                                  PDF Approved
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
                                                  Mark as Read (PDF)
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
                Mark as Read (PDF)
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
                  Submitted!
                </p>
                <p className="text-sm text-[#5c4f42] ink-text">
                  Your PDF read submission is pending moderator approval.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePdfSubmit} className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-[#4e4033] mb-1 ink-text">
                    Book
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
                    Date Read *
                  </label>
                  <input
                    type="date"
                    value={pdfReadDate}
                    onChange={(e) => setPdfReadDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    required
                    className="w-full px-3 py-2 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] rounded-sm focus:ring-2 focus:ring-[#5a4d40] outline-none ink-text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#4e4033] mb-1 ink-text">
                    Note (optional)
                  </label>
                  <textarea
                    value={pdfNote}
                    onChange={(e) => setPdfNote(e.target.value)}
                    placeholder="e.g., Full read, partial reading, audio companion…"
                    rows={3}
                    className="w-full px-3 py-2 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] rounded-sm focus:ring-2 focus:ring-[#5a4d40] outline-none ink-text text-sm"
                  />
                </div>

                {pdfError && (
                  <div className="p-3 bg-[#f6e3df] border border-[#b0665c] text-[#7d2d23] text-sm rounded-sm ink-text">
                    {pdfError}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={closePdfModal}
                    className="flex-1 px-3 py-2 border border-[#7b6d5f] text-[#4e4033] rounded-sm hover:bg-[#eadcca] transition-colors font-medium text-sm ink-text"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !pdfReadDate}
                    className="flex-1 px-3 py-2 bg-[#5a4d40] text-[#f6ede1] rounded-sm hover:bg-[#4c4035] transition-colors font-medium text-sm ink-text disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? "Submitting…" : "Submit"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const bookListStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Courier+Prime:wght@400;700&display=swap');

  .ink-text { font-family: 'Courier Prime', monospace; }
  .ink-title { font-family: 'Playfair Display', serif; }

  .book-list-surface {
    background-color: #f1e7d8;
    border: 1px solid #46372b;
    box-shadow: inset 0 0 0 1px rgba(244, 235, 219, 0.55), 0 0 0 1px rgba(69, 55, 43, 0.2);
  }

  .tron-border { position: relative; overflow: hidden; }

  .tron-border::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      repeating-linear-gradient(90deg, rgba(77, 59, 43, 0.24) 0 3px, transparent 3px 20px) top / 100% 1px no-repeat,
      repeating-linear-gradient(90deg, rgba(77, 59, 43, 0.18) 0 2px, transparent 2px 18px) bottom / 100% 1px no-repeat,
      repeating-linear-gradient(180deg, rgba(77, 59, 43, 0.18) 0 2px, transparent 2px 16px) left / 1px 100% no-repeat,
      repeating-linear-gradient(180deg, rgba(77, 59, 43, 0.14) 0 2px, transparent 2px 20px) right / 1px 100% no-repeat;
    opacity: 0.78;
  }
`;
