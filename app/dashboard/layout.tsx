"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import {
  FaBars,
  FaBook,
  FaChartLine,
  FaExchangeAlt,
  FaGraduationCap,
  FaShieldAlt,
  FaTimes,
  FaUsers,
} from "react-icons/fa";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navigationItems = [
    {
      label: "Overview",
      href: "/dashboard",
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
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="h-screen bg-[#e5d9c4] dashboard-shell overflow-hidden">
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

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-30 dashboard-surface border-b border-[#6f5f4f] flex items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-[#221910] ink-title"
        >
          <FaBook className="w-5 h-5 text-[#554738]" />
          BICS SUST LMS
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-[#5f5144] hover:text-[#2f251d] transition-colors"
        >
          {sidebarOpen ? (
            <FaTimes className="w-6 h-6" />
          ) : (
            <FaBars className="w-6 h-6" />
          )}
        </button>
      </div>

      <div className="flex h-full min-h-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:sticky lg:top-0 h-screen lg:overflow-y-auto dashboard-surface tron-border text-[#2b2119] border-r border-[#5e4e3e]">
          <div className="flex items-center gap-2 px-6 py-6 font-bold text-lg mb-4 border-b border-[#6d5c4a] ink-title text-[#221910]">
            <FaBook className="w-6 h-6 text-[#554738]" />
            BICS SUST LMS
          </div>

          <nav className="px-4 space-y-2 pb-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-colors ink-text border ${
                    isActive(item.href)
                      ? "bg-[#eadcc8] text-[#221910] border-[#7d6d5a]"
                      : "text-[#4d4034] border-transparent hover:bg-[#ece0ce] hover:border-[#b59f86]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto">
          {/* Top Navigation Bar */}
          <div className="hidden lg:block sticky top-0 z-20 dashboard-surface border-b border-[#6f5f4f] px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-[#221910] ink-title">
                Dashboard
              </h1>
              <div className="flex items-center gap-6">
                <div className="text-sm text-[#5a4b3f] ink-text">
                  Welcome back,{" "}
                  <span className="font-semibold text-[#2f251d]">
                    Admin User
                  </span>
                </div>
                <button className="cursor-pointer px-4 py-2 bg-[#f0e4d1] text-[#4c3e31] border border-[#8a7966] rounded-sm hover:bg-[#eadcc8] transition-colors font-medium text-sm ink-text">
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-4 lg:p-8 pb-8">{children}</div>
        </main>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-50 ${
          sidebarOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <button
          aria-label="Close sidebar overlay"
          className={`absolute inset-0 bg-[#1f170f]/42 backdrop-blur-[1px] transition-opacity duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={`absolute left-0 top-0 h-dvh w-72 max-w-[86vw] dashboard-surface tron-border text-[#2b2119] border-r border-[#5e4e3e] transition-transform duration-300 ease-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-5 border-b border-[#6d5c4a]">
            <div className="flex items-center gap-2 font-bold text-base ink-title text-[#221910]">
              <FaBook className="w-5 h-5 text-[#554738]" />
              BICS SUST LMS
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-[#e7d8c3] rounded-sm transition-colors"
              aria-label="Close sidebar"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <nav className="px-4 py-4 space-y-2 overflow-y-auto h-[calc(100dvh-76px)]">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-colors ink-text border ${
                    isActive(item.href)
                      ? "bg-[#eadcc8] text-[#221910] border-[#7d6d5a]"
                      : "text-[#4d4034] border-transparent hover:bg-[#ece0ce] hover:border-[#b59f86]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>
    </div>
  );
}
