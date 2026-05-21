"use client";

import { useTranslation } from "@/lib/i18n/context";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 bg-[#f0e4d1] border border-[#8a7966] p-1 rounded-sm">
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 py-1 text-[10px] font-bold transition-all rounded-sm uppercase tracking-wider ${
          language === "en"
            ? "bg-[#3f3328] text-[#fcf9f4]"
            : "text-[#5a4b3f] hover:bg-[#eadcc8]"
        }`}
        title={t.common.languages.en}
      >
        EN
      </button>
      <div className="w-px h-3 bg-[#8a7966]/40" />
      <button
        onClick={() => setLanguage("bn")}
        className={`px-2 py-1 text-[11px] font-bold transition-all rounded-sm ${
          language === "bn"
            ? "bg-[#3f3328] text-[#fcf9f4]"
            : "text-[#5a4b3f] hover:bg-[#eadcc8]"
        }`}
        title={t.common.languages.bn}
      >
        বাংলা
      </button>
    </div>
  );
}
