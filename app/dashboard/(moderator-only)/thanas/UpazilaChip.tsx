"use client";

import { startTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaCheck, FaPencilAlt, FaTimes, FaTrash } from "react-icons/fa";
import { deleteThana, modifyThana } from "@/server/geo-actions";
import ConfirmModal from "@/components/ui/confirm-modal";

interface UpazilaChipProps {
  id: string;
  name: string;
}

export function UpazilaChip({ id, name }: UpazilaChipProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);

  // ── Delete modal ──────────────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function handleDeleteConfirm() {
    setDeleteLoading(true);
    const fd = new FormData();
    fd.append("id", id);
    startTransition(async () => {
      await deleteThana(fd);
      setDeleteLoading(false);
      setDeleteOpen(false);
      router.refresh();
    });
  }

  // ── Rename modal ──────────────────────────────────────────────────────────
  const [renameOpen, setRenameOpen] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);

  function handleRenameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const newName = inputRef.current?.value.trim() ?? "";
    if (!newName) return;
    setPendingName(newName);
    setRenameOpen(true);
  }

  function handleRenameConfirm() {
    setRenameLoading(true);
    const fd = new FormData();
    fd.append("id", id);
    fd.append("name", pendingName);
    startTransition(async () => {
      await modifyThana(fd);
      setRenameLoading(false);
      setRenameOpen(false);
      setEditing(false);
      router.refresh();
    });
  }

  // ── Editing (rename) view ─────────────────────────────────────────────────
  if (editing) {
    return (
      <>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs border border-[#c4ae8e] bg-[#f6ecdd] rounded-sm text-[#3b3026] ink-text">
          <form
            onSubmit={handleRenameSubmit}
            className="inline-flex items-center gap-1.5"
          >
            <input type="hidden" name="id" value={id} />
            <input
              ref={inputRef}
              type="text"
              name="name"
              defaultValue={name}
              required
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              className="px-1 py-0.5 border border-[#8a7966] bg-white text-[#2f251d] rounded-sm outline-none focus:ring-1 focus:ring-[#6e5d4a] text-xs w-28 ink-text"
            />
            <button
              type="submit"
              className="text-[#3a6a3a] hover:text-[#1a4a1a] transition-colors"
              aria-label="Save rename"
            >
              <FaCheck className="w-2.5 h-2.5" />
            </button>
          </form>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-[#7a5a4a] hover:text-[#5a2a1a] transition-colors"
            aria-label="Cancel rename"
          >
            <FaTimes className="w-2.5 h-2.5" />
          </button>
        </div>

        <ConfirmModal
          open={renameOpen}
          onClose={() => {
            if (!renameLoading) setRenameOpen(false);
          }}
          onConfirm={handleRenameConfirm}
          title="Rename Upazila"
          preview={`Renaming from '${name}' to '${pendingName}'`}
          confirmLabel="Rename"
          loading={renameLoading}
        />
      </>
    );
  }

  // ── Default (display) view ────────────────────────────────────────────────
  return (
    <>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs border border-[#c4ae8e] bg-[#f6ecdd] rounded-sm text-[#3b3026] ink-text">
        {name}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[#7a5a4a] hover:text-[#5a2a1a] transition-colors ml-0.5"
          aria-label={`Rename ${name}`}
        >
          <FaPencilAlt className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="text-[#7a5a4a] hover:text-[#5a2a1a] transition-colors"
          aria-label={`Remove ${name}`}
        >
          <FaTrash className="w-2.5 h-2.5" />
        </button>
      </div>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => {
          if (!deleteLoading) setDeleteOpen(false);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Upazila"
        description="This cannot be undone. If any member profiles reference this upazila, deletion will be blocked automatically."
        preview={name}
        danger={true}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </>
  );
}
