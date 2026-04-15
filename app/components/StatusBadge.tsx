import type { ComponentType, ReactNode } from "react";

type BadgeTone =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "neutral"
  | "accent"
  | "muted";

type BadgeSize = "xs" | "sm";

interface StatusBadgeProps {
  tone?: BadgeTone;
  size?: BadgeSize;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: "bg-[#e4eee0] text-[#2f4a31] border-[#8ea787]",
  info: "bg-[#e1eaef] text-[#2d4556] border-[#8da5b6]",
  warning: "bg-[#f2e7d8] text-[#5b4834] border-[#b29a7d]",
  danger: "bg-[#f3e2de] text-[#6f3d35] border-[#b58a82]",
  neutral: "bg-[#ede5d8] text-[#584536] border-[#b2a086]",
  accent: "bg-[#e9e4f1] text-[#4a3f63] border-[#a79abf]",
  muted: "bg-[#e6e6e2] text-[#4d4d46] border-[#a4a49b]",
};

const ICON_CLASSES: Record<BadgeTone, string> = {
  success: "text-[#3f6040]",
  info: "text-[#3f6073]",
  warning: "text-[#7a6249]",
  danger: "text-[#8a5046]",
  neutral: "text-[#735b48]",
  accent: "text-[#665487]",
  muted: "text-[#626258]",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  xs: "px-2.5 py-1 text-[10px]",
  sm: "px-3 py-1 text-xs",
};

export default function StatusBadge({
  tone = "neutral",
  size = "sm",
  icon: Icon,
  children,
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border font-semibold ink-text whitespace-nowrap ${SIZE_CLASSES[size]} ${TONE_CLASSES[tone]} ${className}`}
    >
      {Icon ? <Icon className={`w-3 h-3 ${ICON_CLASSES[tone]}`} /> : null}
      {children}
    </span>
  );
}
