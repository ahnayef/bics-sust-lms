"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * ModalPortal renders modal content directly into `document.body`.
 * This prevents any ancestor CSS transforms, filters, or animations (such as page transitions)
 * from trapping `position: fixed` modals in a local containing block or misaligning scroll perspective.
 */
export function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}

export default ModalPortal;
