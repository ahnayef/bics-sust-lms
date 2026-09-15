"use client";

import { useTranslation } from "@/lib/i18n/context";

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "bn" : "en")}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-[#f0e4d1] border border-[#8a7966] text-[#3f3328] hover:bg-[#eadcc8] active:scale-95 transition-all cursor-pointer shrink-0 shadow-2xs"
      title={language === "en" ? "Switch to বাংলা" : "Switch to English"}
      aria-label="Toggle language"
    >
      <span className="text-[11px]">🌐</span>
      <span className="text-[11px] uppercase tracking-wide">
        {language === "en" ? "EN" : "বাং"}
      </span>
    </button>
  );
}
