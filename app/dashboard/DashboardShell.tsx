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

import { UserRole } from "@/lib/constants";
import type { NotificationItem } from "@/types/library";
import NotificationBell from "./NotificationBell";

interface DashboardShellProps {
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar?: string | null;
  initialNotifications: NotificationItem[];
  children: React.ReactNode;
}

import { USER_ROLES } from "@/lib/constants";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: FaHome,
    requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR, USER_ROLES.MEMBER],
  },
  {
    label: "My Profile",
    href: "/dashboard/profile",
    icon: FaUser,
    requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR, USER_ROLES.MEMBER],
  },
  {
    label: "Book List",
    href: "/dashboard/book-list",
    icon: FaBookOpen,
    requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR, USER_ROLES.MEMBER],
  },
  {
    label: "Overview",
    href: "/dashboard/overview",
    icon: FaChartLine,
    requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
  },
  {
    label: "Moderators",
    href: "/dashboard/moderators",
    icon: FaShieldAlt,
    requiresRole: [USER_ROLES.ADMIN],
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: FaUsers,
    requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
  },
  {
    label: "Books",
    href: "/dashboard/books",
    icon: FaBook,
    requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
  },
  {
    label: "Copies",
    href: "/dashboard/copies",
    icon: FaGraduationCap,
    requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
  },
  {
    label: "Transactions",
    href: "/dashboard/transactions",
    icon: FaExchangeAlt,
    requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
  },
  {
    label: "Logs",
    href: "/dashboard/logs",
    icon: FaClipboardList,
    requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
  },
  {
    label: "Thanas",
    href: "/dashboard/thanas",
    icon: FaMapMarkerAlt,
    requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
  },
  {
    label: "Ranks",
    href: "/dashboard/ranks",
    icon: FaShieldAlt,
    requiresRole: [USER_ROLES.ADMIN],
  },
  {
    label: "Print QR",
    href: "/dashboard/print-qr",
    icon: FaPrint,
    requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
  },
];

const ADMIN_COLOR = {
  active: "bg-[#dbe6f1] text-[#234b7d] border-y-[#5c8ab0] shadow-[inset_4px_0_0_0_#5c8ab0]",
  inactive: "bg-[#e6ebf1]/70 text-[#3f4b5a] hover:bg-[#d5dee9] hover:border-y-[#9eb0d6]",
  iconActive: "text-[#234b7d]",
  iconInactive: "text-[#4d719d]",
};

const MODERATOR_COLOR = {
  active: "bg-[#d3decb] text-[#2d4a35] border-y-[#4a7c59] shadow-[inset_4px_0_0_0_#4a7c59]",
  inactive: "bg-[#ecf1e9]/40 text-[#5a4b3f] hover:bg-[#e1eadc] hover:border-y-[#c8d6c7]",
  iconActive: "text-[#2d4a35]",
  iconInactive: "text-[#4a7c59]",
};

const GENERAL_COLOR = {
  active: "bg-[#eadcc8] text-[#221910] border-y-[#7d6d5a] shadow-[inset_4px_0_0_0_#4e4033]",
  inactive: "text-[#4d4034] hover:bg-[#ece0ce] hover:border-y-[#b59f86]",
  iconActive: "text-[#221910]",
  iconInactive: "text-[#554738]",
};

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
              const isAdminOnly = item.requiresRole.length === 1 && item.requiresRole[0] === USER_ROLES.ADMIN;
              const isModeratorStaff = item.requiresRole.includes(USER_ROLES.MODERATOR) && !item.requiresRole.includes(USER_ROLES.MEMBER);

              let itemClasses = "";
              let iconClasses = "";

              if (isAdminOnly) {
                // Admin Only: Subtle bluish tint
                itemClasses = active ? ADMIN_COLOR.active : ADMIN_COLOR.inactive;
                iconClasses = active ? ADMIN_COLOR.iconActive : ADMIN_COLOR.iconInactive;
              } else if (isModeratorStaff) {
                // Moderator/Staff: Subtle green tint
                itemClasses = active ? MODERATOR_COLOR.active : MODERATOR_COLOR.inactive;
                iconClasses = active ? MODERATOR_COLOR.iconActive : MODERATOR_COLOR.iconInactive;
              } else {
                // General: Default parchment/tan
                itemClasses = active ? GENERAL_COLOR.active : GENERAL_COLOR.inactive;
                iconClasses = active ? GENERAL_COLOR.iconActive : GENERAL_COLOR.iconInactive;
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
                    priority
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
