"use client";

import { signOut } from "@/server/auth";
import "@/styles/components.css";
import "@/styles/typography.css";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import {
  FaBars,
  FaBook,
  FaBookOpen,
  FaChartLine,
  FaClipboardList,
  FaExchangeAlt,
  FaGraduationCap,
  FaHome,
  FaMapMarkerAlt,
  FaPrint,
  FaShieldAlt,
  FaTimes,
  FaUser,
  FaUsers,
} from "react-icons/fa";

import type { NotificationItem } from "@/types/library";
import NotificationBell from "./NotificationBell";

interface DashboardShellProps {
  userId: string;
  userName: string;
  userRole: string;
  userAvatar?: string | null;
  initialNotifications: NotificationItem[];
  children: React.ReactNode;
}

const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: FaHome,
    requiresRole: ["admin", "moderator", "member"],
  },
  {
    label: "My Profile",
    href: "/dashboard/profile",
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
    requiresRole: ["admin", "moderator"],
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
    label: "Logs",
    href: "/dashboard/logs",
    icon: FaClipboardList,
    requiresRole: ["admin", "moderator"],
  },
  {
    label: "Thanas",
    href: "/dashboard/thanas",
    icon: FaMapMarkerAlt,
    requiresRole: ["admin", "moderator"],
  },
  {
    label: "Print QR",
    href: "/dashboard/print-qr",
    icon: FaPrint,
    requiresRole: ["admin", "moderator"],
  },
];

export default function DashboardShell({
  userId,
  userName,
  userRole,
  userAvatar,
  initialNotifications,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
    <div className="relative h-screen flex overflow-hidden dashboard-shell print:h-auto print:overflow-visible print:block">


      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Wrapper — natively holds space in the flex layout to prevent shifting */}
      <div className="shrink-0 transition-all duration-300 print:hidden relative z-50 w-14 lg:w-64">
        {/* The actual sidebar — absolute to the wrapper so it can float when expanded */}
        <aside
          className={`absolute top-0 left-0 flex flex-col shrink-0 h-screen overflow-y-auto dashboard-surface tron-border border-r border-[#5e4e3e] transition-all duration-300 ${isMobileOpen ? "w-64 shadow-2xl" : "w-14"} lg:w-64`}
        >
          <Link
            href="/dashboard"
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center py-[17px] border-b border-[#6d5c4a] ink-title text-[#221910] font-bold text-lg overflow-hidden hover:bg-[#ece0ce] transition-colors w-full text-left ${isMobileOpen ? "px-4 gap-3" : "justify-center lg:justify-start lg:px-4 lg:gap-3"}`}
          >
            <div className="w-5 h-5 lg:w-6 lg:h-6 shrink-0 flex items-center justify-center text-[#554738]">
              <FaBook className="w-full h-full hidden lg:block" />
              {isMobileOpen ? <FaTimes className="w-5 h-5 lg:hidden" /> : <FaBars className="w-4 h-4 lg:hidden" />}
            </div>
            <span className={`whitespace-nowrap transition-opacity ${isMobileOpen ? "block" : "hidden lg:block"}`}>
              SUST LMS
            </span>
          </Link>

          <nav className="py-4 pb-8">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              // Determine "flavor" based on role requirements
              const isAdminOnly = item.requiresRole.length === 1 && item.requiresRole[0] === "admin";
              const isModeratorStaff = item.requiresRole.includes("moderator") && !item.requiresRole.includes("member");

              let itemClasses = "";
              let iconClasses = "";

              if (isAdminOnly) {
                // Admin Only: Subtle wine/terracotta tint
                itemClasses = active
                  ? "bg-[#eadcd8] text-[#7d2d23] border-y-[#b0665c] shadow-[inset_4px_0_0_0_#b0665c]"
                  : "bg-[#f1ebe6]/70 text-[#5a4b3f] hover:bg-[#e9dad5] hover:border-y-[#d6a59e]";
                iconClasses = active ? "text-[#7d2d23]" : "text-[#9d5c4d]";
              } else if (isModeratorStaff) {
                // Moderator/Staff: Subtle green tint
                itemClasses = active
                  ? "bg-[#d3decb] text-[#2d4a35] border-y-[#4a7c59] shadow-[inset_4px_0_0_0_#4a7c59]"
                  : "bg-[#ecf1e9]/40 text-[#5a4b3f] hover:bg-[#e1eadc] hover:border-y-[#c8d6c7]";
                iconClasses = active ? "text-[#2d4a35]" : "text-[#4a7c59]";
              } else {
                // General: Default parchment/tan
                itemClasses = active
                  ? "bg-[#eadcc8] text-[#221910] border-y-[#7d6d5a] shadow-[inset_4px_0_0_0_#4e4033]"
                  : "text-[#4d4034] hover:bg-[#ece0ce] hover:border-y-[#b59f86]";
                iconClasses = active ? "text-[#221910]" : "text-[#554738]";
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center py-3 transition-colors ink-text border-y border-transparent overflow-hidden ${isMobileOpen ? "px-4 gap-3" : "justify-center lg:justify-start lg:px-4 lg:gap-3"} ${itemClasses}`}
                  title={item.label}
                >
                  <div className={`w-5 h-5 lg:w-6 lg:h-6 shrink-0 flex items-center justify-center ${iconClasses}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`font-medium whitespace-nowrap transition-opacity ${isMobileOpen ? "block" : "hidden lg:block"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto flex flex-col print:overflow-visible">
        {/* Top Bar — always visible */}
        <div className="sticky top-0 z-20 dashboard-surface border-b border-[#6f5f4f] px-4 lg:px-8 py-3 print:hidden">
          <div className="flex items-center justify-between">
            <h1 className="text-lg lg:text-xl font-semibold text-[#221910] ink-title">
              {pathname === "/dashboard"
                ? "Home"
                : pathname.startsWith("/dashboard/profile")
                  ? "My Profile"
                  : "Dashboard"}
            </h1>
            <div className="flex items-center gap-2 lg:gap-5">
              <NotificationBell userId={userId} notifications={initialNotifications} />

              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 text-sm text-[#5a4b3f] ink-text hover:text-[#221910] transition-colors"
              >
                {userAvatar ? (
                  <Image
                    src={userAvatar}
                    alt={userName}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full object-cover border border-[#8a7966]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#d9cbb7] border border-[#8a7966] flex items-center justify-center text-xs font-bold text-[#4a3e33]">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:block">
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
        <div className="flex-1 px-1 py-4 sm:p-4 lg:p-8 pb-20 print:p-0 print:m-0">
          {children}
        </div>
      </main>
    </div>
  );
}
