"use client";

import { useEffect } from "react";

const BOT_PATTERN =
  /bot|crawler|spider|crawling|googlebot|bingbot|yandex|baidu|duckduck|slurp|ia_archiver|lighthouse|headlesschrome|puppeteer|prerender/i;

interface ClarityProps {
  projectId?: string;
}

export default function Clarity({ projectId }: ClarityProps) {
  useEffect(() => {
    if (!projectId) return;
    if (typeof window === "undefined") return;
    if (BOT_PATTERN.test(navigator.userAgent)) return;

    let initialized = false;

    async function init() {
      if (initialized) return;
      initialized = true;

      try {
        const { clarity } = await import("clarity-js");

        clarity.start({
          projectId: projectId!,
          upload: `${window.location.origin}/api/c/collect`,
          track: true,
          content: true,
          cookies: ["_clck", "_clsk"],
        });

        // Expose window.clarity compatibility shim for existing
        // window.clarity("set", ...) / window.clarity("identify", ...) calls
        if (typeof (window as any).clarity !== "function") {
          (window as any).clarity = function (...args: any[]) {
            const [method, ...rest] = args;
            if (method === "set" && rest.length >= 2) {
              clarity.set(rest[0], rest[1]);
            } else if (method === "identify") {
              clarity.identify(rest[0], rest[1], rest[2], rest[3]);
            } else if (method === "consent") {
              clarity.consent();
            } else if (method === "upgrade") {
              clarity.upgrade(rest[0] ?? "manual");
            } else if (method === "event") {
              clarity.event(rest[0], rest[1]);
            }
          };
        }
      } catch (e) {
        console.warn("[Clarity] Failed to initialize:", e);
      }
    }

    // Defer until first user interaction
    const interactionEvents = [
      "scroll",
      "pointerdown",
      "touchstart",
      "keydown",
    ] as const;
    const listenerOpts: AddEventListenerOptions = {
      passive: true,
      once: true,
    };

    function onInteraction() {
      // Remove all listeners once any fires
      for (const evt of interactionEvents) {
        window.removeEventListener(evt, onInteraction, listenerOpts);
      }
      init();
    }

    for (const evt of interactionEvents) {
      window.addEventListener(evt, onInteraction, listenerOpts);
    }

    // Fallback: init after idle or 3.5s timeout
    let fallbackId: ReturnType<typeof setTimeout> | number | undefined;
    if ("requestIdleCallback" in window) {
      fallbackId = window.requestIdleCallback(() => init(), {
        timeout: 3500,
      });
    } else {
      fallbackId = setTimeout(() => init(), 3000);
    }

    return () => {
      for (const evt of interactionEvents) {
        window.removeEventListener(evt, onInteraction, listenerOpts);
      }
      if (fallbackId !== undefined) {
        if ("cancelIdleCallback" in window) {
          window.cancelIdleCallback(fallbackId as number);
        } else {
          clearTimeout(fallbackId as ReturnType<typeof setTimeout>);
        }
      }
    };
  }, [projectId]);

  return null;
}

/**
 * Helper utilities for calling Clarity methods from anywhere.
 * Safe to call even before Clarity has initialized — they no-op gracefully.
 */
export const ClarityUtils = {
  setTag: (key: string, value: string | string[]) =>
    (window as any).clarity?.("set", key, value),

  identify: (
    userId: string,
    sessionId?: string,
    pageId?: string,
    friendlyName?: string,
  ) =>
    (window as any).clarity?.(
      "identify",
      userId,
      sessionId,
      pageId,
      friendlyName,
    ),

  consent: () => (window as any).clarity?.("consent"),

  consentV2: (consent: boolean) =>
    (window as any).clarity?.("consent", consent),

  upgrade: (reason?: string) =>
    (window as any).clarity?.("upgrade", reason ?? "manual"),

  event: (name: string, value?: string) =>
    (window as any).clarity?.("event", name, value),
};
