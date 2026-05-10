"use client";

import { signOut } from "@/server/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  FaBook,
  FaBookOpen,
  FaChartLine,
  FaExchangeAlt,
  FaGraduationCap,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaUser,
  FaUsers,
} from "react-icons/fa";

interface DashboardShellProps {
  userName: string;
  userRole: string;
  userAvatar?: string | null;
  children: React.ReactNode;
}

const navigationItems = [
  {
    label: "My Profile",
    href: "/dashboard",
    icon: FaUser,
    requiresRole: ["admin", "moderator", "member"],
  },
  {
    label: "Book List",
    href: "/dashboard/book-list",
    icon: FaBookOpen,
    requiresRole: ["admin", "moderator", "member"],
  },
  {
    label: "Overview",
    href: "/dashboard/overview",
    icon: FaChartLine,
    requiresRole: ["admin", "moderator", "member"],
  },
  {
    label: "Moderators",
    href: "/dashboard/moderators",
    icon: FaShieldAlt,
    requiresRole: ["admin"],
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: FaUsers,
    requiresRole: ["admin", "moderator"],
  },
  {
    label: "Books",
    href: "/dashboard/books",
    icon: FaBook,
    requiresRole: ["admin", "moderator"],
  },
  {
    label: "Copies",
    href: "/dashboard/copies",
    icon: FaGraduationCap,
    requiresRole: ["admin", "moderator"],
  },
  {
    label: "Transactions",
    href: "/dashboard/transactions",
    icon: FaExchangeAlt,
    requiresRole: ["admin", "moderator"],
  },
  {
    label: "Thanas",
    href: "/dashboard/thanas",
    icon: FaMapMarkerAlt,
    requiresRole: ["admin"],
  },
];

export default function DashboardShell({
  userName,
  userRole,
  userAvatar,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();

  const visibleNavItems = navigationItems.filter((item) =>
    item.requiresRole.includes(userRole),
  );

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="h-screen flex overflow-hidden dashboard-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Courier+Prime:wght@400;700&display=swap');

        .dashboard-shell {
          background-image:
            linear-gradient(180deg, #eee4d3 0%, #e5d8c1 52%, #dcccb2 100%),
            linear-gradient(92deg, rgba(88, 66, 46, 0.05), transparent 24%),
            linear-gradient(268deg, rgba(88, 66, 46, 0.04), transparent 18%),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px),
            url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="4" seed="13"/></filter><rect width="220" height="220" fill="%23e5d9c4"/><rect width="220" height="220" filter="url(%23p)" opacity="0.028"/></svg>');
        }

        .ink-text {
          font-family: 'Courier Prime', monospace;
        }

        .ink-title {
          font-family: 'Playfair Display', serif;
        }

        .dashboard-surface {
          background-color: #f1e7d8;
          border: 1px solid #46372b;
          box-shadow: inset 0 0 0 1px rgba(244, 235, 219, 0.55), 0 0 0 1px rgba(69, 55, 43, 0.2);
        }

        .tron-border {
          position: relative;
          overflow: hidden;
        }

        .tron-border::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            repeating-linear-gradient(90deg, rgba(77, 59, 43, 0.24) 0 3px, transparent 3px 20px) top / 100% 1px no-repeat,
            repeating-linear-gradient(90deg, rgba(77, 59, 43, 0.18) 0 2px, transparent 2px 18px) bottom / 100% 1px no-repeat,
            repeating-linear-gradient(180deg, rgba(77, 59, 43, 0.18) 0 2px, transparent 2px 16px) left / 1px 100% no-repeat,
            repeating-linear-gradient(180deg, rgba(77, 59, 43, 0.14) 0 2px, transparent 2px 20px) right / 1px 100% no-repeat;
          opacity: 0.78;
        }
      `}</style>

      {/* Sidebar — always visible, narrow on mobile, full on lg+ */}
      <aside className="flex flex-col shrink-0 w-14 lg:w-64 h-screen overflow-y-auto dashboard-surface tron-border border-r border-[#5e4e3e] transition-all duration-300">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 lg:px-6 py-5 border-b border-[#6d5c4a] ink-title text-[#221910] font-bold text-lg overflow-hidden"
        >
          <FaBook className="w-5 h-5 lg:w-6 lg:h-6 text-[#554738] shrink-0" />
          <span className="hidden lg:block whitespace-nowrap">
            BICS SUST LMS
          </span>
        </Link>

        <nav className="px-2 lg:px-4 py-4 space-y-2 pb-8">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 lg:px-4 py-3 rounded-sm transition-colors ink-text border overflow-hidden ${
                  isActive(item.href)
                    ? "bg-[#eadcc8] text-[#221910] border-[#7d6d5a]"
                    : "text-[#4d4034] border-transparent hover:bg-[#ece0ce] hover:border-[#b59f86]"
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden lg:block font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto flex flex-col">
        {/* Top Bar — always visible */}
        <div className="sticky top-0 z-20 dashboard-surface border-b border-[#6f5f4f] px-4 lg:px-8 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg lg:text-xl font-semibold text-[#221910] ink-title">
              Dashboard
            </h1>
            <div className="flex items-center gap-3 lg:gap-6">
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-2 text-sm text-[#5a4b3f] ink-text hover:text-[#221910] transition-colors"
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-7 h-7 rounded-full object-cover border border-[#8a7966]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#d9cbb7] border border-[#8a7966] flex items-center justify-center text-xs font-bold text-[#4a3e33]">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span>
                  Welcome back,{" "}
                  <span className="font-semibold text-[#2f251d]">
                    {userName}
                  </span>
                </span>
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="cursor-pointer px-3 py-1.5 lg:px-4 lg:py-2 bg-[#f0e4d1] text-[#4c3e31] border border-[#8a7966] rounded-sm hover:bg-[#eadcc8] transition-colors font-medium text-sm ink-text"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-8 pb-20">{children}</div>
      </main>
    </div>
  );
}
