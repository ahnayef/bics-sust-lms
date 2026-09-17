"use client";

import ConfirmModal from "@/components/ui/confirm-modal";
import { deleteThana, getThanaRefCount, modifyThana } from "@/server/geo-actions";
import { useRouter } from "next/navigation";
import { startTransition, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { FaCheck, FaPencilAlt, FaTimes, FaTrash } from "react-icons/fa";

interface ThanaChipProps {
  id: string;
  name: string;
  onFlash: (type: "success" | "error", text: string) => void;
}

export function ThanaChip({ id, name, onFlash }: ThanaChipProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refCount, setRefCount] = useState<number | null>(null);

  async function handleDeleteClick() {
    setRefCount(null);
    setDeleteOpen(true);
    const count = await getThanaRefCount(id);
    setRefCount(count);
  }

  function handleDeleteConfirm() {
    setDeleteLoading(true);
    const fd = new FormData();
    fd.append("id", id);
    startTransition(async () => {
      const result = await deleteThana(fd);
      setDeleteLoading(false);
      setDeleteOpen(false);
      if (result?.error) {
        onFlash("error", result.error);
        return;
      }
      onFlash("success", t.thanas.chip.deleteSuccess.replace("{name}", name));
      router.refresh();
    });
  }

  const deleteDescription =
    refCount === null
      ? t.thanas.chip.checkingRefs
      : refCount > 0
        ? <span><b className="text-[#221910] font-bold">{refCount}</b> {t.thanas.chip.refWarning.replace("{count}", "")}</span>
        : <span>{t.thanas.chip.noRefWarning}</span>;

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
      const result = await modifyThana(fd);
      setRenameLoading(false);
      setRenameOpen(false);
      if (result?.error) {
        onFlash("error", result.error);
        return;
      }
      setEditing(false);
      onFlash("success", t.thanas.chip.renameSuccess.replace("{name}", pendingName));
      router.refresh();
    });
  }

  if (editing) {
    return (
      <>
        <div className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-[#c4ae8e] bg-[#f6ecdd] rounded-sm text-[#3b3026] ink-text">
          <form
            onSubmit={handleRenameSubmit}
            className="inline-flex items-center gap-2"
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
              className="px-2 py-1 border border-[#8a7966] bg-white text-[#2f251d] rounded-sm outline-none focus:ring-1 focus:ring-[#6e5d4a] text-sm w-36 ink-text"
            />
            <button
              type="submit"
              className="p-1.5 text-[#3a6a3a] hover:text-[#1a4a1a] transition-colors rounded-sm hover:bg-[#eadcc8]"
              aria-label="Save rename"
            >
              <FaCheck className="w-4 h-4" />
            </button>
          </form>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="p-1.5 text-[#7a5a4a] hover:text-[#5a2a1a] transition-colors rounded-sm hover:bg-[#eadcc8]"
            aria-label="Cancel rename"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        <ConfirmModal
          open={renameOpen}
          onClose={() => {
            if (!renameLoading) setRenameOpen(false);
          }}
          onConfirm={handleRenameConfirm}
          title={t.thanas.chip.renameTitle}
          preview={t.thanas.chip.renamePreview.replace("{old}", name).replace("{new}", pendingName)}
          confirmLabel={t.thanas.chip.renameLabel}
          loading={renameLoading}
        />
      </>
    );
  }

  return (
    <>
      <div className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-[#c4ae8e] bg-[#f6ecdd] rounded-sm text-[#3b3026] ink-text">
        {name}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="p-1.5 text-[#7a5a4a] hover:text-[#5a2a1a] transition-colors rounded-sm hover:bg-[#eadcc8]"
          aria-label={`${t.books.actions.edit} ${name}`}
        >
          <FaPencilAlt className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleDeleteClick}
          className="p-1.5 text-[#7a5a4a] hover:text-[#5a2a1a] transition-colors rounded-sm hover:bg-[#eadcc8]"
          aria-label={`${t.books.actions.delete} ${name}`}
        >
          <FaTrash className="w-4 h-4" />
        </button>
      </div>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => {
          if (!deleteLoading) setDeleteOpen(false);
        }}
        onConfirm={handleDeleteConfirm}
        title={t.thanas.chip.deleteTitle}
        description={deleteDescription}
        preview={name}
        danger={true}
        confirmLabel={t.thanas.chip.deleteConfirm}
        loading={deleteLoading}
      />
    </>
  );
}
