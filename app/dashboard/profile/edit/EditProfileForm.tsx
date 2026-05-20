"use client";

import ThanaCombobox from "@/components/ThanaCombobox";
import ConfirmModal from "@/components/ui/confirm-modal";
import { RankBadge } from "@/components/ui/rank-badge";
import type { GeoSource } from "@/server/geo";
import { updateProfileInfo } from "@/server/profiles";
import "@/styles/components.css";
import "@/styles/typography.css";
import type { Profile, Rank, Thana } from "@/types/profile";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaExclamationTriangle,
  FaMapMarkerAlt,
} from "react-icons/fa";

interface Props {
  profile: Profile;
  thanas: Thana[];
  ranks: Rank[];
  geoSource: GeoSource;
}

const inputClass =
  "w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text";

const labelClass = "block text-sm font-medium text-[#3f3328] mb-1 ink-text";

async function updateProfileAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const result = await updateProfileInfo(formData);
  return result ?? null;
}

export default function EditProfileForm({
  profile,
  thanas,
  ranks,
  geoSource: initialGeoSource,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    null,
  );

  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [phoneError, setPhoneError] = useState("");
  const [rankId, setRankId] = useState<string | null>(profile.rank_id);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits and + at the beginning
    if (value === "" || /^\+?[0-9]*$/.test(value)) {
      setPhone(value);
      if (value.length > 19) {
        setPhoneError("Phone number cannot exceed 19 characters");
      } else {
        setPhoneError("");
      }
    }
  };

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }
    e.preventDefault();
    setSaveModalOpen(true);
  }

  function handleSaveConfirm() {
    setSaveModalOpen(false);
    confirmedRef.current = true;
    formRef.current?.requestSubmit();
  }

  const rankChanged = rankId !== profile.rank_id;
  const currentRankName = ranks.find(r => r.id === rankId)?.name ?? "None";

  const thanaOptions = useMemo(
    () => [{ id: "", name: "— Not set —" } as Thana, ...thanas],
    [thanas],
  );

  const [selectedThana, setSelectedThana] = useState(profile.thana_id ?? "");
  const [geoSource] = useState<GeoSource>(initialGeoSource);

  const selectedThanaLabel =
    thanaOptions.find((t) => t.id === selectedThana)?.name ?? "Not set";

  const savePreview = (
    <div className="space-y-1">
      <p>
        <span className="text-[#7a6a5c]">Full Name:</span>{" "}
        {fullName || "(none)"}
      </p>
      <p>
        <span className="text-[#7a6a5c]">Phone:</span> {phone || "(none)"}
      </p>
      <p className="flex items-center gap-2">
        <span className="text-[#7a6a5c]">Rank:</span>{" "}
        <RankBadge name={currentRankName} className={rankChanged ? "border-amber-500 bg-amber-50" : ""} />
      </p>
      <p>
        <span className="text-[#7a6a5c]">Thana:</span> {selectedThanaLabel}
      </p>
      {rankChanged && (
        <p className="mt-2 text-amber-700">
          ⚠ Your rank is changing — you will be un-verified and need
          re-verification.
        </p>
      )}
    </div>
  );

  const initials = profile.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : "?";

  return (
    <>


      <div
        className="p-2 sm:p-0"
        style={{ fontFamily: "'Courier Prime', 'Courier New', monospace" }}
      >
        <div className="max-w-lg mx-auto">
          <div className="mb-5">
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-2 text-sm text-[#6a5a4c] hover:text-[#221910] ink-text transition-colors"
            >
              <FaArrowLeft className="w-3 h-3" />
              Back to My Profile
            </Link>
          </div>

          <div className="mb-6">
            <h1
              className="text-2xl sm:text-3xl font-bold text-[#221910] ink-title mb-1"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Edit Profile
            </h1>
            <p className="text-[#5a4b3f] text-sm ink-text">
              Update your details below. Username and avatar cannot be changed
              here.
            </p>
          </div>

          <div className="dashboard-surface tron-border rounded-sm p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-[#c9b89a]">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#8a7966] shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#d9cbb7] border-2 border-[#8a7966] flex items-center justify-center text-xl font-bold text-[#4a3e33] shrink-0 ink-title">
                  {initials}
                </div>
              )}
              <div>
                <p
                  className="text-lg font-semibold text-[#221910] ink-title leading-tight"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {profile.full_name}
                </p>
                <p className="text-sm text-[#7a6a5c] ink-text">
                  @{profile.username}
                </p>
                <p className="text-xs text-[#a0907e] ink-text mt-0.5">
                  Avatar &amp; username are managed via your OAuth provider
                </p>
              </div>
            </div>

            <form
              ref={formRef}
              action={formAction}
              onSubmit={handleFormSubmit}
              className="space-y-5"
            >
              {state?.error && (
                <div className="border border-red-400 bg-red-50 text-red-700 px-4 py-3 rounded-sm text-sm ink-text">
                  {state.error}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="full_name" className={labelClass}>
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-[#7a6a5c] font-normal opacity-70">
                    ({fullName.length}/100)
                  </span>
                </div>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  maxLength={100}
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="phone" className={labelClass}>
                    Phone Number{" "}
                    <span className="text-[#7a6a5c] font-normal">
                      (optional)
                    </span>
                    {phone.length > 0 && (
                      <span className="ml-2 text-[10px] text-[#7a6a5c] font-normal opacity-70">
                        ({phone.length}/19)
                      </span>
                    )}
                  </label>
                  {phoneError && (
                    <span className="text-xs text-red-600 font-semibold ink-text">
                      Too long
                    </span>
                  )}
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={19}
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="01919191919"
                  className={`${inputClass} ${phoneError ? "border-red-400 focus:ring-red-500" : ""
                    }`}
                />
                {phoneError && (
                  <p className="mt-1 text-xs text-red-600 ink-text">
                    {phoneError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="rank_id" className={labelClass}>
                  Rank <span className="text-red-500">*</span>
                </label>
                <select
                  id="rank_id"
                  name="rank_id"
                  required
                  value={rankId ?? "none"}
                  onChange={(e) => setRankId(e.target.value === "none" ? null : e.target.value)}
                  className={inputClass}
                >
                  <option value="none">None</option>
                  {ranks.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-start gap-2 mt-2 px-3 py-2 rounded-sm border border-amber-400/60 bg-amber-50/80 text-amber-800 text-xs ink-text">
                  <FaExclamationTriangle className="shrink-0 mt-0.5 w-3 h-3" />
                  <span>
                    If you change your rank, you will be un-verified until a moderator verifies you again.
                  </span>
                </div>
              </div>

              <div className="border border-[#c9b99a] bg-[#ede0cc] rounded-sm p-4 space-y-4">
                <div className="flex items-center gap-2 text-[#3f3328]">
                  <FaMapMarkerAlt className="text-[#6e5d4a] shrink-0" />
                  <span className="text-sm font-semibold ink-text tracking-wide uppercase">
                    Thana
                  </span>
                </div>

                {geoSource === "unavailable" && thanas.length === 0 && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-sm border border-red-400/60 bg-red-50/80 text-red-800 text-xs ink-text">
                    <span className="shrink-0 mt-0.5">✕</span>
                    <span>
                      No thanas are configured. You can leave the thana unset
                      until an admin adds thanas.
                    </span>
                  </div>
                )}

                <div>
                  <label className={labelClass}>Select thana</label>
                  <ThanaCombobox
                    name="thana_id"
                    options={thanaOptions}
                    value={selectedThana}
                    onChange={setSelectedThana}
                    placeholder="Select thana…"
                    searchPlaceholder="Search thana…"
                    disabled={thanaOptions.length <= 1}
                    disabledHint="No thanas available yet"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 px-4 py-3 border border-[#c9b99a] bg-[#ede0cc] rounded-sm">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#3f3328] ink-text">
                    Hide contact info from public profile
                  </p>
                  <p className="text-xs text-[#6a5a4c] ink-text mt-0.5">
                    When enabled, your email, phone, and location won&apos;t be
                    visible on your public profile page.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mt-0.5">
                  <input
                    type="checkbox"
                    name="hide_sensitive_info"
                    value="true"
                    defaultChecked={profile.hide_sensitive_info}
                    className="sr-only peer"
                  />
                  <input
                    type="hidden"
                    name="hide_sensitive_info"
                    value="false"
                  />
                  <div className="w-10 h-5 bg-[#c9b99a] peer-checked:bg-[#5a4d40] rounded-full transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <Link
                  href="/dashboard/profile"
                  className="flex-1 py-3 px-4 text-center bg-[#ede0cc] text-[#4a3825] border border-[#c9b99a] font-semibold rounded-sm hover:bg-[#e4d5b8] active:scale-[0.98] transition-all duration-150 ink-text text-base"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 px-6 bg-[#3f3328] text-[#f4e8d4] font-semibold rounded-sm hover:bg-[#221910] active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ink-title text-base tracking-wide"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {isPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

          <ConfirmModal
            open={saveModalOpen}
            onClose={() => {
              if (!isPending) setSaveModalOpen(false);
            }}
            onConfirm={handleSaveConfirm}
            title="Save Profile Changes"
            preview={savePreview}
            confirmLabel="Save Changes"
            loading={isPending}
          />

          <p className="text-center text-xs text-[#7a6a5c] mt-6 ink-text">
            BICS &mdash; Sylhet
          </p>
        </div>
      </div>
    </>
  );
}
