"use client";

import { returnBook } from "@/server/transaction-actions";
import type { Transaction } from "@/types/library";
import { Scanner, useDevices } from "@yudiel/react-qr-scanner";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  FaExclamationTriangle,
  FaKeyboard,
  FaQrcode,
  FaUndoAlt,
} from "react-icons/fa";

interface ReturnClientProps {
  currentBorrows: Transaction[];
  userId: string;
}

export default function ReturnClient({
  currentBorrows,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId: _userId,
}: ReturnClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Global feedback
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // QR / manual input section
  const [copyId, setCopyId] = useState("");
  const [scannedCopyId, setScannedCopyId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"qr" | "manual">("qr");
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [scanPaused, setScanPaused] = useState(false);
  const [scannerInitialized, setScannerInitialized] = useState(true);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

  const devices = useDevices();

  // ── Shared return logic ─────────────────────────────────────────────────────

  function handleReturn(targetCopyId: string, bookTitle: string) {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const fd = new FormData();
      fd.set("copy_id", targetCopyId);
      const result = await returnBook(fd);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(
          `Return request submitted for "${bookTitle}". A moderator will confirm it shortly.`,
        );
        // Clear QR scanner state after a successful scanner-triggered return
        setScannedCopyId(null);
        setCopyId("");
        setScanPaused(false);
        router.refresh();
      }
    });
  }

  // ── QR scanner helpers ──────────────────────────────────────────────────────

  function processCopyId(value: string): boolean {
    const upper = value.toUpperCase().trim();
    setCopyId(upper);
    setError("");
    if (upper.length > 0) {
      setScannedCopyId(upper);
      return true;
    }
    setScannedCopyId(null);
    return false;
  }

  function handleCopyIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    processCopyId(e.target.value);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleScan(detectedCodes: any[]) {
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
    setCopyId("");
    setScanPaused(false);
    setError("");
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // When showing the QR confirmation panel, try to find the book title from
  // the current borrows list so the success message is meaningful.
  const scannedBorrow = scannedCopyId
    ? currentBorrows.find(
        (b) => b.copy_id.toUpperCase() === scannedCopyId.toUpperCase(),
      )
    : null;
  const scannedBookTitle = scannedBorrow?.book?.title ?? scannedCopyId ?? "";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl sm:text-3xl text-[#221910] ink-title font-bold">
          Return
        </h1>
        <p className="text-[#5c4f42] text-sm mt-1 ink-text">
          Return books you&apos;ve borrowed, or scan a QR code to submit a
          return request.
        </p>
      </div>

      {/* Global feedback */}
      {success && (
        <div className="p-4 bg-[#e8f1e7] border border-[#8faa8f] rounded-lg">
          <p className="text-sm text-[#3a5a3a] ink-text">{success}</p>
        </div>
      )}
      {error && (
        <div className="p-4 bg-[#f6e3df] border border-[#b0665c] rounded-lg">
          <p className="text-sm text-[#7d2d23] ink-text">{error}</p>
        </div>
      )}

      {/* ── Section 1: Currently borrowed books ─────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-[#221910] ink-title mb-3">
          Currently Borrowed
        </h2>

        {currentBorrows.length === 0 ? (
          <div className="dashboard-surface tron-border rounded-lg p-8 text-center">
            <FaUndoAlt className="mx-auto w-8 h-8 text-[#9c8d7e] mb-3" />
            <p className="text-[#5c4f42] ink-text">
              You have no active borrows.
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
              ).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const dueDateStr = dueDate
                ? dueDate.toLocaleDateString("en-GB", {
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
                          Copy:{" "}
                          <span className="font-semibold font-mono text-[#221910]">
                            {txn.copy_id}
                          </span>
                        </span>
                        <span>
                          Borrowed:{" "}
                          <span className="font-semibold text-[#221910]">
                            {borrowedDateStr}
                          </span>
                        </span>
                        <span>
                          Due:{" "}
                          <span className="font-semibold text-[#221910]">
                            {dueDateStr}
                          </span>
                        </span>
                      </div>

                      {/* Overdue badge */}
                      {isOverdue && overdueDays > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-[#7a4c37] bg-[#f7e6df] border border-[#b0665c] rounded px-2 py-1 w-fit ink-text">
                          <FaExclamationTriangle className="w-3 h-3 shrink-0" />
                          Overdue by {overdueDays} day
                          {overdueDays !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>

                    {/* Return button */}
                    <button
                      onClick={() => handleReturn(txn.copy_id, bookTitle)}
                      disabled={isPending}
                      className="shrink-0 px-4 py-2 bg-[#5a4d40] text-[#f6ede1] rounded-lg font-medium hover:bg-[#4c4035] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ink-text text-sm"
                    >
                      {isPending ? "…" : "Return"}
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
          Return by QR Code
        </h2>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4 dashboard-surface tron-border rounded-lg p-1">
          <button
            onClick={() => setInputMode("qr")}
            className={`flex-1 px-3 sm:px-4 py-2 rounded font-medium transition-colors text-sm sm:text-base ink-text ${
              inputMode === "qr"
                ? "bg-[#5a4d40] text-[#f6ede1]"
                : "text-[#4e4033] hover:bg-[#eadcca]"
            }`}
          >
            <FaQrcode className="inline w-4 h-4 mr-2" />
            Scan QR
          </button>
          <button
            onClick={() => setInputMode("manual")}
            className={`flex-1 px-3 sm:px-4 py-2 rounded font-medium transition-colors text-sm sm:text-base ink-text ${
              inputMode === "manual"
                ? "bg-[#5a4d40] text-[#f6ede1]"
                : "text-[#4e4033] hover:bg-[#eadcca]"
            }`}
          >
            <FaKeyboard className="inline w-4 h-4 mr-2" />
            Enter ID
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
                    ? "Camera Permission Denied — Try Again"
                    : "Start QR Scanner"}
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
                Position QR code within the frame
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
              <label className="block">
                <p className="text-sm font-medium text-[#4e4033] mb-2 ink-text">
                  Copy ID
                </p>
                <input
                  type="text"
                  value={copyId}
                  onChange={handleCopyIdChange}
                  placeholder="e.g., QRA1B2C3-1"
                  maxLength={20}
                  className="w-full px-4 py-3 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] rounded-lg focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent outline-none text-lg font-mono tracking-widest"
                  autoFocus
                />
              </label>
            </div>
          )}

          {/* ── Confirmation panel (shared by QR and manual) ──────────────── */}
          {scannedCopyId && (
            <div className="border border-[#8faa8f] bg-[#edf4ec] rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FaUndoAlt className="w-4 h-4 text-[#4a6a4a] shrink-0" />
                <p className="text-sm font-semibold text-[#3a5a3a] ink-text">
                  Ready to return:
                </p>
              </div>

              <div>
                {scannedBorrow?.book?.title && (
                  <p className="text-base font-bold text-[#221910] ink-title">
                    {scannedBorrow.book.title}
                  </p>
                )}
                <p className="text-sm font-mono text-[#4e4033] ink-text mt-0.5">
                  Copy ID:{" "}
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
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleReturn(scannedCopyId, scannedBookTitle)}
                  disabled={isPending}
                  className="flex-1 px-3 py-2 bg-[#5a4d40] text-[#f6ede1] rounded-lg font-medium hover:bg-[#4c4035] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ink-text text-sm"
                >
                  {isPending ? "Submitting…" : "Confirm Return"}
                </button>
              </div>
            </div>
          )}

          {/* Camera permission denied notice */}
          {cameraPermissionDenied && (
            <div className="p-4 bg-[#f4ecd8] border border-[#b49d6f] rounded-lg">
              <p className="text-sm text-[#6b5428] ink-text">
                <strong>Camera permission denied.</strong> Please enable camera
                access in your browser settings and try again.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
