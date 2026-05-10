"use client";

import { useActionState, useRef, useState } from "react";
import {
  updateProfileInfo,
  fetchDistrictsByDivision,
  fetchUpazilasByDistrict,
} from "@/server/profiles";
import type { GeoSource } from "@/server/geo";
import type { District, Division, Upazila, UserRank } from "@/types/profile";
import type { Profile } from "@/types/profile";
import {
  FaMapMarkerAlt,
  FaArrowLeft,
  FaExclamationTriangle,
} from "react-icons/fa";
import LocationCombobox from "@/components/LocationCombobox";
import Link from "next/link";
import ConfirmModal from "@/components/ui/confirm-modal";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface Props {
  profile: Profile;
  divisions: Division[];
  initialDistricts: District[];
  initialUpazilas: Upazila[];
  geoSource: GeoSource;
}

const RANKS: UserRank[] = ["None", "Member", "Associate", "Supporter"];

const inputClass =
  "w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text";

const labelClass = "block text-sm font-medium text-[#3f3328] mb-1 ink-text";

// ---------------------------------------------------------------------------
// Action wrapper
// ---------------------------------------------------------------------------

async function updateProfileAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const result = await updateProfileInfo(formData);
  return result ?? null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EditProfileForm({
  profile,
  divisions,
  initialDistricts,
  initialUpazilas,
  geoSource: initialGeoSource,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    null,
  );

  // Controlled fields for modal preview
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [rank, setRank] = useState<UserRank>(profile.rank);

  // Save-changes confirm modal
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return; // let the action proceed
    }
    e.preventDefault();
    setSaveModalOpen(true);
  }

  function handleSaveConfirm() {
    setSaveModalOpen(false);
    confirmedRef.current = true;
    formRef.current?.requestSubmit();
  }

  const rankChanged = rank !== profile.rank;

  const savePreview = (
    <div className="space-y-1">
      <p>
        <span className="text-[#7a6a5c]">Full Name:</span>{" "}
        {fullName || "(none)"}
      </p>
      <p>
        <span className="text-[#7a6a5c]">Phone:</span> {phone || "(none)"}
      </p>
      <p>
        <span className="text-[#7a6a5c]">Rank:</span>{" "}
        <span className={rankChanged ? "font-semibold text-amber-700" : ""}>
          {rank}
        </span>
      </p>
      {rankChanged && (
        <p className="mt-2 text-amber-700">
          ⚠ Your rank is changing — you will be un-verified and need
          re-verification.
        </p>
      )}
    </div>
  );

  // Location state — initialise from current profile
  const [selectedDivision, setSelectedDivision] = useState(
    profile.division_id ?? "",
  );
  const [selectedDistrict, setSelectedDistrict] = useState(
    profile.district_id ?? "",
  );
  const [selectedUpazila, setSelectedUpazila] = useState(
    profile.upazila_id ?? "",
  );
  const [districts, setDistricts] = useState<District[]>(initialDistricts);
  const [upazilas, setUpazilas] = useState<Upazila[]>(initialUpazilas);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingUpazilas, setLoadingUpazilas] = useState(false);
  const [geoSource, setGeoSource] = useState<GeoSource>(initialGeoSource);

  function mergeSource(s: GeoSource) {
    if (s === "unavailable" || geoSource === "unavailable")
      setGeoSource("unavailable");
    else if (s === "local-cache" || geoSource === "local-cache")
      setGeoSource("local-cache");
  }

  // ---- Event handlers ----

  function handleDivisionChange(divisionId: string) {
    setSelectedDivision(divisionId);
    setSelectedDistrict("");
    setSelectedUpazila("");
    setDistricts([]);
    setUpazilas([]);

    if (!divisionId) return;
    setLoadingDistricts(true);
    fetchDistrictsByDivision(divisionId).then((result) => {
      setDistricts(result.data);
      mergeSource(result.source);
      setLoadingDistricts(false);
    });
  }

  function handleDistrictChange(districtId: string) {
    setSelectedDistrict(districtId);
    setSelectedUpazila("");
    setUpazilas([]);

    if (!districtId) return;
    setLoadingUpazilas(true);
    fetchUpazilasByDistrict(districtId).then((result) => {
      setUpazilas(result.data);
      mergeSource(result.source);
      setLoadingUpazilas(false);
    });
  }

  // Initials for avatar fallback
  const initials = profile.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : "?";

  // ---- Render ----

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
        .ink-title { font-family: 'Playfair Display', Georgia, serif; }
        .ink-text  { font-family: 'Courier Prime', 'Courier New', monospace; }
      `}</style>

      <div
        className="p-2 sm:p-0"
        style={{ fontFamily: "'Courier Prime', 'Courier New', monospace" }}
      >
        <div className="max-w-lg mx-auto">
          {/* Back link */}
          <div className="mb-5">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-[#6a5a4c] hover:text-[#221910] ink-text transition-colors"
            >
              <FaArrowLeft className="w-3 h-3" />
              Back to Profile
            </Link>
          </div>

          {/* Page header */}
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

          {/* Card */}
          <div className="dashboard-surface tron-border rounded-sm p-6 sm:p-8">
            {/* ── Read-only identity display ── */}
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-[#c9b89a]">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
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
              {/* ── Global error banner ── */}
              {state?.error && (
                <div className="border border-red-400 bg-red-50 text-red-700 px-4 py-3 rounded-sm text-sm ink-text">
                  {state.error}
                </div>
              )}

              {/* ── Full Name ── */}
              <div>
                <label htmlFor="full_name" className={labelClass}>
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>

              {/* ── Phone ── */}
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone Number{" "}
                  <span className="text-[#7a6a5c] font-normal">(optional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 1X XX XXXX XXX"
                  className={inputClass}
                />
              </div>

              {/* ── Rank ── */}
              <div>
                <label htmlFor="rank" className={labelClass}>
                  Rank <span className="text-red-500">*</span>
                </label>
                <select
                  id="rank"
                  name="rank"
                  required
                  value={rank}
                  onChange={(e) => setRank(e.target.value as UserRank)}
                  className={inputClass}
                >
                  {RANKS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {/* Rank-change warning */}
                <div className="flex items-start gap-2 mt-2 px-3 py-2 rounded-sm border border-amber-400/60 bg-amber-50/80 text-amber-800 text-xs ink-text">
                  <FaExclamationTriangle className="shrink-0 mt-0.5 w-3 h-3" />
                  <span>
                    Saving the profile will un-verify you if you change your
                    rank. A moderator will need to re-verify you.
                  </span>
                </div>
              </div>

              {/* ── Location picker ── */}
              <div className="border border-[#c9b99a] bg-[#ede0cc] rounded-sm p-4 space-y-4">
                <div className="flex items-center gap-2 text-[#3f3328]">
                  <FaMapMarkerAlt className="text-[#6e5d4a] shrink-0" />
                  <span className="text-sm font-semibold ink-text tracking-wide uppercase">
                    Location
                  </span>
                  <span className="text-red-500 text-sm">*</span>
                </div>

                {/* Geo source banners */}
                {geoSource === "local-cache" && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-sm border border-amber-400/60 bg-amber-50/80 text-amber-800 text-xs ink-text">
                    <span className="shrink-0 mt-0.5">⚠</span>
                    <span>
                      Location data loaded from local cache — Supabase was
                      unreachable. Data may be slightly outdated.
                    </span>
                  </div>
                )}
                {geoSource === "unavailable" && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-sm border border-red-400/60 bg-red-50/80 text-red-800 text-xs ink-text">
                    <span className="shrink-0 mt-0.5">✕</span>
                    <span>
                      Location data is unavailable — Supabase is unreachable and
                      no local cache was found. Try refreshing, or run{" "}
                      <code className="font-mono bg-red-100 px-1 rounded">
                        bun fetch-geo
                      </code>
                      .
                    </span>
                  </div>
                )}

                {/* Division */}
                <div>
                  <label className={labelClass}>
                    Division <span className="text-red-500">*</span>
                  </label>
                  <LocationCombobox
                    name="division_id"
                    options={divisions}
                    value={selectedDivision}
                    onChange={handleDivisionChange}
                    placeholder="Select division…"
                    searchPlaceholder="Search division…"
                  />
                </div>

                {/* District */}
                <div>
                  <label className={labelClass}>
                    District <span className="text-red-500">*</span>
                  </label>
                  <LocationCombobox
                    name="district_id"
                    options={districts}
                    value={selectedDistrict}
                    onChange={handleDistrictChange}
                    placeholder="Select district…"
                    searchPlaceholder="Search district…"
                    disabled={!selectedDivision}
                    loading={loadingDistricts}
                    disabledHint="Select a division first"
                  />
                </div>

                {/* Upazila */}
                <div>
                  <label className={labelClass}>
                    Upazila <span className="text-red-500">*</span>
                  </label>
                  <LocationCombobox
                    name="upazila_id"
                    options={upazilas}
                    value={selectedUpazila}
                    onChange={setSelectedUpazila}
                    placeholder="Select upazila…"
                    searchPlaceholder="Search upazila…"
                    disabled={!selectedDistrict}
                    loading={loadingUpazilas}
                    disabledHint="Select a district first"
                  />
                </div>
              </div>

              {/* ── Privacy toggle ── */}
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
                  {/* Hidden input so unchecked = "false" */}
                  <input
                    type="hidden"
                    name="hide_sensitive_info"
                    value="false"
                  />
                  <div className="w-10 h-5 bg-[#c9b99a] peer-checked:bg-[#5a4d40] rounded-full transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>

              {/* ── Submit ── */}
              <div className="pt-2 flex gap-3">
                <Link
                  href="/dashboard"
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

          {/* Footer note */}
          <p className="text-center text-xs text-[#7a6a5c] mt-6 ink-text">
            BICS &mdash; Sylhet
          </p>
        </div>
      </div>
    </>
  );
}
