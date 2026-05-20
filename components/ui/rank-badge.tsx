"use client";

import { FaUser, FaUserTag, FaAward, FaMedal, FaCrown, FaStar, FaUserGraduate, FaUserTie } from "react-icons/fa";
import { cn } from "@/lib/utils";

interface RankBadgeProps {
  name?: string | null;
  className?: string;
  showIcon?: boolean;
}

/**
 * RankBadge — Displays a rank name with a representing icon.
 */
export function RankBadge({ name, className, showIcon = true }: RankBadgeProps) {
  const rankName = name || "None";
  const isNone = rankName === "None";

  // Simple heuristic for icons based on rank name
  const getIcon = () => {
    const n = rankName.toLowerCase();
    if (isNone) return FaUser;
    if (n.includes("admin") || n.includes("founder") || n.includes("president")) return FaCrown;
    if (n.includes("senior") || n.includes("lead") || n.includes("expert")) return FaAward;
    if (n.includes("moderator") || n.includes("manager") || n.includes("head")) return FaUserTie;
    if (n.includes("graduate") || n.includes("alumni") || n.includes("pro")) return FaUserGraduate;
    if (n.includes("star") || n.includes("top") || n.includes("gold")) return FaStar;
    if (n.includes("silver") || n.includes("bronze") || n.includes("medal")) return FaMedal;
    
    return FaUserTag; // Default rank icon
  };

  const Icon = getIcon();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold border ink-text transition-colors",
        isNone
          ? "bg-[#f1e9df] text-[#8a7966] border-[#d9c8b0]"
          : "bg-[#ede0cc] text-[#4a3825] border-[#b59f86]",
        className
      )}
    >
      {showIcon && <Icon className={cn("w-3 h-3 shrink-0", isNone ? "opacity-60" : "text-[#6d5c4a]")} />}
      {rankName}
    </span>
  );
}
