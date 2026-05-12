"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QRCode from "qrcode";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  FaBookOpen,
  FaCheckSquare,
  FaFilter,
  FaPrint,
  FaRegSquare,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import "@/styles/typography.css";
import "@/styles/components.css";

interface Book {
  id: string;
  title: string;
  author: string;
  short_id: string;
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
  const [activeTab, setActiveTab] = useState("select");

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
    const authors = new Set(books.map(b => b.author));
    return Array.from(authors).sort();
  }, [books]);

  const filteredBooks = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return books.map(book => {
      const matchesType = typeFilter === "all" || (typeFilter === "syllabus" ? book.is_syllabus : !book.is_syllabus);
      const matchesAuthor = authorFilter === "all" || book.author === authorFilter;
      const bookCopies = copies.filter(c => c.book_id === book.id);

      const matchesQuery = !query ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.short_id.toLowerCase().includes(query) ||
        bookCopies.some(c => c.id.toLowerCase().includes(query));

      return {
        ...book,
        copies: bookCopies,
        visible: matchesType && matchesAuthor && matchesQuery && bookCopies.length > 0
      };
    }).filter(b => b.visible);
  }, [books, copies, searchTerm, typeFilter, authorFilter]);

  const visibleCopyIds = useMemo(() => {
    return filteredBooks.flatMap(b => b.copies.map(c => c.id));
  }, [filteredBooks]);

  const hasActiveFilters = searchTerm !== "" || typeFilter !== "all" || authorFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setAuthorFilter("all");
    setExpandedBookId(null);
  };

  const isAllSelected = visibleCopyIds.length > 0 && visibleCopyIds.every(id => selectedCopies.has(id));
  const isSomeSelected = visibleCopyIds.some(id => selectedCopies.has(id));

  const toggleSelectAll = () => {
    const next = new Set(selectedCopies);
    if (isAllSelected) {
      visibleCopyIds.forEach(id => next.delete(id));
    } else {
      visibleCopyIds.forEach(id => next.add(id));
    }
    setSelectedCopies(next);
  };

  const toggleBookSelect = (e: React.MouseEvent, copyIds: string[]) => {
    e.stopPropagation();
    const next = new Set(selectedCopies);
    const allSelected = copyIds.every(id => next.has(id));
    if (allSelected) {
      copyIds.forEach(id => next.delete(id));
    } else {
      copyIds.forEach(id => next.add(id));
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
    return () => { active = false; };
  }, [selectedCopies]);

  const printCopies = useMemo(() => {
    const baseCopies = copies.filter(c => selectedCopies.has(c.id)).sort((a, b) => {
      // Sort by book title, then copy number
      const bookA = books.find(book => book.id === a.book_id);
      const bookB = books.find(book => book.id === b.book_id);
      if (!bookA || !bookB) return 0;
      return bookA.title.localeCompare(bookB.title) || a.copy_number - b.copy_number;
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
    <div className="space-y-4 sm:space-y-6 print:space-y-0 print:m-0 max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">


      {/* Header */}
      <section className="book-list-surface tron-border rounded-md sm:rounded-lg p-3 sm:p-5 print:hidden">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex w-fit items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#8a7966] bg-[#f6ecdd] text-[#4e4033] ink-text text-[9px] uppercase tracking-[0.12em]">
            <FaPrint className="w-3 h-3" />
            Moderator Tools
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
            <h1 className="text-lg sm:text-2xl font-bold text-[#221910] leading-tight ink-title">
              Print QR Codes
            </h1>
          </div>
        </div>
      </section>

      <section className="book-list-surface tron-border rounded-md sm:rounded-lg border border-[#5f4f40] overflow-hidden print:border-none print:shadow-none print:bg-transparent print:overflow-visible print:p-0 print:m-0 print:rounded-none">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto rounded-none bg-[#eadcc8] border-b border-[#7d6d5a] p-0 flex print:hidden">
            <TabsTrigger
              value="select"
              className="flex-1 rounded-none py-2.5 sm:py-3 px-2 sm:px-4 text-[11px] sm:text-sm font-medium ink-text text-[#5a4b3f] border-r border-[#c5b090] data-[state=active]:bg-[#f6ecdd] data-[state=active]:text-[#221910] data-[state=active]:font-bold data-[state=active]:shadow-[inset_0_-2px_0_0_#4a3d31] hover:bg-[#e4d4bf] transition-all"
            >
              Select Items
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="flex-1 rounded-none py-2.5 sm:py-3 px-2 sm:px-4 text-[11px] sm:text-sm font-medium ink-text text-[#5a4b3f] data-[state=active]:bg-[#f6ecdd] data-[state=active]:text-[#221910] data-[state=active]:font-bold data-[state=active]:shadow-[inset_0_-2px_0_0_#4a3d31] hover:bg-[#e4d4bf] transition-all flex items-center justify-center gap-2"
            >
              Preview & Print Layout
              {selectedCopies.size > 0 && (
                <span className="bg-[#4a3d31] text-[#f4e8d4] px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {selectedCopies.size}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="p-3 sm:p-5 mt-0 space-y-3 sm:space-y-4 print:hidden">
            {/* Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-6 gap-2.5">
              <div className="relative xl:col-span-2">
                <FaSearch className="absolute left-3 top-3 text-[#7a6a5a]" />
                <input
                  type="text"
                  placeholder="Search title, author, ID…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#8a7966] bg-[#f8f1e6] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-sm"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="xl:col-span-2 px-3 py-2 border border-[#8a7966] bg-[#f8f1e6] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-sm"
              >
                <option value="all">All Types</option>
                <option value="syllabus">Syllabus</option>
                <option value="additional">Additional</option>
              </select>
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="xl:col-span-2 px-3 py-2 border border-[#8a7966] bg-[#f8f1e6] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none ink-text text-sm"
              >
                <option value="all">All Authors</option>
                {uniqueAuthors.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#6b5c4e] ink-text">
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[#c2b09a] bg-[#f8f1e6] text-[11px]">
                  <FaFilter className="w-3 h-3" />
                  {filteredBooks.length} books shown
                </span>
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#8a7966] bg-[#f8f1e6] text-[#4e4033] text-[11px] hover:bg-[#eadcca] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaTimes className="w-2.5 h-2.5" />
                  Clear filters
                </button>
              </div>
            </div>

            {/* List */}
            <div className="border border-[#d2bfa5] rounded-sm overflow-hidden bg-[#f8f1e6]">
              <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-2.5 bg-[#eadcc8] border-b border-[#d2bfa5]">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[#4e4033] hover:text-[#221910] transition-colors"
                >
                  {isAllSelected ? <FaCheckSquare className="w-4 h-4" /> : <FaRegSquare className="w-4 h-4" />}
                </button>
                <span className="text-xs font-semibold text-[#3b3026] uppercase tracking-[0.08em] ink-text">
                  Select / Unselect All Filtered
                </span>
              </div>

              {filteredBooks.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-[#5c4f42] ink-text">No books match the current filters.</p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm ink-text">
                    <thead>
                      <tr className="bg-[#f2e7d7] border-b border-[#d2bfa5]">
                        <th className="w-10 px-3 py-2 text-center text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">Sel</th>
                        <th className="px-3 py-2 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">Book</th>
                        <th className="px-3 py-2 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">Author</th>
                        <th className="px-3 py-2 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">Type</th>
                        <th className="px-3 py-2 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-[10px]">Copies</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.map((book) => {
                        const isExpanded = expandedBookId === book.id;
                        const copyIds = book.copies.map(c => c.id);
                        const allSelected = copyIds.every(id => selectedCopies.has(id));
                        const someSelected = copyIds.some(id => selectedCopies.has(id));

                        return (
                          <Fragment key={book.id}>
                            <tr
                              className="border-b border-[#d2bfa5] hover:bg-[#efe4d1] transition-colors align-top cursor-pointer"
                              onClick={() => setExpandedBookId(isExpanded ? null : book.id)}
                            >
                              <td className="px-3 py-3 text-center align-middle">
                                <button
                                  type="button"
                                  onClick={(e) => toggleBookSelect(e, copyIds)}
                                  className={`transition-colors ${allSelected ? 'text-[#4a7c59]' : someSelected ? 'text-[#8faa8f]' : 'text-[#8a7966] hover:text-[#4e4033]'}`}
                                >
                                  {allSelected ? <FaCheckSquare className="w-4 h-4" /> : <FaRegSquare className="w-4 h-4" />}
                                </button>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-start gap-2">
                                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded-sm border border-[#b59f84] bg-[#f8f1e6] text-[#4e4033] text-xs font-bold inline-flex items-center justify-center">
                                    {isExpanded ? "−" : "+"}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-[#221910] leading-snug text-sm">{book.title}</p>
                                    <p className="text-[10px] text-[#6a5a4c] mt-0.5 font-mono">ID: {book.short_id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-[#5a4b3f] text-sm">{book.author}</td>
                              <td className="px-3 py-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-[#8f7f6c] bg-[#f8f1e6] text-[#3f3328] text-[11px] font-semibold">
                                  <FaBookOpen className="w-3 h-3 text-[#4e4033]" />
                                  {book.is_syllabus ? "Syllabus" : "Additional"}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-[#5a4b3f] text-sm">{book.copies.length}</td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-[#fcf8f3] border-b border-[#d2bfa5]">
                                <td></td>
                                <td colSpan={4} className="px-3 py-3">
                                  <div className="w-full max-w-2xl bg-white border border-[#e4d4bf] rounded-sm p-3">
                                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#6a5a4c] mb-2 border-b border-[#e4d4bf] pb-1">
                                      Copies of {book.title}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                      {book.copies.map(copy => {
                                        const isSelected = selectedCopies.has(copy.id);
                                        return (
                                          <button
                                            key={copy.id}
                                            type="button"
                                            onClick={(e) => toggleCopySelect(e, copy.id)}
                                            className={`flex items-center gap-2 p-2 rounded-sm border transition-colors text-left
                                              ${isSelected
                                                ? 'bg-[#eef5e9] border-[#8aa06f] text-[#3d5c2e]'
                                                : 'bg-[#fcf8f3] border-[#e4d4bf] text-[#5b4a3c] hover:bg-[#f8f1e6]'}`}
                                          >
                                            {isSelected ? <FaCheckSquare className="w-3.5 h-3.5 shrink-0" /> : <FaRegSquare className="w-3.5 h-3.5 shrink-0" />}
                                            <div className="min-w-0">
                                              <p className="text-xs font-semibold">Copy #{copy.copy_number}</p>
                                              <p className="text-[10px] font-mono opacity-80">{copy.id}</p>
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
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="p-3 sm:p-5 mt-0 bg-white print:p-0">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 pb-4 border-b border-[#e4d4bf] print:hidden">
              <div className="flex flex-col gap-3">
                <p className="text-sm text-[#5a4b3f] ink-text font-semibold">
                  {selectedCopies.size} unique {selectedCopies.size === 1 ? 'QR code' : 'QR codes'} selected.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm ink-text">
                  <label className="flex items-center gap-2 text-[#3b3026]">
                    <span className="font-semibold">Copies per QR:</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={duplicateCount}
                      onChange={(e) => setDuplicateCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-2 py-1 border border-[#8a7966] bg-[#f8f1e6] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none"
                    />
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[#3b3026]">
                    <input
                      type="checkbox"
                      checked={fillPage}
                      onChange={(e) => setFillPage(e.target.checked)}
                      className="w-4 h-4 accent-[#4a7c59]"
                    />
                    <span className="font-semibold">Fill page with QRs</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <p className="text-sm font-semibold text-[#4a7c59] ink-text">Total QRs: {printCopies.length}</p>
                <button
                  onClick={() => window.print()}
                  disabled={printCopies.length === 0}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#4a7c59] text-[#f6ecdd] border border-[#3d6447] rounded-sm hover:bg-[#3d6447] transition-colors text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ink-text"
                >
                  <FaPrint />
                  Print Layout
                </button>
              </div>
            </div>

            {selectedCopies.size === 0 ? (
              <div className="text-center py-10">
                <p className="text-[#5c4f42] ink-text">No copies selected. Go back to &quot;Select Items&quot; to pick copies for printing.</p>
              </div>
            ) : (
              <div id="print-area" className="min-h-[297mm] print:min-h-0 w-full max-w-[210mm] print:max-w-none print:w-full mx-auto print:mx-0 print:border-none print:shadow-none bg-white print:bg-transparent">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 sm:gap-4 print:grid-cols-5">
                  {printCopies.map((copy, idx) => {
                    const book = books.find(b => b.id === copy.book_id);
                    return (
                      <div key={`${copy.id}-${idx}`} className="flex flex-col items-center border border-dashed border-gray-400 p-2 break-inside-avoid">
                        {qrImages[copy.id] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={qrImages[copy.id]} alt={copy.id} className="w-full max-w-[120px] aspect-square object-contain" />
                        ) : (
                          <div className="w-full max-w-[120px] aspect-square bg-gray-100 flex items-center justify-center text-xs text-gray-400">Loading...</div>
                        )}
                        <div className="text-center mt-1 w-full text-[10px] leading-tight font-sans text-black">
                          <p className="font-bold truncate text-[11px]" title={book?.title}>{book?.title}</p>
                          <p className="text-[9px] text-gray-700 mt-0.5">Copy #{copy.copy_number}</p>
                          <p className="font-mono text-[10px] mt-0.5">{copy.id}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
