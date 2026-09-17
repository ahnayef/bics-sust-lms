"use client";

import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

import { usePathname } from "next/navigation";

export const AOSInit = () => {
  const pathname = usePathname();

  useEffect(() => {
    AOS.init({
      easing: "ease-out-cubic",
      duration: 350,
      once: false,
      disable: false,
      offset: 30,
      delay: 0,
    });
  }, []);

  useEffect(() => {
    // Refresh AOS elements whenever the page route changes
    AOS.refresh();
  }, [pathname]);

  return null;
};
