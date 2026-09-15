"use client";

import { updateUserProfileByStaff } from "@/server/profiles";
import {
  directBorrowByStaff,
  directMarkBookReadByStaff,
  directReturnByStaff,
} from "@/server/transaction-actions";
import type { Book, Transaction } from "@/types/library";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  FaBook,
  FaBookOpen,
  FaCalendarAlt,
  FaCheck,
  FaCheckCircle,
  FaEdit,
  FaExclamationTriangle,
  FaPlus,
  FaSearch,
  FaTimes,
  FaUndoAlt,
} from "react-icons/fa";

interface Props {
  userId: string;
  userName: string;
  userPhone?: string | null;
  userThanaId?: string | null;
  thanas?: { id: string; name: string }[];
  books: Book[];
  currentBorrows: Transaction[];
  language?: string;
}

export default function UserOperations({
  userId,
  userName,
  userPhone,
  userThanaId,
  thanas = [],
  books,
  currentBorrows,
  language = "en",
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showMarkReadModal, setShowMarkReadModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);

  // Edit Profile fields
  const [editFullName, setEditFullName] = useState(userName);
  const [editPhone, setEditPhone] = useState(userPhone ?? "");
  const [editThanaId, setEditThanaId] = useState<string | null>(
    userThanaId ?? null,
  );

  // Feedback state
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFlash = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // ── Borrow Modal State ──────────────────────────────────────────────────
  const [borrowSearch, setBorrowSearch] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedCopyId, setSelectedCopyId] = useState<string | null>(null);
  const [borrowDueDate, setBorrowDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });

  // Filter books that have at least one available copy
  const availableBooks = useMemo(() => {
    return books
      .map((b) => {
        const availableCopies = (b.copies || []).filter(
          (c) => c.status === "available",
        );
        return {
          ...b,
          availableCopies,
        };
      })
      .filter((b) => {
        if (!borrowSearch.trim()) return b.availableCopies.length > 0;
        const q = borrowSearch.toLowerCase();
        const matchesQuery =
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.availableCopies.some((c) => c.id.toLowerCase().includes(q));
        return matchesQuery && b.availableCopies.length > 0;
      });
  }, [books, borrowSearch]);

  const selectedBook = useMemo(() => {
    return books.find((b) => b.id === selectedBookId) || null;
  }, [books, selectedBookId]);

  const bookAvailableCopies = useMemo(() => {
    if (!selectedBook) return [];
    return (selectedBook.copies || []).filter((c) => c.status === "available");
  }, [selectedBook]);

  // ── Mark as Read Modal State ───────────────────────────────────────────
  const [readSearch, setReadSearch] = useState("");
  const [selectedReadBookId, setSelectedReadBookId] = useState<string | null>(
    null,
  );
  const [readDate, setReadDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [readNote, setReadNote] = useState("");

  const searchableBooks = useMemo(() => {
    if (!readSearch.trim()) return books.slice(0, 20);
    const q = readSearch.toLowerCase();
    return books
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [books, readSearch]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleConfirmBorrow = () => {
    if (!selectedCopyId) {
      showFlash(
        "error",
        language === "bn" ? "একটি কপি নির্বাচন করুন" : "Please select a copy",
      );
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("user_id", userId);
      fd.set("copy_id", selectedCopyId);
      fd.set("due_date", borrowDueDate);

      const res = await directBorrowByStaff(fd);
      if (res.error) {
        showFlash("error", res.error);
      } else {
        showFlash(
          "success",
          language === "bn"
            ? "বইটি সফলভাবে বরাদ্দ করা হয়েছে!"
            : `Book successfully assigned to ${userName}!`,
        );
        setShowBorrowModal(false);
        setSelectedBookId(null);
        setSelectedCopyId(null);
        setBorrowSearch("");
        router.refresh();
      }
    });
  };

  const handleConfirmMarkRead = () => {
    if (!selectedReadBookId) {
      showFlash(
        "error",
        language === "bn" ? "একটি বই নির্বাচন করুন" : "Please select a book",
      );
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("user_id", userId);
      fd.set("book_id", selectedReadBookId);
      fd.set("read_date", readDate);
      if (readNote.trim()) fd.set("note", readNote.trim());

      const res = await directMarkBookReadByStaff(fd);
      if (res.error) {
        showFlash("error", res.error);
      } else {
        showFlash(
          "success",
          language === "bn"
            ? "বইটি পড়া সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে!"
            : `Book marked as completed for ${userName}!`,
        );
        setShowMarkReadModal(false);
        setSelectedReadBookId(null);
        setReadSearch("");
        setReadNote("");
        router.refresh();
      }
    });
  };

  const handleReturnBorrow = (txId: string, title: string) => {
    setReturningId(txId);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("transaction_id", txId);

      const res = await directReturnByStaff(fd);
      setReturningId(null);
      if (res.error) {
        showFlash("error", res.error);
      } else {
        showFlash(
          "success",
          language === "bn"
            ? `"${title}" সফলভাবে ফেরত গ্রহণ করা হয়েছে!`
            : `"${title}" marked as returned!`,
        );
        router.refresh();
      }
    });
  };

  const handleConfirmEditProfile = () => {
    if (!editFullName.trim()) {
      showFlash(
        "error",
        language === "bn" ? "পুরো নাম আবশ্যক" : "Full name is required",
      );
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("user_id", userId);
      fd.set("full_name", editFullName.trim());
      fd.set("phone", editPhone.trim());
      if (editThanaId) fd.set("thana_id", editThanaId);

      const res = await updateUserProfileByStaff(fd);
      if (res?.error) {
        showFlash("error", res.error);
      } else {
        showFlash(
          "success",
          language === "bn"
            ? "সদস্যের তথ্য সফলভাবে আপডেট হয়েছে!"
            : "Member details updated successfully!",
        );
        setShowEditProfileModal(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg border text-sm font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === "success"
              ? "bg-[#eef5e9] text-[#2d521f] border-[#a1c48f]"
              : "bg-[#fdf0ec] text-[#8b2c1a] border-[#d0604a]"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <FaCheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <FaExclamationTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-75 cursor-pointer"
          >
            <FaTimes className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Staff Action Buttons Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 w-full">
        <button
          type="button"
          onClick={() => setShowBorrowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-3 sm:px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-[#3f3328] text-[#f4e8d4] hover:bg-[#282019] transition-all shadow-xs cursor-pointer border border-[#282019] text-center"
        >
          <FaPlus className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {language === "bn" ? "বই বরাদ্দ (Borrow)" : "Assign Book"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShowMarkReadModal(true)}
          className="inline-flex items-center justify-center gap-2 px-3 sm:px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-[#2d521f] text-[#f4e8d4] hover:bg-[#203a16] transition-all shadow-xs cursor-pointer border border-[#203a16] text-center"
        >
          <FaCheck className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {language === "bn" ? "পড়া সম্পন্ন (Mark Read)" : "Mark as Read"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setEditFullName(userName);
            setEditPhone(userPhone ?? "");
            setEditThanaId(userThanaId ?? null);
            setShowEditProfileModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-3 sm:px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-[#7b6957] text-[#f4e8d4] hover:bg-[#625242] transition-all shadow-xs cursor-pointer border border-[#625242] text-center"
        >
          <FaEdit className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {language === "bn" ? "তথ্য সম্পাদন (Edit)" : "Edit Member Info"}
          </span>
        </button>
      </div>

      {/* ── Active Borrows Quick Action Render (if current borrows exist) ── */}
      {currentBorrows.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6a5a4c]">
            {language === "bn"
              ? "চলতি বই ফেরত গ্রহণের অ্যাকশন"
              : "Quick Return Actions for Active Borrows"}
          </p>
          <div className="space-y-2">
            {currentBorrows.map((tx) => {
              const working = returningId === tx.id && isPending;
              return (
                <div
                  key={tx.id}
                  className="flex flex-col xs:flex-row xs:items-center justify-between p-2.5 bg-[#f6ecdd] border border-[#b9a58b] rounded-lg text-xs gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#2b2119] truncate">
                      {tx.book?.title}
                    </p>
                    <p className="text-[11px] text-[#6a5a4c]">
                      Copy #{tx.copy?.copy_number} &middot;{" "}
                      <span className="font-mono">{tx.copy?.id}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={working}
                    onClick={() =>
                      handleReturnBorrow(tx.id, tx.book?.title || "Book")
                    }
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs bg-[#8b2c1a] text-[#fdf0ec] hover:bg-[#6e2214] transition-colors shadow-2xs disabled:opacity-50 cursor-pointer shrink-0 w-full xs:w-auto"
                  >
                    <FaUndoAlt className="w-2.5 h-2.5 shrink-0" />
                    <span>
                      {working
                        ? language === "bn"
                          ? "ফেরত হচ্ছে..."
                          : "Returning..."
                        : language === "bn"
                          ? "ফেরত নিন"
                          : "Mark Returned"}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          1. DIRECT BORROW / ASSIGN BOOK MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showBorrowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#f6ecdd] border border-[#8a7966] rounded-xl max-w-lg w-full max-h-[85vh] sm:max-h-[80vh] flex flex-col shadow-2xl ink-text">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 border-b border-[#cfbba1] flex items-center justify-between bg-[#eadcc8]">
              <div className="flex items-center gap-2">
                <FaBook className="w-4 h-4 text-[#5c4a3b] shrink-0" />
                <h3 className="font-bold text-sm sm:text-base text-[#221910] ink-title truncate">
                  {language === "bn"
                    ? `${userName}-কে বই বরাদ্দ করুন`
                    : `Assign Book to ${userName}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowBorrowModal(false);
                  setSelectedBookId(null);
                  setSelectedCopyId(null);
                }}
                className="p-1 rounded-md text-[#7a6755] hover:text-[#221910] cursor-pointer transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3.5 sm:p-4 overflow-y-auto space-y-4 flex-1">
              {/* Step 1: Select Book */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6a5a4c] block">
                  {language === "bn" ? "১. বই নির্বাচন করুন" : "1. Select Book"}
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7966] w-3 h-3" />
                  <input
                    type="text"
                    placeholder={
                      language === "bn"
                        ? "বইয়ের নাম বা লেখক খুঁজুন..."
                        : "Search available books by title or author..."
                    }
                    value={borrowSearch}
                    onChange={(e) => setBorrowSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-[#8a7966] bg-[#fffaf2] text-[#2f251d] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none"
                  />
                </div>

                {/* Available Books List */}
                <div className="max-h-44 overflow-y-auto border border-[#d2bfa5] rounded-lg divide-y divide-[#e4d4bf] bg-[#fffaf2]">
                  {availableBooks.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#7a6a5c] italic">
                      {language === "bn"
                        ? "কোনো বরাদ্দযোগ্য বই পাওয়া যায়নি"
                        : "No available books with ready copies found"}
                    </div>
                  ) : (
                    availableBooks.map((book) => {
                      const isSelected = selectedBookId === book.id;
                      return (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => {
                            setSelectedBookId(book.id);
                            // Auto-select first available copy
                            if (book.availableCopies.length > 0) {
                              setSelectedCopyId(book.availableCopies[0].id);
                            } else {
                              setSelectedCopyId(null);
                            }
                          }}
                          className={`w-full text-left p-2.5 text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? "bg-[#3f3328] text-[#f4e8d4] font-bold"
                              : "hover:bg-[#f2e5d3] text-[#2b2119]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-xs sm:text-sm">
                              {book.title}
                            </p>
                            <p
                              className={`truncate text-[11px] ${
                                isSelected ? "text-[#d2bfa5]" : "text-[#7a6a5c]"
                              }`}
                            >
                              {book.author}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              isSelected
                                ? "bg-[#5a4d40] text-[#fdf6ec]"
                                : "bg-[#e5d6c2] text-[#4a3e33]"
                            }`}
                          >
                            {book.availableCopies.length}{" "}
                            {language === "bn" ? "কপি" : "available"}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Step 2: Select Specific Copy */}
              {selectedBook && (
                <div className="space-y-1.5 pt-2 border-t border-[#d2bfa5]">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#6a5a4c] block">
                    {language === "bn"
                      ? "২. নির্দিষ্ট কপি নির্বাচন করুন"
                      : "2. Select Copy"}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {bookAvailableCopies.map((c) => {
                      const isCopySelected = selectedCopyId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCopyId(c.id)}
                          className={`p-2 rounded-lg border text-xs font-medium text-center transition-all cursor-pointer ${
                            isCopySelected
                              ? "bg-[#3f3328] text-[#f4e8d4] border-[#3f3328] shadow-xs font-bold"
                              : "bg-[#fffaf2] text-[#4e4033] border-[#b9a58b] hover:bg-[#ede0cc]"
                          }`}
                        >
                          <div>Copy #{c.copy_number}</div>
                          <div className="font-mono text-[10px] opacity-75">
                            {c.id}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Due Date */}
              <div className="space-y-1.5 pt-2 border-t border-[#d2bfa5]">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6a5a4c] flex items-center gap-1.5">
                  <FaCalendarAlt className="w-3 h-3 text-[#7a6a5c]" />
                  <span>
                    {language === "bn"
                      ? "৩. ফেরত দেওয়ার তারিখ (Due Date)"
                      : "3. Due Date"}
                  </span>
                </label>
                <input
                  type="date"
                  value={borrowDueDate}
                  onChange={(e) => setBorrowDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#8a7966] bg-[#fffaf2] text-[#2f251d] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-[#cfbba1] grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 sm:gap-2.5 bg-[#eadcc8]">
              <button
                type="button"
                onClick={() => setShowBorrowModal(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-[#8a7966] bg-[#f6ecdd] text-[#4e4033] hover:bg-[#ece0ce] transition-colors cursor-pointer text-center"
              >
                {language === "bn" ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={!selectedCopyId || isPending}
                onClick={handleConfirmBorrow}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs sm:text-sm font-bold bg-[#3f3328] text-[#f4e8d4] hover:bg-[#282019] transition-all shadow-xs disabled:opacity-50 cursor-pointer text-center"
              >
                {isPending
                  ? language === "bn"
                    ? "বরাদ্দ হচ্ছে..."
                    : "Assigning..."
                  : language === "bn"
                    ? "বরাদ্দ নিশ্চিত করুন"
                    : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          2. MARK BOOK AS READ / COMPLETED MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showMarkReadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#f6ecdd] border border-[#8a7966] rounded-xl max-w-lg w-full max-h-[85vh] sm:max-h-[80vh] flex flex-col shadow-2xl ink-text">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 border-b border-[#cfbba1] flex items-center justify-between bg-[#eadcc8]">
              <div className="flex items-center gap-2">
                <FaBookOpen className="w-4 h-4 text-[#2d521f] shrink-0" />
                <h3 className="font-bold text-sm sm:text-base text-[#221910] ink-title truncate">
                  {language === "bn"
                    ? `${userName}-এর পড়া বই সম্পন্ন করুন`
                    : `Mark Book Read for ${userName}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowMarkReadModal(false);
                  setSelectedReadBookId(null);
                }}
                className="p-1 rounded-md text-[#7a6755] hover:text-[#221910] cursor-pointer transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3.5 sm:p-4 overflow-y-auto space-y-4 flex-1">
              {/* Step 1: Search and Select Book */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6a5a4c] block">
                  {language === "bn" ? "১. বই নির্বাচন করুন" : "1. Select Book"}
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7966] w-3 h-3" />
                  <input
                    type="text"
                    placeholder={
                      language === "bn"
                        ? "বইয়ের নাম বা লেখক খুঁজুন..."
                        : "Search books from library..."
                    }
                    value={readSearch}
                    onChange={(e) => setReadSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-[#8a7966] bg-[#fffaf2] text-[#2f251d] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border border-[#d2bfa5] rounded-lg divide-y divide-[#e4d4bf] bg-[#fffaf2]">
                  {searchableBooks.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#7a6a5c] italic">
                      {language === "bn"
                        ? "কোনো বই পাওয়া যায়নি"
                        : "No books found"}
                    </div>
                  ) : (
                    searchableBooks.map((book) => {
                      const isSelected = selectedReadBookId === book.id;
                      return (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => setSelectedReadBookId(book.id)}
                          className={`w-full text-left p-2.5 text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? "bg-[#2d521f] text-[#f4e8d4] font-bold"
                              : "hover:bg-[#f2e5d3] text-[#2b2119]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-xs sm:text-sm">
                              {book.title}
                            </p>
                            <p
                              className={`truncate text-[11px] ${
                                isSelected ? "text-[#c2e0b5]" : "text-[#7a6a5c]"
                              }`}
                            >
                              {book.author}
                            </p>
                          </div>
                          {book.is_syllabus && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                                isSelected
                                  ? "bg-[#203a16] text-[#c2e0b5]"
                                  : "bg-[#e5d6c2] text-[#4a3e33]"
                              }`}
                            >
                              {language === "bn" ? "সিলেবাস" : "Syllabus"}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Step 2: Completion Date */}
              <div className="space-y-1.5 pt-2 border-t border-[#d2bfa5]">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6a5a4c] flex items-center gap-1.5">
                  <FaCalendarAlt className="w-3 h-3 text-[#7a6a5c]" />
                  <span>
                    {language === "bn"
                      ? "২. সমাপ্তির তারিখ"
                      : "2. Completion Date"}
                  </span>
                </label>
                <input
                  type="date"
                  value={readDate}
                  onChange={(e) => setReadDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#8a7966] bg-[#fffaf2] text-[#2f251d] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none cursor-pointer"
                />
              </div>

              {/* Step 3: Staff Note */}
              <div className="space-y-1.5 pt-2 border-t border-[#d2bfa5]">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6a5a4c] block">
                  {language === "bn"
                    ? "৩. মন্তব্য (ঐচ্ছিক)"
                    : "3. Note / Comments (Optional)"}
                </label>
                <input
                  type="text"
                  placeholder={
                    language === "bn"
                      ? "যেমন: পাঠচক্রে পাঠ সমাপ্ত"
                      : "e.g., Completed reading review or group reading"
                  }
                  value={readNote}
                  onChange={(e) => setReadNote(e.target.value)}
                  className="w-full px-3 py-2 border border-[#8a7966] bg-[#fffaf2] text-[#2f251d] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-[#cfbba1] grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 sm:gap-2.5 bg-[#eadcc8]">
              <button
                type="button"
                onClick={() => setShowMarkReadModal(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-[#8a7966] bg-[#f6ecdd] text-[#4e4033] hover:bg-[#ece0ce] transition-colors cursor-pointer text-center"
              >
                {language === "bn" ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={!selectedReadBookId || isPending}
                onClick={handleConfirmMarkRead}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs sm:text-sm font-bold bg-[#2d521f] text-[#f4e8d4] hover:bg-[#203a16] transition-all shadow-xs disabled:opacity-50 cursor-pointer text-center"
              >
                {isPending
                  ? language === "bn"
                    ? "সংরক্ষণ হচ্ছে..."
                    : "Saving..."
                  : language === "bn"
                    ? "পড়া সম্পন্ন নিশ্চিত করুন"
                    : "Confirm Mark Read"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          3. EDIT PROFILE MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#f6ecdd] border border-[#8a7966] rounded-xl max-w-md w-full max-h-[85vh] sm:max-h-[80vh] shadow-2xl ink-text flex flex-col">
            <div className="p-3.5 sm:p-4 border-b border-[#cfbba1] flex items-center justify-between bg-[#eadcc8]">
              <div className="flex items-center gap-2">
                <FaEdit className="w-4 h-4 text-[#5c4a3b] shrink-0" />
                <h3 className="font-bold text-sm sm:text-base text-[#221910] ink-title truncate">
                  {language === "bn"
                    ? `${userName}-এর তথ্য সম্পাদনা`
                    : `Edit Member: ${userName}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="p-1 rounded-md text-[#7a6755] hover:text-[#221910] cursor-pointer transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 sm:p-4 space-y-3.5 flex-1 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6a5a4c] block">
                  {language === "bn" ? "পুরো নাম" : "Full Name"}
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#8a7966] bg-[#fffaf2] text-[#2f251d] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6a5a4c] block">
                  {language === "bn" ? "ফোন নম্বর" : "Phone Number"}
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 border border-[#8a7966] bg-[#fffaf2] text-[#2f251d] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none"
                />
              </div>

              {thanas && thanas.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#6a5a4c] block">
                    {language === "bn" ? "থানা / এলাকা" : "Thana / Location"}
                  </label>
                  <select
                    value={editThanaId ?? "none"}
                    onChange={(e) =>
                      setEditThanaId(
                        e.target.value === "none" ? null : e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-[#8a7966] bg-[#fffaf2] text-[#2f251d] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none cursor-pointer"
                  >
                    <option value="none">
                      {language === "bn"
                        ? "-- কোনো থানা নেই --"
                        : "-- None / Unassigned --"}
                    </option>
                    {thanas.map((th) => (
                      <option key={th.id} value={th.id}>
                        {th.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 border-t border-[#cfbba1] grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 sm:gap-2.5 bg-[#eadcc8]">
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-[#8a7966] bg-[#f6ecdd] text-[#4e4033] hover:bg-[#ece0ce] transition-colors cursor-pointer text-center"
              >
                {language === "bn" ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={!editFullName.trim() || isPending}
                onClick={handleConfirmEditProfile}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs sm:text-sm font-bold bg-[#3f3328] text-[#f4e8d4] hover:bg-[#282019] transition-all shadow-xs disabled:opacity-50 cursor-pointer text-center"
              >
                {isPending
                  ? language === "bn"
                    ? "সংরক্ষণ হচ্ছে..."
                    : "Saving..."
                  : language === "bn"
                    ? "আপডেট করুন"
                    : "Update Details"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
