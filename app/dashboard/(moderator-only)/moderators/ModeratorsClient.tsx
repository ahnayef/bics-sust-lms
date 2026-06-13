"use client";

import ConfirmModal from "@/components/ui/confirm-modal";
import { useTranslation } from "@/lib/i18n/context";
import { demoteModerator, promoteToModerator } from "@/server/profiles";
import type { Profile } from "@/types/profile";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  FaCheck,
  FaCheckCircle,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaTimes,
  FaTimesCircle,
  FaUserSlash,
} from "react-icons/fa";

interface Props {
  initialModerators: Profile[];
}

export default function ModeratorsClient({ initialModerators }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [moderators, setModerators] = useState<Profile[]>(initialModerators);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [flash, setFlash] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!showModal) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false);
        setEmail("");
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showModal]);

  /* Promote confirm modal */
  const [showConfirmPromote, setShowConfirmPromote] = useState(false);

  /* Demote confirm modal: holds the target moderator, or null when closed */
  const [demoteTarget, setDemoteTarget] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  const filtered = moderators.filter(
    (m) =>
      m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const showFlash = (type: "success" | "error", text: string) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), 4000);
  };

  /* Step 1: user clicks "Promote" in the email modal → open confirm modal */
  const openPromoteConfirm = () => {
    if (!email.trim()) return;
    setShowModal(false);
    setShowConfirmPromote(true);
  };

  /* Step 2: user confirms in the promote confirm modal → submit */
  const executePromote = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("email", email.trim());
      const result = await promoteToModerator(fd);
      setShowConfirmPromote(false);
      if (result.error) {
        showFlash("error", result.error);
        setShowModal(true); /* reopen email modal so they can correct and retry */
      } else {
        showFlash("success", result.success!);
        setEmail("");
        router.refresh();
      }
    });
  };

  const cancelPromoteConfirm = () => {
    setShowConfirmPromote(false);
    setShowModal(true); /* go back to the email entry modal */
  };

  /* Step 1: user clicks "Remove" on a moderator → open confirm modal */
  const openDemoteConfirm = (person: Profile) => {
    setDemoteTarget({
      id: person.id,
      name: person.full_name,
      email: person.email,
    });
  };

  /* Step 2: user confirms in the demote confirm modal → submit */
  const executeDemote = () => {
    if (!demoteTarget) return;
    const target = demoteTarget;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("userId", target.id);
      const result = await demoteModerator(fd);
      setDemoteTarget(null);
      if (result.error) {
        showFlash("error", result.error);
      } else {
        showFlash("success", result.success!);
        setModerators((prev) => prev.filter((m) => m.id !== target.id));
      }
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <section className="dashboard-surface tron-border rounded-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#221910] mb-1 ink-title">
                {t.moderators.title}
              </h1>
              <p className="text-[#5a4b3f] ink-text text-sm">
                {t.moderators.subtitle}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium ink-text shrink-0"
            >
              <FaPlus className="w-4 h-4" /> {t.moderators.actions.add}
            </button>
          </div>
        </section>

        {/* Flash message */}
        {flash && (
          <div
            className={`p-4 rounded-sm flex items-center gap-3 ink-text text-sm border ${flash.type === "success"
              ? "bg-[#efe4d1] border-[#8d7a66] text-[#3f3328]"
              : "bg-red-50 border-red-400 text-red-800"
              }`}
          >
            {flash.type === "success" ? (
              <FaCheck className="w-4 h-4 shrink-0 text-[#5b4a3b]" />
            ) : (
              <FaTimes className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{flash.text}</span>
          </div>
        )}

        {/* Search */}
        <section className="dashboard-surface tron-border rounded-sm p-3 sm:p-4 border border-[#5f4f40]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a6a5a]" />
            <input
              type="text"
              placeholder={t.moderators.filters.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#6e5d4a] ink-text"
            />
          </div>
        </section>

        {/* List */}
        <section className="dashboard-surface tron-border rounded-sm border border-[#5f4f40] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-[#6a5a4c] ink-text">
              {t.moderators.empty}
            </div>
          ) : (
            <ul className="divide-y divide-[#d2bfa5]">
              {filtered.map((person) => (
                <li
                  key={person.id}
                  className="flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-[#f4ebdc] transition-colors"
                >
                  {/* Avatar */}
                  {person.avatar_url ? (
                    <Image
                      src={person.avatar_url}
                      alt={person.full_name}
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-full object-cover border border-[#8a7966] shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#d9cbb7] border border-[#8a7966] flex items-center justify-center text-base font-bold text-[#4a3e33] shrink-0 ink-title">
                      {person.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/dashboard/users/${person.id}`}
                        className="font-semibold text-[#2b2119] ink-title truncate hover:underline hover:text-[#5a4b3f] transition-colors"
                      >
                        {person.full_name}
                      </Link>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-semibold border ink-text ${person.role === "admin"
                          ? "bg-amber-100 text-amber-800 border-amber-400"
                          : "bg-teal-100 text-teal-800 border-teal-400"
                          }`}
                      >
                        <FaShieldAlt className="w-2.5 h-2.5" />
                        {person.role === "admin" ? t.moderators.roles.admin : t.moderators.roles.moderator}
                      </span>
                      {person.is_verified ? (
                        <FaCheckCircle
                          className="w-3.5 h-3.5 text-[#5a8a3e]"
                          title={t.moderators.badges.verified}
                        />
                      ) : (
                        <FaTimesCircle
                          className="w-3.5 h-3.5 text-[#b07a2a]"
                          title={t.moderators.badges.unverified}
                        />
                      )}
                    </div>
                    <p className="text-sm text-[#5a4b3f] ink-text truncate">
                      {person.email}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/dashboard/users/${person.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-[#4d4034] border border-[#8a7966] rounded-sm hover:bg-[#eadcc8] transition-colors ink-text"
                    >
                      {t.common.actions}
                    </Link>
                    {person.role === "moderator" && (
                      <button
                        onClick={() => openDemoteConfirm(person)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 border border-red-300 rounded-sm hover:bg-red-50 transition-colors ink-text disabled:opacity-50"
                        title={t.moderators.actions.remove}
                      >
                        <FaUserSlash className="w-3 h-3" /> {t.moderators.actions.remove}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Add Moderator Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-4 z-80"
          onClick={(e) =>
            e.target === e.currentTarget && (setShowModal(false), setEmail(""))
          }
        >
          <div
            className="dashboard-surface tron-border rounded-sm shadow-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-5">
              <h2 className="text-xl font-bold text-[#221910] ink-title">
                {t.moderators.modal.title}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEmail("");
                }}
                className="p-1.5 text-[#655648] hover:bg-[#e7d8c3] rounded-sm transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-[#5a4b3f] ink-text mb-4">
              {t.moderators.modal.subtitle}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4f4134] mb-1 ink-text">
                  {t.moderators.modal.label} <span className="text-[#7a4c37]">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && openPromoteConfirm()}
                  placeholder={t.moderators.modal.placeholder}
                  className="w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:outline-none focus:ring-2 focus:ring-[#6e5d4a] ink-text"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEmail("");
                  }}
                  className="flex-1 py-2.5 border border-[#8a7966] text-[#4f4134] rounded-sm hover:bg-[#eadcc8] transition-colors font-medium ink-text"
                >
                  {t.moderators.modal.cancel}
                </button>
                <button
                  type="button"
                  onClick={openPromoteConfirm}
                  disabled={isPending || !email.trim()}
                  className="flex-1 py-2.5 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-sm hover:bg-[#4a3d31] transition-colors font-medium ink-text disabled:opacity-50"
                >
                  {isPending ? "..." : t.moderators.modal.promote}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Promote confirm modal */}
      <ConfirmModal
        open={showConfirmPromote}
        onClose={cancelPromoteConfirm}
        onConfirm={executePromote}
        title={t.moderators.confirmPromote.title}
        preview={
          <div>
            <p className="font-semibold">{email}</p>
            <p className="text-xs mt-1 opacity-80">
              {t.moderators.confirmPromote.message.replace("{email}", "")}
            </p>
          </div>
        }
        confirmLabel={t.moderators.modal.promote}
        loading={isPending}
      />

      {/* Demote confirm modal */}
      <ConfirmModal
        open={demoteTarget !== null}
        onClose={() => setDemoteTarget(null)}
        onConfirm={executeDemote}
        title={t.moderators.confirmDemote.title}
        description={t.moderators.confirmDemote.message.replace("{name}", demoteTarget?.name || "").replace("{email}", demoteTarget?.email || "")}
        preview={
          demoteTarget && (
            <div>
              <p className="font-semibold">{demoteTarget.name}</p>
              <p className="text-xs mt-0.5 opacity-75">{demoteTarget.email}</p>
            </div>
          )
        }
        danger={true}
        confirmLabel={t.moderators.actions.remove}
        loading={isPending}
      />
    </>
  );
}
