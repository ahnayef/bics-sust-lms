"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Language, TranslationKeys, translations } from "./translations";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang);
    }
    setIsLoaded(true);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    document.cookie = `language=${lang}; path=/; max-age=31536000`;
    document.documentElement.lang = lang;
    // Optional: refresh the page to update server components
    window.location.reload();
  };

  const t = translations[language];

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-[#f4e8d4] flex items-center justify-center z-[9999]">
        <div className="w-8 h-8 border-4 border-[#3f3328] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      <div className={language === "bn" ? "font-bengali min-h-screen bg-[#f4e8d4]" : "min-h-screen bg-[#f4e8d4]"}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
