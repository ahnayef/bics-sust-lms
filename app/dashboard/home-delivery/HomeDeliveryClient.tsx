"use client";

import { ModalPortal } from "@/components/ui/modal-portal";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { submitHomeDeliveryRequest } from "@/server/delivery-actions";
import "@/styles/components.css";
import "@/styles/typography.css";
import type { Book, Category } from "@/types/library";
import type { Profile, Thana } from "@/types/profile";
import { useMemo, useState, useTransition } from "react";
import {
  FaBook,
  FaBoxOpen,
  FaCheck,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaPhone,
  FaPlus,
  FaSearch,
  FaShoppingBag,
  FaSpinner,
  FaTimes,
  FaTrashAlt,
  FaTruck,
  FaUser,
} from "react-icons/fa";

interface Props {
  profile: Profile | null;
  books: Book[];
  categories: Category[];
  thanas: Thana[];
}

const MAX_CART_ITEMS = 3;

export default function HomeDeliveryClient({
  profile,
  books,
  categories,
  thanas,
}: Props) {
  const { t, language } = useTranslation();
  const [isPending, startTransition] = useTransition();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Cart state: store selected books
  const [cart, setCart] = useState<Book[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Delivery form state
  const [recipientPhone, setRecipientPhone] = useState(profile?.phone || "");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [selectedThanaId, setSelectedThanaId] = useState<string>(
    profile?.thana_id || (thanas[0]?.id ?? ""),
  );
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Feedback state
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    count: number;
    phone: string;
    address: string;
  } | null>(null);

  // Cart helper functions
  const isInCart = (bookId: string) => cart.some((b) => b.id === bookId);

  const toggleCart = (book: Book) => {
    if (isInCart(book.id)) {
      setCart((prev) => prev.filter((b) => b.id !== book.id));
    } else {
      if (cart.length >= MAX_CART_ITEMS) {
        alert(t.delivery.cart.maxReached);
        return;
      }
      setCart((prev) => [...prev, book]);
    }
  };

  const removeFromCart = (bookId: string) => {
    setCart((prev) => prev.filter((b) => b.id !== bookId));
  };

  const handleDirectRequest = (book: Book) => {
    if (!isInCart(book.id)) {
      setCart([book]);
    }
    setFormError(null);
    setIsCheckoutOpen(true);
  };

  // Filtered books
  const filteredBooks = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return books.filter((book) => {
      const matchesQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === "all" || book.category_id === selectedCategory;

      const availableCopies = (book.copies || []).filter(
        (c) => c.status === "available",
      ).length;

      const matchesAvail = !onlyAvailable || availableCopies > 0;

      return matchesQuery && matchesCat && matchesAvail;
    });
  }, [books, searchTerm, selectedCategory, onlyAvailable]);

  // Submit delivery request
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (cart.length === 0) {
      setFormError(t.delivery.alerts.cartEmpty);
      return;
    }

    if (!recipientPhone.trim()) {
      setFormError(t.delivery.alerts.phoneRequired);
      return;
    }

    if (!deliveryAddress.trim()) {
      setFormError(t.delivery.alerts.addressRequired);
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("book_ids", JSON.stringify(cart.map((b) => b.id)));
      fd.set("phone", recipientPhone.trim());
      fd.set("address", deliveryAddress.trim());
      if (selectedThanaId) fd.set("thana_id", selectedThanaId);
      if (deliveryNotes.trim()) fd.set("note", deliveryNotes.trim());

      const res = await submitHomeDeliveryRequest(fd);

      if (!res.success) {
        setFormError(res.error || "Failed to submit request.");
      } else {
        setSubmittedResult({
          count: cart.length,
          phone: recipientPhone.trim(),
          address: deliveryAddress.trim(),
        });
        setCart([]);
        setIsCheckoutOpen(false);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-32 lg:pb-16 animate-in fade-in duration-200">
      {/* ── Top Hero Banner ────────────────────────────────────────────── */}
      <div className="dashboard-surface tron-border rounded-xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#3f3328] text-[#f4e8d4] flex items-center justify-center shrink-0 shadow-xs">
                <FaTruck className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#221910] ink-title">
                {t.delivery.title}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#5a4b3f] ink-text max-w-2xl">
              {t.delivery.subtitle}
            </p>
          </div>

          {/* Quick Cart Trigger Button */}
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setIsCheckoutOpen(true);
            }}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all shadow-sm shrink-0 cursor-pointer",
              cart.length > 0
                ? "bg-[#2d521f] text-[#f4e8d4] hover:bg-[#203a16] border border-[#203a16]"
                : "bg-[#eadcc8] text-[#4a3e33] hover:bg-[#ded0bc] border border-[#cfbba1]",
            )}
          >
            <FaShoppingBag className="w-4 h-4 shrink-0" />
            <span>{t.delivery.cart.title}</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#f6ecdd] text-[#221910] border border-[#cfbba1]">
              {cart.length} / {MAX_CART_ITEMS}
            </span>
          </button>
        </div>
      </div>

      {/* ── Success Confirmation Banner ─────────────────────────────────── */}
      {submittedResult && (
        <div className="p-4 sm:p-5 rounded-xl border border-[#a1c48f] bg-[#eef5e9] text-[#2d521f] shadow-sm space-y-2 animate-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <FaCheckCircle className="w-5 h-5 text-[#2d521f] mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold ink-title">
                  {t.delivery.alerts.successTitle}
                </h3>
                <p className="text-xs sm:text-sm ink-text text-[#234218]">
                  {t.delivery.alerts.successMessage.replace(
                    "{count}",
                    submittedResult.count.toString(),
                  )}
                </p>
                <p className="text-[11px] sm:text-xs text-[#3a6828] font-mono">
                  📍 {submittedResult.address} &middot; 📞{" "}
                  {submittedResult.phone}
                </p>
                <p className="text-[11px] text-[#42752e] italic pt-1">
                  {t.delivery.alerts.telegramNotice}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSubmittedResult(null)}
              className="p-1.5 hover:bg-[#d8e8cf] rounded-md text-[#2d521f] cursor-pointer transition-colors"
            >
              <FaTimes className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Catalog Filter & Search Bar ─────────────────────────────────── */}
      <div className="dashboard-surface tron-border rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center">
          {/* Search input */}
          <div className="relative flex-1 min-w-0">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7966] w-3.5 h-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder={t.delivery.catalog.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#8a7966] bg-[#f8f1e6] text-[#221910] rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#5a4d40] ink-text"
            />
          </div>

          {/* Category Select */}
          <div className="w-full md:w-56 shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-[#8a7966] bg-[#f8f1e6] text-[#221910] rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#5a4d40] ink-text cursor-pointer"
            >
              <option value="all">{t.delivery.catalog.allCategories}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Only available toggle */}
          <label className="flex items-center gap-2 px-3 py-2 border border-[#c9b89a] bg-[#f6ecdd] rounded-lg text-xs font-semibold text-[#4a3e33] cursor-pointer hover:bg-[#ece0ce] transition-colors shrink-0 select-none">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="rounded-xs text-[#3f3328] focus:ring-0 cursor-pointer"
            />
            <span>{t.delivery.catalog.onlyAvailable}</span>
          </label>
        </div>
      </div>

      {/* ── Catalog Books Grid ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#6a5a4c] ink-text flex items-center gap-1.5">
            <FaBook className="w-3.5 h-3.5 text-[#7a6a5c]" />
            <span>{t.delivery.catalog.title}</span>
            <span className="font-mono text-xs font-normal text-[#7a6a5c]">
              ({filteredBooks.length})
            </span>
          </h2>
          {cart.length > 0 && (
            <span className="text-xs font-bold text-[#2d521f] ink-text">
              {cart.length} {t.delivery.cart.itemsSelected}
            </span>
          )}
        </div>

        {filteredBooks.length === 0 ? (
          <div className="dashboard-surface tron-border rounded-xl p-8 sm:p-12 text-center space-y-2">
            <FaBoxOpen className="w-8 h-8 text-[#8a7966] mx-auto opacity-70" />
            <p className="text-sm text-[#5a4b3f] ink-text font-medium">
              {t.delivery.catalog.empty}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredBooks.map((book) => {
              const availableCopies = (book.copies || []).filter(
                (c) => c.status === "available",
              ).length;
              const hasCopies = availableCopies > 0;
              const bookInCart = isInCart(book.id);

              return (
                <div
                  key={book.id}
                  className={cn(
                    "dashboard-surface tron-border rounded-xl p-4 flex flex-col justify-between transition-all hover:border-[#6a5a4c] shadow-2xs space-y-3",
                    bookInCart &&
                      "ring-2 ring-[#2d521f] border-[#2d521f] bg-[#f4f7f1]",
                  )}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm sm:text-base text-[#221910] ink-title leading-snug break-words">
                          {book.title}
                        </h3>
                        <p className="text-xs text-[#5c4f42] ink-text mt-0.5 truncate">
                          {book.author}
                        </p>
                      </div>
                      {book.is_syllabus && (
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-[#e3dcd1] text-[#3f3328] border border-[#c5b59d] shrink-0">
                          {t.delivery.catalog.syllabus}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {book.category && (
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-[#ede4d5] text-[#5a4b3f] border border-[#d2bfa5]">
                          {book.category.name}
                        </span>
                      )}
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-xs text-[10px] font-bold border",
                          hasCopies
                            ? "bg-[#eef5e9] text-[#2d521f] border-[#a1c48f]"
                            : "bg-[#fff7ed] text-[#9a3412] border-[#fdba74]",
                        )}
                      >
                        {hasCopies
                          ? t.delivery.catalog.availableCopies.replace(
                              "{count}",
                              availableCopies.toString(),
                            )
                          : t.delivery.catalog.noCopies}
                      </span>
                    </div>
                  </div>

                  {/* Actions for this book */}
                  <div className="pt-2 border-t border-[#dfcfb9] grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCart(book)}
                      className={cn(
                        "inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center",
                        bookInCart
                          ? "bg-[#2d521f] text-[#f4e8d4] hover:bg-[#203a16]"
                          : "bg-[#f6ecdd] text-[#3f3328] border border-[#8a7966] hover:bg-[#eadcc8]",
                      )}
                    >
                      {bookInCart ? (
                        <>
                          <FaCheck className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {t.delivery.catalog.inCart}
                          </span>
                        </>
                      ) : (
                        <>
                          <FaPlus className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {t.delivery.catalog.addToCart}
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDirectRequest(book)}
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold bg-[#3f3328] text-[#f4e8d4] hover:bg-[#282019] transition-colors cursor-pointer text-center shadow-xs"
                    >
                      <FaTruck className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {t.delivery.catalog.requestDirect}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Floating Cart Dock (Screens with > 0 items in cart) ─────────── */}
      {cart.length > 0 && !isCheckoutOpen && (
        <aside
          aria-label="Floating delivery cart"
          className="fixed bottom-16 lg:bottom-5 inset-x-3 sm:inset-x-auto sm:right-6 max-w-md sm:w-96 z-40 bg-[#3f3328] text-[#f4e8d4] rounded-xl shadow-2xl border border-[#282019] p-3.5 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#2d521f] text-[#f4e8d4] flex items-center justify-center shrink-0 font-bold text-xs">
              {cart.length}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs sm:text-sm ink-title truncate">
                {cart.length} {t.delivery.cart.itemsSelected}
              </p>
              <p className="text-[11px] text-[#c9b89a] truncate">
                {cart.map((b) => b.title).join(", ")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setIsCheckoutOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#f4e8d4] text-[#3f3328] hover:bg-[#ffffff] transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <span>{t.delivery.cart.checkout}</span>
          </button>
        </aside>
      )}

      {/* ── Checkout / Delivery Info Modal ───────────────────────────────── */}
      {isCheckoutOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-[#f6ecdd] border border-[#8a7966] rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl ink-text">
              {/* Modal Header */}
              <div className="p-3.5 sm:p-4 border-b border-[#cfbba1] flex items-center justify-between bg-[#eadcc8]">
                <div className="flex items-center gap-2">
                  <FaTruck className="w-4 h-4 text-[#5c4a3b] shrink-0" />
                  <h2 className="font-bold text-sm sm:text-base text-[#221910] ink-title">
                    {t.delivery.form.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-1.5 rounded-md text-[#7a6755] hover:text-[#221910] cursor-pointer transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4"
              >
                {/* Validation Error Banner */}
                {formError && (
                  <div className="p-3 rounded-lg border border-[#e5a89b] bg-[#fdf0ec] text-[#8b2c1a] text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <FaExclamationTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Selected Books List in Cart */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold uppercase tracking-wider text-[#6a5a4c]">
                      {t.delivery.cart.title} ({cart.length}/{MAX_CART_ITEMS})
                    </label>
                    {cart.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCart([])}
                        className="text-[11px] text-[#8b2c1a] hover:underline font-semibold cursor-pointer"
                      >
                        {t.delivery.cart.clear}
                      </button>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <div className="p-4 rounded-lg border border-dashed border-[#c5b59d] text-center text-xs text-[#7a6a5c] italic bg-[#fffaf2]">
                      {t.delivery.cart.empty}
                    </div>
                  ) : (
                    <div className="divide-y divide-[#e4d4bf] border border-[#d2bfa5] rounded-lg bg-[#fffaf2] max-h-36 overflow-y-auto">
                      {cart.map((book) => (
                        <div
                          key={book.id}
                          className="p-2.5 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[#221910] truncate">
                              {book.title}
                            </p>
                            <p className="text-[11px] text-[#5c4f42] truncate">
                              {book.author}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(book.id)}
                            className="p-1 text-[#8b2c1a] hover:bg-[#f8e5e1] rounded-md transition-colors cursor-pointer"
                            title="Remove from cart"
                          >
                            <FaTrashAlt className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recipient Details */}
                <div className="space-y-3 pt-2 border-t border-[#dfcfb9]">
                  {/* Recipient Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#6a5a4c] flex items-center gap-1.5">
                      <FaUser className="w-3 h-3 text-[#7a6a5c]" />
                      <span>{t.delivery.form.recipientName}</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={profile?.full_name || ""}
                      className="w-full px-3 py-2 border border-[#c5b59d] bg-[#ede4d5] text-[#3f3328] rounded-lg text-xs sm:text-sm font-semibold cursor-not-allowed outline-none"
                    />
                  </div>

                  {/* Contact Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#6a5a4c] flex items-center gap-1.5">
                      <FaPhone className="w-3 h-3 text-[#7a6a5c]" />
                      <span>{t.delivery.form.phone} *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder={t.delivery.form.phonePlaceholder}
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8a7966] bg-[#fffaf2] text-[#221910] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none"
                    />
                    <p className="text-[10px] text-[#7a6a5c]">
                      {t.delivery.form.phoneHelp}
                    </p>
                  </div>

                  {/* Delivery Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#6a5a4c] flex items-center gap-1.5">
                      <FaMapMarkerAlt className="w-3 h-3 text-[#7a6a5c]" />
                      <span>{t.delivery.form.address} *</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder={t.delivery.form.addressPlaceholder}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8a7966] bg-[#fffaf2] text-[#221910] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none resize-none"
                    />
                  </div>

                  {/* Thana Selection */}
                  {thanas.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#6a5a4c] block">
                        {t.delivery.form.thana}
                      </label>
                      <select
                        value={selectedThanaId}
                        onChange={(e) => setSelectedThanaId(e.target.value)}
                        className="w-full px-3 py-2 border border-[#8a7966] bg-[#fffaf2] text-[#221910] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none cursor-pointer"
                      >
                        {thanas.map((th) => (
                          <option key={th.id} value={th.id}>
                            {th.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Delivery Notes */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#6a5a4c] block">
                      {t.delivery.form.notes}
                    </label>
                    <input
                      type="text"
                      placeholder={t.delivery.form.notesPlaceholder}
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8a7966] bg-[#fffaf2] text-[#221910] rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#6e5d4a] outline-none"
                    />
                  </div>
                </div>

                {/* Informational Banner */}
                <div className="p-3 bg-[#ede4d5]/70 border border-[#d2bfa5] rounded-lg flex items-start gap-2.5 text-xs text-[#5a4b3f]">
                  <FaInfoCircle className="w-3.5 h-3.5 text-[#7a6a5c] mt-0.5 shrink-0" />
                  <p className="leading-snug">
                    {language === "bn"
                      ? "অনুরোধ পাঠানোর সাথে সাথে এটি লাইব্রেরির টেলিগ্রাম চ্যানেলে নোটিফিকেশন হিসেবে পৌঁছে যাবে। ডেলিভারি টিম আপনার সাথে ফোনে যোগাযোগ করবে।"
                      : "Submitting this request instantly notifies library volunteers via the Telegram dispatch channel. They will call you to confirm dispatch."}
                  </p>
                </div>

                {/* Modal Footer */}
                <div className="p-3 sm:p-4 -mx-3.5 sm:-mx-4 -mb-3.5 sm:-mb-4 border-t border-[#cfbba1] grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 sm:gap-2.5 bg-[#eadcc8]">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-[#8a7966] bg-[#f6ecdd] text-[#4e4033] hover:bg-[#ece0ce] transition-colors cursor-pointer text-center"
                  >
                    {t.delivery.form.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={cart.length === 0 || isPending}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs sm:text-sm font-bold bg-[#2d521f] text-[#f4e8d4] hover:bg-[#203a16] transition-all shadow-xs disabled:opacity-50 cursor-pointer text-center inline-flex items-center justify-center gap-1.5"
                  >
                    {isPending ? (
                      <>
                        <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                        <span>{t.delivery.form.submitting}</span>
                      </>
                    ) : (
                      <span>{t.delivery.form.submit}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
