"use client";

import UserNavbar from "@/app/components/UserNavbar";
import { Scanner, useDevices } from "@yudiel/react-qr-scanner";
import Link from "next/link";
import { useState } from "react";
import { FaCheck, FaKeyboard, FaQrcode } from "react-icons/fa";

export default function BorrowPage() {
  const [copyId, setCopyId] = useState("");
  const [selectedCopy, setSelectedCopy] = useState<{
    id: string;
    title: string;
    author: string;
    copyNumber: string;
  } | null>(null);
  const [returnDate, setReturnDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [inputMode, setInputMode] = useState<"qr" | "manual">("qr");
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [scanPaused, setScanPaused] = useState(false);
  const [scannerInitialized, setScannerInitialized] = useState(true);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

  const devices = useDevices();

  // Mock available copies
  const availableCopies: Record<
    string,
    { title: string; author: string; copyNumber: string }
  > = {
    QR001: {
      title: "ইসলামের সামাজিক বিধান",
      author: "আল্লামা জামাল আল বাদাবী",
      copyNumber: "Copy 1",
    },
    QR002: {
      title: "পর্দা ও ইসলাম",
      author: "সাইয়েদ আবুল আ’লা মওদূদী",
      copyNumber: "Copy 1",
    },
    QR003: {
      title: "আদাবে জিন্দেগী",
      author: "আল্লামা ইউসুফ ইসলাহী",
      copyNumber: "Copy 2",
    },
    QR004: {
      title: "ইসলামী ব্যাংকিং ও অর্থায়ন পদ্ধতি: সমস্যা ও সমাধান",
      author: "মুফতি তাকি উসমানি",
      copyNumber: "Copy 1",
    },
  };

  const processCopyId = (value: string) => {
    const upperValue = value.toUpperCase();
    setCopyId(upperValue);
    setError("");
    setSelectedCopy(null);
    setReturnDate(""); // Reset return date when changing book

    if (upperValue.length === 5) {
      const copy = availableCopies[upperValue];
      if (copy) {
        setSelectedCopy({ id: upperValue, ...copy });
        // Set default return date to 7 days from now
        const defaultReturn = new Date();
        defaultReturn.setDate(defaultReturn.getDate() + 7);
        setReturnDate(defaultReturn.toISOString().split("T")[0]);
        console.log("📚 Book Found:", {
          id: upperValue,
          title: copy.title,
          author: copy.author,
          copyNumber: copy.copyNumber,
        });
        return true; // Valid book found
      } else {
        console.log("❌ Invalid QR code (book not found):", upperValue);
        return false; // Invalid book
      }
    }
    return false; // Invalid format
  };

  const handleCopyIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processCopyId(e.target.value);
  };
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes.length > 0) {
      const scannedValue = detectedCodes[0].rawValue;
      console.log("✅ QR Code Scanned:", scannedValue);
      const isValid = processCopyId(scannedValue.trim());
      // Only pause if valid book found
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
      // Stop the stream once we have permission
      stream.getTracks().forEach((track) => track.stop());
      setScannerInitialized(true);
    } catch (error) {
      console.error("Camera permission error:", error);
      setCameraPermissionDenied(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCopy) {
      setError("Please select a book first");
      return;
    }

    if (!returnDate) {
      setError("Please set a return date");
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccess(true);
      setLoading(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      setError("Failed to process borrow request. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    const returnDateObj = new Date(returnDate);
    const formattedDate = returnDateObj.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return (
      <div className="min-h-screen bg-[#e5d9c4] borrow-paper flex flex-col">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Courier+Prime:wght@400;700&display=swap');

          .borrow-paper {
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

          .borrow-surface {
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
          <div className="borrow-surface tron-border rounded-lg p-8 text-center max-w-sm w-full">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#e8f1e7] border border-[#8faa8f]">
                <FaCheck className="w-8 h-8 text-[#4e4033]" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#221910] mb-2 ink-title">
              Borrow Successful!
            </h2>
            <div className="bg-[#f6ecdd] border border-[#786a5c] rounded-lg p-4 mb-6">
              <p className="text-[#5c4f42] mb-3 ink-text">
                <span className="font-semibold text-[#221910] ink-title">
                  {selectedCopy?.title}
                </span>
              </p>
              <div className="space-y-2 text-sm ink-text">
                <p className="text-[#5c4f42]">
                  <span className="text-[#6f6256]">Due:</span>{" "}
                  <span className="font-medium text-[#221910]">
                    {formattedDate}
                  </span>
                </p>
                <p className="text-[#5c4f42]">
                  <span className="text-[#6f6256]">Copy ID:</span>{" "}
                  <span className="font-mono font-medium text-[#221910]">
                    {selectedCopy?.id}
                  </span>
                </p>
              </div>
            </div>
            <Link
              href="/profile"
              className="inline-block px-6 py-2 bg-[#5a4d40] text-[#f6ede1] rounded-lg font-medium hover:bg-[#4c4035] transition-colors ink-text"
            >
              Go to Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e5d9c4] borrow-paper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Courier+Prime:wght@400;700&display=swap');

        .borrow-paper {
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

        .borrow-surface {
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
      {/* Header */}
      {/* <div className="borrow-surface border-b border-[#5a4a3b]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-[#221910] ink-title">
            Borrow a Book
          </h1>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mode Selector */}
        <div className="flex gap-2 mb-6 borrow-surface tron-border rounded-lg p-1">
          <button
            onClick={() => setInputMode("qr")}
            className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
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
            className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
              inputMode === "manual"
                ? "bg-[#5a4d40] text-[#f6ede1]"
                : "text-[#4e4033] hover:bg-[#eadcca]"
            } ink-text`}
          >
            <FaKeyboard className="inline w-4 h-4 mr-2" />
            Enter ID
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* When book is selected, show it prominently at top */}
          {selectedCopy && (
            <div className="space-y-4">
              <div className="borrow-surface tron-border rounded-lg p-6 border-2 border-[#8faa8f] border-l-4 border-l-[#5e7b60] shadow-lg">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <FaCheck className="w-5 h-5 text-[#4e4033]" />
                    <p className="text-sm font-semibold text-[#4e4033] ink-text">
                      Book Scanned Successfully
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6f6256] uppercase tracking-wide mb-1 ink-text">
                      Book Title
                    </p>
                    <p className="text-2xl font-bold text-[#221910] ink-title">
                      {selectedCopy.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6f6256] uppercase tracking-wide mb-1 ink-text">
                      Author
                    </p>
                    <p className="text-lg text-[#4e4033] ink-text">
                      {selectedCopy.author}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-xs text-[#6f6256] uppercase tracking-wide mb-1 ink-text">
                        Copy #
                      </p>
                      <p className="font-medium text-[#221910] ink-text">
                        {selectedCopy.copyNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6f6256] uppercase tracking-wide mb-1 ink-text">
                        ID
                      </p>
                      <p className="font-mono text-sm font-bold text-[#221910]">
                        {selectedCopy.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Date Input */}
              <div className="borrow-surface tron-border rounded-lg p-6">
                <label className="block">
                  <p className="text-sm font-medium text-[#4e4033] mb-2 ink-text">
                    Return Date
                  </p>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] rounded-lg focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent outline-none ink-text"
                    required
                  />
                </label>
                <p className="text-xs text-[#6f6256] mt-2 ink-text">
                  Select when you plan to return the book
                </p>
              </div>

              {/* Action Buttons for Book Card */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCopy(null);
                    setCopyId("");
                    setReturnDate("");
                    setScanPaused(false);
                  }}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 border border-[#7b6d5f] text-[#4e4033] rounded-lg font-medium hover:bg-[#eadcca] transition-colors ink-text text-sm sm:text-base"
                >
                  Scan Another
                </button>
                <button
                  type="submit"
                  disabled={!returnDate || loading}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-[#5a4d40] text-[#f6ede1] rounded-lg font-medium hover:bg-[#4c4035] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ink-text text-sm sm:text-base"
                >
                  {loading ? "Processing..." : "Confirm Borrow"}
                </button>
              </div>
            </div>
          )}

          {/* Scanner - only show when no book selected */}
          {!selectedCopy && (
            <div className="borrow-surface tron-border rounded-lg p-6">
              {inputMode === "qr" ? (
                <div className="space-y-4">
                  <div className="space-y-3 mb-4">
                    <label className="block">
                      <p className="text-sm font-medium text-[#4e4033] mb-2 ink-text">
                        Select Camera
                      </p>
                      <select
                        value={deviceId || ""}
                        onChange={(e) =>
                          setDeviceId(e.target.value || undefined)
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
                  </div>
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
                        onError={(error) => {
                          console.error("Scanner error:", error);
                          const errorStr = JSON.stringify(error).toLowerCase();
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
                      {/* Minimal Scanner Overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Moving scanning line - CENTER */}
                        <div
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 w-full h-0.5 bg-red-500 opacity-75"
                          style={{ animation: "qrScannerMove 2s infinite" }}
                        ></div>
                      </div>
                    </div>

                    {/* Corner brackets - outside frame */}
                    <div className="absolute -top-1 -left-1 w-6 h-1.5 bg-[#3d3024] pointer-events-none"></div>
                    <div className="absolute -top-1 -left-1 w-1.5 h-6 bg-[#3d3024] pointer-events-none"></div>

                    <div className="absolute -top-1 -right-1 w-6 h-1.5 bg-[#3d3024] pointer-events-none"></div>
                    <div className="absolute -top-1 -right-1 w-1.5 h-6 bg-[#3d3024] pointer-events-none"></div>

                    <div className="absolute -bottom-1 -left-1 w-6 h-1.5 bg-[#3d3024] pointer-events-none"></div>
                    <div className="absolute -bottom-1 -left-1 w-1.5 h-6 bg-[#3d3024] pointer-events-none"></div>

                    <div className="absolute -bottom-1 -right-1 w-6 h-1.5 bg-[#3d3024] pointer-events-none"></div>
                    <div className="absolute -bottom-1 -right-1 w-1.5 h-6 bg-[#3d3024] pointer-events-none"></div>
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
                  {!scanPaused && (
                    <button
                      type="button"
                      onClick={() => setScannerInitialized(false)}
                      className="w-full px-4 py-2 bg-[#7b6d5f] text-[#f6ede1] rounded-lg font-medium hover:bg-[#6a5d50] transition-colors ink-text"
                    >
                      Stop Scanner
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
                  <p className="text-xs text-[#6f6256] ink-text">
                    Valid IDs: QR001, QR002, QR003, QR004
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error or Success Messages */}
          {error && (
            <div className="p-4 bg-[#f6e3df] border border-[#b0665c] rounded-lg">
              <p className="text-sm text-[#7d2d23] ink-text">{error}</p>
            </div>
          )}

          {cameraPermissionDenied && (
            <div className="p-4 bg-[#f4ecd8] border border-[#b49d6f] rounded-lg">
              <p className="text-sm text-[#6b5428] ink-text">
                <strong>Camera permission denied.</strong> Please enable camera
                access in your browser settings and try again.
              </p>
            </div>
          )}

          {/* Action Buttons - Only for scanner/manual entry mode */}
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
