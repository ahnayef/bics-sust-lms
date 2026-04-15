"use client";

import StatusBadge from "@/app/components/StatusBadge";
import UserNavbar from "@/app/components/UserNavbar";
import {
  LIBRARY_BOOKS,
  type LibraryBook,
  type LibraryCopy,
} from "@/app/data/library";
import {
  addNewSubmission,
  hasExistingSubmissionForBook,
  MOCK_PDF_SUBMISSIONS,
  type PdfReadSubmission,
} from "@/app/data/pdf-submissions";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import {
  FaBook,
  FaBookOpen,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaFileAlt,
  FaFilter,
  FaSearch,
  FaSortAmountDown,
  FaTimes,
} from "react-icons/fa";

type SortKey =
  | "title"
  | "pages-asc"
  | "pages-desc"
  | "copies-asc"
  | "copies-desc";
type TypeFilter = "all" | "syllabus" | "additional";
type AvailabilityFilter = "all" | "available" | "unavailable";

const CURRENT_MEMBER = {
  id: "Member-204",
  name: "Mahmudul Hasan",
};

const getCopyStatusBadge = (status: LibraryCopy["status"]) =>
  status === "available" ? (
    <StatusBadge tone="success" size="xs" icon={FaCheckCircle}>
      Available
    </StatusBadge>
  ) : (
    <StatusBadge tone="warning" size="xs" icon={FaClock}>
      Borrowed
    </StatusBadge>
  );

export default function BookListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("title");
  const [expandedBookId, setExpandedBookId] = useState<number | null>(null);

  // PDF submission modal state
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedBookForPDF, setSelectedBookForPDF] =
    useState<LibraryBook | null>(null);
  const [pdfReadDate, setPdfReadDate] = useState("");
  const [pdfNote, setPdfNote] = useState("");
  const [pdfSubmitError, setPdfSubmitError] = useState("");
  const [pdfSubmitSuccess, setPdfSubmitSuccess] = useState(false);
  const [pdfSubmissions, setPdfSubmissions] =
    useState<PdfReadSubmission[]>(MOCK_PDF_SUBMISSIONS);

  const openPdfModal = (book: LibraryBook) => {
    setSelectedBookForPDF(book);
    setPdfReadDate("");
    setPdfNote("");
    setPdfSubmitError("");
    setPdfSubmitSuccess(false);
    setShowPdfModal(true);
  };

  const closePdfModal = () => {
    setShowPdfModal(false);
    setSelectedBookForPDF(null);
  };

  const handlePdfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPdfSubmitError("");

    if (!selectedBookForPDF) {
      setPdfSubmitError("No book selected");
      return;
    }

    if (!pdfReadDate.trim()) {
      setPdfSubmitError("Please select a read date");
      return;
    }

    // Check for duplicate pending/approved submission
    if (
      hasExistingSubmissionForBook(CURRENT_MEMBER.id, selectedBookForPDF.id, [
        "rejected",
      ])
    ) {
      setPdfSubmitError(
        "You already have a pending or approved submission for this book",
      );
      return;
    }

    // Create new submission
    const newSubmission = addNewSubmission(
      CURRENT_MEMBER.id,
      CURRENT_MEMBER.name,
      selectedBookForPDF.id,
      selectedBookForPDF.title,
      pdfReadDate,
      pdfNote,
    );

    setPdfSubmissions([...pdfSubmissions, newSubmission]);
    setPdfSubmitSuccess(true);

    // Auto-close after success
    setTimeout(() => {
      closePdfModal();
    }, 1500);
  };

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

  const stats = useMemo(
    () => ({
      books: LIBRARY_BOOKS.length,
      copies: LIBRARY_BOOKS.reduce(
        (total, book) => total + book.copies.length,
        0,
      ),
      available: LIBRARY_BOOKS.reduce(
        (total, book) =>
          total +
          book.copies.filter((copy) => copy.status === "available").length,
        0,
      ),
      borrowed: LIBRARY_BOOKS.reduce(
        (total, book) =>
          total +
          book.copies.filter((copy) => copy.status === "unavailable").length,
        0,
      ),
    }),
    [],
  );

  const filteredBooks = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    const matchesQuery = (book: LibraryBook, copy: LibraryCopy) => {
      if (!query) {
        return true;
      }

      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.pages.toString().includes(query) ||
        copy.id.toLowerCase().includes(query) ||
        copy.copyNumber.toLowerCase().includes(query) ||
        (copy.borrowedByName?.toLowerCase().includes(query) ?? false) ||
        (copy.borrowedBy?.toLowerCase().includes(query) ?? false)
      );
    };

    const filtered = LIBRARY_BOOKS.map((book) => {
      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "syllabus" ? book.isSyllabus : !book.isSyllabus);

      const copies = book.copies.filter((copy) => {
        const matchesAvailability =
          availabilityFilter === "all" || copy.status === availabilityFilter;

        return matchesAvailability && matchesQuery(book, copy);
      });

      return {
        ...book,
        copies,
        matchesType,
      };
    }).filter((book) => book.matchesType && book.copies.length > 0);

    filtered.sort((leftBook, rightBook) => {
      if (sortBy === "title") {
        return leftBook.title.localeCompare(rightBook.title, "bn");
      }

      if (sortBy === "pages-asc") {
        return (
          leftBook.pages - rightBook.pages ||
          leftBook.title.localeCompare(rightBook.title, "bn")
        );
      }

      if (sortBy === "pages-desc") {
        return (
          rightBook.pages - leftBook.pages ||
          leftBook.title.localeCompare(rightBook.title, "bn")
        );
      }

      if (sortBy === "copies-asc") {
        return (
          leftBook.copies.length - rightBook.copies.length ||
          leftBook.title.localeCompare(rightBook.title, "bn")
        );
      }

      return (
        rightBook.copies.length - leftBook.copies.length ||
        leftBook.title.localeCompare(rightBook.title, "bn")
      );
    });

    return filtered;
  }, [availabilityFilter, searchTerm, sortBy, typeFilter]);

  const isBorrowedByCurrentMember = (copy: LibraryCopy) =>
    copy.status === "unavailable" &&
    (copy.borrowedBy === CURRENT_MEMBER.id ||
      copy.borrowedByName === CURRENT_MEMBER.name);

  return (
    <div className="min-h-screen bg-[#e5d9c4] book-list-paper overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Courier+Prime:wght@400;700&display=swap');

        .book-list-paper {
          background-image:
            linear-gradient(180deg, #eee4d3 0%, #e5d8c1 52%, #dcccb2 100%),
            linear-gradient(92deg, rgba(88, 66, 46, 0.05), transparent 24%),
            linear-gradient(268deg, rgba(88, 66, 46, 0.04), transparent 18%),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px),
            url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="4" seed="6"/></filter><rect width="220" height="220" fill="%23e5d9c4"/><rect width="220" height="220" filter="url(%23p)" opacity="0.028"/></svg>');
        }

        .ink-text { font-family: 'Courier Prime', monospace; }
        .ink-title { font-family: 'Playfair Display', serif; }

        .book-list-surface {
          background-color: #f1e7d8;
          border: 1px solid #46372b;
          box-shadow: inset 0 0 0 1px rgba(244, 235, 219, 0.55), 0 0 0 1px rgba(69, 55, 43, 0.2);
        }

        .tron-border {
          position: relative;
          overflow: hidden;
        }

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
      `}</style>
      <UserNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <section
          className="book-list-surface tron-border rounded-lg p-3 sm:p-4"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <div className="flex flex-col gap-1.5">
            <div className="inline-flex w-fit items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#8a7966] bg-[#f6ecdd] text-[#4e4033] ink-text text-[9px] uppercase tracking-[0.12em]">
              <FaBook className="w-3 h-3" />
              Library Catalogue
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
              <h1 className="text-lg sm:text-xl font-bold text-[#221910] leading-tight ink-title">
                Books and copies
              </h1>
              <p className="text-[11px] sm:text-xs text-[#5c4f42] ink-text sm:text-right">
                {stats.books} books, {stats.copies} copies, {stats.available}{" "}
                open.
              </p>
            </div>
          </div>
        </section>

        <section
          className="book-list-surface tron-border rounded-lg p-3 sm:p-4"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-6 gap-2.5">
            <div className="relative xl:col-span-2">
              <FaSearch className="absolute left-3 top-3 text-[#7a6a5a]" />
              <input
                type="text"
                placeholder="Search title, author, copy, borrower..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text text-sm"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text text-sm"
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
              className="px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text text-sm"
            >
              <option value="all">All Copies</option>
              <option value="available">Available Copies</option>
              <option value="unavailable">Borrowed Copies</option>
            </select>

            <div className="relative xl:col-span-2">
              <FaSortAmountDown className="absolute left-3 top-3 text-[#7a6a5a]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="w-full pl-10 pr-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text text-sm"
              >
                <option value="title">Sort by Title</option>
                <option value="pages-asc">Pages: Low to High</option>
                <option value="pages-desc">Pages: High to Low</option>
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
              className="inline-flex items-center justify-center px-2 py-0.5 rounded-full border border-[#8a7966] bg-[#f6ecdd] text-[#4e4033] text-[11px] hover:bg-[#eadcca] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear filters
            </button>
          </div>
        </section>

        <section
          className="book-list-surface tron-border rounded-lg overflow-hidden border border-[#5f4f40]"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          {filteredBooks.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-[#5c4f42] ink-text">
                No books match the current search and filters.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-180 text-sm ink-text">
                <thead>
                  <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                    <th className="px-3 sm:px-4 py-2 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">
                      Book
                    </th>
                    <th className="px-3 sm:px-4 py-2 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">
                      Author
                    </th>
                    <th className="px-3 sm:px-4 py-2 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">
                      Pages
                    </th>
                    <th className="px-3 sm:px-4 py-2 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">
                      Type
                    </th>
                    <th className="px-3 sm:px-4 py-2 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">
                      Copies
                    </th>
                    <th className="px-3 sm:px-4 py-2 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">
                      Open
                    </th>
                    <th className="px-3 sm:px-4 py-2 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">
                      PDF
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBooks.map((book) => {
                    const availableCount = book.copies.filter(
                      (copy) => copy.status === "available",
                    ).length;
                    const isExpanded = expandedBookId === book.id;

                    return (
                      <Fragment key={book.id}>
                        <tr
                          className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors align-top cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            setExpandedBookId(isExpanded ? null : book.id)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setExpandedBookId(isExpanded ? null : book.id);
                            }
                          }}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? "Collapse" : "Expand"} copies for ${book.title}`}
                        >
                          <td className="px-3 sm:px-4 py-2">
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 h-6 w-6 shrink-0 rounded-sm border border-[#b59f84] bg-[#f6ecdd] text-[#4e4033] text-xs font-bold inline-flex items-center justify-center">
                                {isExpanded ? "-" : "+"}
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
                              {book.pages}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-[#8f7f6c] bg-[#efe4d1] text-[#3f3328] text-[11px] font-semibold">
                              <FaBookOpen className="w-3 h-3 text-[#4e4033]" />
                              {book.isSyllabus ? "Syllabus" : "Additional"}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 text-sm">
                            {book.copies.length}
                          </td>
                          <td className="px-3 sm:px-4 py-2 text-sm">
                            {availableCount}
                          </td>
                          <td className="px-3 sm:px-4 py-2 text-sm">
                            {book.pdfLink ? (
                              <a
                                href={book.pdfLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(event) => event.stopPropagation()}
                                className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-sm border border-[#4f4134] bg-[#3f3328] text-[#f4e8d4] hover:bg-[#4a3d31] transition-colors text-[10px] font-semibold whitespace-nowrap"
                                aria-label={`Download PDF for ${book.title}`}
                                title="Download PDF"
                              >
                                <FaDownload className="w-3 h-3" />
                                Download
                              </a>
                            ) : (
                              <span className="text-[#7b6d5f] text-[10px]">
                                -
                              </span>
                            )}
                          </td>
                        </tr>

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
                                        Status
                                      </th>
                                      <th className="py-1.5 pr-2 text-left font-semibold">
                                        Borrower
                                      </th>
                                      <th className="py-1.5 pr-2 text-left font-semibold">
                                        Action
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {book.copies.map((copy) => (
                                      <tr
                                        key={copy.id}
                                        className="border-b border-[#e4d4bf] last:border-b-0"
                                      >
                                        <td className="py-1.5 pr-2 font-mono text-[#3f3328]">
                                          {copy.id}
                                        </td>
                                        <td className="py-1.5 pr-2">
                                          {getCopyStatusBadge(copy.status)}
                                        </td>
                                        <td className="py-1.5 pr-2 text-[#5b4a3c]">
                                          {copy.status === "available"
                                            ? "-"
                                            : copy.borrowedByName ||
                                              copy.borrowedBy ||
                                              "Unknown"}
                                        </td>
                                        <td className="py-1.5 pr-2">
                                          <div className="flex gap-1 flex-wrap">
                                            {copy.status === "available" ? (
                                              <Link
                                                href={`/borrow?copyId=${encodeURIComponent(copy.id)}`}
                                                className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-sm border border-[#4f4134] bg-[#3f3328] text-[#f4e8d4] hover:bg-[#4a3d31] transition-colors font-medium text-[10px] sm:text-xs whitespace-nowrap"
                                              >
                                                Borrow
                                              </Link>
                                            ) : isBorrowedByCurrentMember(
                                                copy,
                                              ) ? (
                                              <Link
                                                href={`/return?copyId=${encodeURIComponent(copy.id)}`}
                                                className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-sm border border-[#4f4134] bg-[#5a4d40] text-[#f4e8d4] hover:bg-[#4a3d31] transition-colors font-medium text-[10px] sm:text-xs whitespace-nowrap"
                                              >
                                                Return
                                              </Link>
                                            ) : (
                                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-sm border border-[#9b8a75] bg-[#e3d2bf] text-[#6f6256] font-medium text-[10px] sm:text-xs whitespace-nowrap">
                                                Borrowed
                                              </span>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => openPdfModal(book)}
                                              className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-sm border border-[#6b5d4f] bg-[#5a4d40] text-[#f4e8d4] hover:bg-[#4a3d31] transition-colors font-medium text-[10px] sm:text-xs whitespace-nowrap"
                                            >
                                              <FaFileAlt className="w-3 h-3" />
                                              Mark as Read (PDF)
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
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
            data-aos="zoom-in"
            data-aos-duration="200"
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

            {pdfSubmitSuccess ? (
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
                  <p className="text-sm font-semibold text-[#4e4033] mb-2 ink-text">
                    Book
                  </p>
                  <p className="text-sm text-[#221910] ink-title font-semibold">
                    {selectedBookForPDF?.title}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#4e4033] mb-2 ink-text">
                    Read Date *
                  </label>
                  <input
                    type="date"
                    value={pdfReadDate}
                    onChange={(e) => setPdfReadDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] rounded-sm focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent outline-none ink-text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#4e4033] mb-2 ink-text">
                    Note (optional)
                  </label>
                  <textarea
                    value={pdfNote}
                    onChange={(e) => setPdfNote(e.target.value)}
                    placeholder="e.g., Read full copy, partial reading, etc."
                    rows={3}
                    className="w-full px-3 py-2 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] rounded-sm focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent outline-none ink-text text-sm"
                  />
                </div>

                {pdfSubmitError && (
                  <div className="p-3 bg-[#f6e3df] border border-[#b0665c] text-[#7d2d23] text-sm rounded-sm ink-text">
                    {pdfSubmitError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closePdfModal}
                    className="flex-1 px-3 py-2 border border-[#7b6d5f] text-[#4e4033] rounded-sm hover:bg-[#eadcca] transition-colors font-medium text-sm ink-text"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 bg-[#5a4d40] text-[#f6ede1] rounded-sm hover:bg-[#4c4035] transition-colors font-medium text-sm ink-text"
                  >
                    Submit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
