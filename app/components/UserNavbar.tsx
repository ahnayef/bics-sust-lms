"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBook, FaBookOpen, FaQrcode, FaUndoAlt } from "react-icons/fa";

const getLinkClassName = (isActive: boolean) =>
  `text-xs sm:text-sm font-medium transition-colors px-2 sm:px-3 py-2 rounded-md ink-text ${
    isActive
      ? "bg-[#d9c7ad] text-[#201710] border border-[#8b775f]"
      : "text-[#4e4033] hover:text-[#201710] hover:bg-[#e9dcc9] border border-transparent"
  }`;

export default function UserNavbar() {
  const pathname = usePathname();

  const isBookList = pathname === "/book-list";
  const isProfile = pathname === "/profile";
  const isHistory = pathname === "/history";
  const isBorrow = pathname === "/borrow";
  const isReturn = pathname === "/return";

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

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 ml-2 sm:ml-4">
            <Link href="/book-list" className={getLinkClassName(isBookList)}>
              <span className="inline-flex items-center gap-1.5">
                <FaBookOpen className="w-3 h-3" />
                Books
              </span>
            </Link>
            <Link href="/profile" className={getLinkClassName(isProfile)}>
              Profile
            </Link>
            <Link href="/history" className={getLinkClassName(isHistory)}>
              History
            </Link>
            <Link href="/return" className={getLinkClassName(isReturn)}>
              <span className="inline-flex items-center gap-1.5">
                <FaUndoAlt className="w-3 h-3" />
                Return
              </span>
            </Link>

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
        </div>
      </div>
    </nav>
  );
}
