"use client";

import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function PageTransition({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    setAnimating(true);
  }, [pathname]);

  return (
    <div
      key={pathname}
      onAnimationEnd={() => setAnimating(false)}
      className={`w-full ${animating ? "page-transition" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
