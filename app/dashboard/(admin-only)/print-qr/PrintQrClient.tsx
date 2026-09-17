"use client";
import { InventoryNav } from "@/app/dashboard/components/StaffHubNav";
import { useTranslation } from "@/lib/i18n/context";
import "@/styles/components.css";
import "@/styles/typography.css";
import QRCode from "qrcode";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaBookOpen,
  FaCheckSquare,
  FaChevronDown,
  FaChevronUp,
  FaFilter,
  FaPrint,
  FaRegSquare,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

interface Book {
  id: string;
  title: string;
  author: string;
  is_syllabus?: boolean;
}

interface Copy {
  id: string;
  book_id: string;
  copy_number: number;
}

interface Props {
  books: Book[];
  copies: Copy[];
}

type TypeFilter = "all" | "syllabus" | "additional";

export default function PrintQrClient({ books, copies }: Props) {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<"select" | "preview">("select");

  // Selection state
  const [selectedCopies, setSelectedCopies] = useState<Set<string>>(new Set());
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);

  // Print Options
  const [duplicateCount, setDuplicateCount] = useState<number>(1);
  const [fillPage, setFillPage] = useState<boolean>(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [authorFilter, setAuthorFilter] = useState<string>("all");

  const uniqueAuthors = useMemo(() => {
    const authors = new Set(books.map((b) => b.author));
    return Array.from(authors).sort();
  }, [books]);

  const filteredBooks = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return books
      .map((book) => {
        const matchesType =
          typeFilter === "all" ||
          (typeFilter === "syllabus" ? book.is_syllabus : !book.is_syllabus);
        const matchesAuthor =
          authorFilter === "all" || book.author === authorFilter;
        const bookCopies = copies.filter((c) => c.book_id === book.id);

        const matchesQuery =
          !query ||
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.id.toLowerCase().includes(query) ||
          bookCopies.some((c) => c.id.toLowerCase().includes(query));

        return {
          ...book,
          copies: bookCopies,
          visible: matchesType && matchesAuthor && matchesQuery,
        };
      })
      .filter((b) => b.visible);
  }, [books, copies, searchTerm, typeFilter, authorFilter]);

  const visibleCopyIds = useMemo(() => {
    return filteredBooks.flatMap((b) => b.copies.map((c) => c.id));
  }, [filteredBooks]);

  const hasActiveFilters =
    searchTerm !== "" || typeFilter !== "all" || authorFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setAuthorFilter("all");
    setExpandedBookId(null);
  };

  const isAllSelected =
    visibleCopyIds.length > 0 &&
    visibleCopyIds.every((id) => selectedCopies.has(id));
  const isSomeSelected = visibleCopyIds.some((id) => selectedCopies.has(id));

  const toggleSelectAll = () => {
    const next = new Set(selectedCopies);
    if (isAllSelected) {
      visibleCopyIds.forEach((id) => next.delete(id));
    } else {
      visibleCopyIds.forEach((id) => next.add(id));
    }
    setSelectedCopies(next);
  };

  const toggleBookSelect = (e: React.MouseEvent, copyIds: string[]) => {
    e.stopPropagation();
    const next = new Set(selectedCopies);
    const allSelected = copyIds.every((id) => next.has(id));
    if (allSelected) {
      copyIds.forEach((id) => next.delete(id));
    } else {
      copyIds.forEach((id) => next.add(id));
    }
    setSelectedCopies(next);
  };

  const toggleCopySelect = (e: React.MouseEvent, copyId: string) => {
    e.stopPropagation();
    const next = new Set(selectedCopies);
    if (next.has(copyId)) next.delete(copyId);
    else next.add(copyId);
    setSelectedCopies(next);
  };

  // QR Generation
  const [qrImages, setQrImages] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const generateQRs = async () => {
      const images: Record<string, string> = {};
      const selected = Array.from(selectedCopies);
      for (const id of selected) {
        images[id] = await QRCode.toDataURL(id, { margin: 1, width: 120 });
      }
      if (active) setQrImages(images);
    };
    generateQRs();
    return () => {
      active = false;
    };
  }, [selectedCopies]);

  const printCopies = useMemo(() => {
    const baseCopies = copies
      .filter((c) => selectedCopies.has(c.id))
      .sort((a, b) => {
        // Sort by book title, then copy number
        const bookA = books.find((book) => book.id === a.book_id);
        const bookB = books.find((book) => book.id === b.book_id);
        if (!bookA || !bookB) return 0;
        return (
          bookA.title.localeCompare(bookB.title) ||
          a.copy_number - b.copy_number
        );
      });

    if (baseCopies.length === 0) return [];

    const duplicated: Copy[] = [];
    for (const copy of baseCopies) {
      for (let i = 0; i < duplicateCount; i++) {
        duplicated.push(copy);
      }
    }

    if (fillPage) {
      const ITEMS_PER_PAGE = 25; // 5 cols * 4 rows fits with 100% safety on all margins
      const currentLength = duplicated.length;
      if (currentLength > 0) {
        const remainder = currentLength % ITEMS_PER_PAGE;
        if (remainder !== 0) {
          const needed = ITEMS_PER_PAGE - remainder;
          for (let i = 0; i < needed; i++) {
            duplicated.push(duplicated[i % currentLength]);
          }
        }
      }
    }

    return duplicated;
  }, [copies, selectedCopies, books, duplicateCount, fillPage]);

  return (
    <div className="space-y-3 sm:space-y-5 print:space-y-0 print:m-0 px-2 sm:px-6 lg:px-8 py-3 sm:py-6">
      {/* Inventory Hub Sub-Navigation (Hidden on mobile for native app flow) */}
      <div className="hidden md:block print:hidden">
        <InventoryNav />
      </div>

      {/* Header */}
      <section className="book-list-surface tron-border rounded-xl p-3 sm:p-5 print:hidden shadow-xs">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#8a7966] bg-[#f6ecdd] text-[#4e4033] ink-text text-[9px] sm:text-[10px] uppercase tracking-[0.12em] font-semibold">
              <FaPrint className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {t.bookList.qrPrint.subtitle}
            </div>

            {/* Quick stats pill */}
            <div className="flex items-center gap-1.5 text-xs text-[#5c4f42]">
              <span className="px-2 py-0.5 rounded-md bg-[#eadcc8] border border-[#d2bfa5] text-[11px] font-medium">
                {books.length} {t.bookList.table.book}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#eadcc8] border border-[#d2bfa5] text-[11px] font-medium">
                {copies.length} {t.bookList.table.copies}
              </span>
              {selectedCopies.size > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-[#eef5e9] border border-[#8aa06f] text-[#3d5c2e] text-[11px] font-bold">
                  {selectedCopies.size}{" "}
                  {language === "bn" ? "নির্বাচিত" : "Selected"}
                </span>
              )}
            </div>
          </div>

          <h1 className="text-base sm:text-2xl font-bold text-[#221910] leading-tight ink-title">
            {t.bookList.qrPrint.title}
          </h1>
        </div>
      </section>

      {/* Main Container */}
      <section className="book-list-surface tron-border rounded-xl border border-[#5f4f40] overflow-hidden print:border-none print:shadow-none print:bg-transparent print:overflow-visible print:p-0 print:m-0 print:rounded-none">
        {/* Segmented Control Tabs */}
        <div className="w-full bg-[#eadcc8] border-b border-[#7d6d5a] p-1 sm:p-1.5 flex gap-1 print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("select")}
            className={`flex-1 py-2 sm:py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "select"
                ? "bg-[#f6ecdd] text-[#221910] shadow-xs font-bold"
                : "text-[#5a4b3f] hover:bg-[#dfd0bc]"
            }`}
          >
            <span>{t.bookList.qrPrint.tabs.select}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex-1 py-2 sm:py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "preview"
                ? "bg-[#f6ecdd] text-[#221910] shadow-xs font-bold"
                : "text-[#5a4b3f] hover:bg-[#dfd0bc]"
            }`}
          >
            <span>{t.bookList.qrPrint.tabs.preview}</span>
            {selectedCopies.size > 0 && (
              <span className="bg-[#4a3d31] text-[#f4e8d4] px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {selectedCopies.size}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Selection */}
        {activeTab === "select" && (
          <div className="p-3 sm:p-5 space-y-3 sm:space-y-4 print:hidden">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-2 sm:gap-2.5">
              <div className="relative sm:col-span-2 xl:col-span-2">
                <FaSearch className="absolute left-3 top-2.5 text-[#7a6a5a] text-xs" />
                <input
                  type="text"
                  placeholder={t.bookList.header.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[#8a7966] bg-[#f8f1e6] text-[#2f251d] rounded-lg focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-xs sm:text-sm"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="xl:col-span-2 px-3 py-2 border border-[#8a7966] bg-[#f8f1e6] text-[#2f251d] rounded-lg focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-xs sm:text-sm"
              >
                <option value="all">{t.bookList.filters.type.all}</option>
                <option value="syllabus">
                  {t.bookList.filters.type.syllabus}
                </option>
                <option value="additional">
                  {t.bookList.filters.type.additional}
                </option>
              </select>
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="xl:col-span-2 px-3 py-2 border border-[#8a7966] bg-[#f8f1e6] text-[#2f251d] rounded-lg focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-xs sm:text-sm truncate"
              >
                <option value="all">
                  {t.bookList.qrPrint.filters.allAuthors}
                </option>
                {uniqueAuthors.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter tags & actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6b5c4e] ink-text">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#c2b09a] bg-[#f8f1e6] text-[11px]">
                  <FaFilter className="w-2.5 h-2.5" />
                  {t.bookList.qrPrint.filters.booksShown.replace(
                    "{count}",
                    filteredBooks.length.toString(),
                  )}
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[#8a7966] bg-[#f8f1e6] text-[#4e4033] text-[11px] hover:bg-[#eadcca] transition-colors"
                  >
                    <FaTimes className="w-2.5 h-2.5" />
                    {t.bookList.empty.clearFilters}
                  </button>
                )}
              </div>

              {/* Select all toggle button */}
              <button
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#8a7966] bg-[#eadcc8] hover:bg-[#dfcfb9] text-[#221910] text-[11px] sm:text-xs font-semibold transition-colors"
              >
                {isAllSelected ? (
                  <FaCheckSquare className="w-3.5 h-3.5 text-[#4a7c59]" />
                ) : (
                  <FaRegSquare className="w-3.5 h-3.5" />
                )}
                <span>{t.bookList.qrPrint.table.selectUnselectAll}</span>
              </button>
            </div>

            {/* Books Container */}
            {filteredBooks.length === 0 ? (
              <div className="p-8 sm:p-12 text-center rounded-xl border border-[#d2bfa5] bg-[#f8f1e6]">
                <p className="text-[#5c4f42] text-xs sm:text-sm ink-text">
                  {t.bookList.empty.noBooks}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Cards View (block md:hidden) */}
                <div className="block md:hidden space-y-2">
                  {filteredBooks.map((book) => {
                    const isExpanded = expandedBookId === book.id;
                    const copyIds = book.copies.map((c) => c.id);
                    const allSelected =
                      copyIds.length > 0 &&
                      copyIds.every((id) => selectedCopies.has(id));
                    const someSelected = copyIds.some((id) =>
                      selectedCopies.has(id),
                    );
                    const selectedCount = copyIds.filter((id) =>
                      selectedCopies.has(id),
                    ).length;

                    return (
                      <div
                        key={book.id}
                        className={`rounded-xl border transition-all ${
                          allSelected
                            ? "border-[#8aa06f] bg-[#f2f7ef]"
                            : someSelected
                              ? "border-[#c4b08a] bg-[#fbf7f0]"
                              : "border-[#d2bfa5] bg-[#f8f1e6]"
                        }`}
                      >
                        <div className="p-3">
                          <div className="flex items-start gap-2.5">
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={(e) => toggleBookSelect(e, copyIds)}
                              className={`mt-0.5 shrink-0 transition-colors ${
                                allSelected
                                  ? "text-[#4a7c59]"
                                  : someSelected
                                    ? "text-[#8faa8f]"
                                    : "text-[#8a7966] hover:text-[#4e4033]"
                              }`}
                              aria-label="Select book copies"
                            >
                              {allSelected ? (
                                <FaCheckSquare className="w-5 h-5" />
                              ) : (
                                <FaRegSquare className="w-5 h-5" />
                              )}
                            </button>

                            {/* Book Info */}
                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() =>
                                setExpandedBookId(isExpanded ? null : book.id)
                              }
                            >
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-[#221910] text-xs sm:text-sm leading-snug">
                                  {book.title}
                                </p>
                                {book.is_syllabus ? (
                                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold border border-[#8aa06f] bg-[#eef5e9] text-[#3d5c2e]">
                                    {t.bookList.filters.type.syllabus}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold border border-[#8f7f6c] bg-[#f0e6d8] text-[#5b4a3c]">
                                    {t.bookList.filters.type.additional}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#6a5a4c] mt-0.5 truncate">
                                {book.author}
                              </p>
                            </div>

                            {/* Expand / Copies pill */}
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedBookId(isExpanded ? null : book.id)
                              }
                              className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg border border-[#c2b09a] bg-[#f0e5d5] hover:bg-[#e6d8c4] text-[#4e4033] text-[10px] sm:text-[11px] font-semibold transition-colors"
                            >
                              <span>
                                {book.copies.length}{" "}
                                {language === "bn" ? "কপি" : "copies"}
                              </span>
                              {isExpanded ? (
                                <FaChevronUp className="w-2.5 h-2.5" />
                              ) : (
                                <FaChevronDown className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>

                          {/* Quick selection indicator */}
                          {someSelected && !allSelected && (
                            <p className="text-[11px] text-[#4a7c59] font-medium mt-1.5 pl-7">
                              {selectedCount} / {copyIds.length}{" "}
                              {language === "bn"
                                ? "টি কপি নির্বাচিত"
                                : "copies selected"}
                            </p>
                          )}
                        </div>

                        {/* Expanded Copies Drawer */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 border-t border-[#d2bfa5]/60 bg-white/70 rounded-b-xl">
                            <div className="flex items-center justify-between py-1 mb-1.5">
                              <span className="text-[10px] uppercase tracking-wider font-bold text-[#6a5a4c]">
                                {language === "bn"
                                  ? "কপি তালিকা:"
                                  : "Select individual copies:"}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const next = new Set(selectedCopies);
                                    copyIds.forEach((id) => next.add(id));
                                    setSelectedCopies(next);
                                  }}
                                  className="text-[10px] text-[#4a7c59] hover:underline font-bold"
                                >
                                  {language === "bn"
                                    ? "সব নির্বাচন"
                                    : "Select all"}
                                </button>
                                <span className="text-[#8a7966]">•</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const next = new Set(selectedCopies);
                                    copyIds.forEach((id) => next.delete(id));
                                    setSelectedCopies(next);
                                  }}
                                  className="text-[10px] text-[#9b3a25] hover:underline font-bold"
                                >
                                  {language === "bn" ? "সব বাতিল" : "Deselect"}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5">
                              {book.copies.map((copy) => {
                                const isSelected = selectedCopies.has(copy.id);
                                return (
                                  <button
                                    key={copy.id}
                                    type="button"
                                    onClick={(e) =>
                                      toggleCopySelect(e, copy.id)
                                    }
                                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
                                      isSelected
                                        ? "bg-[#eef5e9] border-[#8aa06f] text-[#3d5c2e] shadow-xs"
                                        : "bg-white border-[#e4d4bf] text-[#5b4a3c] hover:bg-[#f8f1e6]"
                                    }`}
                                  >
                                    {isSelected ? (
                                      <FaCheckSquare className="w-3.5 h-3.5 shrink-0 text-[#4a7c59]" />
                                    ) : (
                                      <FaRegSquare className="w-3.5 h-3.5 shrink-0 text-[#8a7966]" />
                                    )}
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold truncate">
                                        Copy #{copy.copy_number}
                                      </p>
                                      <p className="text-[9px] font-mono opacity-70 truncate">
                                        {copy.id}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View (hidden md:block) */}
                <div className="hidden md:block border border-[#d2bfa5] rounded-xl overflow-hidden bg-[#f8f1e6]">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-sm ink-text">
                      <thead>
                        <tr className="bg-[#eadcc8] border-b border-[#d2bfa5]">
                          <th className="w-10 px-3 py-2.5 text-center text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">
                            {t.bookList.qrPrint.table.sel}
                          </th>
                          <th className="px-3 py-2.5 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">
                            {t.bookList.table.book}
                          </th>
                          <th className="px-3 py-2.5 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">
                            {t.bookList.table.author}
                          </th>
                          <th className="px-3 py-2.5 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">
                            {t.bookList.table.type}
                          </th>
                          <th className="px-3 py-2.5 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">
                            {t.bookList.table.copies}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBooks.map((book) => {
                          const isExpanded = expandedBookId === book.id;
                          const copyIds = book.copies.map((c) => c.id);
                          const allSelected =
                            copyIds.length > 0 &&
                            copyIds.every((id) => selectedCopies.has(id));
                          const someSelected = copyIds.some((id) =>
                            selectedCopies.has(id),
                          );

                          return (
                            <Fragment key={book.id}>
                              <tr
                                className="border-b border-[#d2bfa5] hover:bg-[#efe4d1] transition-colors align-top cursor-pointer"
                                onClick={() =>
                                  setExpandedBookId(isExpanded ? null : book.id)
                                }
                              >
                                <td className="px-3 py-3 text-center align-middle">
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      toggleBookSelect(e, copyIds)
                                    }
                                    className={`transition-colors ${
                                      allSelected
                                        ? "text-[#4a7c59]"
                                        : someSelected
                                          ? "text-[#8faa8f]"
                                          : "text-[#8a7966] hover:text-[#4e4033]"
                                    }`}
                                  >
                                    {allSelected ? (
                                      <FaCheckSquare className="w-4 h-4" />
                                    ) : (
                                      <FaRegSquare className="w-4 h-4" />
                                    )}
                                  </button>
                                </td>
                                <td className="px-3 py-3">
                                  <div className="flex items-start gap-2">
                                    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-md border border-[#b59f84] bg-[#f8f1e6] text-[#4e4033] text-xs font-bold inline-flex items-center justify-center">
                                      {isExpanded ? "−" : "+"}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-[#221910] leading-snug text-sm">
                                        {book.title}
                                      </p>
                                      <p className="text-[10px] text-[#6a5a4c] mt-0.5 font-mono">
                                        ID: {book.id}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-[#5a4b3f] text-sm">
                                  {book.author}
                                </td>
                                <td className="px-3 py-3">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[#8f7f6c] bg-[#f8f1e6] text-[#3f3328] text-[11px] font-semibold">
                                    <FaBookOpen className="w-3 h-3 text-[#4e4033]" />
                                    {book.is_syllabus
                                      ? t.bookList.filters.type.syllabus
                                      : t.bookList.filters.type.additional}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-[#5a4b3f] text-sm font-semibold">
                                  {book.copies.length}
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr className="bg-[#fcf8f3] border-b border-[#d2bfa5]">
                                  <td></td>
                                  <td colSpan={4} className="px-3 py-3">
                                    <div className="w-full max-w-2xl bg-white border border-[#e4d4bf] rounded-lg p-3">
                                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#6a5a4c] mb-2 border-b border-[#e4d4bf] pb-1">
                                        Copies of {book.title}
                                      </h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {book.copies.map((copy) => {
                                          const isSelected = selectedCopies.has(
                                            copy.id,
                                          );
                                          return (
                                            <button
                                              key={copy.id}
                                              type="button"
                                              onClick={(e) =>
                                                toggleCopySelect(e, copy.id)
                                              }
                                              className={`flex items-center gap-2 p-2 rounded-lg border transition-colors text-left ${
                                                isSelected
                                                  ? "bg-[#eef5e9] border-[#8aa06f] text-[#3d5c2e]"
                                                  : "bg-[#fcf8f3] border-[#e4d4bf] text-[#5b4a3c] hover:bg-[#f8f1e6]"
                                              }`}
                                            >
                                              {isSelected ? (
                                                <FaCheckSquare className="w-3.5 h-3.5 shrink-0 text-[#4a7c59]" />
                                              ) : (
                                                <FaRegSquare className="w-3.5 h-3.5 shrink-0 text-[#8a7966]" />
                                              )}
                                              <div className="min-w-0">
                                                <p className="text-xs font-semibold">
                                                  Copy #{copy.copy_number}
                                                </p>
                                                <p className="text-[10px] font-mono opacity-80">
                                                  {copy.id}
                                                </p>
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
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
                </div>
              </>
            )}

            {/* Sticky Mobile Floating Action Bar when items selected */}
            {selectedCopies.size > 0 && (
              <div className="md:hidden sticky bottom-16 sm:bottom-0 z-30 -mx-3 -mb-3 p-3 bg-[#3f3328] text-[#f4e8d4] shadow-lg flex items-center justify-between rounded-t-xl border-t border-[#6e5d4a]">
                <div>
                  <p className="text-xs font-bold leading-tight">
                    {selectedCopies.size}{" "}
                    {language === "bn" ? "টি কপি নির্বাচিত" : "copies selected"}
                  </p>
                  <p className="text-[10px] text-[#c5b090]">
                    {language === "bn"
                      ? "প্রিন্ট লেআউট প্রস্তুত"
                      : "Ready to preview"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("preview");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4a7c59] hover:bg-[#3d6447] text-[#f6ecdd] text-xs font-bold rounded-lg shadow-xs transition-all"
                >
                  <span>{language === "bn" ? "প্রিভিউ দেখুন" : "Preview"}</span>
                  <FaArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Preview & Print */}
        {activeTab === "preview" && (
          <div className="p-3 sm:p-5 bg-white print:p-0">
            {/* Options Bar */}
            <div className="p-3 sm:p-4 rounded-xl bg-[#f8f1e6] border border-[#d2bfa5] space-y-3 mb-4 print:hidden shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#221910] ink-title">
                    {t.bookList.qrPrint.preview.options}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#6a5a4c] ink-text">
                    {selectedCopies.size}{" "}
                    {language === "bn" ? "টি কপি নির্বাচিত" : "items selected"}{" "}
                    • {t.overview.stats.copies}: {printCopies.length}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    disabled={printCopies.length === 0}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#4a7c59] text-[#f6ecdd] border border-[#3d6447] rounded-lg hover:bg-[#3d6447] transition-all text-xs sm:text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                  >
                    <FaPrint className="w-3.5 h-3.5" />
                    {t.bookList.qrPrint.preview.print}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#d2bfa5]/60 text-xs sm:text-sm">
                <label className="flex items-center justify-between sm:justify-start gap-2 text-[#3b3026] p-2 bg-white/70 rounded-lg border border-[#e4d4bf]">
                  <span className="font-semibold text-xs sm:text-sm">
                    {t.bookList.qrPrint.preview.duplicates}:
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={duplicateCount}
                    onChange={(e) =>
                      setDuplicateCount(
                        Math.max(1, parseInt(e.target.value) || 1),
                      )
                    }
                    className="w-16 px-2 py-1 border border-[#8a7966] bg-white rounded-md text-center font-bold focus:ring-2 focus:ring-[#6e5d4a] outline-none text-xs sm:text-sm"
                  />
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-[#3b3026] p-2 bg-white/70 rounded-lg border border-[#e4d4bf]">
                  <input
                    type="checkbox"
                    checked={fillPage}
                    onChange={(e) => setFillPage(e.target.checked)}
                    className="w-4 h-4 accent-[#4a7c59] rounded"
                  />
                  <div className="min-w-0">
                    <span className="font-semibold text-xs sm:text-sm block truncate">
                      {t.bookList.qrPrint.preview.fillPage}
                    </span>
                    <span className="text-[10px] text-[#6a5a4c] block truncate">
                      {t.bookList.qrPrint.preview.fillPageNote}
                    </span>
                  </div>
                </label>
              </div>

              <p className="text-[10px] text-[#7a6a5a] pt-1">
                {t.bookList.qrPrint.preview.printNote}
              </p>
            </div>

            {selectedCopies.size === 0 ? (
              <div className="text-center py-10 sm:py-16">
                <p className="text-[#5c4f42] text-xs sm:text-sm ink-text">
                  {t.bookList.empty.noBooks}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("select")}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#eadcc8] hover:bg-[#dfcfb9] text-[#221910] text-xs font-semibold rounded-lg transition-colors"
                >
                  <span>{t.bookList.qrPrint.tabs.select}</span>
                </button>
              </div>
            ) : (
              <div
                id="print-area"
                className="min-h-[297mm] print:min-h-0 w-full max-w-[210mm] print:max-w-none print:w-full mx-auto print:mx-0 print:border-none print:shadow-none bg-white print:bg-transparent"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3.5 print:grid-cols-5 print:gap-2">
                  {printCopies.map((copy, idx) => {
                    const book = books.find((b) => b.id === copy.book_id);
                    return (
                      <div
                        key={`${copy.id}-${idx}`}
                        className="flex flex-col items-center border border-dashed border-[#bda68c] print:border-gray-400 p-2 break-inside-avoid bg-white rounded-lg print:rounded-none"
                      >
                        {qrImages[copy.id] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={qrImages[copy.id]}
                            alt={copy.id}
                            className="w-full max-w-[110px] sm:max-w-[120px] aspect-square object-contain"
                          />
                        ) : (
                          <div className="w-full max-w-[110px] sm:max-w-[120px] aspect-square bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                            Loading...
                          </div>
                        )}
                        <div className="text-center mt-1 w-full text-[10px] leading-tight font-sans text-black">
                          <p
                            className="font-bold truncate text-[11px]"
                            title={book?.title}
                          >
                            {book?.title}
                          </p>
                          <p className="text-[9px] text-gray-700 mt-0.5">
                            Copy #{copy.copy_number}
                          </p>
                          <p className="font-mono text-[9px] sm:text-[10px] mt-0.5 truncate opacity-80">
                            {copy.id}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
