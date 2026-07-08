"use client";

import { borrowBook, lookupCopy } from "@/server/transaction-actions";
import "@/styles/components.css";
import "@/styles/typography.css";
import type { Copy } from "@/types/library";
import { Scanner, useDevices } from "@yudiel/react-qr-scanner";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  FaCheck,
  FaExclamationTriangle,
  FaKeyboard,
  FaQrcode,
} from "react-icons/fa";

import { useTranslation } from "@/lib/i18n/context";

interface CompletedBook {
  bookId: string;
  completedOn: string;
  copyId: string;
}

interface Props {
  initialCopyId: string;
  initialCopy: Copy | null;
  activeBorrowCopyIds: string[];
  completedBooks: CompletedBook[];
  isVerified: boolean;
}

export default function BorrowClient({
  initialCopyId,
  initialCopy,
  activeBorrowCopyIds,
  completedBooks,
  isVerified,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, language } = useTranslation();

  // ── State ──────────────────────────────────────────────────────────────────

  const [copyId, setCopyId] = useState(initialCopyId);
  const [selectedCopy, setSelectedCopy] = useState<Copy | null>(
    initialCopy?.status === "available" ? initialCopy : null,
  );
  const [unavailableCopy, setUnavailableCopy] = useState<Copy | null>(
    initialCopy && initialCopy.status !== "available" ? initialCopy : null,
  );
  const [returnDate, setReturnDate] = useState(() => {
    if (initialCopy?.status === "available") {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      return d.toISOString().split("T")[0];
    }
    return "";
  });
  const [error, setError] = useState(() => {
    if (initialCopyId && !initialCopy) {
      return t.borrow.errors.copyNotFound;
    }
    if (initialCopy && initialCopy.status !== "available") {
      return initialCopy.status === "damaged"
        ? t.borrow.errors.damaged
        : t.borrow.errors.borrowed;
    }
    return "";
  });
  const [success, setSuccess] = useState(false);
  const [inputMode, setInputMode] = useState<"qr" | "manual">(() => {
    // If there's initialCopyId, use manual mode; otherwise check localStorage
    if (initialCopyId) return "manual";
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("borrow-input-mode");
      if (saved === "qr" || saved === "manual") return saved;
    }
    return "qr";
  });
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [scanPaused, setScanPaused] = useState(false);
  const [scannerInitialized, setScannerInitialized] = useState(true);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Used to discard stale lookup results when a new one starts
  const lookupCounterRef = useRef(0);
  const devices = useDevices();

  // ── Derived ────────────────────────────────────────────────────────────────

  const alreadyCompletedBook = selectedCopy?.book
    ? completedBooks.find((b) => String(b.bookId).toLowerCase() === String(selectedCopy.book!.id).toLowerCase())
    : null;

  // ── Helpers ───────────────────────────────────────────────────────────────

  const resetLookup = () => {
    // Keep copyId so the user can edit it
    setSelectedCopy(null);
    setUnavailableCopy(null);
    setError("");
    setReturnDate("");
    setScanPaused(false);
    setInputMode("manual"); // Switch to manual so they can edit the ID

    const params = new URLSearchParams(searchParams.toString());
    params.delete("copyId");
    router.replace(pathname, { scroll: false });
  };

  // ── Copy lookup ────────────────────────────────────────────────────────────

  const performLookup = async (value: string): Promise<boolean> => {
    const upper = value.toUpperCase().trim();
    if (!upper) return false;

    setError("");
    setSelectedCopy(null);
    setUnavailableCopy(null);
    setReturnDate("");
    setIsLookingUp(true);

    // Update URL param
    const params = new URLSearchParams(searchParams.toString());
    params.set("copyId", upper);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });

    const thisLookup = ++lookupCounterRef.current;
    try {
      const { copy, error: lookupError } = await lookupCopy(upper);

      // Discard if a newer lookup has already started
      if (thisLookup !== lookupCounterRef.current) return false;

      setIsLookingUp(false);

      if (!copy) {
        setError(lookupError ?? t.borrow.errors.copyNotFound);
        return false;
      }

      if (copy.status !== "available") {
        setUnavailableCopy(copy);
        setError(
          copy.status === "damaged"
            ? t.borrow.errors.damaged
            : t.borrow.errors.borrowed,
        );
        return false;
      }

      if (activeBorrowCopyIds.includes(upper)) {
        setError(t.borrow.errors.alreadyBorrowed);
        return false;
      }

      setSelectedCopy(copy);
      const d = new Date();
      d.setDate(d.getDate() + 14);
      setReturnDate(d.toISOString().split("T")[0]);
      return true;
    } catch (err) {
      if (thisLookup === lookupCounterRef.current) {
        setIsLookingUp(false);
        setError(t.borrow.errors.generic);
      }
      return false;
    }
  };

  // ── Synchronization ────────────────────────────────────────────────────────

  // Sync state with props from server
  useEffect(() => {
    if (initialCopyId) {
      setCopyId(initialCopyId);
      setInputMode("manual");
    }
    if (initialCopy) {
      if (initialCopy.status === "available") {
        setSelectedCopy(initialCopy);
        setUnavailableCopy(null);
        setError("");
        const d = new Date();
        d.setDate(d.getDate() + 14);
        setReturnDate(d.toISOString().split("T")[0]);
      } else {
        setUnavailableCopy(initialCopy);
        setSelectedCopy(null);
        setError(
          initialCopy.status === "damaged"
            ? t.borrow.errors.damaged
            : t.borrow.errors.borrowed,
        );
      }
    } else if (initialCopyId) {
      // If we have an ID but no initialCopy was passed, try to fetch it
      if (!selectedCopy && !unavailableCopy && !error && !isLookingUp) {
        performLookup(initialCopyId);
      }
    }
  }, [initialCopyId, initialCopy]);

  const handleCopyIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().trim();
    setCopyId(val);
    // Clear results when typing
    if (selectedCopy || unavailableCopy || error) {
      setSelectedCopy(null);
      setUnavailableCopy(null);
      setError("");
    }
  };

  const handleManualCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) return;
    if (!copyId.trim()) {
      setError(t.borrow.errors.copyNotFound);
      return;
    }
    performLookup(copyId);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleScan = (detectedCodes: any[]) => {
    if (!isVerified) return;
    if (detectedCodes.length > 0 && !isLookingUp) {
      const scannedValue = detectedCodes[0].rawValue.trim();
      setCopyId(scannedValue.toUpperCase());
      performLookup(scannedValue).then((valid) => {
        if (valid) setScanPaused(true);
      });
    }
  };

  const requestCameraPermission = async () => {
    try {
      setCameraPermissionDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      stream.getTracks().forEach((track) => track.stop());
      setScannerInitialized(true);
    } catch {
      setCameraPermissionDenied(true);
    }
  };

  // ── Borrow submission ──────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified || !selectedCopy || !returnDate) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.set("copy_id", selectedCopy.id);
      fd.set("due_date", returnDate);
      const result = await borrowBook(fd);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  };

  // ── Success screen ─────────────────────────────────────────────────────────

  if (success && selectedCopy) {
    const returnDateObj = new Date(returnDate);
    const formattedDate = returnDateObj.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return (
      <>
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="borrow-surface tron-border rounded-lg p-8 text-center max-w-sm w-full">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#e8f1e7] border border-[#8faa8f]">
                <FaCheck className="w-8 h-8 text-[#4e4033]" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#221910] mb-2 ink-title">
              {t.borrow.success.title}
            </h2>
            <div className="bg-[#f6ecdd] border border-[#786a5c] rounded-lg p-4 mb-6">
              <p className="text-[#5c4f42] mb-3 ink-text">
                <span className="font-semibold text-[#221910] ink-title">
                  {selectedCopy.book?.title ?? "—"}
                </span>
              </p>
              <p className="text-sm text-[#5c4f42] mb-3 ink-text">
                {t.borrow.success.message.replace("{title}", "")}
              </p>
              <div className="space-y-2 text-sm ink-text">
                <p className="text-[#5c4f42]">
                  <span className="text-[#6f6256]">{t.borrow.form.copyId}:</span>{" "}
                  <span className="font-mono font-medium text-[#221910]">
                    {selectedCopy.id}
                  </span>
                </p>
                <p className="text-[#5c4f42]">
                  <span className="text-[#6f6256]">{t.borrow.form.returnDate}:</span>{" "}
                  <span className="font-medium text-[#221910]">
                    {formattedDate}
                  </span>
                </p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-2 bg-[#5a4d40] text-[#f6ede1] rounded-lg font-medium hover:bg-[#4c4035] transition-colors ink-text"
            >
              {t.history.backToDashboard}
            </Link>
          </div>
        </div>
      </>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mode selector */}
        <div className="flex gap-2 mb-6 borrow-surface tron-border rounded-lg p-1">
          <button
            onClick={() => {
              setInputMode("qr");
              localStorage.setItem("borrow-input-mode", "qr");
            }}
            className={`flex-1 px-4 py-2 rounded font-medium transition-colors ink-text ${inputMode === "qr"
              ? "bg-[#5a4d40] text-[#f6ede1]"
              : "text-[#4e4033] hover:bg-[#eadcca]"
              }`}
          >
            <FaQrcode className="inline w-4 h-4 mr-2" />
            {t.borrow.qrMode}
          </button>
          <button
            onClick={() => {
              setInputMode("manual");
              localStorage.setItem("borrow-input-mode", "manual");
            }}
            className={`flex-1 px-4 py-2 rounded font-medium transition-colors ink-text ${inputMode === "manual"
              ? "bg-[#5a4d40] text-[#f6ede1]"
              : "text-[#4e4033] hover:bg-[#eadcca]"
              }`}
          >
            <FaKeyboard className="inline w-4 h-4 mr-2" />
            {t.borrow.manualMode}
          </button>
        </div>

        {/* ── Not Verified Warning ────────────────────────────────────────────── */}
        {!isVerified && (
          <div className="borrow-surface tron-border rounded-lg p-4 border-2 border-[#b0665c] border-l-4 border-l-[#8d4f45] bg-[#f8e7e3] mb-5">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="w-5 h-5 text-[#8d4f45] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#7d2d23] ink-text">
                  {t.borrow.errors.notVerified}
                </p>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Scanner / input ────────────────────────────────────────────── */}
          <div className="borrow-surface tron-border rounded-lg p-6">
            {inputMode === "qr" ? (
              <div className="space-y-4">
                {/* Camera selector */}
                {!selectedCopy && (
                  <label className="block">
                    <p className="text-sm font-medium text-[#4e4033] mb-2 ink-text">
                      Select Camera
                    </p>
                    <select
                      value={deviceId ?? ""}
                      onChange={(e) => setDeviceId(e.target.value || undefined)}
                      className="w-full px-4 py-2 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] rounded-lg focus:ring-2 focus:ring-[#5a4d40] outline-none ink-text"
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
                )}

                {!scannerInitialized && !selectedCopy && (
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

                {/* Scanner */}
                {!selectedCopy && (
                  <div className="relative max-w-md mx-auto">
                    <div className="relative bg-[#1f1812] rounded-sm shadow-lg aspect-square overflow-clip">
                      <Scanner
                        formats={["qr_code"]}
                        constraints={{ deviceId }}
                        onScan={handleScan}
                        onError={(err) => {
                          const s = JSON.stringify(err).toLowerCase();
                          if (
                            s.includes("permission") ||
                            s.includes("notallowed")
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
                      <div className="absolute inset-0 pointer-events-none">
                        <div
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 w-full h-0.5 bg-red-500 opacity-75"
                          style={{ animation: "qrScannerMove 2s infinite" }}
                        />
                      </div>
                    </div>
                    {/* Corner brackets */}
                    {[
                      "-top-1 -left-1 w-6 h-1.5",
                      "-top-1 -left-1 w-1.5 h-6",
                      "-top-1 -right-1 w-6 h-1.5",
                      "-top-1 -right-1 w-1.5 h-6",
                      "-bottom-1 -left-1 w-6 h-1.5",
                      "-bottom-1 -left-1 w-1.5 h-6",
                      "-bottom-1 -right-1 w-6 h-1.5",
                      "-bottom-1 -right-1 w-1.5 h-6",
                    ].map((cls, i) => (
                      <div
                        key={i}
                        className={`absolute ${cls} bg-[#3d3024] pointer-events-none`}
                      />
                    ))}
                  </div>
                )}

                {!selectedCopy && (
                  <p className="text-xs text-[#5c4f42] text-center ink-text">
                    {isLookingUp
                      ? t.borrow.lookingUp
                      : t.borrow.scanPlaceholder}
                  </p>
                )}

                {!selectedCopy && (
                  <div className="space-y-2">
                    {scanPaused ? (
                      <button
                        type="button"
                        onClick={() => setScanPaused(false)}
                        className="w-full px-4 py-2 bg-[#5a4d40] text-[#f6ede1] rounded-lg font-medium hover:bg-[#4c4035] transition-colors ink-text"
                      >
                        Resume Scanning
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setScannerInitialized(false)}
                        className="w-full px-4 py-2 bg-[#7b6d5f] text-[#f6ede1] rounded-lg font-medium hover:bg-[#6a5d50] transition-colors ink-text"
                      >
                        Stop Scanner
                      </button>
                    )}
                  </div>
                )}

                {selectedCopy && (
                  <button
                    type="button"
                    onClick={resetLookup}
                    className="w-full px-4 py-3 border border-[#7b6d5f] text-[#4e4033] rounded-lg font-medium hover:bg-[#eadcca] transition-colors ink-text"
                  >
                    {t.borrow.success.borrowAnother}
                  </button>
                )}
              </div>
            ) : (
              /* Manual entry */
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block">
                    <p className="text-sm font-medium text-[#4e4033] mb-2 ink-text">
                      {t.borrow.form.copyId}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={copyId}
                        onChange={handleCopyIdChange}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleManualCheck(e as any);
                          }
                        }}
                        placeholder={t.borrow.inputPlaceholder}
                        maxLength={16}
                        className="flex-1 px-4 py-3 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] rounded-lg focus:ring-2 focus:ring-[#5a4d40] outline-none text-lg font-mono tracking-widest"
                        autoFocus
                        disabled={!isVerified}
                      />
                      <button
                        type="button"
                        onClick={handleManualCheck}
                        disabled={isLookingUp || !copyId.trim() || !isVerified}
                        className="px-6 py-3 bg-[#5a4d40] text-[#f6ede1] rounded-lg font-medium hover:bg-[#4c4035] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ink-text whitespace-nowrap"
                      >
                        {isLookingUp ? t.borrow.lookingUp : t.borrow.lookup}
                      </button>
                    </div>
                  </label>
                </div>
                {!selectedCopy && (
                  <p className="text-xs text-[#6f6256] ink-text">
                    {isLookingUp
                      ? t.borrow.lookingUp
                      : t.borrow.subtitle}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Book details (shown when a valid copy is resolved) ─────────── */}
          {selectedCopy && (
            <div className="space-y-4">
              <div className="borrow-surface tron-border rounded-lg p-6 border-2 border-[#8faa8f] border-l-4 border-l-[#5e7b60] shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <FaCheck className="w-5 h-5 text-[#4e4033]" />
                  <p className="text-sm font-semibold text-[#4e4033] ink-text">
                    {t.borrow.lookup}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-[#6f6256] uppercase tracking-wide mb-1 ink-text">
                      {t.borrow.form.bookTitle}
                    </p>
                    <p className="text-2xl font-bold text-[#221910] ink-title">
                      {selectedCopy.book?.title ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6f6256] uppercase tracking-wide mb-1 ink-text">
                      {t.bookList.table.author}
                    </p>
                    <p className="text-lg text-[#4e4033] ink-text">
                      {selectedCopy.book?.author ?? "—"}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div>
                      <p className="text-xs text-[#6f6256] uppercase tracking-wide mb-1 ink-text">
                        {t.bookList.table.copyNum}
                      </p>
                      <p className="font-medium text-[#221910] ink-text">
                        {selectedCopy.copy_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6f6256] uppercase tracking-wide mb-1 ink-text">
                        {t.bookList.table.pages}
                      </p>
                      <p className="font-medium text-[#221910] ink-text">
                        {selectedCopy.book?.pages ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6f6256] uppercase tracking-wide mb-1 ink-text">
                        {t.borrow.form.copyId}
                      </p>
                      <p className="font-mono text-sm font-bold text-[#221910]">
                        {selectedCopy.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Already completed warning */}
              {alreadyCompletedBook && (
                <div className="borrow-surface tron-border rounded-lg p-4 border-2 border-[#b49d6f] border-l-4 border-l-[#8a7348] bg-[#f4ecd8]">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="w-5 h-5 text-[#7a6338] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-[#6b5428] ink-text">
                        {t.borrow.form.alreadyRead
                          .replace("{date}", new Date(alreadyCompletedBook.completedOn).toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB"))
                          .replace("{copyId}", alreadyCompletedBook.copyId)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Return date */}
              <div className="borrow-surface tron-border rounded-lg p-6">
                <label className="block">
                  <p className="text-sm font-medium text-[#4e4033] mb-2 ink-text">
                    {t.borrow.form.returnDate}
                  </p>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] rounded-lg focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent outline-none ink-text"
                    required
                    disabled={!isVerified}
                  />
                </label>
                <p className="text-xs text-[#6f6256] mt-2 ink-text">
                  {t.borrow.form.returnDateDesc}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <button
                  type="submit"
                  disabled={!returnDate || isPending || !isVerified}
                  className="flex-1 px-4 py-3 bg-[#5a4d40] text-[#f6ede1] rounded-lg font-medium hover:bg-[#4c4035] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ink-text"
                >
                  {isPending ? t.borrow.form.submitting : t.borrow.form.submit}
                </button>
              </div>
            </div>
          )}

          {/* Unavailable copy info */}
          {unavailableCopy && (
            <div className="borrow-surface tron-border rounded-lg p-5 border-2 border-[#b0665c] border-l-4 border-l-[#8d4f45] bg-[#f8e7e3]">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="w-5 h-5 text-[#8d4f45] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#7d2d23] ink-text mb-1">
                    {unavailableCopy.status === "damaged"
                      ? t.borrow.errors.damaged
                      : activeBorrowCopyIds.includes(unavailableCopy.id)
                        ? t.borrow.errors.alreadyBorrowed
                        : t.borrow.errors.borrowed}
                  </p>
                  <p className="text-sm text-[#5b3a33] ink-text font-semibold">
                    {unavailableCopy.book?.title ?? "—"}
                  </p>
                  <p className="text-xs text-[#6c4d44] ink-text mt-1">
                    {t.bookList.table.copyNum} {unavailableCopy.copy_number} — {unavailableCopy.id}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error message — only show if there's no unavailableCopy */}
          {error && !unavailableCopy && (
            <div className="p-4 bg-[#f6e3df] border border-[#b0665c] rounded-lg">
              <p className="text-sm text-[#7d2d23] ink-text">{error}</p>
            </div>
          )}

          {/* Camera denied */}
          {cameraPermissionDenied && (
            <div className="p-4 bg-[#f4ecd8] border border-[#b49d6f] rounded-lg">
              <p className="text-sm text-[#6b5428] ink-text">
                <strong>{t.borrow.errors.cameraPermission.split(".")[0]}.</strong> {t.borrow.errors.cameraPermission.split(".")[1]}
              </p>
            </div>
          )}

          {/* Cancel button */}
          {!selectedCopy && (
            <div>
              <Link
                href="/dashboard/book-list"
                className="block w-full px-4 py-3 border border-[#7b6d5f] text-[#4e4033] rounded-lg font-medium hover:bg-[#eadcca] transition-colors text-center ink-text"
              >
                {t.bookList.empty.clearFilters.replace("Filters", "and Go Back")}
              </Link>
            </div>
          )}
        </form>
      </div>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
