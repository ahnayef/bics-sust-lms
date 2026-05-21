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
import { useTranslation } from "@/lib/i18n/context";
import type { NotificationItem } from "@/types/library";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
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
import { cn } from "@/lib/utils";

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { t } = useTranslation();

  const navigationItems = [
    {
      label: t.dashboard.sidebar.dashboard,
      href: "/dashboard",
      icon: FaHome,
      requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR, USER_ROLES.MEMBER],
    },
    {
      label: t.dashboard.sidebar.myProfile,
      href: "/dashboard/profile",
      icon: FaUser,
      requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR, USER_ROLES.MEMBER],
    },
    {
      label: t.dashboard.sidebar.bookList,
      href: "/dashboard/book-list",
      icon: FaBookOpen,
      requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR, USER_ROLES.MEMBER],
    },
    {
      label: t.dashboard.sidebar.overview,
      href: "/dashboard/overview",
      icon: FaChartLine,
      requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
    },
    {
      label: t.dashboard.sidebar.transactions,
      href: "/dashboard/transactions",
      icon: FaExchangeAlt,
      requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
    },
    {
      label: t.dashboard.sidebar.books,
      href: "/dashboard/books",
      icon: FaBook,
      requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
    },
    {
      label: t.dashboard.sidebar.copies,
      href: "/dashboard/copies",
      icon: FaGraduationCap,
      requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
    },
    {
      label: t.dashboard.sidebar.users,
      href: "/dashboard/users",
      icon: FaUsers,
      requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
    },
    {
      label: t.dashboard.sidebar.moderators,
      href: "/dashboard/moderators",
      icon: FaShieldAlt,
      requiresRole: [USER_ROLES.ADMIN],
    },
    {
      label: t.dashboard.sidebar.ranks,
      href: "/dashboard/ranks",
      icon: FaShieldAlt,
      requiresRole: [USER_ROLES.ADMIN],
    },
    {
      label: t.dashboard.sidebar.categories,
      href: "/dashboard/categories",
      icon: FaClipboardList,
      requiresRole: [USER_ROLES.ADMIN],
    },
    {
      label: t.dashboard.sidebar.logs,
      href: "/dashboard/logs",
      icon: FaClipboardList,
      requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
    },
    {
      label: t.dashboard.sidebar.thanas,
      href: "/dashboard/thanas",
      icon: FaMapMarkerAlt,
      requiresRole: [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
    },
    {
      label: t.dashboard.sidebar.printQr,
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

  const visibleNavItems = navigationItems.filter((item) =>
    (item.requiresRole as string[]).includes(userRole),
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
        {/* NOTE FROM DEV: DO NOT CHANGE THE RANDOM py-5 AND md:py-4 CLASSES, THEY ARE MUST FOR THINGS TO BE PROPERLY ALIGNED! */}
        <aside
          className={`absolute top-0 left-0 flex flex-col shrink-0 h-screen overflow-y-auto dashboard-surface tron-border border-r border-[#5e4e3e] transition-all duration-300 ${isMobileOpen ? "w-64 shadow-2xl" : "w-14"} lg:w-64`}
        >
          <div className={`flex items-center border-b border-[#6d5c4a] overflow-hidden hover:bg-[#ece0ce] transition-colors w-full ${isMobileOpen ? "px-4" : "justify-center lg:justify-start lg:px-4"}`}>
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className={cn("shrink-0 flex items-center justify-center text-[#554738] lg:hidden", isMobileOpen ? "py-[18px]" : "py-5")}
            >
              {isMobileOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-4 h-4" />}
            </button>

            <Link
              href="/dashboard"
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center md:py-4 ink-title text-[#221910] font-bold text-lg gap-3 ${isMobileOpen ? "block" : "hidden lg:flex"}`}
            >
              <FaBook className="w-5 h-5 lg:w-6 lg:h-6 shrink-0 hidden lg:block text-[#554738]" />
              <span className="ml-3 whitespace-nowrap transition-opacity">
                SUST LMS
              </span>
            </Link>
          </div>

          <nav className="py-4 pb-8">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              // Determine "flavor" based on role requirements
              const roles = item.requiresRole as string[];
              const isAdminOnly = roles.length === 1 && roles[0] === USER_ROLES.ADMIN;
              const isModeratorStaff = roles.includes(USER_ROLES.MODERATOR) && !roles.includes(USER_ROLES.MEMBER);

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
                  <span className={`font-medium whitespace-nowrap transition-opacity ${isMobileOpen ? "block text-sm" : "hidden lg:block"}`}>
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
                ? t.dashboard.sidebar.dashboard
                : pathname.startsWith("/dashboard/profile")
                  ? t.dashboard.sidebar.myProfile
                  : navigationItems.find((item) => isActive(item.href))?.label ||
                  t.dashboard.sidebar.dashboard}
            </h1>
            <div className="flex items-center gap-2 lg:gap-5">
              <div className="hidden sm:flex items-center gap-2 lg:gap-5">
                <LanguageSwitcher />
                <NotificationBell userId={userId} notifications={initialNotifications} />

                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 text-sm text-[#5a4b3f] ink-text hover:text-[#221910] transition-colors focus:outline-none"
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
                    <span>
                      {t.dashboard.header.welcome}{" "}
                      <span className="font-semibold text-[#2f251d]">
                        {userName}
                      </span>
                    </span>
                  </button>

                  {isProfileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsProfileOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-[#f6ecdd] border border-[#8a7966] rounded-sm shadow-xl z-40 py-2">
                        <div className="px-4 py-2 border-b border-[#eadcc8] mb-1">
                          <p className="text-xs text-[#5c4f42] uppercase tracking-wider">{t.dashboard.header.welcome}</p>
                          <p className="text-sm font-bold text-[#221910] truncate">{userName}</p>
                        </div>
                        <form action={signOut}>
                          <button
                            type="submit"
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-[#fdf0ec] transition-colors font-medium"
                          >
                            <FaBars className="w-3.5 h-3.5 rotate-90" />
                            {t.dashboard.header.logout}
                          </button>
                        </form>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Profile Dropdown */}
              <div className="sm:hidden flex items-center gap-3">
                <NotificationBell userId={userId} notifications={initialNotifications} />
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center focus:outline-none"
                  >
                    {userAvatar ? (
                      <Image
                        src={userAvatar}
                        alt={userName}
                        width={32}
                        height={32}
                        priority
                        className="w-8 h-8 rounded-full object-cover border border-[#8a7966]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#d9cbb7] border border-[#8a7966] flex items-center justify-center text-sm font-bold text-[#4a3e33]">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>

                  {isProfileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsProfileOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-[#f6ecdd] border border-[#8a7966] rounded-sm shadow-xl z-40 py-2">
                        <div className="px-4 py-2 border-b border-[#eadcc8] mb-1">
                          <p className="text-xs text-[#5c4f42] uppercase tracking-wider">{t.dashboard.header.welcome}</p>
                          <p className="text-sm font-bold text-[#221910] truncate">{userName}</p>
                        </div>
                        <div className="px-4 py-2 border-b border-[#eadcc8] my-1">
                          <LanguageSwitcher />
                        </div>
                        <form action={signOut} className="mt-1">
                          <button
                            type="submit"
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-[#fdf0ec] transition-colors font-medium"
                          >
                            <FaBars className="w-3.5 h-3.5 rotate-90" />
                            {t.dashboard.header.logout}
                          </button>
                        </form>
                      </div>
                    </>
                  )}
                </div>
              </div>
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
