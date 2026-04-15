"use client";

import UserNavbar from "@/app/components/UserNavbar";
import { Scanner, useDevices } from "@yudiel/react-qr-scanner";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  FaCheck,
  FaExclamationTriangle,
  FaKeyboard,
  FaQrcode,
  FaUndoAlt,
} from "react-icons/fa";

interface BorrowedCopy {
  title: string;
  author: string;
  copyNumber: string;
  borrowedDate: string;
  dueDate: string;
}

const BORROWED_COPIES: Record<string, BorrowedCopy> = {
  QR001: {
    title: "ইসলামের সামাজিক বিধান",
    author: "আল্লামা জামাল আল বাদাবী",
    copyNumber: "Copy 1",
    borrowedDate: "2026-04-05",
    dueDate: "2026-04-12",
  },
  QR002: {
    title: "পর্দা ও ইসলাম",
    author: "সাইয়েদ আবুল আ'লা মওদূদী",
    copyNumber: "Copy 1",
    borrowedDate: "2026-04-02",
    dueDate: "2026-04-15",
  },
  QR003: {
    title: "আদাবে জিন্দেগী",
    author: "আল্লামা ইউসুফ ইসলাহী",
    copyNumber: "Copy 2",
    borrowedDate: "2026-03-28",
    dueDate: "2026-04-10",
  },
  QR004: {
    title: "ইসলামী অর্থনীতি",
    author: "সাইয়েদ আবুল আ'লা মওদূদী",
    copyNumber: "Copy 1",
    borrowedDate: "2026-04-09",
    dueDate: "2026-04-17",
  },
  QR005: {
    title: "ইসলামী অর্থনীতি",
    author: "সাইয়েদ আবুল আ'লা মওদূদী",
    copyNumber: "Copy 2",
    borrowedDate: "2026-04-10",
    dueDate: "2026-04-17",
  },
};

interface AllCopy {
  title: string;
  author: string;
  copyNumber: string;
  borrowedBy?: string;
  borrowedByName?: string;
  borrowedDate?: string;
  dueDate?: string;
}

// All copies in the library system (for validation)
const ALL_COPIES: Record<string, AllCopy> = {
  QR001: {
    title: "ইসলামের সামাজিক বিধান",
    author: "আল্লামা জামাল আল বাদাবী",
    copyNumber: "Copy 1",
    borrowedBy: "Member-101",
    borrowedByName: "You",
    borrowedDate: "2026-04-05",
    dueDate: "2026-04-12",
  },
  QR002: {
    title: "পর্দা ও ইসলাম",
    author: "সাইয়েদ আবুল আ'লা মওদূদী",
    copyNumber: "Copy 1",
    borrowedBy: "Member-101",
    borrowedByName: "You",
    borrowedDate: "2026-04-02",
    dueDate: "2026-04-15",
  },
  QR003: {
    title: "আদাবে জিন্দেগী",
    author: "আল্লামা ইউসুফ ইসলাহী",
    copyNumber: "Copy 2",
    borrowedBy: "Member-101",
    borrowedByName: "You",
    borrowedDate: "2026-03-28",
    dueDate: "2026-04-10",
  },
  QR004: {
    title: "ইসলামী অর্থনীতি",
    author: "সাইয়েদ আবুল আ'লা মওদূদী",
    copyNumber: "Copy 1",
    borrowedBy: "Member-101",
    borrowedByName: "You",
    borrowedDate: "2026-04-09",
    dueDate: "2026-04-17",
  },
  QR005: {
    title: "ইসলামী অর্থনীতি",
    author: "সাইয়েদ আবুল আ'লা মওদূদী",
    copyNumber: "Copy 2",
    borrowedBy: "Member-101",
    borrowedByName: "You",
    borrowedDate: "2026-04-10",
    dueDate: "2026-04-17",
  },
  QR006: {
    title: "সুন্নাহর আইনী মর্যাদা",
    author: "সাইয়েদ আবুল আ'লা মওদূদী",
    copyNumber: "Copy 1",
    borrowedBy: "Member-205",
    borrowedByName: "Ahmed Khan",
  },
  QR007: {
    title: "আল-কুরআনের সূরা সমূহের বিষয়বস্তু",
    author: "আবুল হাসান আলী নদভী",
    copyNumber: "Copy 1",
    borrowedBy: "Member-302",
    borrowedByName: "Fatima Akter",
  },
  QR008: {
    title: "তাফসীরে মা'আরিফুল কোরআন",
    author: "মুফতি মুহাম্মাদ শফী উসমানী",
    copyNumber: "Copy 1",
  },
};

function ReturnPageFallback() {
  return (
    <div className="min-h-screen bg-[#e5d9c4]">
      <UserNavbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-[#5c4f42]">Loading return page...</p>
      </div>
    </div>
  );
}

function ReturnPageContent() {
  const searchParams = useSearchParams();
  const [copyId, setCopyId] = useState("");
  const [selectedCopy, setSelectedCopy] = useState<
    ({ id: string } & BorrowedCopy) | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [inputMode, setInputMode] = useState<"qr" | "manual">("qr");
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [scanPaused, setScanPaused] = useState(false);
  const [scannerInitialized, setScannerInitialized] = useState(true);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [autofillHandled, setAutofillHandled] = useState(false);

  const devices = useDevices();

  useEffect(() => {
    if (autofillHandled) return;

    const queryCopyId = searchParams.get("copyId");
    if (!queryCopyId) {
      setAutofillHandled(true);
      return;
    }

    const normalized = queryCopyId.toUpperCase().trim();
    setCopyId(normalized);

    const copy = BORROWED_COPIES[normalized];
    if (copy) {
      setSelectedCopy({ id: normalized, ...copy });
      setInputMode("manual");
      setError("");
    } else {
      setError(
        "Auto-filled copy ID was not found. Please scan or enter manually.",
      );
    }

    setAutofillHandled(true);
  }, [autofillHandled, searchParams]);

  const overdueDays = useMemo(() => {
    if (!selectedCopy) return 0;
    const due = new Date(selectedCopy.dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  }, [selectedCopy]);

  const processCopyId = (value: string) => {
    const upperValue = value.toUpperCase().trim();
    setCopyId(upperValue);
    setError("");
    setSelectedCopy(null);

    if (upperValue.length === 5) {
      // First check if it exists in the system
      const systemCopy = ALL_COPIES[upperValue];

      if (!systemCopy) {
        setError("Copy not found in the library system.");
        return false;
      }

      // Then check if user has borrowed this copy
      const userCopy = BORROWED_COPIES[upperValue];
      if (userCopy) {
        setSelectedCopy({ id: upperValue, ...userCopy });
        return true;
      }

      // Copy exists but user hasn't borrowed it
      if (systemCopy.borrowedBy) {
        setError(
          `This copy is currently borrowed by ${systemCopy.borrowedByName} (${systemCopy.borrowedBy}). You cannot return a book you haven't borrowed.`,
        );
      } else {
        setError(
          "This copy hasn't been borrowed by anyone yet. You can only return books you've borrowed.",
        );
      }
      return false;
    }
    return false;
  };

  const handleCopyIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processCopyId(event.target.value);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes.length > 0) {
      const scannedValue = detectedCodes[0].rawValue;
      const isValid = processCopyId(scannedValue.trim());
      if (isValid) {
        setScanPaused(true);
      }
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
    } catch (scanError) {
      console.error("Camera permission error:", scanError);
      setCameraPermissionDenied(true);
    }
  };

  const handleReturn = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedCopy) {
      setError("Please scan or enter a valid copy ID.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccess(true);
    } catch {
      setError("Failed to process return. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#e5d9c4] return-paper flex flex-col">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Courier+Prime:wght@400;700&display=swap');

          .return-paper {
            background-image:
              linear-gradient(180deg, #eee4d3 0%, #e5d8c1 52%, #dcccb2 100%),
              linear-gradient(92deg, rgba(88, 66, 46, 0.05), transparent 24%),
              linear-gradient(268deg, rgba(88, 66, 46, 0.04), transparent 18%),
              repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px),
              repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px),
              url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="4" seed="8"/></filter><rect width="220" height="220" fill="%23e5d9c4"/><rect width="220" height="220" filter="url(%23p)" opacity="0.028"/></svg>');
          }

          .ink-text { font-family: 'Courier Prime', monospace; }
          .ink-title { font-family: 'Playfair Display', serif; }

          .return-surface {
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
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div
            className="return-surface tron-border rounded-lg p-7 text-center max-w-sm w-full"
            data-aos="zoom-in"
            data-aos-duration="200"
          >
            <div className="flex justify-center mb-5">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#e8f1e7] border border-[#8faa8f]">
                <FaCheck className="w-8 h-8 text-[#4e4033]" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#221910] mb-2 ink-title">
              Return Completed
            </h2>
            <div className="bg-[#f6ecdd] border border-[#786a5c] rounded-lg p-4 mb-6">
              <p className="text-[#5c4f42] mb-2 ink-text">
                {selectedCopy?.title}
              </p>
              <p className="text-sm text-[#5c4f42] ink-text">
                Copy ID:{" "}
                <span className="font-semibold text-[#221910]">
                  {selectedCopy?.id}
                </span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href="/history"
                className="flex-1 px-5 py-2 bg-[#f6ecdd] text-[#4e4033] border border-[#7b6d5f] rounded-lg font-medium hover:bg-[#eadcca] transition-colors ink-text"
              >
                View History
              </Link>
              <Link
                href="/profile"
                className="flex-1 px-5 py-2 bg-[#5a4d40] text-[#f6ede1] rounded-lg font-medium hover:bg-[#4c4035] transition-colors ink-text"
              >
                Back to Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e5d9c4] return-paper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Courier+Prime:wght@400;700&display=swap');

        .return-paper {
          background-image:
            linear-gradient(180deg, #eee4d3 0%, #e5d8c1 52%, #dcccb2 100%),
            linear-gradient(92deg, rgba(88, 66, 46, 0.05), transparent 24%),
            linear-gradient(268deg, rgba(88, 66, 46, 0.04), transparent 18%),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px),
            url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="4" seed="8"/></filter><rect width="220" height="220" fill="%23e5d9c4"/><rect width="220" height="220" filter="url(%23p)" opacity="0.028"/></svg>');
        }

        .ink-text { font-family: 'Courier Prime', monospace; }
        .ink-title { font-family: 'Playfair Display', serif; }

        .return-surface {
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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-5">
          <h1 className="text-2xl sm:text-3xl text-[#221910] ink-title font-bold">
            Return a Book
          </h1>
          <p className="text-[#5c4f42] text-sm mt-1 ink-text">
            Scan or enter copy ID, confirm condition, and complete return.
          </p>
        </div>

        <div
          className="flex gap-2 mb-6 return-surface tron-border rounded-lg p-1"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <button
            onClick={() => setInputMode("qr")}
            className={`flex-1 px-3 sm:px-4 py-2 rounded font-medium transition-colors text-sm sm:text-base ${
              inputMode === "qr"
                ? "bg-[#5a4d40] text-[#f6ede1]"
                : "text-[#4e4033] hover:bg-[#eadcca]"
            } ink-text`}
          >
            <FaQrcode className="inline w-4 h-4 mr-2" />
            Scan QR
          </button>
          <button
            onClick={() => setInputMode("manual")}
            className={`flex-1 px-3 sm:px-4 py-2 rounded font-medium transition-colors text-sm sm:text-base ${
              inputMode === "manual"
                ? "bg-[#5a4d40] text-[#f6ede1]"
                : "text-[#4e4033] hover:bg-[#eadcca]"
            } ink-text`}
          >
            <FaKeyboard className="inline w-4 h-4 mr-2" />
            Enter ID
          </button>
        </div>

        <form onSubmit={handleReturn} className="space-y-5">
          {!selectedCopy && (
            <div
              className="return-surface tron-border rounded-lg p-6"
              data-aos="fade-up"
              data-aos-duration="800"
            >
              {inputMode === "qr" ? (
                <div className="space-y-4">
                  <label className="block">
                    <p className="text-sm font-medium text-[#4e4033] mb-2 ink-text">
                      Select Camera
                    </p>
                    <select
                      value={deviceId || ""}
                      onChange={(event) =>
                        setDeviceId(event.target.value || undefined)
                      }
                      className="w-full px-4 py-2 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] rounded-lg focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent outline-none ink-text"
                      disabled={scannerInitialized}
                    >
                      <option value="">Default Camera</option>
                      {devices.map((device, index) => (
                        <option key={index} value={device.deviceId}>
                          {device.label || `Camera ${index + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>

                  {!scannerInitialized ? (
                    <button
                      type="button"
                      onClick={requestCameraPermission}
                      className="w-full px-4 py-3 bg-[#5a4d40] text-[#f6ede1] rounded-lg font-medium hover:bg-[#4c4035] transition-colors ink-text"
                    >
                      {cameraPermissionDenied
                        ? "Camera Permission Denied - Try Again"
                        : "Start QR Scanner"}
                    </button>
                  ) : null}

                  <div className="relative max-w-md mx-auto">
                    <div className="relative bg-[#1f1812] rounded-sm shadow-lg aspect-square overflow-clip">
                      <Scanner
                        formats={["qr_code"]}
                        constraints={{
                          deviceId: deviceId,
                        }}
                        onScan={handleScan}
                        onError={(scanError) => {
                          console.error("Scanner error:", scanError);
                          const errorStr =
                            JSON.stringify(scanError).toLowerCase();
                          if (
                            errorStr.includes("permission") ||
                            errorStr.includes("notallowed")
                          ) {
                            setCameraPermissionDenied(true);
                            setScannerInitialized(false);
                          }
                        }}
                        styles={{
                          container: {
                            width: "100%",
                            aspectRatio: "1",
                          },
                          video: {
                            objectFit: "cover",
                          },
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
                        ></div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#5c4f42] text-center ink-text">
                    Position QR code within the frame
                  </p>

                  {scanPaused && (
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
                <div className="space-y-4">
                  <label className="block">
                    <p className="text-sm font-medium text-[#4e4033] mb-2 ink-text">
                      Copy ID
                    </p>
                    <input
                      type="text"
                      value={copyId}
                      onChange={handleCopyIdChange}
                      placeholder="e.g., QR001"
                      maxLength={5}
                      className="w-full px-4 py-3 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] rounded-lg focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent outline-none text-lg font-mono tracking-widest"
                      autoFocus
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {selectedCopy && (
            <div
              className="space-y-4"
              data-aos="fade-up"
              data-aos-duration="800"
            >
              <div className="return-surface tron-border rounded-lg p-6 border-2 border-[#8faa8f] border-l-4 border-l-[#5e7b60] shadow-lg">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <FaUndoAlt className="w-5 h-5 text-[#4e4033]" />
                    <p className="text-sm font-semibold text-[#4e4033] ink-text">
                      Borrowed Copy Found
                    </p>
                  </div>

                  <p className="text-2xl font-bold text-[#221910] ink-title">
                    {selectedCopy.title}
                  </p>
                  <p className="text-[#4e4033] ink-text">
                    {selectedCopy.author}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-sm ink-text">
                    <p className="text-[#5c4f42]">
                      Copy:{" "}
                      <span className="font-semibold text-[#221910]">
                        {selectedCopy.copyNumber}
                      </span>
                    </p>
                    <p className="text-[#5c4f42]">
                      ID:{" "}
                      <span className="font-semibold text-[#221910]">
                        {selectedCopy.id}
                      </span>
                    </p>
                    <p className="text-[#5c4f42]">
                      Borrowed:{" "}
                      <span className="font-semibold text-[#221910]">
                        {new Date(
                          selectedCopy.borrowedDate,
                        ).toLocaleDateString()}
                      </span>
                    </p>
                    <p className="text-[#5c4f42]">
                      Due:{" "}
                      <span className="font-semibold text-[#221910]">
                        {new Date(selectedCopy.dueDate).toLocaleDateString()}
                      </span>
                    </p>
                  </div>

                  {overdueDays > 0 && (
                    <div className="flex items-center gap-2 text-[#7a4c37] text-sm bg-[#f7e6df] border border-[#b0665c] rounded p-2.5 ink-text">
                      <FaExclamationTriangle className="w-4 h-4" />
                      Overdue by {overdueDays} day{overdueDays > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCopy(null);
                    setCopyId("");
                    setScanPaused(false);
                  }}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 border border-[#7b6d5f] text-[#4e4033] rounded-lg font-medium hover:bg-[#eadcca] transition-colors ink-text text-sm sm:text-base"
                >
                  Scan Another
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-[#5a4d40] text-[#f6ede1] rounded-lg font-medium hover:bg-[#4c4035] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ink-text text-sm sm:text-base"
                >
                  {loading ? "Processing..." : "Confirm Return"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-[#f6e3df] border border-[#b0665c] rounded-lg">
              <p className="text-sm text-[#7d2d23] ink-text">{error}</p>
            </div>
          )}

          {cameraPermissionDenied && (
            <div className="p-4 bg-[#f4ecd8] border border-[#b49d6f] rounded-lg">
              <p className="text-sm text-[#6b5428] ink-text">
                <strong>Camera permission denied.</strong> Please enable camera
                access in browser settings and try again.
              </p>
            </div>
          )}

          {!selectedCopy && (
            <div className="flex gap-3">
              <Link
                href="/profile"
                className="flex-1 px-4 py-3 border border-[#7b6d5f] text-[#4e4033] rounded-lg font-medium hover:bg-[#eadcca] transition-colors text-center ink-text"
              >
                Cancel
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function ReturnPage() {
  return (
    <Suspense fallback={<ReturnPageFallback />}>
      <ReturnPageContent />
    </Suspense>
  );
}
