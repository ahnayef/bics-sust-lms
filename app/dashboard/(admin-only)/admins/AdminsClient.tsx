"use client";

import { CommunityNav } from "@/app/dashboard/components/StaffHubNav";
import ConfirmModal from "@/components/ui/confirm-modal";
import { ModalPortal } from "@/components/ui/modal-portal";
import { useTranslation } from "@/lib/i18n/context";
import {
  demoteFromAdminAction,
  promoteToAdminByEmail,
} from "@/server/profiles";
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
  initialAdmins: Profile[];
  currentUserId?: string;
}

export default function AdminsClient({ initialAdmins, currentUserId }: Props) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const strings = (t as any).admins ?? (t as any).moderators;

  // Superadmin is strictly hidden from this list
  const [admins, setAdmins] = useState<Profile[]>(
    initialAdmins.filter((p) => p.role !== "superadmin"),
  );
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

  /* Demote confirm modal: holds the target admin, or null when closed */
  const [demoteTarget, setDemoteTarget] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  const filtered = admins.filter(
    (m) =>
      m.role !== "superadmin" &&
      (m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())),
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
      const result = await promoteToAdminByEmail(fd);
      setShowConfirmPromote(false);
      if (result.error) {
        showFlash("error", result.error);
        setShowModal(
          true,
        ); /* reopen email modal so they can correct and retry */
      } else {
        showFlash("success", result.success!);
        setEmail("");
        router.refresh();
      }
    });
  };

  /* Step 1: user clicks "Remove" on an admin → open confirm modal */
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
      const result = await demoteFromAdminAction(fd);
      setDemoteTarget(null);
      if (result.error) {
        showFlash("error", result.error);
      } else {
        showFlash("success", result.success!);
        setAdmins((prev) => prev.filter((m) => m.id !== target.id));
      }
    });
  };

  return (
    <>
      <div className="space-y-3 sm:space-y-5 px-2 sm:px-6 lg:px-8 py-3 sm:py-6">
        {/* Community Hub Sub-Navigation */}
        <div className="hidden md:block">
          <CommunityNav />
        </div>

        {/* Header */}
        <section className="dashboard-surface tron-border rounded-xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#8a7966] bg-[#f6ecdd] text-[#4e4033] ink-text text-[9px] sm:text-[10px] uppercase tracking-[0.12em] font-semibold">
                  <FaShieldAlt className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{strings.subtitle}</span>
                </div>
                {/* Stats badge */}
                <span className="px-2 py-0.5 rounded-md bg-[#eadcc8] border border-[#d2bfa5] text-[11px] font-semibold text-[#3b3026]">
                  {admins.length}{" "}
                  {language === "bn" ? "জন অ্যাডমিন" : "Administrators"}
                </span>
              </div>
              <h1 className="text-base sm:text-2xl font-bold text-[#221910] leading-tight ink-title">
                {strings.title}
              </h1>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-lg hover:bg-[#4a3d31] transition-all font-semibold text-xs sm:text-sm ink-text shadow-xs shrink-0 cursor-pointer"
            >
              <FaPlus className="w-3.5 h-3.5" /> {strings.actions.add}
            </button>
          </div>
        </section>

        {/* Flash message */}
        {flash && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2.5 ink-text text-xs sm:text-sm border shadow-xs ${
              flash.type === "success"
                ? "bg-[#efe4d1] border-[#8d7a66] text-[#3f3328]"
                : "bg-red-50 border-red-400 text-red-800"
            }`}
          >
            {flash.type === "success" ? (
              <FaCheck className="w-3.5 h-3.5 shrink-0 text-[#5b4a3b]" />
            ) : (
              <FaTimes className="w-3.5 h-3.5 shrink-0 text-red-600" />
            )}
            <span>{flash.text}</span>
          </div>
        )}

        {/* Search */}
        <section className="dashboard-surface tron-border rounded-xl p-2.5 sm:p-3.5 border border-[#5f4f40] shadow-xs">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7a6a5a]" />
            <input
              type="text"
              placeholder={strings.filters.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e5d4a] ink-text text-xs sm:text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#7a6a5a] hover:text-[#221910] transition-colors"
                aria-label="Clear search"
              >
                <FaTimes className="w-3 h-3" />
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="text-[11px] text-[#6a5a4c] ink-text mt-1.5 px-1">
              {filtered.length}{" "}
              {language === "bn" ? "জন পাওয়া গেছে" : "results found"}
            </p>
          )}
        </section>

        {/* List */}
        <section className="dashboard-surface tron-border rounded-xl border border-[#5f4f40] overflow-hidden shadow-xs">
          {filtered.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-[#6a5a4c] ink-text text-xs sm:text-sm">
              {strings.empty}
            </div>
          ) : (
            <ul className="divide-y divide-[#d2bfa5]">
              {filtered.map((person) => (
                <li
                  key={person.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:px-5 sm:py-3.5 hover:bg-[#f4ebdc] transition-colors"
                >
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {person.avatar_url ? (
                      <Image
                        src={person.avatar_url}
                        alt={person.full_name}
                        width={44}
                        height={44}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-[#8a7966] shrink-0 shadow-xs"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#d9cbb7] border border-[#8a7966] flex items-center justify-center text-sm sm:text-base font-bold text-[#4a3e33] shrink-0 ink-title shadow-xs">
                        {person.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/dashboard/users/${person.id}`}
                          className="font-bold text-[#2b2119] ink-title text-xs sm:text-sm truncate hover:underline hover:text-[#5a4b3f] transition-colors"
                        >
                          {person.full_name}
                        </Link>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[10px] font-semibold border ink-text shrink-0 bg-amber-100 text-amber-800 border-amber-400">
                          <FaShieldAlt className="w-2.5 h-2.5" />
                          {strings.roles.admin}
                        </span>
                        {person.is_verified ? (
                          <FaCheckCircle
                            className="w-3 h-3 text-[#5a8a3e] shrink-0"
                            title={strings.badges.verified}
                          />
                        ) : (
                          <FaTimesCircle
                            className="w-3 h-3 text-[#b07a2a] shrink-0"
                            title={strings.badges.unverified}
                          />
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-[#5a4b3f] ink-text truncate mt-0.5">
                        {person.email}
                      </p>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 sm:shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#d2bfa5]/60">
                    <Link
                      href={`/dashboard/users/${person.id}`}
                      className="flex-1 sm:flex-initial text-center px-3 py-1.5 text-xs font-semibold text-[#4d4034] bg-white/60 sm:bg-transparent border border-[#8a7966] rounded-lg hover:bg-[#eadcc8] transition-colors ink-text shadow-xs"
                    >
                      {t.common.actions}
                    </Link>
                    {/* Admins can demote other admins, but cannot demote themselves */}
                    {person.id !== currentUserId && (
                      <button
                        onClick={() => openDemoteConfirm(person)}
                        disabled={isPending}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50/80 border border-red-300 rounded-lg hover:bg-red-100 transition-colors ink-text disabled:opacity-50 shadow-xs cursor-pointer"
                        title={strings.actions.remove}
                      >
                        <FaUserSlash className="w-3 h-3" />
                        <span>{strings.actions.remove}</span>
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Add Admin Modal */}
      {showModal && (
        <ModalPortal>
          <div
            className="fixed inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4 z-80"
            onClick={(e) =>
              e.target === e.currentTarget &&
              (setShowModal(false), setEmail(""))
            }
          >
            <div
              className="dashboard-surface tron-border rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#221910] ink-title">
                  {strings.modal.title}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEmail("");
                  }}
                  className="p-1.5 text-[#655648] hover:bg-[#e7d8c3] rounded-lg transition-colors cursor-pointer"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-[#5a4b3f] ink-text mb-4">
                {strings.modal.subtitle}
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  openPromoteConfirm();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-[#5a4b3f] ink-text mb-1.5">
                    {strings.modal.label}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={strings.modal.placeholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6e5d4a] ink-text text-xs sm:text-sm"
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEmail("");
                    }}
                    className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#5a4b3f] hover:bg-[#eadcc8] rounded-lg transition-colors ink-text cursor-pointer"
                  >
                    {strings.modal.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={!email.trim() || isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#3f3328] text-[#f4e8d4] border border-[#4e4033] rounded-lg hover:bg-[#4a3d31] transition-all font-semibold text-xs sm:text-sm ink-text shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <FaShieldAlt className="w-3.5 h-3.5" />
                    <span>{strings.modal.promote}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Confirmation modal: Promote to Admin */}
      <ConfirmModal
        open={showConfirmPromote}
        onClose={() => {
          setShowConfirmPromote(false);
          setShowModal(true);
        }}
        onConfirm={executePromote}
        title={strings.confirmPromote.title}
        description={strings.confirmPromote.message.replace("{email}", email)}
        confirmLabel={strings.modal.promote}
        danger={false}
        loading={isPending}
      />

      {/* Confirmation modal: Demote Admin */}
      <ConfirmModal
        open={!!demoteTarget}
        onClose={() => setDemoteTarget(null)}
        onConfirm={executeDemote}
        title={strings.confirmDemote.title}
        description={
          demoteTarget
            ? strings.confirmDemote.message
                .replace("{name}", demoteTarget.name)
                .replace("{email}", demoteTarget.email)
            : ""
        }
        confirmLabel={strings.actions.remove}
        danger={true}
        loading={isPending}
      />
    </>
  );
}
