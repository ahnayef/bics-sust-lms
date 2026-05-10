"use client";

import Link from "next/link";
import { useState } from "react";

interface NavbarProps {
  isLoggedIn?: boolean;
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const ctaHref = isLoggedIn ? "/dashboard" : "/login";
  const ctaLabel = isLoggedIn ? "Dashboard" : "Sign In";

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
            href={isLoggedIn ? "/dashboard" : "/"}
            className="flex flex-col items-start leading-none"
          >
            <span
              className="text-2xl font-bold tracking-tight text-[#1f1a17]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              SUST LMS
            </span>
            <span
              className="text-xs tracking-[0.14em] text-[#4a4038]"
              style={{ fontFamily: "Courier Prime, monospace" }}
            >
              Weekly Edition
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {!isLoggedIn && (
              <>
                <Link
                  href="#features"
                  className="text-[#2c2520] hover:text-black font-semibold tracking-wide text-sm transition-colors"
                  style={{ fontFamily: "Courier Prime, monospace" }}
                >
                  Features
                </Link>
                <Link
                  href="#contact"
                  className="text-[#2c2520] hover:text-black font-semibold tracking-wide text-sm transition-colors"
                  style={{ fontFamily: "Courier Prime, monospace" }}
                >
                  Contact
                </Link>
              </>
            )}
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
          <div className="md:hidden pb-4 pt-2 space-y-2 border-t border-[#3c342d]">
            {!isLoggedIn && (
              <>
                <Link
                  href="#features"
                  className="block px-4 py-2 text-[#2c2520] hover:bg-[#d9cbb7] tracking-wide font-semibold"
                  style={{ fontFamily: "Courier Prime, monospace" }}
                  onClick={() => setIsOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="#contact"
                  className="block px-4 py-2 text-[#2c2520] hover:bg-[#d9cbb7] tracking-wide font-semibold"
                  style={{ fontFamily: "Courier Prime, monospace" }}
                  onClick={() => setIsOpen(false)}
                >
                  Contact
                </Link>
              </>
            )}
            <Link
              href={ctaHref}
              className="block px-4 py-2 bg-[#6d6053] text-[#f3ebdd] font-semibold tracking-wide hover:bg-[#5b5045]"
              style={{ fontFamily: "Courier Prime, monospace" }}
              onClick={() => setIsOpen(false)}
            >
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
