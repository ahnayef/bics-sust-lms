"use client";

import { Scanner, useDevices } from "@yudiel/react-qr-scanner";
import Link from "next/link";
import { useState } from "react";
import { FaArrowLeft, FaCheck, FaKeyboard, FaQrcode } from "react-icons/fa";

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

  const devices = useDevices();

  // Mock available copies
  const availableCopies: Record<
    string,
    { title: string; author: string; copyNumber: string }
  > = {
    QR001: {
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      copyNumber: "Copy 1",
    },
    QR002: {
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      copyNumber: "Copy 1",
    },
    QR003: {
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      copyNumber: "Copy 2",
    },
    QR004: { title: "1984", author: "George Orwell", copyNumber: "Copy 1" },
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

  const initializeScanner = () => {
    setScannerInitialized(true);
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
    } catch (err) {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg p-8 text-center max-w-sm w-full">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-50">
              <FaCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Borrow Successful!
          </h2>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-600 mb-3">
              <span className="font-semibold text-gray-900">
                {selectedCopy?.title}
              </span>
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">
                <span className="text-gray-500">Due:</span>{" "}
                <span className="font-medium text-gray-900">
                  {formattedDate}
                </span>
              </p>
              <p className="text-gray-600">
                <span className="text-gray-500">Copy ID:</span>{" "}
                <span className="font-mono font-medium text-gray-900">
                  {selectedCopy?.id}
                </span>
              </p>
            </div>
          </div>
          <Link
            href="/profile"
            className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Go to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Borrow a Book</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mode Selector */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg p-1 border border-gray-200">
          <button
            onClick={() => setInputMode("qr")}
            className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
              inputMode === "qr"
                ? "bg-gray-900 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FaQrcode className="inline w-4 h-4 mr-2" />
            Scan QR
          </button>
          <button
            onClick={() => setInputMode("manual")}
            className={`flex-1 px-4 py-2 rounded font-medium transition-colors ${
              inputMode === "manual"
                ? "bg-gray-900 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FaKeyboard className="inline w-4 h-4 mr-2" />
            Enter ID
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input Area */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            {inputMode === "qr" ? (
              <div className="space-y-4">
                <div className="space-y-3 mb-4">
                  <label className="block">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Select Camera
                    </p>
                    <select
                      value={deviceId || ""}
                      onChange={(e) => setDeviceId(e.target.value || undefined)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
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
                    onClick={initializeScanner}
                    className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    Start QR Scanner
                  </button>
                ) : null}
                <div className="relative max-w-md mx-auto">
                  <div className="relative bg-black rounded-sm shadow-lg aspect-square overflow-clip">
                    <Scanner
                      formats={["qr_code"]}
                      constraints={{
                        deviceId: deviceId,
                      }}
                      onScan={handleScan}
                      onError={(error) => {
                        console.error("Scanner error:", error);
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
                      {/* Blinking scanning line - CENTER */}
                      <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-red-500 opacity-75"
                        style={{ animation: "qrScannerBlink 1.2s infinite" }}
                      ></div>
                    </div>
                  </div>

                  {/* Corner brackets - outside frame */}
                  <div className="absolute -top-1 -left-1 w-6 h-1.5 bg-black pointer-events-none"></div>
                  <div className="absolute -top-1 -left-1 w-1.5 h-6 bg-black pointer-events-none"></div>

                  <div className="absolute -top-1 -right-1 w-6 h-1.5 bg-black pointer-events-none"></div>
                  <div className="absolute -top-1 -right-1 w-1.5 h-6 bg-black pointer-events-none"></div>

                  <div className="absolute -bottom-1 -left-1 w-6 h-1.5 bg-black pointer-events-none"></div>
                  <div className="absolute -bottom-1 -left-1 w-1.5 h-6 bg-black pointer-events-none"></div>

                  <div className="absolute -bottom-1 -right-1 w-6 h-1.5 bg-black pointer-events-none"></div>
                  <div className="absolute -bottom-1 -right-1 w-1.5 h-6 bg-black pointer-events-none"></div>
                </div>

                <p className="text-xs text-gray-600 text-center">
                  Position QR code within the frame
                </p>

                {scanPaused && (
                  <button
                    type="button"
                    onClick={() => setScanPaused(false)}
                    className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    Resume Scanning
                  </button>
                )}
                {!scanPaused && (
                  <button
                    type="button"
                    onClick={() => setScannerInitialized(false)}
                    className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                  >
                    Stop Scanner
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Copy ID
                  </p>
                  <input
                    type="text"
                    value={copyId}
                    onChange={handleCopyIdChange}
                    placeholder="e.g., QR001"
                    maxLength={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-lg font-mono tracking-widest"
                    autoFocus
                  />
                </label>
                <p className="text-xs text-gray-500">
                  Valid IDs: QR001, QR002, QR003, QR004
                </p>
              </div>
            )}
          </div>

          {/* Error or Success Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Book Card */}
          {selectedCopy && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-6 border-2 border-green-200 border-l-4 border-l-green-600">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Book Title
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedCopy.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Author
                    </p>
                    <p className="text-gray-700">{selectedCopy.author}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Copy #
                      </p>
                      <p className="font-medium text-gray-900">
                        {selectedCopy.copyNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        ID
                      </p>
                      <p className="font-mono text-sm font-bold text-gray-900">
                        {selectedCopy.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Date Input */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <label className="block">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Return Date
                  </p>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                    required
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Select when you plan to return the book
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 sticky bottom-0 bg-gradient-to-t from-gray-50 pt-4">
            <Link
              href="/profile"
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!selectedCopy || !returnDate || loading}
              className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Processing..." : "Confirm Borrow"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
