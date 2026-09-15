"use client";

import StatusBadge from "@/app/components/StatusBadge";
import { InventoryNav } from "@/app/dashboard/components/StaffHubNav";
import ConfirmModal from "@/components/ui/confirm-modal";
import { useTranslation } from "@/lib/i18n/context";
import {
  addCopyOfBook,
  getCopyBorrowerName,
  getCopyRefCount,
  removeCopy,
  renameCopyId,
  updateCopyMetadata,
} from "@/server/library-actions";
import type { Book, Copy, CopyStatus } from "@/types/library";
import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import {
  FaCheck,
  FaDownload,
  FaExclamationTriangle,
  FaPencilAlt,
  FaPlus,
  FaQrcode,
  FaSearch,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

import type { Category } from "@/types/library";

type TypeFilter = "all" | string; // category id
type StatusFilter = "all" | CopyStatus;
type SortKey = "title-asc" | "title-desc" | "copies-asc" | "copies-desc";

// ── QR card generation ───────────────────────────────────────────────────────

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
    if (line) lines.push(line);
    line = word;
  }
  if (line) lines.push(line);

  if (lines.length <= maxLines) return lines;

  const visibleLines = lines.slice(0, maxLines);
  let lastLine = visibleLines[maxLines - 1];
  while (ctx.measureText(`${lastLine}…`).width > maxWidth && lastLine.length) {
    lastLine = lastLine.slice(0, -1);
  }
  visibleLines[maxLines - 1] = `${lastLine}…`;
  return visibleLines;
};

const buildQrCardImage = async (
  copyId: string,
  bookTitle: string,
  copyIdLabel: string,
) => {
  const qrDataUrl = await QRCode.toDataURL(copyId, {
    errorCorrectionLevel: "M",
    margin: 2,
    color: { dark: "#221910", light: "#ffffff" },
    width: QR_SIZE,
  });

  const qrImage = new window.Image();
  qrImage.src = qrDataUrl;
  await qrImage.decode();

  const canvas = document.createElement("canvas");
  canvas.width = QR_CARD_WIDTH;
  canvas.height = QR_CARD_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to create QR card canvas.");

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
    `${copyIdLabel}: ${copyId}`,
    canvas.width / 2,
    titleStartY + titleLines.length * QR_TITLE_LINE_HEIGHT + QR_COPY_GAP,
  );

  return canvas.toDataURL("image/png");
};

// ── Component ─────────────────────────────────────────────────────────────────

interface CopyForm {
  book_id: string;
  copy_id: string;
}

const EMPTY_FORM: CopyForm = { book_id: "", copy_id: "" };

type PendingAction = { type: "delete"; copyId: string; bookTitle: string };

interface EditCopyIdState {
  copyId: string;
  newId: string;
  error: string | null;
}

interface Props {
  initialCopies: Copy[];
  books: Book[];
  categories: Category[];
}

export default function CopiesClient({
  initialCopies,
  books,
  categories,
}: Props) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const [copies, setCopies] = useState<Copy[]>(initialCopies);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("title-asc");
  const [showAddModal, setShowAddModal] = useState(false);
  const [bookSearchTerm, setBookSearchTerm] = useState("");
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const bookInputRef = useRef<HTMLInputElement>(null);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const [formData, setFormData] = useState<CopyForm>(EMPTY_FORM);
  const [copyIdError, setCopyIdError] = useState<string | null>(null);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const [editCopyId, setEditCopyId] = useState<EditCopyIdState | null>(null);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    typeFilter !== "all" ||
    statusFilter !== "all" ||
    sortBy !== "title-asc";

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
    setSortBy("title-asc");
    setExpandedBookId(null);
  };

  const [qrModalCopyId, setQrModalCopyId] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const [qrIsLoading, setQrIsLoading] = useState(false);
  const qrRequestIdRef = useRef(0);

  const [flash, setFlash] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [refCount, setRefCount] = useState<number | null>(null);
  // Map of copyId -> borrower name (fetched lazily when copy is borrowed)
  const [borrowerNames, setBorrowerNames] = useState<
    Record<string, string | null>
  >({});

  // Fetch borrower name for a borrowed copy on demand
  const fetchBorrowerName = async (copyId: string) => {
    if (copyId in borrowerNames) return;
    const name = await getCopyBorrowerName(copyId);
    setBorrowerNames((prev) => ({ ...prev, [copyId]: name }));
  };

  useEffect(() => {
    if (!showAddModal && !qrModalCopyId && !editCopyId) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
        closeQrModal();
        setEditCopyId(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showAddModal, qrModalCopyId, editCopyId]);

  // Sync when server re-renders after router.refresh()
  useEffect(() => {
    setCopies(initialCopies);
  }, [initialCopies]);

  const showFlash = (type: "success" | "error", text: string) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), 4500);
  };

  // ── Group copies by book ─────────────────────────────────────────────────
  const groupedCopies = useMemo(() => {
    const groups = new Map<string, { book: Book; copies: Copy[] }>();

    // First, initialize groups with all books
    books.forEach((book) => {
      groups.set(book.id, { book, copies: [] });
    });

    // Then, add copies to their respective groups
    copies.forEach((copy) => {
      const group = groups.get(copy.book_id);
      if (group) {
        group.copies.push(copy);
      }
    });

    return Array.from(groups.values());
  }, [copies, books]);

  // ── Filtering and Sorting ─────────────────────────────────────────────────────
  const filteredGroups = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    const result = groupedCopies
      .filter((group) => {
        const matchesType =
          typeFilter === "all" || group.book.category_id === typeFilter;

        const matchesSearch =
          !query ||
          group.book.title.toLowerCase().includes(query) ||
          group.book.author.toLowerCase().includes(query) ||
          group.copies.some((copy) => copy.id.toLowerCase().includes(query));

        // When filtering by status, only show the book if it has matching copies
        // OR if statusFilter is "all" (show all books, including empty ones)
        const filteredCopies = group.copies.filter(
          (copy) => statusFilter === "all" || copy.status === statusFilter,
        );

        const hasMatchingCopiesOrNoFilter =
          statusFilter === "all" || filteredCopies.length > 0;

        return matchesType && matchesSearch && hasMatchingCopiesOrNoFilter;
      })
      .map((group) => ({
        ...group,
        copies: group.copies.filter(
          (copy) => statusFilter === "all" || copy.status === statusFilter,
        ),
      }));

    // Sort the results exactly like BookListClient
    result.sort((a, b) => {
      if (sortBy === "title-asc")
        return a.book.title.localeCompare(b.book.title, "bn");
      if (sortBy === "title-desc")
        return b.book.title.localeCompare(a.book.title, "bn");
      if (sortBy === "copies-asc")
        return (
          a.copies.length - b.copies.length ||
          a.book.title.localeCompare(b.book.title, "bn")
        );
      return (
        b.copies.length - a.copies.length ||
        a.book.title.localeCompare(b.book.title, "bn")
      );
    });

    return result;
  }, [groupedCopies, searchTerm, typeFilter, statusFilter, sortBy]);

  const totalFilteredCopies = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.copies.length, 0);
  }, [filteredGroups]);

  const counts = {
    total: copies.length,
    available: copies.filter((c) => c.status === "available").length,
    borrowed: copies.filter((c) => c.status === "borrowed").length,
    damaged: copies.filter((c) => c.status === "damaged").length,
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

  // ── Book search dropdown (for the Add modal) ────────────────────────────
  const getBookOptionLabel = (book: Book) => `${book.title} — ${book.author}`;

  const filteredBookOptions = books.filter((book) => {
    const q = bookSearchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q)
    );
  });

  const handleBookSearchChange = (value: string) => {
    setBookSearchTerm(value);
    setShowBookDropdown(true);
    const matched = books.find(
      (b) => getBookOptionLabel(b).toLowerCase() === value.toLowerCase(),
    );
    setFormData((prev) => ({ ...prev, book_id: matched ? matched.id : "" }));
  };

  const handleSelectBook = (book: Book) => {
    setFormData((prev) => ({ ...prev, book_id: book.id }));
    setBookSearchTerm(getBookOptionLabel(book));
    setShowBookDropdown(false);
  };

  // ── CRUD handlers ────────────────────────────────────────────────────────
  const openAddModal = (bookId?: string) => {
    if (bookId) {
      const book = books.find((b) => b.id === bookId);
      if (book) {
        setFormData({ book_id: book.id, copy_id: "" });
        setBookSearchTerm(getBookOptionLabel(book));
      } else {
        setFormData(EMPTY_FORM);
        setBookSearchTerm("");
      }
    } else {
      setFormData(EMPTY_FORM);
      setBookSearchTerm("");
    }
    setShowBookDropdown(false);
    setCopyIdError(null);
    setShowAddModal(true);
  };

  const handleAdd = () => {
    if (!formData.book_id || !formData.copy_id.trim()) return;
    setCopyIdError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("book_id", formData.book_id);
      fd.set("copy_id", formData.copy_id.trim());
      const result = await addCopyOfBook(fd);
      if (result.error) {
        if (result.error.toLowerCase().includes("already exists")) {
          setCopyIdError(result.error);
        } else {
          showFlash("error", result.error);
        }
      } else {
        showFlash("success", t.copies.flash.addSuccess);
        closeModal();
        router.refresh();
      }
    });
  };

  const handleDelete = async (copyId: string) => {
    const copy = copies.find((c) => c.id === copyId);
    setRefCount(null);
    setPendingAction({
      type: "delete",
      copyId,
      bookTitle: copy?.book?.title ?? "Unknown",
    });
    const count = await getCopyRefCount(copyId);
    setRefCount(count);
  };

  const handleMarkAsDamaged = async (copyId: string, currentStatus: string) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", copyId);
      fd.set("status", currentStatus === "damaged" ? "available" : "damaged");
      const result = await updateCopyMetadata(fd);
      if (result.error) {
        showFlash("error", result.error);
      } else {
        showFlash("success", t.copies.flash.statusUpdated);
        router.refresh();
      }
    });
  };

  const confirmDelete = () => {
    if (!pendingAction || pendingAction.type !== "delete") return;
    const { copyId } = pendingAction;
    setPendingAction(null);
    if (qrModalCopyId === copyId) closeQrModal();
    startTransition(async () => {
      const fd = new FormData();
      fd.set("copy_id", copyId);
      const result = await removeCopy(fd);
      if (result.error) {
        showFlash("error", result.error);
      } else {
        showFlash("success", t.copies.flash.deleteSuccess);
        router.refresh();
      }
    });
  };

  const openEditCopyIdModal = (copyId: string) => {
    setEditCopyId({ copyId, newId: copyId, error: null });
  };

  const handleRenameCopyId = () => {
    if (!editCopyId) return;
    const trimmed = editCopyId.newId.trim().toUpperCase();
    if (!trimmed) return;
    if (trimmed === editCopyId.copyId) {
      setEditCopyId(null);
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("old_id", editCopyId.copyId);
      fd.set("new_id", trimmed);
      const result = await renameCopyId(fd);
      if (result.error) {
        const isCollision = result.error
          .toLowerCase()
          .includes("already exists");
        if (isCollision) {
          setEditCopyId((prev) =>
            prev ? { ...prev, error: result.error! } : null,
          );
        } else {
          setEditCopyId(null);
          showFlash("error", result.error);
        }
      } else {
        setEditCopyId(null);
        showFlash("success", t.copies.flash.renameSuccess);
        router.refresh();
      }
    });
  };

  const closeModal = () => {
    setShowAddModal(false);
    setFormData(EMPTY_FORM);
    setBookSearchTerm("");
    setShowBookDropdown(false);
    setCopyIdError(null);
  };

  // ── QR modal ─────────────────────────────────────────────────────────────
  const openQrModal = async (copyId: string) => {
    const requestId = qrRequestIdRef.current + 1;
    qrRequestIdRef.current = requestId;

    setQrModalCopyId(copyId);
    setQrImageUrl("");
    setQrIsLoading(true);

    const copy = copies.find((c) => c.id === copyId);
    if (!copy?.book) {
      if (qrRequestIdRef.current === requestId) setQrIsLoading(false);
      return;
    }

    try {
      const imageUrl = await buildQrCardImage(
        copy.id,
        copy.book.title,
        t.copies.qrModal.copyId,
      );
      if (qrRequestIdRef.current === requestId) setQrImageUrl(imageUrl);
    } catch {
      if (qrRequestIdRef.current === requestId) setQrImageUrl("");
    } finally {
      if (qrRequestIdRef.current === requestId) setQrIsLoading(false);
    }
  };

  const closeQrModal = () => {
    qrRequestIdRef.current += 1;
    setQrModalCopyId(null);
    setQrImageUrl("");
    setQrIsLoading(false);
  };

  const handleDownloadQr = () => {
    if (!qrModalCopyId || !qrImageUrl) return;
    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `${qrModalCopyId}.png`;
    link.click();
  };

  // ── Render ────────────────────────────────────────────────────────────────

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

      {/* Header + stats */}
      <section className="dashboard-surface tron-border rounded-sm p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
              {t.copies.title}
            </h1>
            <p className="text-[#5a4b3f] mt-1 ink-text">{t.copies.subtitle}</p>
          </div>

          <button
            onClick={() => openAddModal()}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] disabled:opacity-55 transition-colors font-medium ink-text"
          >
            <FaPlus className="w-4 h-4" />
            {t.copies.actions.addCopy}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-5">
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-2 sm:p-3">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
              {t.copies.stats.total}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title leading-none mt-1">
              {counts.total}
            </p>
          </div>
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-2 sm:p-3">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
              {t.copies.stats.available}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title leading-none mt-1">
              {counts.available}
            </p>
          </div>
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-2 sm:p-3">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
              {t.copies.stats.borrowed}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title leading-none mt-1">
              {counts.borrowed}
            </p>
          </div>
          <div className="border border-[#b9a58b] bg-[#f6ecdd] rounded-sm p-2 sm:p-3">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-[#5c4f42] ink-text leading-tight">
              {t.copies.stats.damaged}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#221910] ink-title leading-none mt-1">
              {counts.damaged}
            </p>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-4 sm:mt-5">
          {/* Search Bar */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d6d5a] w-3.5 h-3.5" />
            <input
              type="text"
              placeholder={t.copies.filters.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[#f8f1e6] border border-[#b9a58b] rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#7d6d5a] ink-text placeholder:text-[#a6917c]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7d6d5a] hover:text-[#221910] p-1 transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <FaTimes className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            className="bg-[#f8f1e6] border border-[#b9a58b] rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#7d6d5a] ink-text cursor-pointer"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          >
            <option value="all">{t.bookList.filters.type.all}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="bg-[#f8f1e6] border border-[#b9a58b] rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#7d6d5a] ink-text cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">{t.bookList.filters.availability.all}</option>
            <option value="available">
              {t.bookList.filters.availability.available}
            </option>
            <option value="borrowed">{t.bookList.copyStatus.borrowed}</option>
            <option value="damaged">{t.bookList.copyStatus.damaged}</option>
          </select>

          {/* Sort Select */}
          <select
            className="bg-[#f8f1e6] border border-[#b9a58b] rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#7d6d5a] ink-text cursor-pointer font-medium"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
          >
            <option value="title-asc">
              {t.copies.sort?.titleAsc || "Title (A-Z)"}
            </option>
            <option value="title-desc">
              {t.copies.sort?.titleDesc || "Title (Z-A)"}
            </option>
            <option value="copies-desc">
              {t.copies.sort?.copiesDesc || "Copies (High to Low)"}
            </option>
            <option value="copies-asc">
              {t.copies.sort?.copiesAsc || "Copies (Low to High)"}
            </option>
          </select>
        </div>

        {/* Results Counter & Active Filters Summary */}
        <div className="flex items-center justify-between gap-2.5 pt-3 mt-3.5 border-t border-[#d8c7b2] flex-wrap text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Count Pill */}
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#e6d7c3] text-[#3f3328] font-bold text-xs border border-[#c4b39c] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#2d4a35] shrink-0" />
              {hasActiveFilters ? (
                language === "bn" ? (
                  <span>
                    <strong className="text-[#221910] font-bold text-sm">
                      {filteredGroups.length}
                    </strong>
                    টি বইয়ের{" "}
                    <strong className="text-[#221910] font-bold text-sm">
                      {totalFilteredCopies}
                    </strong>
                    টি কপি পাওয়া গেছে
                    <span className="text-[#7a6a5a] font-normal ml-1">
                      (মোট {books.length}টি বই, {copies.length}টি কপির মধ্যে)
                    </span>
                  </span>
                ) : (
                  <span>
                    Showing{" "}
                    <strong className="text-[#221910] font-bold text-sm">
                      {filteredGroups.length}
                    </strong>{" "}
                    of {books.length} books{" "}
                    <span className="text-[#5a4b3f]">
                      ({totalFilteredCopies} copies)
                    </span>
                  </span>
                )
              ) : language === "bn" ? (
                <span>
                  মোট{" "}
                  <strong className="text-[#221910] font-bold text-sm">
                    {filteredGroups.length}
                  </strong>
                  টি বইয়ের{" "}
                  <strong className="text-[#221910] font-bold text-sm">
                    {totalFilteredCopies}
                  </strong>
                  টি কপি প্রদর্শিত হচ্ছে
                </span>
              ) : (
                <span>
                  Showing{" "}
                  <strong className="text-[#221910] font-bold text-sm">
                    {filteredGroups.length}
                  </strong>{" "}
                  books{" "}
                  <span className="text-[#5a4b3f]">
                    ({totalFilteredCopies} copies)
                  </span>
                </span>
              )}
            </span>

            {/* Active Sort Indicator */}
            <span className="text-[11px] text-[#6a5a4c] bg-[#f0e4d2] px-2.5 py-1 rounded-md border border-[#dac8b1]">
              {language === "bn" ? "সাজানো:" : "Sort:"}{" "}
              <strong className="text-[#3f3328]">
                {sortBy === "title-asc" &&
                  (t.copies.sort?.titleAsc || "Title (A-Z)")}
                {sortBy === "title-desc" &&
                  (t.copies.sort?.titleDesc || "Title (Z-A)")}
                {sortBy === "copies-desc" &&
                  (t.copies.sort?.copiesDesc || "Copies (High to Low)")}
                {sortBy === "copies-asc" &&
                  (t.copies.sort?.copiesAsc || "Copies (Low to High)")}
              </strong>
            </span>
          </div>

          {/* Clear Filters Action */}
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
      </section>

      {/* Books table */}
      <section className="book-list-surface tron-border rounded-lg overflow-hidden border border-[#5f4f40]">
        {filteredGroups.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-[#5c4f42] ink-text text-sm font-medium">
              {t.copies.empty}
            </p>
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
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-180 text-sm ink-text">
              <thead>
                <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                  {[
                    t.copies.table.bookTitle,
                    t.books.table.author,
                    t.bookList.table.copies,
                    t.copies.table.actions,
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
                {filteredGroups.map((group) => {
                  const isExpanded = expandedBookId === group.book.id;

                  return (
                    <Fragment key={group.book.id}>
                      {/* Book row */}
                      <tr
                        className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors align-top cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          setExpandedBookId(isExpanded ? null : group.book.id)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setExpandedBookId(
                              isExpanded ? null : group.book.id,
                            );
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
                                {group.book.title}
                              </p>
                              <p className="text-[10px] text-[#6a5a4c] mt-0.5">
                                {group.copies.length}{" "}
                                {t.bookList.bookCard.copies}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-2 text-[#5a4b3f] text-sm">
                          {group.book.author}
                        </td>
                        <td className="px-3 sm:px-4 py-2 text-sm">
                          {group.copies.length}
                        </td>
                        <td className="px-3 sm:px-4 py-2 text-sm">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddModal(group.book.id);
                            }}
                            className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-sm border border-[#4f4134] bg-[#3f3328] text-[#f4e8d4] hover:bg-[#4a3d31] transition-colors text-[10px] font-semibold whitespace-nowrap"
                          >
                            <FaPlus className="w-3 h-3" />
                            {t.copies.actions.addCopy}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded copies */}
                      {isExpanded && (
                        <tr className="bg-[#f8f1e5] border-b border-[#d2bfa5]">
                          <td colSpan={4} className="px-3 sm:px-4 py-2">
                            {group.copies.length === 0 ? (
                              <p className="text-[#6a5a4c] ink-text text-sm">
                                {t.copies.empty}
                              </p>
                            ) : (
                              <div className="w-full overflow-x-auto">
                                <table className="w-full min-w-150 text-[11px] sm:text-xs">
                                  <thead>
                                    <tr className="text-[#6a5a4c] uppercase tracking-[0.08em] border-b border-[#d9c6ab]">
                                      <th className="py-1.5 pr-2 text-left font-semibold">
                                        {t.copies.table.copyId}
                                      </th>
                                      <th className="py-1.5 pr-2 text-left font-semibold">
                                        {t.copies.table.status}
                                      </th>
                                      <th className="py-1.5 pr-2 text-left font-semibold">
                                        {t.copies.table.createdAt}
                                      </th>
                                      <th className="py-1.5 pr-2 text-left font-semibold">
                                        {t.copies.table.actions}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {group.copies.map((copy) => (
                                      <tr
                                        key={copy.id}
                                        className="border-b border-[#e4d4bf] last:border-b-0"
                                      >
                                        <td className="py-1.5 pr-2 font-mono text-[#3f3328]">
                                          {copy.id}
                                        </td>
                                        <td className="py-1.5 pr-2">
                                          <div className="space-y-1">
                                            <StatusBadge
                                              tone={getStatusBadgeTone(
                                                copy.status,
                                              )}
                                            >
                                              {t.copies.filters[copy.status]}
                                            </StatusBadge>
                                            {copy.status === "borrowed" &&
                                              copy.borrower && (
                                                <p className="text-[10px] text-[#5a4b3f] ink-text">
                                                  by{" "}
                                                  <Link
                                                    href={`/dashboard/users/${copy.borrower.id}`}
                                                    className="font-semibold underline hover:text-[#2b2119]"
                                                  >
                                                    {copy.borrower.full_name}
                                                  </Link>
                                                </p>
                                              )}
                                          </div>
                                        </td>
                                        <td className="py-1.5 pr-2">
                                          <span
                                            className="text-[#5a4b3f]"
                                            title={new Date(
                                              copy.created_at,
                                            ).toLocaleString()}
                                          >
                                            {new Date(
                                              copy.created_at,
                                            ).toLocaleDateString(undefined, {
                                              year: "numeric",
                                              month: "short",
                                              day: "numeric",
                                            })}
                                          </span>
                                        </td>
                                        <td className="py-1.5 pr-2">
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() =>
                                                openQrModal(copy.id)
                                              }
                                              disabled={isPending}
                                              className="p-2 text-[#5b4c3f] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors disabled:opacity-55"
                                              aria-label={`${t.copies.actions.downloadQr} ${copy.id}`}
                                              title={
                                                t.copies.actions.downloadQr
                                              }
                                            >
                                              <FaQrcode className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={() =>
                                                openEditCopyIdModal(copy.id)
                                              }
                                              disabled={isPending}
                                              className="p-2 text-[#5b4c3f] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors disabled:opacity-55"
                                              aria-label={`${t.copies.actions.editCopyId} ${copy.id}`}
                                              title={
                                                t.copies.actions.editCopyId
                                              }
                                            >
                                              <FaPencilAlt className="w-3.5 h-3.5" />
                                            </button>
                                            {copy.status !== "borrowed" && (
                                              <button
                                                onClick={() =>
                                                  handleMarkAsDamaged(
                                                    copy.id,
                                                    copy.status,
                                                  )
                                                }
                                                disabled={isPending}
                                                className="p-2 text-[#5b4c3f] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors disabled:opacity-55"
                                                aria-label={
                                                  copy.status === "damaged"
                                                    ? t.copies.actions
                                                        .markAsAvailable
                                                    : t.copies.actions
                                                        .markAsDamaged
                                                }
                                                title={
                                                  copy.status === "damaged"
                                                    ? t.copies.actions
                                                        .markAsAvailable
                                                    : t.copies.actions
                                                        .markAsDamaged
                                                }
                                              >
                                                {copy.status === "damaged" ? (
                                                  <FaCheck className="w-4 h-4" />
                                                ) : (
                                                  <FaExclamationTriangle className="w-4 h-4" />
                                                )}
                                              </button>
                                            )}
                                            <button
                                              onClick={() => {
                                                if (copy.status === "borrowed")
                                                  return;
                                                handleDelete(copy.id);
                                              }}
                                              onMouseEnter={() => {
                                                if (copy.status === "borrowed")
                                                  fetchBorrowerName(copy.id);
                                              }}
                                              disabled={
                                                isPending ||
                                                copy.status === "borrowed"
                                              }
                                              className="p-2 text-[#6a4e3d] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                              aria-label={
                                                copy.status === "borrowed"
                                                  ? `Borrowed by ${borrowerNames[copy.id] ?? "someone"}`
                                                  : `${t.copies.actions.delete} ${copy.id}`
                                              }
                                              title={
                                                copy.status === "borrowed"
                                                  ? `Borrowed by ${borrowerNames[copy.id] ?? "…"}`
                                                  : t.copies.actions.delete
                                              }
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
                            )}
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

      {/* Add copy modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-4 z-80"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div
            className="dashboard-surface tron-border rounded-sm max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-[#221910] ink-title">
                {t.copies.modal.addTitle}
              </h2>
              <button
                onClick={closeModal}
                disabled={isPending}
                className="p-2 text-[#655648] hover:bg-[#e7d8c3] rounded-sm transition-colors"
                aria-label="Close copy modal"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAdd();
              }}
              className="space-y-4 ink-text"
            >
              {/* Copy ID */}
              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  Copy ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. C001"
                  value={formData.copy_id}
                  onChange={(e) => {
                    if (copyIdError) setCopyIdError(null);
                    setFormData({
                      ...formData,
                      copy_id: e.target.value.toUpperCase(),
                    });
                  }}
                  className={`w-full px-4 py-2.5 border rounded-sm focus:ring-2 focus:border-transparent outline-none transition-colors ${
                    copyIdError
                      ? "border-red-500 focus:ring-red-500 bg-[#fdf2f2] text-red-900"
                      : "border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] focus:ring-[#6e5d4a]"
                  }`}
                />
                {copyIdError && (
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    {copyIdError}
                  </p>
                )}
              </div>

              {/* Book search dropdown */}
              <div className="relative z-50">
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  {t.copies.modal.labels.selectBook} *
                </label>

                {/* Native select for small screens */}
                <select
                  value={formData.book_id}
                  onChange={(e) => {
                    const selected = books.find((b) => b.id === e.target.value);
                    if (selected) handleSelectBook(selected);
                  }}
                  className="sm:hidden w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                  required
                >
                  <option value="" disabled>
                    {t.copies.modal.placeholders.searchBook}
                  </option>
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} — {book.author}
                    </option>
                  ))}
                </select>

                {/* Custom dropdown for larger screens — rendered via portal so it escapes any overflow:hidden ancestor */}
                <div className="hidden sm:block">
                  <input
                    ref={bookInputRef}
                    type="text"
                    value={bookSearchTerm}
                    onFocus={() => {
                      const rect =
                        bookInputRef.current?.getBoundingClientRect();
                      if (rect) setDropdownRect(rect);
                      setShowBookDropdown(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowBookDropdown(false), 120);
                    }}
                    onChange={(e) => {
                      const rect =
                        bookInputRef.current?.getBoundingClientRect();
                      if (rect) setDropdownRect(rect);
                      handleBookSearchChange(e.target.value);
                    }}
                    placeholder={
                      formData.book_id
                        ? (books.find((b) => b.id === formData.book_id)
                            ?.title ?? t.copies.modal.placeholders.searchBook)
                        : t.copies.modal.placeholders.searchBook
                    }
                    className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                  />

                  {showBookDropdown &&
                    dropdownRect &&
                    typeof document !== "undefined" &&
                    createPortal(
                      <div
                        style={{
                          position: "fixed",
                          top: dropdownRect.bottom + 4,
                          left: dropdownRect.left,
                          width: dropdownRect.width,
                          zIndex: 9999,
                        }}
                        className="max-h-56 overflow-y-auto rounded-sm border border-[#8a7966] bg-[#f6ecdd] shadow-xl"
                      >
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
                                — {book.author}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-[#6a5a4c]">
                            No matching book found
                          </div>
                        )}
                      </div>,
                      document.body,
                    )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 border border-[#8a7966] text-[#4f4134] rounded-sm hover:bg-[#eadcc8] disabled:opacity-55 transition-colors font-medium ink-text"
                >
                  {t.copies.modal.cancel}
                </button>
                <button
                  type="submit"
                  disabled={
                    isPending || !formData.book_id || !formData.copy_id.trim()
                  }
                  className="flex-1 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] disabled:opacity-55 disabled:cursor-not-allowed transition-colors font-medium ink-text"
                >
                  {isPending ? "..." : t.copies.modal.add}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Copy ID modal */}
      {editCopyId && (
        <div
          className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-4 z-80"
          onClick={(e) => e.target === e.currentTarget && setEditCopyId(null)}
        >
          <div
            className="dashboard-surface tron-border rounded-sm max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-[#221910] ink-title">
                {t.copies.editModal.title}
              </h2>
              <button
                onClick={() => setEditCopyId(null)}
                disabled={isPending}
                className="p-2 text-[#655648] hover:bg-[#e7d8c3] rounded-sm transition-colors"
                aria-label="Close edit copy ID modal"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#6a5a4c] ink-text mb-4">
              {t.copies.table.copyId}:{" "}
              <span className="font-mono font-semibold text-[#3f3328]">
                {editCopyId.copyId}
              </span>
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRenameCopyId();
              }}
              className="space-y-4 ink-text"
            >
              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  {t.copies.editModal.label} *
                </label>
                <input
                  type="text"
                  id="edit-copy-id-input"
                  placeholder={t.copies.editModal.placeholder}
                  value={editCopyId.newId}
                  autoFocus
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setEditCopyId((prev) =>
                      prev ? { ...prev, newId: val, error: null } : null,
                    );
                  }}
                  className={`w-full px-4 py-2.5 border rounded-sm focus:ring-2 focus:border-transparent outline-none transition-colors font-mono ${
                    editCopyId.error
                      ? "border-red-500 focus:ring-red-500 bg-[#fdf2f2] text-red-900"
                      : "border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] focus:ring-[#6e5d4a]"
                  }`}
                />
                {editCopyId.error && (
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    {editCopyId.error}
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditCopyId(null)}
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 border border-[#8a7966] text-[#4f4134] rounded-sm hover:bg-[#eadcc8] disabled:opacity-55 transition-colors font-medium ink-text"
                >
                  {t.copies.editModal.cancel}
                </button>
                <button
                  type="submit"
                  disabled={
                    isPending ||
                    !editCopyId.newId.trim() ||
                    editCopyId.newId.trim().toUpperCase() === editCopyId.copyId
                  }
                  className="flex-1 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] disabled:opacity-55 disabled:cursor-not-allowed transition-colors font-medium ink-text"
                >
                  {isPending ? "..." : t.copies.editModal.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm modal only for delete */}
      {pendingAction?.type === "delete" && (
        <ConfirmModal
          open
          onClose={() => setPendingAction(null)}
          onConfirm={confirmDelete}
          title={t.copies.confirmDelete.title}
          description={
            refCount === null ? (
              "..."
            ) : refCount > 0 ? (
              <span>
                <b className="text-[#221910] font-bold">{refCount}</b>{" "}
                {t.copies.confirmDelete.warning.replace(
                  "{count}",
                  refCount.toString(),
                )}
              </span>
            ) : (
              t.copies.confirmDelete.message
            )
          }
          preview={
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-semibold">
                  {t.copies.table.bookTitle}:
                </span>{" "}
                {pendingAction.bookTitle}
              </p>
              <p>
                <span className="font-semibold">{t.copies.table.copyId}:</span>{" "}
                {pendingAction.copyId}
              </p>
            </div>
          }
          confirmLabel={t.copies.actions.delete}
          danger
          loading={isPending}
        />
      )}

      {/* QR modal */}
      {qrModalCopyId && (
        <div
          className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-4 z-80"
          onClick={(e) => e.target === e.currentTarget && closeQrModal()}
        >
          <div
            className="dashboard-surface tron-border rounded-sm max-w-md w-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-xl font-bold text-[#221910] ink-title">
                  {t.copies.qrModal.title}
                </h2>
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
                  {t.copies.qrModal.loading}
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
                  Error
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                onClick={closeQrModal}
                className="flex-1 px-3 py-2 border border-[#8a7966] text-[#4f4134] rounded-sm hover:bg-[#eadcc8] transition-colors font-medium text-sm ink-text"
              >
                {t.copies.qrModal.close}
              </button>
              <button
                onClick={handleDownloadQr}
                disabled={!qrImageUrl || qrIsLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] disabled:opacity-55 disabled:cursor-not-allowed transition-colors font-medium text-sm ink-text"
              >
                <FaDownload className="w-4 h-4" />
                {t.copies.qrModal.download}
              </button>
            </div>

            <p className="text-xs text-[#6a5a4c] mt-2 text-center ink-text">
              {qrModalCopyId}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
