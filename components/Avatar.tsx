"use client";

import { useState } from "react";

interface AvatarProps {
  src?: string | null;
  alt: string;
  initials: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-[10px]",
  md: "w-16 h-16 text-xl",
  lg: "w-20 h-20 text-2xl",
  xl: "w-24 h-24 text-3xl",
};

export default function Avatar({
  src,
  alt,
  initials,
  size = "md",
  className = "",
}: AvatarProps) {
  const [error, setError] = useState(false);

  return (
    <div
      className={`rounded-full bg-[#d9cbb7] border border-[#8a7966] flex items-center justify-center font-bold text-[#4a3e33] shrink-0 overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      {src && !error ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
