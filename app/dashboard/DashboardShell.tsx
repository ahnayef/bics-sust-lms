"use client";

import { signOut } from "@/server/auth";
import "@/styles/components.css";
import "@/styles/typography.css";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import {
  FaBook,
  FaBookOpen,
  FaChartLine,
  FaCheckSquare,
  FaClipboardList,
  FaExchangeAlt,
  FaFileExport,
  FaGraduationCap,
  FaHome,
  FaMapMarkerAlt,
  FaPrint,
  FaQrcode,
  FaShieldAlt,
  FaTimes,
  FaTruck,
  FaUser,
  FaUsers,
} from "react-icons/fa";

import { USER_ROLES, UserRole } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
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

export default function DashboardShell({
  userId,
  userName,
  userRole,
  userAvatar,
  initialNotifications,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [isStaffDrawerOpen, setIsStaffDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { t, language } = useTranslation();

  const isStaff =
    userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.MODERATOR;
  const isAdmin = userRole === USER_ROLES.ADMIN;

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Nav item styles
  const navLinkClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ink-text",
      active
        ? "bg-[#eadcc8] text-[#221910] shadow-xs border border-[#8a7966]/40 font-bold"
        : "text-[#5a4b3f] hover:bg-[#ece0ce] hover:text-[#221910]",
    );

  const staffLinkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors",
      active
        ? "bg-[#d3decb] text-[#2d4a35] font-bold border border-[#4a7c59]/40"
        : "text-[#4a3e33] hover:bg-[#e6eee0] hover:text-[#2d4a35]",
    );

  const memberNavItems = [
    { label: t.dashboard.sidebar.dashboard, href: "/dashboard", icon: FaHome },
    {
      label: t.dashboard.sidebar.bookList,
      href: "/dashboard/book-list",
      icon: FaBookOpen,
    },
    {
      label: t.dashboard.sidebar.homeDelivery,
      href: "/dashboard/home-delivery",
      icon: FaTruck,
    },
    {
      label: t.dashboard.sidebar.checklists,
      href: "/dashboard/checklists",
      icon: FaCheckSquare,
    },
    {
      label: t.dashboard.sidebar.myProfile,
      href: "/dashboard/profile",
      icon: FaUser,
    },
  ];

  const circulationItems = [
    {
      label: t.dashboard.sidebar.overview,
      href: "/dashboard/overview",
      icon: FaChartLine,
    },
    {
      label: t.dashboard.sidebar.transactions,
      href: "/dashboard/transactions",
      icon: FaExchangeAlt,
    },
  ];

  const inventoryItems = [
    {
      label: t.dashboard.sidebar.books,
      href: "/dashboard/books",
      icon: FaBook,
    },
    {
      label: t.dashboard.sidebar.copies,
      href: "/dashboard/copies",
      icon: FaGraduationCap,
    },
    {
      label: t.dashboard.sidebar.categories,
      href: "/dashboard/categories",
      icon: FaClipboardList,
    },
    {
      label: t.dashboard.sidebar.printQr,
      href: "/dashboard/print-qr",
      icon: FaPrint,
    },
    {
      label: t.dashboard.sidebar.exports,
      href: "/dashboard/exports",
      icon: FaFileExport,
    },
  ];

  const communityItems = [
    {
      label: t.dashboard.sidebar.users,
      href: "/dashboard/users",
      icon: FaUsers,
    },
    {
      label: t.dashboard.sidebar.moderators,
      href: "/dashboard/moderators",
      icon: FaShieldAlt,
    },
    {
      label: t.dashboard.sidebar.ranks,
      href: "/dashboard/ranks",
      icon: FaShieldAlt,
    },
    {
      label: t.dashboard.sidebar.thanas,
      href: "/dashboard/thanas",
      icon: FaMapMarkerAlt,
    },
  ];

  return (
    <div className="relative h-screen flex overflow-hidden dashboard-shell print:h-auto print:overflow-visible print:block bg-[#f4ebd9]">
      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* Desktop Sidebar (hidden on mobile)                                     */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col shrink-0 w-64 h-screen overflow-y-auto dashboard-surface tron-border border-r border-[#5e4e3e] z-30 select-none">
        {/* Brand Header */}
        <div className="flex items-center px-5 py-4 border-b border-[#6d5c4a] shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 ink-title text-[#221910] font-bold text-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-[#3f3328] text-[#f4e8d4] flex items-center justify-center shadow-xs">
              <FaBook className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="leading-none text-base">SUST LMS</span>
              <span className="text-[10px] text-[#7a6a5c] font-normal mt-0.5 tracking-wider uppercase">
                {isStaff ? (isAdmin ? "Admin Desk" : "Staff Desk") : "Library"}
              </span>
            </div>
          </Link>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="p-3 space-y-6 flex-1 overflow-y-auto">
          {/* Member Section */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-[#7a6a5c] mb-1.5">
              {t.dashboard.sidebar.myLibrary}
            </p>
            {memberNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLinkClass(active)}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0",
                      active ? "text-[#221910]" : "text-[#7a6a5c]",
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Staff Desk (Moderator & Admin) */}
          {isStaff && (
            <div className="space-y-4 pt-3 border-t border-[#6d5c4a]/30">
              <div className="px-3 flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#4a7c59]">
                  {t.dashboard.sidebar.staffDesk}
                </p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-[#d3decb] text-[#2d4a35] border border-[#4a7c59]/30 uppercase">
                  {userRole}
                </span>
              </div>

              {/* Circulation */}
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-semibold text-[#6d5c4a]">
                  {t.dashboard.sidebar.circulation}
                </p>
                {circulationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={staffLinkClass(active)}
                    >
                      <Icon
                        className={cn(
                          "w-3.5 h-3.5 shrink-0",
                          active ? "text-[#2d4a35]" : "text-[#4a7c59]",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Inventory */}
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-semibold text-[#6d5c4a]">
                  {t.dashboard.sidebar.inventory}
                </p>
                {inventoryItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={staffLinkClass(active)}
                    >
                      <Icon
                        className={cn(
                          "w-3.5 h-3.5 shrink-0",
                          active ? "text-[#2d4a35]" : "text-[#4a7c59]",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Members */}
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-semibold text-[#6d5c4a]">
                  {t.dashboard.sidebar.community}
                </p>
                {communityItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={staffLinkClass(active)}
                    >
                      <Icon
                        className={cn(
                          "w-3.5 h-3.5 shrink-0",
                          active ? "text-[#2d4a35]" : "text-[#4a7c59]",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Syllabus & Logs */}
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-semibold text-[#6d5c4a]">
                  {t.dashboard.sidebar.system}
                </p>
                <Link
                  href="/dashboard/checklists-manage"
                  className={staffLinkClass(
                    isActive("/dashboard/checklists-manage"),
                  )}
                >
                  <FaCheckSquare className="w-3.5 h-3.5 text-[#4a7c59] shrink-0" />
                  <span className="truncate">
                    {t.dashboard.sidebar.checklistsManage}
                  </span>
                </Link>
                {isAdmin && (
                  <Link
                    href="/dashboard/logs"
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors",
                      isActive("/dashboard/logs")
                        ? "bg-[#dbe6f1] text-[#234b7d] font-bold border border-[#5c8ab0]/40"
                        : "text-[#3f4b5a] hover:bg-[#d5dee9] hover:text-[#234b7d]",
                    )}
                  >
                    <FaClipboardList className="w-3.5 h-3.5 text-[#4d719d] shrink-0" />
                    <span className="truncate">{t.dashboard.sidebar.logs}</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </nav>
      </aside>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* Main Content Area                                                     */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-y-auto flex flex-col print:overflow-visible">
        {/* Top App Bar */}
        <header className="sticky top-0 z-20 dashboard-surface border-b border-[#6f5f4f] px-2.5 sm:px-6 py-2 sm:py-2.5 print:hidden">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            {/* Left: Mobile Brand or Page Title */}
            <div className="flex items-center gap-2 min-w-0">
              <Link
                href="/dashboard"
                className="lg:hidden flex items-center gap-1.5 text-[#221910] ink-title font-bold text-sm sm:text-base shrink-0"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#3f3328] text-[#f4e8d4] flex items-center justify-center shadow-xs shrink-0">
                  <FaBook className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <span className="tracking-tight">SUST LMS</span>
              </Link>
              <h1 className="hidden lg:block text-lg font-bold text-[#221910] ink-title truncate">
                {pathname === "/dashboard"
                  ? t.dashboard.sidebar.dashboard
                  : pathname.startsWith("/dashboard/profile")
                    ? t.dashboard.sidebar.myProfile
                    : memberNavItems.find((m) => isActive(m.href))?.label ||
                      circulationItems.find((m) => isActive(m.href))?.label ||
                      inventoryItems.find((m) => isActive(m.href))?.label ||
                      communityItems.find((m) => isActive(m.href))?.label ||
                      t.dashboard.sidebar.dashboard}
              </h1>
            </div>

            {/* Right: Controls & Profile */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <LanguageSwitcher />
              <NotificationBell
                userId={userId}
                notifications={initialNotifications}
              />

              {/* Profile Avatar & Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center focus:outline-none cursor-pointer rounded-full p-0.5 hover:ring-2 hover:ring-[#8a7966] transition-all"
                  aria-label="User profile menu"
                >
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt={userName}
                      width={30}
                      height={30}
                      priority
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-[#8a7966]"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#d9cbb7] border border-[#8a7966] flex items-center justify-center text-xs font-bold text-[#4a3e33]">
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
                    <div className="absolute right-0 mt-2 w-52 bg-[#f6ecdd] border border-[#8a7966] rounded-lg shadow-2xl z-40 py-2 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2 border-b border-[#eadcc8] mb-1">
                        <p className="text-[10px] text-[#5c4f42] uppercase tracking-wider font-semibold">
                          {t.dashboard.header.welcome}
                        </p>
                        <p className="text-sm font-bold text-[#221910] truncate">
                          {userName}
                        </p>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded-xs text-[9px] font-bold uppercase bg-[#e6dbca] text-[#4a3e33] border border-[#c9b89a]">
                          {userRole}
                        </span>
                      </div>
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#3f3328] hover:bg-[#ece0ce] font-semibold transition-colors"
                      >
                        <FaUser className="w-3.5 h-3.5 text-[#6d5c4a]" />
                        {t.dashboard.sidebar.myProfile}
                      </Link>
                      <form
                        action={signOut}
                        className="mt-1 border-t border-[#eadcc8] pt-1"
                      >
                        <button
                          type="submit"
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-700 hover:bg-[#fdf0ec] transition-colors font-semibold cursor-pointer"
                        >
                          <FaTimes className="w-3.5 h-3.5" />
                          {t.dashboard.header.logout}
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Container — with safe bottom padding for bottom nav */}
        <div className="flex-1 px-2.5 py-3 sm:p-5 lg:p-8 pb-28 lg:pb-12 print:p-0 print:m-0 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* Mobile Bottom Navigation Bar (Screens < lg)                           */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#f6ecdd]/95 backdrop-blur-md border-t border-[#8a7966] lg:hidden print:hidden px-2 pb-safe shadow-lg">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {/* Home */}
          <Link
            href="/dashboard"
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[48px]",
              pathname === "/dashboard"
                ? "text-[#221910] font-bold"
                : "text-[#7a6a5c] hover:text-[#221910]",
            )}
          >
            <div
              className={cn(
                "p-1 rounded-full",
                pathname === "/dashboard" && "bg-[#ebdcc8]",
              )}
            >
              <FaHome className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 ink-title truncate">
              {t.dashboard.sidebar.dashboard}
            </span>
          </Link>

          {isStaff ? (
            <>
              {/* Transactions (Staff) */}
              <Link
                href="/dashboard/transactions"
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[48px]",
                  isActive("/dashboard/transactions")
                    ? "text-[#221910] font-bold"
                    : "text-[#7a6a5c] hover:text-[#221910]",
                )}
              >
                <div
                  className={cn(
                    "p-1 rounded-full",
                    isActive("/dashboard/transactions") && "bg-[#ebdcc8]",
                  )}
                >
                  <FaExchangeAlt className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 ink-title truncate">
                  {t.dashboard.sidebar.transactions}
                </span>
              </Link>

              {/* Center Elevated Action: Staff Desk */}
              <button
                type="button"
                onClick={() => setIsStaffDrawerOpen(true)}
                className="flex-1 flex flex-col items-center justify-center -mt-5 min-h-[48px] group cursor-pointer"
                aria-label={t.dashboard.sidebar.staffDesk}
              >
                <div className="w-12 h-12 rounded-full bg-[#2d4a35] text-[#f4e8d4] shadow-md border-2 border-[#f6ecdd] flex items-center justify-center group-hover:scale-105 active:scale-95 transition-transform">
                  <FaShieldAlt className="w-5 h-5 text-[#f4e8d4]" />
                </div>
                <span className="text-[10px] mt-0.5 font-bold text-[#2d4a35] ink-title truncate">
                  {t.dashboard.sidebar.staffDesk}
                </span>
              </button>

              {/* Users (Staff) */}
              <Link
                href="/dashboard/users"
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[48px]",
                  isActive("/dashboard/users")
                    ? "text-[#221910] font-bold"
                    : "text-[#7a6a5c] hover:text-[#221910]",
                )}
              >
                <div
                  className={cn(
                    "p-1 rounded-full",
                    isActive("/dashboard/users") && "bg-[#ebdcc8]",
                  )}
                >
                  <FaUsers className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 ink-title truncate">
                  {t.dashboard.sidebar.users}
                </span>
              </Link>
            </>
          ) : (
            <>
              {/* Books (Member) */}
              <Link
                href="/dashboard/book-list"
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[48px]",
                  isActive("/dashboard/book-list")
                    ? "text-[#221910] font-bold"
                    : "text-[#7a6a5c] hover:text-[#221910]",
                )}
              >
                <div
                  className={cn(
                    "p-1 rounded-full",
                    isActive("/dashboard/book-list") && "bg-[#ebdcc8]",
                  )}
                >
                  <FaBookOpen className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 ink-title truncate">
                  {t.dashboard.sidebar.bookList}
                </span>
              </Link>

              {/* Center Elevated Action: Scan & Borrow (Member) */}
              <Link
                href="/dashboard/borrow"
                className="flex-1 flex flex-col items-center justify-center -mt-5 min-h-[48px] group"
              >
                <div className="w-12 h-12 rounded-full bg-[#3f3328] text-[#f4e8d4] shadow-md border-2 border-[#f6ecdd] flex items-center justify-center group-hover:scale-105 active:scale-95 transition-transform">
                  <FaQrcode className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 font-bold text-[#3f3328] ink-title truncate">
                  {t.dashboard.sidebar.borrow}
                </span>
              </Link>

              {/* Tasks / Checklists (Member) */}
              <Link
                href="/dashboard/checklists"
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[48px]",
                  isActive("/dashboard/checklists")
                    ? "text-[#221910] font-bold"
                    : "text-[#7a6a5c] hover:text-[#221910]",
                )}
              >
                <div
                  className={cn(
                    "p-1 rounded-full",
                    isActive("/dashboard/checklists") && "bg-[#ebdcc8]",
                  )}
                >
                  <FaCheckSquare className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 ink-title truncate">
                  {t.dashboard.sidebar.checklists}
                </span>
              </Link>
            </>
          )}

          {/* Profile */}
          <Link
            href="/dashboard/profile"
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[48px]",
              isActive("/dashboard/profile")
                ? "text-[#221910] font-bold"
                : "text-[#7a6a5c] hover:text-[#221910]",
            )}
          >
            <div
              className={cn(
                "p-1 rounded-full",
                isActive("/dashboard/profile") && "bg-[#ebdcc8]",
              )}
            >
              <FaUser className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 ink-title truncate">
              {t.dashboard.sidebar.myProfile}
            </span>
          </Link>
        </div>
      </nav>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* Mobile Staff Desk Drawer (Moderators & Admins on Mobile)             */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {isStaff && isStaffDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsStaffDrawerOpen(false)}
          />
          <div className="relative z-10 w-full max-h-[85vh] overflow-y-auto bg-[#f6ecdd] border-t-2 border-[#5e4e3e] rounded-t-2xl shadow-2xl p-5 space-y-5 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#c9b89a]">
              <div className="flex items-center gap-2">
                <FaShieldAlt className="w-5 h-5 text-[#2d4a35]" />
                <h2 className="text-base font-bold text-[#221910] ink-title">
                  {t.dashboard.sidebar.staffDesk}
                </h2>
              </div>
              <button
                onClick={() => setIsStaffDrawerOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#ebdcc8] text-[#554738] transition-colors cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Circulation Hub */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#6d5c4a] mb-2 ink-title">
                {t.dashboard.sidebar.circulation}
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/dashboard/overview"
                  onClick={() => setIsStaffDrawerOpen(false)}
                  className="p-3 rounded-lg border border-[#7d6d5a] bg-[#fbf5ed] hover:bg-[#f0e3d0] active:scale-98 transition-all flex items-center gap-2.5 shadow-xs"
                >
                  <div className="w-8 h-8 rounded-full bg-[#d3decb] text-[#2d4a35] flex items-center justify-center shrink-0">
                    <FaChartLine className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-[#221910] truncate">
                    {t.dashboard.sidebar.overview}
                  </span>
                </Link>
                <Link
                  href="/dashboard/transactions"
                  onClick={() => setIsStaffDrawerOpen(false)}
                  className="p-3 rounded-lg border border-[#7d6d5a] bg-[#fbf5ed] hover:bg-[#f0e3d0] active:scale-98 transition-all flex items-center gap-2.5 shadow-xs"
                >
                  <div className="w-8 h-8 rounded-full bg-[#d3decb] text-[#2d4a35] flex items-center justify-center shrink-0">
                    <FaExchangeAlt className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-[#221910] truncate">
                    {t.dashboard.sidebar.transactions}
                  </span>
                </Link>
              </div>
            </div>

            {/* Inventory Hub */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#6d5c4a] mb-2 ink-title">
                {t.dashboard.sidebar.inventory}
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/dashboard/books"
                  onClick={() => setIsStaffDrawerOpen(false)}
                  className="p-3 rounded-lg border border-[#7d6d5a] bg-[#fbf5ed] hover:bg-[#f0e3d0] active:scale-98 transition-all flex items-center gap-2.5 shadow-xs"
                >
                  <div className="w-8 h-8 rounded-full bg-[#d3decb] text-[#2d4a35] flex items-center justify-center shrink-0">
                    <FaBook className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-[#221910] truncate">
                    {t.dashboard.sidebar.books}
                  </span>
                </Link>
                <Link
                  href="/dashboard/copies"
                  onClick={() => setIsStaffDrawerOpen(false)}
                  className="p-3 rounded-lg border border-[#7d6d5a] bg-[#fbf5ed] hover:bg-[#f0e3d0] active:scale-98 transition-all flex items-center gap-2.5 shadow-xs"
                >
                  <div className="w-8 h-8 rounded-full bg-[#d3decb] text-[#2d4a35] flex items-center justify-center shrink-0">
                    <FaGraduationCap className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-[#221910] truncate">
                    {t.dashboard.sidebar.copies}
                  </span>
                </Link>
                <Link
                  href="/dashboard/categories"
                  onClick={() => setIsStaffDrawerOpen(false)}
                  className="p-3 rounded-lg border border-[#7d6d5a] bg-[#fbf5ed] hover:bg-[#f0e3d0] active:scale-98 transition-all flex items-center gap-2.5 shadow-xs"
                >
                  <div className="w-8 h-8 rounded-full bg-[#d3decb] text-[#2d4a35] flex items-center justify-center shrink-0">
                    <FaClipboardList className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-[#221910] truncate">
                    {t.dashboard.sidebar.categories}
                  </span>
                </Link>
                <Link
                  href="/dashboard/print-qr"
                  onClick={() => setIsStaffDrawerOpen(false)}
                  className="p-3 rounded-lg border border-[#7d6d5a] bg-[#fbf5ed] hover:bg-[#f0e3d0] active:scale-98 transition-all flex items-center gap-2.5 shadow-xs"
                >
                  <div className="w-8 h-8 rounded-full bg-[#d3decb] text-[#2d4a35] flex items-center justify-center shrink-0">
                    <FaPrint className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-[#221910] truncate">
                    {t.dashboard.sidebar.printQr}
                  </span>
                </Link>
                <Link
                  href="/dashboard/exports"
                  onClick={() => setIsStaffDrawerOpen(false)}
                  className="p-3 rounded-lg border border-[#7d6d5a] bg-[#fbf5ed] hover:bg-[#f0e3d0] active:scale-98 transition-all flex items-center gap-2.5 shadow-xs col-span-2"
                >
                  <div className="w-8 h-8 rounded-full bg-[#d3decb] text-[#2d4a35] flex items-center justify-center shrink-0">
                    <FaFileExport className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-[#221910] truncate">
                    {t.dashboard.sidebar.exports}
                  </span>
                </Link>
              </div>
            </div>

            {/* Community Hub */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#6d5c4a] mb-2 ink-title">
                {t.dashboard.sidebar.community}
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/dashboard/users"
                  onClick={() => setIsStaffDrawerOpen(false)}
                  className="p-3 rounded-lg border border-[#7d6d5a] bg-[#fbf5ed] hover:bg-[#f0e3d0] active:scale-98 transition-all flex items-center gap-2.5 shadow-xs"
                >
                  <div className="w-8 h-8 rounded-full bg-[#d3decb] text-[#2d4a35] flex items-center justify-center shrink-0">
                    <FaUsers className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-[#221910] truncate">
                    {t.dashboard.sidebar.users}
                  </span>
                </Link>
                <Link
                  href="/dashboard/moderators"
                  onClick={() => setIsStaffDrawerOpen(false)}
                  className="p-3 rounded-lg border border-[#7d6d5a] bg-[#fbf5ed] hover:bg-[#f0e3d0] active:scale-98 transition-all flex items-center gap-2.5 shadow-xs"
                >
                  <div className="w-8 h-8 rounded-full bg-[#d3decb] text-[#2d4a35] flex items-center justify-center shrink-0">
                    <FaShieldAlt className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-[#221910] truncate">
                    {t.dashboard.sidebar.moderators}
                  </span>
                </Link>
                <Link
                  href="/dashboard/ranks"
                  onClick={() => setIsStaffDrawerOpen(false)}
                  className="p-3 rounded-lg border border-[#7d6d5a] bg-[#fbf5ed] hover:bg-[#f0e3d0] active:scale-98 transition-all flex items-center gap-2.5 shadow-xs"
                >
                  <div className="w-8 h-8 rounded-full bg-[#d3decb] text-[#2d4a35] flex items-center justify-center shrink-0">
                    <FaShieldAlt className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-[#221910] truncate">
                    {t.dashboard.sidebar.ranks}
                  </span>
                </Link>
                <Link
                  href="/dashboard/thanas"
                  onClick={() => setIsStaffDrawerOpen(false)}
                  className="p-3 rounded-lg border border-[#7d6d5a] bg-[#fbf5ed] hover:bg-[#f0e3d0] active:scale-98 transition-all flex items-center gap-2.5 shadow-xs"
                >
                  <div className="w-8 h-8 rounded-full bg-[#d3decb] text-[#2d4a35] flex items-center justify-center shrink-0">
                    <FaMapMarkerAlt className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-[#221910] truncate">
                    {t.dashboard.sidebar.thanas}
                  </span>
                </Link>
              </div>
            </div>

            {/* System / Syllabus */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#6d5c4a] mb-2 ink-title">
                {t.dashboard.sidebar.system}
              </h3>
              <div className="grid grid-cols-2 gap-2.5 pb-6">
                <Link
                  href="/dashboard/checklists-manage"
                  onClick={() => setIsStaffDrawerOpen(false)}
                  className="p-3 rounded-lg border border-[#7d6d5a] bg-[#fbf5ed] hover:bg-[#f0e3d0] active:scale-98 transition-all flex items-center gap-2.5 shadow-xs"
                >
                  <div className="w-8 h-8 rounded-full bg-[#d3decb] text-[#2d4a35] flex items-center justify-center shrink-0">
                    <FaCheckSquare className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-[#221910] truncate">
                    {t.dashboard.sidebar.checklistsManage}
                  </span>
                </Link>
                {isAdmin && (
                  <Link
                    href="/dashboard/logs"
                    onClick={() => setIsStaffDrawerOpen(false)}
                    className="p-3 rounded-lg border border-[#7d6d5a] bg-[#fbf5ed] hover:bg-[#f0e3d0] active:scale-98 transition-all flex items-center gap-2.5 shadow-xs"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#dbe6f1] text-[#234b7d] flex items-center justify-center shrink-0">
                      <FaClipboardList className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#221910] truncate">
                      {t.dashboard.sidebar.logs}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
