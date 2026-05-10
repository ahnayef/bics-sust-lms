"use client";

import { useActionState, useState } from "react";
import {
  setupProfile,
  fetchDistrictsByDivision,
  fetchUpazilasByDistrict,
} from "@/server/profiles";
import type { GeoSource } from "@/server/geo";
import type { District, Division, Upazila, UserRank } from "@/types/profile";
import { FaMapMarkerAlt } from "react-icons/fa";
import LocationCombobox from "@/components/LocationCombobox";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type Props = { divisions: Division[]; geoSource: GeoSource };

const RANKS: UserRank[] = ["None", "Member", "Associate", "Supporter"];

const inputClass =
  "w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text";

const labelClass = "block text-sm font-medium text-[#3f3328] mb-1 ink-text";

// ---------------------------------------------------------------------------
// Action wrapper
// ---------------------------------------------------------------------------

async function setupProfileAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const result = await setupProfile(formData);
  return result ?? null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SetupForm({
  divisions,
  geoSource: initialGeoSource,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    setupProfileAction,
    null,
  );

  // Location state
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedUpazila, setSelectedUpazila] = useState("");
  const [districts, setDistricts] = useState<District[]>([]);
  const [upazilas, setUpazilas] = useState<Upazila[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingUpazilas, setLoadingUpazilas] = useState(false);
  // Tracks the worst source seen so far this session
  const [geoSource, setGeoSource] = useState<GeoSource>(initialGeoSource);

  function mergeSource(s: GeoSource) {
    // escalate: supabase < local-cache < unavailable
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

  // ---- Render ----

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
        .ink-title { font-family: 'Playfair Display', Georgia, serif; }
        .ink-text  { font-family: 'Courier Prime', 'Courier New', monospace; }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16 bg-[#e5d9c4] relative overflow-hidden"
        style={{ fontFamily: "'Courier Prime', 'Courier New', monospace" }}
      >
        {/* Decorative background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,#46372b 0px,#46372b 1px,transparent 1px,transparent 40px)," +
              "repeating-linear-gradient(90deg,#46372b 0px,#46372b 1px,transparent 1px,transparent 40px)",
          }}
        />

        <div className="relative w-full max-w-lg">
          {/* Page header */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl sm:text-4xl font-bold text-[#221910] ink-title mb-2"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Complete Your Profile
            </h1>
            <p className="text-[#5a4b3f] text-sm sm:text-base ink-text">
              You&apos;re almost in. Fill in your details to get started.
            </p>
          </div>

          {/* Card */}
          <div className="bg-[#f1e7d8] border border-[#46372b] rounded-sm p-6 sm:p-8 shadow-sm">
            <form action={formAction} className="space-y-5">
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
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>

              {/* ── Username ── */}
              <div>
                <label htmlFor="username" className={labelClass}>
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="^[a-zA-Z0-9_]+$"
                  autoComplete="username"
                  placeholder="your_username"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-[#7a6a5c] ink-text">
                  3–30 chars · letters, numbers, underscores only · must be
                  unique
                </p>
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
                  defaultValue=""
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select your rank
                  </option>
                  {RANKS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[#7a6a5c] ink-text">
                  Your rank will be unverified until a moderator reviews your
                  profile.
                </p>
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

                {/* Geo source banner */}
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

              {/* ── Submit ── */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 px-6 bg-[#3f3328] text-[#f4e8d4] font-semibold rounded-sm hover:bg-[#221910] active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ink-title text-base tracking-wide"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {isPending ? "Saving…" : "Save & Continue →"}
                </button>
              </div>
            </form>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-[#7a6a5c] mt-6 ink-text">
            BICS &mdash; Sylhet
          </p>
        </div>
      </div>
    </>
  );
}
