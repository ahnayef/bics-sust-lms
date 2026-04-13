"use client";

import Link from "next/link";
import { FaBookOpen, FaHome, FaSearch } from "react-icons/fa";

export default function NotFound() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_top,#f5ecdb_0%,#e8d8bf_38%,#d7c2a2_100%)] text-[#221910]">
      <div className="absolute inset-0 opacity-70 bg-[linear-gradient(rgba(72,52,34,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(72,52,34,0.08)_1px,transparent_1px)] bg-size-[36px_36px]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-[#f8f0e2]/70 to-transparent" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="dashboard-surface tron-border w-full max-w-2xl rounded-sm border border-[#5f4f40] px-5 py-8 sm:px-8 sm:py-10 shadow-[0_24px_60px_rgba(61,42,24,0.16)]">
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#8b785f] bg-[#f3e7d2] px-4 py-2 text-sm font-medium uppercase tracking-[0.16em] text-[#5c4b3f] ink-text">
              <FaSearch className="h-4 w-4" />
              Page not found
            </div>

            <div className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-full border border-[#b89e7f] bg-[#f7eddc] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] sm:h-32 sm:w-32">
              <FaBookOpen className="h-12 w-12 text-[#6b5845] sm:h-14 sm:w-14" />
              <span className="absolute -bottom-2 rounded-full border border-[#7e6954] bg-[#3f3328] px-3 py-1 text-xs font-semibold tracking-[0.2em] text-[#f4e8d4]">
                404
              </span>
            </div>

            <h1 className="ink-title text-3xl font-bold leading-tight sm:text-5xl">
              This page has been misplaced in the archives.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-[#5d4d40] sm:text-base ink-text">
              The address you opened does not match any current route. Return to
              the homepage to continue.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-[#4e4033] bg-[#3f3328] px-5 py-3 font-medium text-[#f4e8d4] transition-colors hover:bg-[#4a3d31] ink-text"
              >
                <FaHome className="h-4 w-4" />
                Back to home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
