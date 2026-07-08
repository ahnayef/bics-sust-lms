"use client";

import { lookupCopy, returnBook } from "@/server/transaction-actions";
import type { Transaction } from "@/types/library";
import { Scanner, useDevices } from "@yudiel/react-qr-scanner";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  FaExclamationTriangle,
  FaKeyboard,
  FaQrcode,
  FaUndoAlt,
} from "react-icons/fa";

import { useTranslation } from "@/lib/i18n/context";

interface ReturnClientProps {
  currentBorrows: Transaction[];
  userId: string;
  pendingReturnCopyIds: Set<string>;
  isVerified: boolean;
}

export default function ReturnClient({
  currentBorrows,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId: _userId,
  pendingReturnCopyIds,
  isVerified,
}: ReturnClientProps) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Global feedback
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // QR / manual input section
  const [copyId, setCopyId] = useState("");
  const [scannedCopyId, setScannedCopyId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"qr" | "manual">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("return-input-mode");
      if (saved === "qr" || saved === "manual") return saved;
    }
    return "qr";
  });
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [scanPaused, setScanPaused] = useState(false);
  const [scannerInitialized, setScannerInitialized] = useState(true);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [scannedBorrow, setScannedBorrow] = useState<Transaction | null>(null);
  const lookupCounterRef = useRef(0);

  const devices = useDevices();

  // ── Shared return logic ─────────────────────────────────────────────────────

  function handleReturn(targetCopyId: string, bookTitle: string, transactionId?: string) {
    if (!isVerified) return;
    setError("");
    setSuccess("");
    setProcessingId(transactionId || targetCopyId);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("copy_id", targetCopyId);
      const result = await returnBook(fd);
      setProcessingId(null);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(
          t.return.success.message.replace("{title}", bookTitle),
        );
        // Clear QR scanner state after a successful scanner-triggered return
        setScannedCopyId(null);
        setCopyId("");
        setScanPaused(false);
        setScannedBorrow(null);
        router.refresh();
      }
    });
  }

  // ── Copy lookup ─────────────────────────────────────────────────────────────

  const performLookup = async (value: string): Promise<boolean> => {
    if (!isVerified) return false;
    const upper = value.toUpperCase().trim();
    if (!upper) return false;

    setError("");
    setScannedBorrow(null);
    setIsLookingUp(true);

    const thisLookup = ++lookupCounterRef.current;
    try {
      const { copy } = await lookupCopy(upper);

      // Discard if a newer lookup has already started
      if (thisLookup !== lookupCounterRef.current) return false;

      setIsLookingUp(false);

      if (!copy) {
        setError(t.return.errors.copyNotFound);
        setScannedCopyId(null);
        return false;
      }

      // Check if there's already a pending return for this copy
      if (pendingReturnCopyIds.has(upper)) {
        setError("You already have a pending return request for this copy");
        setScannedCopyId(upper);
        setScannedBorrow(null);
        return false;
      }

      // Check if user has borrowed this copy
      const borrow = currentBorrows.find(
        (b) => b.copy_id.toUpperCase() === upper.toUpperCase(),
      );

      if (!borrow) {
        setError(t.return.errors.notBorrowed);
        setScannedCopyId(upper);
        return false;
      }

      setScannedCopyId(upper);
      setScannedBorrow(borrow);
      return true;
    } catch (err) {
      if (thisLookup === lookupCounterRef.current) {
        setIsLookingUp(false);
        setError(t.return.errors.generic);
      }
      return false;
    }
  };

  // ── QR scanner helpers ──────────────────────────────────────────────────────

  function processCopyId(value: string): boolean {
    const upper = value.toUpperCase().trim();
    setCopyId(upper);
    setError("");
    if (upper.length > 0) {
      performLookup(upper).then((valid) => {
        if (valid) setScanPaused(true);
      });
      return true;
    }
    setScannedCopyId(null);
    setScannedBorrow(null);
    return false;
  }



  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleScan(detectedCodes: any[]) {
    if (!isVerified) return;
    if (detectedCodes.length > 0) {
      const scannedValue = (detectedCodes[0].rawValue as string).trim();
      const isValid = processCopyId(scannedValue);
      if (isValid) setScanPaused(true);
    }
  }

  async function requestCameraPermission() {
    try {
      setCameraPermissionDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      stream.getTracks().forEach((track) => track.stop());
      setScannerInitialized(true);
    } catch (scanError) {
      console.error("Camera permission error:", scanError);
      setCameraPermissionDenied(true);
    }
  }

  function resetScanner() {
    setScannedCopyId(null);
    setScannedBorrow(null);
    setCopyId("");
    setScanPaused(false);
    setError("");
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // When showing the QR confirmation panel, try to find the book title from
  // the current borrows list so the success message is meaningful.
  const scannedBookTitle = scannedBorrow?.book?.title ?? scannedCopyId ?? "";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl sm:text-3xl text-[#221910] ink-title font-bold">
          {t.return.title}
        </h1>
        <p className="text-[#5c4f42] text-sm mt-1 ink-text">
          {t.return.subtitle}
        </p>
      </div>

      {/* Not Verified Warning */}
      {!isVerified && (
        <div className="dashboard-surface tron-border rounded-lg p-4 border-2 border-[#b0665c] border-l-4 border-l-[#8d4f45] bg-[#f8e7e3] mb-5">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="w-5 h-5 text-[#8d4f45] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#7d2d23] ink-text">
                {t.return.errors.notVerified}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Global feedback */}
      {success && (
        <div className="p-4 bg-[#e8f1e7] border border-[#8faa8f] rounded-lg">
          <p className="text-sm text-[#3a5a3a] ink-text">{success}</p>
        </div>
      )}

      {/* ── Section 1: Currently borrowed books ─────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-[#221910] ink-title mb-3">
          {t.return.form.bookTitle}
        </h2>

        {currentBorrows.length === 0 ? (
          <div className="dashboard-surface tron-border rounded-lg p-8 text-center">
            <FaUndoAlt className="mx-auto w-8 h-8 text-[#9c8d7e] mb-3" />
            <p className="text-[#5c4f42] ink-text">
              {t.history.empty}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentBorrows.map((txn) => {
              const dueDate = txn.due_date ? new Date(txn.due_date) : null;
              if (dueDate) dueDate.setHours(0, 0, 0, 0);
              const isOverdue =
                txn.status === "overdue" ||
                (dueDate !== null && dueDate < today);
              const overdueDays =
                isOverdue && dueDate
                  ? Math.floor((today.getTime() - dueDate.getTime()) / 86400000)
                  : 0;

              const bookTitle = txn.book?.title ?? "Unknown Book";
              const borrowedDateStr = new Date(
                txn.request_date,
              ).toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const dueDateStr = dueDate
                ? dueDate.toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
                : "—";

              return (
                <div
                  key={txn.id}
                  className="dashboard-surface tron-border rounded-lg p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Book title + author */}
                      <p className="text-base font-bold text-[#221910] ink-title leading-tight">
                        {bookTitle}
                      </p>
                      {txn.book?.author && (
                        <p className="text-sm text-[#5c4f42] ink-text mt-0.5 mb-2">
                          {txn.book.author}
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm ink-text text-[#5c4f42]">
                        <span>
                          {t.return.form.copyId}:{" "}
                          <span className="font-semibold font-mono text-[#221910]">
                            {txn.copy_id}
                          </span>
                        </span>
                        <span>
                          {t.return.form.borrowedOn}:{" "}
                          <span className="font-semibold text-[#221910]">
                            {borrowedDateStr}
                          </span>
                        </span>
                        <span>
                          {t.return.form.dueDate}:{" "}
                          <span className="font-semibold text-[#221910]">
                            {dueDateStr}
                          </span>
                        </span>
                      </div>

                      {/* Overdue badge */}
                      {isOverdue && overdueDays > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-[#7a4c37] bg-[#f7e6df] border border-[#b0665c] rounded px-2 py-1 w-fit ink-text">
                          <FaExclamationTriangle className="w-3 h-3 shrink-0" />
                          {language === "bn" ? `সময় অতিক্রান্ত: ${overdueDays} দিন` : `Overdue by ${overdueDays} day${overdueDays !== 1 ? "s" : ""}`}
                        </div>
                      )}
                    </div>

                    {/* Return button */}
                    <button
                      onClick={() => handleReturn(txn.copy_id, bookTitle, txn.id)}
                      disabled={isPending || (processingId !== null && processingId !== txn.id) || pendingReturnCopyIds.has(txn.copy_id.toUpperCase()) || !isVerified}
                      className="shrink-0 px-4 py-2 bg-[#5a4d40] text-[#f6ede1] rounded-lg font-medium hover:bg-[#4c4035] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ink-text text-sm"
                    >
                      {pendingReturnCopyIds.has(txn.copy_id.toUpperCase())
                        ? "Pending"
                        : processingId === txn.id && isPending ? "…" : t.return.form.submit.replace("Request to ", "")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Section 2: QR scanner / manual input ──────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-[#221910] ink-title mb-3">
          {t.return.qrMode}
        </h2>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4 dashboard-surface tron-border rounded-lg p-1">
          <button
            onClick={() => {
              setInputMode("qr");
              localStorage.setItem("return-input-mode", "qr");
            }}
            className={`flex-1 px-3 sm:px-4 py-2 rounded font-medium transition-colors text-sm sm:text-base ink-text ${inputMode === "qr"
              ? "bg-[#5a4d40] text-[#f6ede1]"
              : "text-[#4e4033] hover:bg-[#eadcca]"
              }`}
          >
            <FaQrcode className="inline w-4 h-4 mr-2" />
            {t.return.qrMode}
          </button>
          <button
            onClick={() => {
              setInputMode("manual");
              localStorage.setItem("return-input-mode", "manual");
            }}
            className={`flex-1 px-3 sm:px-4 py-2 rounded font-medium transition-colors text-sm sm:text-base ink-text ${inputMode === "manual"
              ? "bg-[#5a4d40] text-[#f6ede1]"
              : "text-[#4e4033] hover:bg-[#eadcca]"
              }`}
          >
            <FaKeyboard className="inline w-4 h-4 mr-2" />
            {t.return.manualMode}
          </button>
        </div>

        <div className="dashboard-surface tron-border rounded-lg p-6 space-y-4">
          {inputMode === "qr" ? (
            /* ── QR scanner ────────────────────────────────────────────────── */
            <div className="space-y-4">
              {/* Camera selector */}
              <label className="block">
                <p className="text-sm font-medium text-[#4e4033] mb-2 ink-text">
                  Select Camera
                </p>
                <select
                  value={deviceId ?? ""}
                  onChange={(e) => setDeviceId(e.target.value || undefined)}
                  className="w-full px-4 py-2 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] rounded-lg focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent outline-none ink-text"
                  disabled={scannerInitialized}
                >
                  <option value="">Default Camera</option>
                  {devices.map((device, i) => (
                    <option key={i} value={device.deviceId}>
                      {device.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
              </label>

              {!scannerInitialized && (
                <button
                  type="button"
                  onClick={requestCameraPermission}
                  className="w-full px-4 py-3 bg-[#5a4d40] text-[#f6ede1] rounded-lg font-medium hover:bg-[#4c4035] transition-colors ink-text"
                >
                  {cameraPermissionDenied
                    ? t.borrow.errors.cameraPermission.split(".")[0]
                    : t.borrow.qrMode}
                </button>
              )}

              {/* Scanner viewport */}
              <div className="relative max-w-md mx-auto">
                <div className="relative bg-[#1f1812] rounded-sm shadow-lg aspect-square overflow-clip">
                  <Scanner
                    formats={["qr_code"]}
                    constraints={{ deviceId }}
                    onScan={handleScan}
                    onError={(scanError) => {
                      console.error("Scanner error:", scanError);
                      const errStr = JSON.stringify(scanError).toLowerCase();
                      if (
                        errStr.includes("permission") ||
                        errStr.includes("notallowed")
                      ) {
                        setCameraPermissionDenied(true);
                        setScannerInitialized(false);
                      }
                    }}
                    styles={{
                      container: { width: "100%", aspectRatio: "1" },
                      video: { objectFit: "cover" },
                    }}
                    components={{
                      onOff: false,
                      torch: true,
                      zoom: true,
                      finder: false,
                    }}
                    allowMultiple={false}
                    scanDelay={2000}
                    paused={scanPaused}
                  />
                  {/* Red scan line */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 w-full h-0.5 bg-red-500 opacity-75"
                      style={{ animation: "qrScannerMove 2s infinite" }}
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#5c4f42] text-center ink-text">
                {t.borrow.scanPlaceholder}
              </p>

              {scanPaused && !scannedCopyId && (
                <button
                  type="button"
                  onClick={() => setScanPaused(false)}
                  className="w-full px-4 py-2 bg-[#5a4d40] text-[#f6ede1] rounded-lg font-medium hover:bg-[#4c4035] transition-colors ink-text"
                >
                  Resume Scanning
                </button>
              )}
            </div>
          ) : (
            /* ── Manual input ──────────────────────────────────────────────── */
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block">
                  <p className="text-sm font-medium text-[#4e4033] mb-2 ink-text">
                    {t.return.form.copyId}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={copyId}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().trim();
                        setCopyId(val);
                        if (scannedCopyId || error) {
                          setScannedCopyId(null);
                          setScannedBorrow(null);
                          setError("");
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (!copyId.trim()) {
                            setError(t.return.errors.copyNotFound);
                            return;
                          }
                          performLookup(copyId);
                        }
                      }}
                      placeholder={t.return.inputPlaceholder}
                      maxLength={20}
                      className="flex-1 px-4 py-3 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] rounded-lg focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent outline-none text-lg font-mono tracking-widest"
                      autoFocus
                      disabled={!isVerified}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!copyId.trim()) {
                          setError(t.return.errors.copyNotFound);
                          return;
                        }
                        performLookup(copyId);
                      }}
                      disabled={isLookingUp || !copyId.trim() || !isVerified}
                      className="px-6 py-3 bg-[#5a4d40] text-[#f6ede1] rounded-lg font-medium hover:bg-[#4c4035] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ink-text whitespace-nowrap"
                    >
                      {isLookingUp ? t.return.lookingUp : t.return.lookup}
                    </button>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ── Error message for invalid copy ────────────────────────────── */}
          {error && !success && (
            <div className="p-4 bg-[#f6e3df] border border-[#b0665c] rounded-lg">
              <p className="text-sm text-[#7d2d23] ink-text">{error}</p>
            </div>
          )}

          {/* ── Confirmation panel (shared by QR and manual) ──────────────── */}
          {scannedBorrow && (
            <div className="border border-[#8faa8f] bg-[#edf4ec] rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FaUndoAlt className="w-4 h-4 text-[#4a6a4a] shrink-0" />
                <p className="text-sm font-semibold text-[#3a5a3a] ink-text">
                  {t.return.success.returnAnother}
                </p>
              </div>

              <div>
                {scannedBorrow?.book?.title && (
                  <p className="text-base font-bold text-[#221910] ink-title">
                    {scannedBorrow.book.title}
                  </p>
                )}
                <p className="text-sm font-mono text-[#4e4033] ink-text mt-0.5">
                  {t.return.form.copyId}:{" "}
                  <span className="font-semibold text-[#221910]">
                    {scannedCopyId}
                  </span>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetScanner}
                  className="flex-1 px-3 py-2 border border-[#7b6d5f] text-[#4e4033] rounded-lg font-medium hover:bg-[#eadcca] transition-colors ink-text text-sm"
                >
                  {language === "bn" ? "বাতিল করুন" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => handleReturn(scannedCopyId!, scannedBookTitle)}
                  disabled={isPending || (processingId !== null && processingId !== scannedCopyId) || !isVerified}
                  className="flex-1 px-3 py-2 bg-[#5a4d40] text-[#f6ede1] rounded-lg font-medium hover:bg-[#4c4035] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ink-text text-sm"
                >
                  {processingId === scannedCopyId && isPending ? t.return.form.submitting : t.return.form.submit}
                </button>
              </div>
            </div>
          )}

          {/* Camera permission denied notice */}
          {cameraPermissionDenied && (
            <div className="p-4 bg-[#f4ecd8] border border-[#b49d6f] rounded-lg">
              <p className="text-sm text-[#6b5428] ink-text">
                <strong>{t.borrow.errors.cameraPermission.split(".")[0]}.</strong> {t.borrow.errors.cameraPermission.split(".")[1]}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
