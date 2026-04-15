"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FaBars,
  FaBook,
  FaBookOpen,
  FaHistory,
  FaQrcode,
  FaTimes,
  FaUndoAlt,
  FaUser,
} from "react-icons/fa";

const getLinkClassName = (isActive: boolean) =>
  `flex items-center text-xs sm:text-sm font-medium transition-colors px-2 sm:px-3 py-2 rounded-md ink-text ${
    isActive
      ? "bg-[#d9c7ad] text-[#201710] border border-[#8b775f]"
      : "text-[#4e4033] hover:text-[#201710] hover:bg-[#e9dcc9] border border-transparent"
  }`;

export default function UserNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isBookList = pathname === "/book-list";
  const isProfile = pathname === "/profile";
  const isHistory = pathname === "/history";
  const isBorrow = pathname === "/borrow";
  const isReturn = pathname === "/return";

  const navLinks = [
    {
      href: "/book-list",
      label: "Books",
      icon: FaBookOpen,
      isActive: isBookList,
    },
    {
      href: "/profile",
      label: "Profile",
      icon: FaUser,
      isActive: isProfile,
    },
    {
      href: "/history",
      label: "History",
      icon: FaHistory,
      isActive: isHistory,
    },
    {
      href: "/return",
      label: "Return",
      icon: FaUndoAlt,
      isActive: isReturn,
    },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-[#5a4a3b] bg-[#f1e7d8]">
      <div className="w-full px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link
            href="/profile"
            className="flex items-center gap-1 sm:gap-2 font-bold text-[#221910] hover:text-[#3d3024] transition-colors shrink-0 min-w-0"
          >
            <FaBook className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            <span className="text-sm sm:text-lg font-bold truncate ink-title">
              BICS SUST LMS
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 sm:gap-4 lg:gap-6 ml-2 sm:ml-4">
            {navLinks.map((link) => {
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={getLinkClassName(link.isActive)}
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <Icon className="w-3 h-3" />
                    {link.label}
                  </span>
                </Link>
              );
            })}

            <Link
              href="/borrow"
              className={`inline-flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 h-10 sm:h-auto ink-text border ${
                isBorrow
                  ? "bg-[#3f352b] text-[#f6ede1] border-[#3f352b]"
                  : "bg-[#5a4d40] text-[#f6ede1] border-[#5a4d40] hover:bg-[#4c4035]"
              }`}
            >
              <FaQrcode className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">Borrow</span>
              <span className="sm:hidden text-xs font-bold">QR</span>
            </Link>
          </div>

          <div className="flex sm:hidden items-center gap-2 ml-2">
            <Link
              href="/borrow"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg font-semibold text-xs transition-colors whitespace-nowrap h-10 ink-text border ${
                isBorrow
                  ? "bg-[#3f352b] text-[#f6ede1] border-[#3f352b]"
                  : "bg-[#5a4d40] text-[#f6ede1] border-[#5a4d40] hover:bg-[#4c4035]"
              }`}
            >
              <FaQrcode className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold">QR</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#8b775f] bg-[#e9dcc9] text-[#2c2018]"
              aria-expanded={isMobileMenuOpen}
              aria-label={
                isMobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
            >
              {isMobileMenuOpen ? (
                <FaTimes className="w-4 h-4" />
              ) : (
                <FaBars className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="sm:hidden pb-3">
            <div className="rounded-lg border border-[#8b775f] bg-[#f1e7d8] p-2 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium ink-text border transition-colors ${
                      link.isActive
                        ? "bg-[#d9c7ad] text-[#201710] border-[#8b775f]"
                        : "text-[#4e4033] hover:text-[#201710] hover:bg-[#e9dcc9] border-transparent"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
