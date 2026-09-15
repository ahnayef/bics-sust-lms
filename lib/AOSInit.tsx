"use client";

import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

export const AOSInit = () => {
  useEffect(() => {
    AOS.init({
      easing: "ease-out-cubic",
      duration: 300,
      once: true,
      disable: false,
      startEvent: "DOMContentLoaded",
      offset: 50,
      delay: 0,
    });
  }, []);

  return null;
};
