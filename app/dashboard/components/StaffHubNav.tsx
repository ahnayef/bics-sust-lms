"use client";

import { useTranslation } from "@/lib/i18n/context";
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
  const { t } = useTranslation();

  const tabs = [
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

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0",
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
  const { t } = useTranslation();

  const tabs = [
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
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0",
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
  const { t } = useTranslation();

  const tabs = [
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
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0",
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
