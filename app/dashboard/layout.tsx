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

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 flex items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-gray-900"
        >
          <FaBook className="w-5 h-5" />
          BICS SUST LMS
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-600 hover:text-gray-900"
        >
          {sidebarOpen ? (
            <FaTimes className="w-6 h-6" />
          ) : (
            <FaBars className="w-6 h-6" />
          )}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "block" : "hidden"
          } lg:block w-64 bg-gray-900 text-white min-h-screen fixed lg:static left-0 top-0 z-40 pt-4 lg:pt-0`}
        >
          {/* Logo */}
          <div className="hidden lg:flex items-center gap-2 px-6 py-6 font-bold text-lg mb-4 border-b border-gray-700">
            <FaBook className="w-6 h-6" />
            BICS SUST LMS
          </div>

          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-end px-4 pb-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-800 rounded"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="px-4 space-y-2 pb-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Top Navigation Bar */}
          <div className="hidden lg:block bg-white border-b border-gray-200 px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              <div className="flex items-center gap-6">
                <div className="text-sm text-gray-600">
                  Welcome back, <span className="font-medium">Admin User</span>
                </div>
                <button className="cursor-pointer px-4 py-2 bg-red-50 text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm">
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
