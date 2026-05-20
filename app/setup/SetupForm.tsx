"use client";

import ThanaCombobox from "@/components/ThanaCombobox";
import type { GeoSource } from "@/server/geo";
import { checkUsernameAvailability, setupProfile } from "@/server/profiles";
import "@/styles/components.css";
import "@/styles/typography.css";
import type { Thana, Rank } from "@/types/profile";
import Link from "next/link";
import { useActionState, useState } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
type Props = { thanas: Thana[]; ranks: Rank[]; geoSource: GeoSource };

const inputClass =
  "w-full px-4 py-2.5 border border-[#8a7966] bg-[#f6ecdd] text-[#2f251d] rounded-sm focus:ring-2 focus:ring-[#6e5d4a] focus:border-transparent outline-none ink-text";

const labelClass = "block text-sm font-medium text-[#3f3328] mb-1 ink-text";

async function setupProfileAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const result = await setupProfile(formData);
  return result ?? null;
}

export default function SetupForm({
  thanas,
  ranks,
  geoSource: initialGeoSource,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    setupProfileAction,
    null,
  );

  const [selectedThana, setSelectedThana] = useState("");
  const [geoSource, setGeoSource] = useState<GeoSource>(initialGeoSource);
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "unavailable" | "invalid"
  >("idle");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

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

  const handleUsernameBlur = async () => {
    if (!username || username.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const result = await checkUsernameAvailability(username);
    setUsernameStatus(result);
  };

  return (
    <>


      <div
        className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16 bg-[#e5d9c4] relative overflow-hidden"
        style={{ fontFamily: "'Courier Prime', 'Courier New', monospace" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,#46372b 0px,#46372b 1px,transparent 1px,transparent 40px)," +
              "repeating-linear-gradient(90deg,#46372b 0px,#46372b 1px,transparent 1px,transparent 40px)",
          }}
        />

        <div className="relative w-full max-w-lg">
          {/* Wordmark */}
          <div className="text-center mb-7 sm:mb-8">
            <Link href="/" className="inline-block">
              <span
                className="text-3xl sm:text-[2.05rem] font-bold text-[#221910]"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                SUST-LMS
              </span>
            </Link>
            <p
              className="text-[#5c4f42] text-sm mt-2"
              style={{ fontFamily: "Courier Prime, monospace" }}
            >
              Library Management System
            </p>
          </div>

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

          <div className="bg-[#f1e7d8] border border-[#46372b] rounded-sm p-6 sm:p-8 shadow-sm">
            <form action={formAction} className="space-y-5">
              {state?.error && (
                <div className="border border-red-400 bg-red-50 text-red-700 px-4 py-3 rounded-sm text-sm ink-text">
                  {state.error}
                </div>
              )}

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

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="username" className={labelClass}>
                    Username <span className="text-red-500">*</span>
                  </label>
                  {usernameStatus === "checking" && (
                    <span className="text-xs text-[#7a6a5c] ink-text">Checking...</span>
                  )}
                  {usernameStatus === "available" && (
                    <span className="text-xs text-[#3d5c2e] font-semibold ink-text">Available</span>
                  )}
                  {usernameStatus === "unavailable" && (
                    <span className="text-xs text-red-600 font-semibold ink-text">Unavailable</span>
                  )}
                  {usernameStatus === "invalid" && (
                    <span className="text-xs text-red-600 font-semibold ink-text">Invalid</span>
                  )}
                </div>
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
                  className={`${inputClass} ${usernameStatus === "unavailable" || usernameStatus === "invalid"
                    ? "border-red-400 focus:ring-red-500"
                    : usernameStatus === "available"
                      ? "border-[#a3b994] focus:ring-[#6b9e5e]"
                      : ""
                    }`}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (usernameStatus !== "idle") setUsernameStatus("idle");
                  }}
                  onBlur={handleUsernameBlur}
                />
                <p className="mt-1 text-xs text-[#7a6a5c] ink-text">
                  3–30 chars · letters, numbers, underscores only · must be
                  unique
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="phone" className={labelClass}>
                    Phone Number{" "}
                    <span className="text-[#7a6a5c] font-normal">(optional)</span>
                    {phone.length > 0 && (
                      <span className="ml-2 text-[10px] text-[#7a6a5c] font-normal opacity-70">
                        ({phone.length} chars)
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
                  placeholder="01919191919"
                  className={`${inputClass} ${phoneError ? "border-red-400 focus:ring-red-500" : ""
                    }`}
                  value={phone}
                  onChange={handlePhoneChange}
                />
                {phoneError && (
                  <p className="mt-1 text-xs text-red-600 ink-text">{phoneError}</p>
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
                  defaultValue=""
                  className={inputClass}
                >
                  <option value="" disabled>
                    Select your rank
                  </option>
                  <option value="none">None</option>
                  {ranks.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[#7a6a5c] ink-text">
                  Your rank will be unverified until a moderator reviews your
                  profile.
                </p>
              </div>

              <div className="border border-[#c9b99a] bg-[#ede0cc] rounded-sm p-4 space-y-4">
                <div className="flex items-center gap-2 text-[#3f3328]">
                  <FaMapMarkerAlt className="text-[#6e5d4a] shrink-0" />
                  <span className="text-sm font-semibold ink-text tracking-wide uppercase">
                    Thana
                  </span>
                  <span className="text-red-500 text-sm">*</span>
                </div>

                {geoSource === "unavailable" && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-sm border border-red-400/60 bg-red-50/80 text-red-800 text-xs ink-text">
                    <span className="shrink-0 mt-0.5">✕</span>
                    <span>
                      No thanas are available yet. Ask an admin or moderator to
                      add thanas in the dashboard, then refresh this page.
                    </span>
                  </div>
                )}

                <div>
                  <label className={labelClass}>
                    Select thana <span className="text-red-500">*</span>
                  </label>
                  <ThanaCombobox
                    name="thana_id"
                    options={thanas}
                    value={selectedThana}
                    onChange={(id) => {
                      setSelectedThana(id);
                      if (thanas.length > 0) {
                        setGeoSource("supabase");
                      }
                    }}
                    placeholder="Select thana…"
                    searchPlaceholder="Search thana…"
                    disabled={thanas.length === 0}
                    disabledHint="No thanas available yet"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending || thanas.length === 0 || !!phoneError}
                  className="w-full py-3 px-6 bg-[#3f3328] text-[#f4e8d4] font-semibold rounded-sm hover:bg-[#221910] active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ink-title text-base tracking-wide"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {isPending ? "Saving…" : "Save & Continue →"}
                </button>
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-[#7a6a5c] mt-6 ink-text">
            BICS &mdash; Sylhet
          </p>
        </div>
      </div>
    </>
  );
}
