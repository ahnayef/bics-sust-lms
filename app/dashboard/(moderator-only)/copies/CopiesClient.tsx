"use client";

import StatusBadge from "@/app/components/StatusBadge";
import ConfirmModal from "@/components/ui/confirm-modal";
import { useTranslation } from "@/lib/i18n/context";
import {
  addCopyOfBook,
  getBookRefCount,
  removeCopy,
} from "@/server/library-actions";
import type { Book, Copy, CopyStatus } from "@/types/library";
import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  FaDownload,
  FaPlus,
  FaQrcode,
  FaSearch,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

type StatusFilter = "all" | CopyStatus;

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

const buildQrCardImage = async (copyId: string, bookTitle: string, copyIdLabel: string) => {
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
  book_id: string; // Manual ID of the selected book
  copy_id: string; // Manual ID for the copy
}

const EMPTY_FORM: CopyForm = { book_id: "", copy_id: "" };

interface Props {
  initialCopies: Copy[];
  books: Book[];
}

type PendingAction =
  | { type: "add" }
  | { type: "delete"; copyId: string; bookTitle: string };

export default function CopiesClient({ initialCopies, books }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const [copies, setCopies] = useState<Copy[]>(initialCopies);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [bookSearchTerm, setBookSearchTerm] = useState("");
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [formData, setFormData] = useState<CopyForm>(EMPTY_FORM);

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

  useEffect(() => {
    if (!showAddModal && !qrModalCopyId) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
        closeQrModal();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showAddModal, qrModalCopyId]);

  // Sync when server re-renders after router.refresh()
  useEffect(() => {
    setCopies(initialCopies);
  }, [initialCopies]);

  const showFlash = (type: "success" | "error", text: string) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), 4500);
  };

  // ── Derived state ────────────────────────────────────────────────────────

  const query = searchTerm.toLowerCase().trim();

  const filteredCopies = copies.filter((copy) => {
    const matchesSearch =
      copy.id.toLowerCase().includes(query) ||
      (copy.book?.title.toLowerCase().includes(query) ?? false) ||
      (copy.book?.author.toLowerCase().includes(query) ?? false);
    const matchesStatus =
      statusFilter === "all" || copy.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    total: copies.length,
    available: copies.filter((c) => c.status === "available").length,
    borrowed: copies.filter((c) => c.status === "borrowed").length,
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

  const openAddModal = () => {
    setFormData(EMPTY_FORM);
    setBookSearchTerm("");
    setShowBookDropdown(false);
    setShowAddModal(true);
  };

  const handleAdd = () => {
    if (!formData.book_id) return;
    setPendingAction({ type: "add" });
  };

  const confirmAdd = () => {
    setPendingAction(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("book_id", formData.book_id);
      fd.set("copy_id", formData.copy_id.trim());
      const result = await addCopyOfBook(fd);
      if (result.error) {
        showFlash("error", result.error);
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
    const count = await getBookRefCount(copyId);
    setRefCount(count);
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

  const closeModal = () => {
    setShowAddModal(false);
    setFormData(EMPTY_FORM);
    setBookSearchTerm("");
    setShowBookDropdown(false);
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
      const imageUrl = await buildQrCardImage(copy.id, copy.book.title, t.copies.qrModal.copyId);
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
      {/* Flash notification */}
      {flash && (
        <div
          className={`fixed top-4 right-4 z-[200] px-4 py-3 rounded-sm border text-sm font-medium ink-text shadow-lg transition-all ${flash.type === "success"
            ? "bg-[#e8f5e8] border-[#6b9e6b] text-[#2a4a2a]"
            : "bg-[#f5e8e8] border-[#9e6b6b] text-[#4a2a2a]"
            }`}
        >
          {flash.text}
        </div>
      )}

      {/* Header + stats */}
      <section
        className="dashboard-surface tron-border rounded-sm p-5 sm:p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title">
              {t.copies.title}
            </h1>
            <p className="text-[#5a4b3f] mt-1 ink-text">
              {t.copies.subtitle}
            </p>
          </div>

          <button
            onClick={openAddModal}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] disabled:opacity-55 transition-colors font-medium ink-text"
          >
            <FaPlus className="w-4 h-4" />
            {t.copies.actions.addCopy}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-5">
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
        </div>
      </section>

      {/* Search & filter bar */}
      <section
        className="dashboard-surface tron-border rounded-sm p-4 sm:p-5 border border-[#5f4f40]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="relative lg:col-span-2">
            <FaSearch className="absolute left-3 top-3 text-[#7a6a5a]" />
            <input
              type="text"
              placeholder={t.copies.filters.searchPlaceholder}
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
            <option value="all">{t.copies.filters.all}</option>
            <option value="available">{t.copies.filters.available}</option>
            <option value="borrowed">{t.copies.filters.borrowed}</option>
            <option value="damaged">{t.copies.filters.damaged}</option>
          </select>
        </div>
      </section>

      {/* Copies table */}
      <section
        className="dashboard-surface tron-border rounded-sm overflow-hidden border border-[#5f4f40]"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm ink-text min-w-160">
            <thead>
              <tr className="bg-[#eadcc8] border-b border-[#7d6d5a]">
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  {t.copies.table.copyId}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  {t.copies.table.bookTitle}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  {t.books.table.author}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  {t.books.table.copies} #
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  {t.copies.table.status}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-[#3b3026] font-semibold uppercase tracking-[0.08em] text-xs">
                  {t.copies.table.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCopies.map((copy) => (
                <tr
                  key={copy.id}
                  className="border-b border-[#d2bfa5] hover:bg-[#f4ebdc] transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 font-mono font-medium text-[#2b2119]">
                    {copy.id}
                  </td>
                  <td className="px-4 sm:px-6 py-3 font-medium text-[#2b2119]">
                    {copy.book?.title ?? "Unknown"}
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-[#5a4b3f]">
                    {copy.book?.author ?? "Unknown"}
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <StatusBadge tone="muted">{copy.copy_number}</StatusBadge>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <div className="space-y-1">
                      <StatusBadge tone={getStatusBadgeTone(copy.status)}>
                        {t.copies.filters[copy.status]}
                      </StatusBadge>
                      {copy.status === "borrowed" && copy.borrower && (
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
                  <td className="px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openQrModal(copy.id)}
                        disabled={isPending}
                        className="p-2 text-[#5b4c3f] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors disabled:opacity-55"
                        aria-label={`${t.copies.actions.downloadQr} ${copy.id}`}
                        title={t.copies.actions.downloadQr}
                      >
                        <FaQrcode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(copy.id)}
                        disabled={isPending}
                        className="p-2 text-[#6a4e3d] hover:bg-[#eadcc8] border border-transparent hover:border-[#c4ad91] rounded-sm transition-colors disabled:opacity-55"
                        aria-label={`${t.copies.actions.delete} ${copy.id}`}
                        title={t.copies.actions.delete}
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

        {filteredCopies.length === 0 && (
          <div className="text-center py-12 text-[#6a5a4c] ink-text">
            <p>{t.copies.empty}</p>
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

            <div className="space-y-4 ink-text">
              {/* Copy ID */}
              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  Copy ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. C001"
                  value={formData.copy_id}
                  onChange={(e) =>
                    setFormData({ ...formData, copy_id: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none"
                />
              </div>

              {/* Book search dropdown */}
              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1">
                  {t.copies.modal.labels.selectBook} *
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
                    placeholder={t.copies.modal.placeholders.searchBook}
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
                              — {book.author}
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


            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 border border-[#8a7966] text-[#4f4134] rounded-sm hover:bg-[#eadcc8] disabled:opacity-55 transition-colors font-medium ink-text"
              >
                {t.copies.modal.cancel}
              </button>
              <button
                onClick={handleAdd}
                disabled={
                  isPending ||
                  !formData.book_id ||
                  !formData.copy_id.trim()
                }
                className="flex-1 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] disabled:opacity-55 disabled:cursor-not-allowed transition-colors font-medium ink-text"
              >
                {isPending ? "..." : t.copies.modal.add}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {pendingAction && (
        <ConfirmModal
          open
          onClose={() => setPendingAction(null)}
          onConfirm={pendingAction.type === "add" ? confirmAdd : confirmDelete}
          title={pendingAction.type === "add" ? t.copies.modal.addTitle : t.copies.confirmDelete.title}
          description={
            pendingAction?.type === "delete" ? (
              refCount === null ? (
                "..."
              ) : refCount > 0 ? (
                <span>
                  <b className="text-[#221910] font-bold">{refCount}</b> {t.copies.confirmDelete.warning.replace("{count}", refCount.toString())}
                </span>
              ) : (
                t.copies.confirmDelete.message
              )
            ) : undefined
          }
          preview={
            pendingAction.type === "delete" ? (
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-semibold">{t.copies.table.bookTitle}:</span>{" "}
                  {pendingAction.bookTitle}
                </p>
                <p>
                  <span className="font-semibold">{t.copies.table.copyId}:</span>{" "}
                  {pendingAction.copyId}
                </p>
              </div>
            ) : (
              (() => {
                const selectedBook = books.find(
                  (b) => b.id === formData.book_id,
                );

                return (
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-semibold">{t.copies.table.bookTitle}:</span>{" "}
                      {selectedBook?.title ?? "—"}
                    </p>
                    <p>
                      <span className="font-semibold">{t.copies.table.copyId}:</span> {formData.copy_id}
                    </p>
                  </div>
                );
              })()
            )
          }
          confirmLabel={
            pendingAction.type === "add" ? t.copies.modal.add : t.copies.actions.delete
          }
          danger={pendingAction.type === "delete"}
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
