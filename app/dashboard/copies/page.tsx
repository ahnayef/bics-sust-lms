"use client";

import StatusBadge from "@/app/components/StatusBadge";
import NextImage from "next/image";
import QRCode from "qrcode";
import { useRef, useState } from "react";
import {
  FaDownload,
  FaEdit,
  FaPlus,
  FaQrcode,
  FaSearch,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

type CopyStatus = "available" | "borrowed" | "damaged";
type StatusFilter = "all" | CopyStatus;

interface BookRef {
  id: number;
  title: string;
  author: string;
}

interface BookCopy {
  bookId: string;
  book: number;
  status: CopyStatus;
  borrowerName: string | null;
}

interface CopyForm {
  bookId: string;
  book: string;
}

const AVAILABLE_BOOKS: BookRef[] = [
  {
    id: 1,
    title: "ইসলামের সামাজিক বিধান",
    author: "আল্লামা জামাল আল বাদাবী",
  },
  { id: 2, title: "পর্দা ও ইসলাম", author: "সাইয়েদ আবুল আ’লা মওদূদী" },
  { id: 3, title: "আদাবে জিন্দেগী", author: "আল্লামা ইউসুফ ইসলাহী" },
  {
    id: 4,
    title: "ইসলামী ব্যাংকিং ও অর্থায়ন পদ্ধতি: সমস্যা ও সমাধান",
    author: "মুফতি তাকি উসমানি",
  },
  { id: 5, title: "ইসলামী অর্থনীতি", author: "সাইয়েদ আবুল আ’লা মওদূদী" },
  {
    id: 6,
    title: "ইসলামী অর্থ ব্যবস্থায় যাকাত",
    author: "ড. জাবের মোহাম্মদ (ইসলামিক সেন্টার)",
  },
  { id: 7, title: "খেলাফত ও রাজতন্ত্র", author: "সাইয়েদ আবুল আ’লা মওদূদী" },
  {
    id: 8,
    title: "ইসলামী রাষ্ট্রে অমুসলিমদের অধিকার",
    author: "সাইয়েদ আবুল আ’লা মওদূদী",
  },
  {
    id: 9,
    title: "একটি সত্যনিষ্ঠ দলের প্রয়োজন",
    author: "সাইয়েদ আবুল আ’লা মওদূদী",
  },
  {
    id: 10,
    title: "ইসলামী রাষ্ট্রব্যবস্থা : তত্ত্ব ও প্রয়োগ",
    author: "ড. ইউসুফ আল-কারযাভী",
  },
  { id: 11, title: "ইসলামী রাষ্ট্র ও সংবিধান", author: "উল্লেখ নেই" },
  { id: 12, title: "গণতন্ত্র: ইসলামী দৃষ্টিকোণ", author: "ড. আহমদ আলী" },
];

const QR_CARD_WIDTH = 420;
const QR_CARD_HEIGHT = 520;
const QR_SIZE = 260;
const QR_BLOCK_MIN_PADDING = 24;
const QR_TITLE_GAP = 42;
const QR_TITLE_LINE_HEIGHT = 28;
const QR_COPY_GAP = 30;
const QR_COPY_LINE_HEIGHT = 24;

const wrapCanvasText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) => {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(nextLine).width <= maxWidth) {
      line = nextLine;
      continue;
    }

    if (line) {
      lines.push(line);
    }
    line = word;
  }

  if (line) {
    lines.push(line);
  }

  if (lines.length <= maxLines) {
    return lines;
  }

  const visibleLines = lines.slice(0, maxLines);
  let lastLine = visibleLines[maxLines - 1];

  while (ctx.measureText(`${lastLine}…`).width > maxWidth && lastLine.length) {
    lastLine = lastLine.slice(0, -1);
  }

  visibleLines[maxLines - 1] = `${lastLine}…`;
  return visibleLines;
};

const buildQrCardImage = async (copyId: string, bookTitle: string) => {
  const qrDataUrl = await QRCode.toDataURL(copyId, {
    errorCorrectionLevel: "M",
    margin: 2,
    color: {
      dark: "#221910",
      light: "#ffffff",
    },
    width: QR_SIZE,
  });

  const qrImage = new window.Image();
  qrImage.src = qrDataUrl;
  await qrImage.decode();

  const canvas = document.createElement("canvas");
  canvas.width = QR_CARD_WIDTH;
  canvas.height = QR_CARD_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create QR card canvas.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.fillStyle = "#221910";
  ctx.font = '700 22px "Arial", sans-serif';

  const titleLines = wrapCanvasText(ctx, bookTitle, canvas.width - 64, 2);
  const contentHeight =
    QR_SIZE +
    QR_TITLE_GAP +
    titleLines.length * QR_TITLE_LINE_HEIGHT +
    QR_COPY_GAP +
    QR_COPY_LINE_HEIGHT;
  const contentTop = Math.max(
    QR_BLOCK_MIN_PADDING,
    (canvas.height - contentHeight) / 2,
  );

  const qrX = (canvas.width - QR_SIZE) / 2;
  ctx.drawImage(qrImage, qrX, contentTop, QR_SIZE, QR_SIZE);

  const titleStartY = contentTop + QR_SIZE + QR_TITLE_GAP;

  titleLines.forEach((line, index) => {
    ctx.fillText(
      line,
      canvas.width / 2,
      titleStartY + index * QR_TITLE_LINE_HEIGHT,
    );
  });

  ctx.fillStyle = "#5a4b3f";
  ctx.font = '600 18px "Arial", sans-serif';
  ctx.fillText(
    `Copy ID: ${copyId}`,
    canvas.width / 2,
    titleStartY + titleLines.length * QR_TITLE_LINE_HEIGHT + QR_COPY_GAP,
  );

  return canvas.toDataURL("image/png");
};

export default function BookCopiesManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bookSearchTerm, setBookSearchTerm] = useState("");
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [qrModalCopyId, setQrModalCopyId] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const [qrIsLoading, setQrIsLoading] = useState(false);
  const qrRequestIdRef = useRef(0);

  const [bookCopies, setBookCopies] = useState<BookCopy[]>([
    {
      bookId: "BOOK-001",
      book: 1,
      status: "available",
      borrowerName: null,
    },
    {
      bookId: "BOOK-002",
      book: 1,
      status: "borrowed",
      borrowerName: "Rafiul Karim",
    },
    {
      bookId: "BOOK-003",
      book: 1,
      status: "borrowed",
      borrowerName: "Sharif Ahmed",
    },
    {
      bookId: "BOOK-004",
      book: 2,
      status: "available",
      borrowerName: null,
    },
    {
      bookId: "BOOK-005",
      book: 4,
      status: "borrowed",
      borrowerName: "Mehedi Hasan",
    },
    {
      bookId: "BOOK-006",
      book: 5,
      status: "borrowed",
      borrowerName: "Nabil Islam",
    },
    {
      bookId: "BOOK-007",
      book: 6,
      status: "available",
      borrowerName: null,
    },
    {
      bookId: "BOOK-008",
      book: 7,
      status: "borrowed",
      borrowerName: "Sabbir Ahmed",
    },
    {
      bookId: "BOOK-009",
      book: 8,
      status: "available",
      borrowerName: null,
    },
  ]);

  const [formData, setFormData] = useState<CopyForm>({
    bookId: "",
    book: "",
  });

  const getNextBookId = () => {
    const bookIds = bookCopies.map((copy) =>
      parseInt(copy.bookId.split("-")[1], 10),
    );
    const maxId = bookIds.length > 0 ? Math.max(...bookIds) : 0;
    return `BOOK-${String(maxId + 1).padStart(3, "0")}`;
  };

  const getBookById = (bookId: number) => {
    return AVAILABLE_BOOKS.find((book) => book.id === bookId);
  };

  const getBookOptionLabel = (book: BookRef) =>
    `${book.title} - ${book.author}`;

  const filteredBookOptions = AVAILABLE_BOOKS.filter((book) => {
    const query = bookSearchTerm.toLowerCase().trim();
    if (!query) return true;
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
    );
  });

  const handleBookSearchChange = (value: string) => {
    setBookSearchTerm(value);
    setShowBookDropdown(true);

    const matched = AVAILABLE_BOOKS.find(
      (book) => getBookOptionLabel(book).toLowerCase() === value.toLowerCase(),
    );

    setFormData((prev) => ({
      ...prev,
      book: matched ? matched.id.toString() : "",
    }));
  };

  const handleSelectBook = (book: BookRef) => {
    setFormData((prev) => ({ ...prev, book: book.id.toString() }));
    setBookSearchTerm(getBookOptionLabel(book));
    setShowBookDropdown(false);
  };

  const query = searchTerm.toLowerCase().trim();

  const filteredCopies = bookCopies.filter((copy) => {
    const book = getBookById(copy.book);
    const matchesSearch =
      (book?.title.toLowerCase().includes(query) ?? false) ||
      (book?.author.toLowerCase().includes(query) ?? false) ||
      copy.bookId.toLowerCase().includes(query) ||
      (copy.borrowerName?.toLowerCase().includes(query) ?? false);

    const matchesStatus =
      statusFilter === "all" || copy.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const counts = {
    total: bookCopies.length,
    available: bookCopies.filter((copy) => copy.status === "available").length,
    borrowed: bookCopies.filter((copy) => copy.status === "borrowed").length,
  };

  const getStatusBadgeTone = (
    status: CopyStatus,
  ): "success" | "warning" | "danger" | "neutral" => {
    switch (status) {
      case "available":
        return "success";
      case "borrowed":
        return "warning";
      case "damaged":
        return "danger";
      default:
        return "neutral";
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ bookId: getNextBookId(), book: "" });
    setBookSearchTerm("");
    setShowBookDropdown(false);
    setShowAddModal(true);
  };

  const handleAdd = () => {
    if (!formData.bookId.trim() || !formData.book) {
      return;
    }

    const newCopy: BookCopy = {
      bookId: formData.bookId.trim(),
      book: parseInt(formData.book, 10),
      status: "available",
      borrowerName: null,
    };

    setBookCopies((prev) => [...prev, newCopy]);
    setFormData({ bookId: "", book: "" });
    setShowAddModal(false);
  };

  const handleEdit = (bookId: string) => {
    const copy = bookCopies.find((item) => item.bookId === bookId);
    if (!copy) return;

    setFormData({ bookId: copy.bookId, book: copy.book.toString() });
    const selectedBook = getBookById(copy.book);
    setBookSearchTerm(selectedBook ? getBookOptionLabel(selectedBook) : "");
    setShowBookDropdown(false);
    setEditingId(bookId);
    setShowAddModal(true);
  };

  const handleUpdate = () => {
    if (!editingId || !formData.bookId.trim() || !formData.book) {
      return;
    }

    setBookCopies((prev) =>
      prev.map((copy) =>
        copy.bookId === editingId
          ? {
              ...copy,
              bookId: formData.bookId.trim(),
              book: parseInt(formData.book, 10),
            }
          : copy,
      ),
    );

    setFormData({ bookId: "", book: "" });
    setEditingId(null);
    setShowAddModal(false);
  };

  const handleDelete = (bookId: string) => {
    if (confirm("Are you sure you want to remove this copy?")) {
      if (qrModalCopyId === bookId) {
        closeQrModal();
      }
      setBookCopies((prev) => prev.filter((copy) => copy.bookId !== bookId));
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setFormData({ bookId: "", book: "" });
    setBookSearchTerm("");
    setShowBookDropdown(false);
  };

  const openQrModal = async (bookId: string) => {
    const requestId = qrRequestIdRef.current + 1;
    qrRequestIdRef.current = requestId;

    setQrModalCopyId(bookId);
    setQrImageUrl("");
    setQrIsLoading(true);

    const copy = bookCopies.find((item) => item.bookId === bookId);
    const book = copy ? getBookById(copy.book) : undefined;

    if (!copy || !book) {
      if (qrRequestIdRef.current === requestId) {
        setQrIsLoading(false);
      }
      return;
    }

    try {
      const imageUrl = await buildQrCardImage(copy.bookId, book.title);
      if (qrRequestIdRef.current === requestId) {
        setQrImageUrl(imageUrl);
      }
    } catch {
      if (qrRequestIdRef.current === requestId) {
        setQrImageUrl("");
      }
    } finally {
      if (qrRequestIdRef.current === requestId) {
        setQrIsLoading(false);
      }
    }
  };

  const closeQrModal = () => {
    qrRequestIdRef.current += 1;
    setQrModalCopyId(null);
    setQrImageUrl("");
    setQrIsLoading(false);
  };

  const handleDownloadQr = () => {
    if (!qrModalCopyId || !qrImageUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `${qrModalCopyId}.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
              Copies Control Room
            </h1>
            <p className="text-[#5a4b3f] mt-1 ink-text">
              Track every physical copy clearly by ID, status, and borrower at a
              glance.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium ink-text"
          >
            <FaPlus className="w-4 h-4" />
            Add Copy
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-5">
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-2 sm:p-3">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
              Total
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title leading-none mt-1">
              {counts.total}
            </p>
          </div>
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-2 sm:p-3">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
              Available
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title leading-none mt-1">
              {counts.available}
            </p>
          </div>
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-2 sm:p-3">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
              Borrowed
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title leading-none mt-1">
              {counts.borrowed}
            </p>
          </div>
        </div>
      </section>

      <section className="dashboard-surface tron-border rounded-sm p-4 sm:p-5 border border-[#5f4f40]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="relative lg:col-span-2">
            <FaSearch className="absolute left-3 top-3 text-[#7a6a5a]" />
            <input
              type="text"
              placeholder="Search title, author, copy ID, or borrower..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="borrowed">Borrowed</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>
      </section>

      <section className="dashboard-surface tron-border rounded-sm overflow-hidden border border-[#5f4f40]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm ink-text min-w-160">
            <thead>
              <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Copy ID
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Book
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Author
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Borrower
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCopies.map((copy) => {
                const book = getBookById(copy.book);
                return (
                  <tr
                    key={copy.bookId}
                    className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 font-mono font-medium text-[#2b2119]">
                      {copy.bookId}
                    </td>
                    <td className="px-4 sm:px-6 py-3 font-medium text-[#2b2119]">
                      {book?.title || "Unknown"}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-[#5a4b3f]">
                      {book?.author || "Unknown"}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <StatusBadge tone={getStatusBadgeTone(copy.status)}>
                        {copy.status.charAt(0).toUpperCase() +
                          copy.status.slice(1)}
                      </StatusBadge>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-[#5a4b3f]">
                      {copy.borrowerName || "-"}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openQrModal(copy.bookId)}
                          className="p-2 text-[#5b4c3f] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                          aria-label={`Show QR for ${copy.bookId}`}
                        >
                          <FaQrcode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(copy.bookId)}
                          className="p-2 text-[#5b4c3f] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                          aria-label={`Edit ${copy.bookId}`}
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(copy.bookId)}
                          className="p-2 text-[#6a4e3d] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors"
                          aria-label={`Delete ${copy.bookId}`}
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCopies.length === 0 && (
          <div className="text-center py-12 text-[#6a5a4c] ink-text">
            <p>No copies match the current search/filter.</p>
          </div>
        )}
      </section>

      {showAddModal && (
        <div className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-4 z-80">
          <div className="dashboard-surface tron-border rounded-sm max-w-md w-full p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-[#221910] ink-title">
                {editingId ? "Edit Copy" : "Add New Copy"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-[#655648] hover:bg-[#e7d8c3] rounded-sm transition-colors"
                aria-label="Close copy modal"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 ink-text">
              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  Select Book *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={bookSearchTerm}
                    onFocus={() => setShowBookDropdown(true)}
                    onBlur={() => {
                      setTimeout(() => setShowBookDropdown(false), 120);
                    }}
                    onChange={(e) => handleBookSearchChange(e.target.value)}
                    placeholder="Search book by title or author"
                    className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                  />

                  {showBookDropdown && (
                    <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-sm border border-[#8a7966] bg-[#f6ecdd] shadow-lg">
                      {filteredBookOptions.length > 0 ? (
                        filteredBookOptions.map((book) => (
                          <button
                            key={book.id}
                            type="button"
                            onMouseDown={() => handleSelectBook(book)}
                            className="w-full px-3 py-2 text-left text-sm text-[#2f251d] hover:bg-[#eadcc8] transition-colors"
                          >
                            <span className="font-medium">{book.title}</span>
                            <span className="text-[#5a4b3f]">
                              {" "}
                              - {book.author}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-[#6a5a4c]">
                          No matching book found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  Copy ID *
                </label>
                <input
                  type="text"
                  value={formData.bookId}
                  onChange={(e) =>
                    setFormData({ ...formData, bookId: e.target.value })
                  }
                  placeholder={getNextBookId()}
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                />
                <p className="text-xs text-[#6a5a4c] mt-1">
                  e.g., BOOK-001, BOOK-002
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 border border-[#8a7966] text-[#4f4134] rounded-sm hover:bg-[#eadcc8] transition-colors font-medium ink-text"
              >
                Cancel
              </button>
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                disabled={!formData.bookId.trim() || !formData.book}
                className="flex-1 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] disabled:opacity-55 disabled:cursor-not-allowed transition-colors font-medium ink-text"
              >
                {editingId ? "Update" : "Add"} Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {qrModalCopyId && (
        <div className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-4 z-80">
          <div className="dashboard-surface tron-border rounded-sm max-w-md w-full p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-xl font-bold text-[#221910] ink-title">
                  Copy QR Code
                </h2>
                <p className="text-xs text-[#5a4b3f] ink-text mt-0.5">
                  Download with book name and copy ID
                </p>
              </div>
              <button
                onClick={closeQrModal}
                className="p-2 text-[#655648] hover:bg-[#e7d8c3] rounded-sm transition-colors"
                aria-label="Close QR modal"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-1 flex flex-col items-center gap-3">
              {qrIsLoading && (
                <div className="w-full min-h-105 flex items-center justify-center text-[#5a4b3f] ink-text">
                  Generating QR preview...
                </div>
              )}

              {!qrIsLoading && qrImageUrl && (
                <NextImage
                  src={qrImageUrl}
                  alt="Copy QR preview"
                  width={420}
                  height={520}
                  unoptimized
                  className="w-full max-w-80 rounded-sm bg-white shadow-sm"
                />
              )}

              {!qrIsLoading && !qrImageUrl && (
                <div className="w-full min-h-105 flex items-center justify-center text-[#5a4b3f] ink-text">
                  Unable to generate QR preview.
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                onClick={closeQrModal}
                className="flex-1 px-3 py-2 border border-[#8a7966] text-[#4f4134] rounded-sm hover:bg-[#eadcc8] transition-colors font-medium text-sm ink-text"
              >
                Close
              </button>
              <button
                onClick={handleDownloadQr}
                disabled={!qrImageUrl || qrIsLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] disabled:opacity-55 disabled:cursor-not-allowed transition-colors font-medium text-sm ink-text"
              >
                <FaDownload className="w-4 h-4" />
                Download PNG
              </button>
            </div>

            {qrModalCopyId && (
              <p className="text-xs text-[#6a5a4c] mt-2 text-center ink-text">
                {qrModalCopyId}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
