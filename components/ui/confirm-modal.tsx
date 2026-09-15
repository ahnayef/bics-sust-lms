"use client";

import { type ReactNode, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description?: ReactNode;
  /** A preview card showing exactly what will change */
  preview?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for destructive actions */
  danger?: boolean;
  loading?: boolean;
}

/**
 * ConfirmModal — reusable confirmation dialog.
 *
 * Shows a title, optional description, optional preview of the change,
 * and Cancel / Confirm buttons. Pass `danger` for destructive actions
 * (removes, demotions, unverifications).
 */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  preview,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && onConfirm) {
        e.preventDefault();
        if (!loading) {
          onConfirm();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, onConfirm, loading]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-[#1f170f]/50 backdrop-blur-[1px] flex items-center justify-center p-4 z-[100]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="dashboard-surface tron-border rounded-sm shadow-xl max-w-md w-full"
        style={{ fontFamily: "'Courier Prime', monospace" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-[#d9c8b0]">
          <h2 className="text-lg font-bold text-[#221910] ink-title">
            {title}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-[#655648] hover:bg-[#e7d8c3] rounded-sm transition-colors shrink-0"
            aria-label="Close"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {description && (
            <div className="text-sm text-[#5a4b3f] ink-text">{description}</div>
          )}

          {/* Preview of what will happen */}
          {preview && (
            <div className="rounded-sm border border-[#c9b89a] bg-[#ede0cc] px-4 py-3 text-sm ink-text text-[#3f3328]">
              {preview}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 border border-[#8a7966] text-[#4f4134] rounded-sm hover:bg-[#eadcc8] transition-colors font-medium ink-text disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-sm font-medium ink-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed border ${danger
                  ? "bg-[#8b5c4a] text-[#f6ecdd] border-[#6b4437] hover:bg-[#6b4437]"
                  : "bg-[#3f3328] text-[#f4e8d4] border-[#4e4033] hover:bg-[#4a3d31]"
                }`}
            >
              {loading ? "Working…" : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
