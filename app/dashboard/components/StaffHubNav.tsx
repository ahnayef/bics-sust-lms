"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaBook,
  FaChartLine,
  FaClipboardList,
  FaExchangeAlt,
  FaGraduationCap,
  FaMapMarkerAlt,
  FaPrint,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";

export function CirculationNav() {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Overview & Insights",
      href: "/dashboard/overview",
      icon: FaChartLine,
    },
    {
      label: "Transactions & Approvals",
      href: "/dashboard/transactions",
      icon: FaExchangeAlt,
    },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0",
              active
                ? "bg-[#3f3328] text-[#f4e8d4] font-bold shadow-xs"
                : "bg-[#eadcc8] text-[#4e4033] hover:bg-[#dfcfb9]",
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function InventoryNav() {
  const pathname = usePathname();

  const tabs = [
    { label: "Books Catalog", href: "/dashboard/books", icon: FaBook },
    {
      label: "Physical Copies",
      href: "/dashboard/copies",
      icon: FaGraduationCap,
    },
    {
      label: "Categories",
      href: "/dashboard/categories",
      icon: FaClipboardList,
    },
    { label: "Print QR Barcodes", href: "/dashboard/print-qr", icon: FaPrint },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0",
              active
                ? "bg-[#3f3328] text-[#f4e8d4] font-bold shadow-xs"
                : "bg-[#eadcc8] text-[#4e4033] hover:bg-[#dfcfb9]",
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function CommunityNav() {
  const pathname = usePathname();

  const tabs = [
    { label: "Member Directory", href: "/dashboard/users", icon: FaUsers },
    {
      label: "Staff & Moderators",
      href: "/dashboard/moderators",
      icon: FaShieldAlt,
    },
    { label: "Ranks", href: "/dashboard/ranks", icon: FaShieldAlt },
    { label: "Thanas", href: "/dashboard/thanas", icon: FaMapMarkerAlt },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0",
              active
                ? "bg-[#3f3328] text-[#f4e8d4] font-bold shadow-xs"
                : "bg-[#eadcc8] text-[#4e4033] hover:bg-[#dfcfb9]",
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
