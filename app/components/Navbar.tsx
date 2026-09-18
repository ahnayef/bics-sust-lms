"use client";

import { useTranslation } from "@/lib/i18n/context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface NavbarProps {
  isLoggedIn?: boolean;
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();

  const ctaHref = isLoggedIn ? "/dashboard" : "/login";
  const ctaLabel = isLoggedIn ? t.nav.dashboard : t.nav.signIn;

  const logoHref = pathname.startsWith("/dashboard") ? "/dashboard" : "/";

  return (
    <nav
      className="fixed top-0 w-full z-50 border-b-2 border-[#3c342d]"
      style={{
        backgroundColor: "#e8dcc8",
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.01) 2px, rgba(0,0,0,.01) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.01) 2px, rgba(0,0,0,.01) 4px)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href={logoHref}
            className="flex flex-col items-start leading-none"
          >
            <span
              className="text-2xl font-bold tracking-tight text-[#1f1a17]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              SUST Pathagar
            </span>
            <span
              className="text-xs tracking-[0.14em] text-[#4a4038]"
              style={{ fontFamily: "Courier Prime, monospace" }}
            >
              {t.nav.weeklyEdition}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/#features"
              className="text-[#2c2520] hover:text-black font-semibold tracking-wide text-sm transition-colors"
              style={{ fontFamily: "Courier Prime, monospace" }}
            >
              {t.nav.features}
            </Link>
            <Link
              href="/contact"
              className="text-[#2c2520] hover:text-black font-semibold tracking-wide text-sm transition-colors"
              style={{ fontFamily: "Courier Prime, monospace" }}
            >
              {t.nav.contact}
            </Link>
            <LanguageSwitcher />
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link
              href={ctaHref}
              className="px-5 py-2 font-semibold text-sm transition-colors border border-[#6d6053] bg-[#6d6053] text-[#f3ebdd] hover:bg-[#5b5045]"
              style={{ fontFamily: "Courier Prime, monospace" }}
            >
              {ctaLabel}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 border border-[#6d6053] text-[#1f1a17] hover:bg-[#d9cbb7]"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div
            className="md:hidden absolute top-16 left-0 w-full border-b-2 border-[#3c342d] py-4 px-4 space-y-4"
            style={{ backgroundColor: "#e8dcc8" }}
          >
            <Link
              href="/#features"
              onClick={() => setIsOpen(false)}
              className="block text-[#2c2520] font-semibold tracking-wide text-sm"
              style={{ fontFamily: "Courier Prime, monospace" }}
            >
              {t.nav.features}
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="block text-[#2c2520] font-semibold tracking-wide text-sm"
              style={{ fontFamily: "Courier Prime, monospace" }}
            >
              {t.nav.contact}
            </Link>
            <div className="pt-2 border-t border-[#6d6053]/20">
              <LanguageSwitcher />
            </div>
            <Link
              href={ctaHref}
              onClick={() => setIsOpen(false)}
              className="block w-full text-center px-5 py-2 font-semibold text-sm border border-[#6d6053] bg-[#6d6053] text-[#f3ebdd]"
              style={{ fontFamily: "Courier Prime, monospace" }}
            >
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
