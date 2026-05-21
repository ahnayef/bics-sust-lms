import { bn } from "./locales/bn";
import { en } from "./locales/en";

// Recursively convert all properties of T to string if they are not objects
type ToStrings<T> = {
  [K in keyof T]: T[K] extends object ? ToStrings<T[K]> : string;
};

export type TranslationKeys = ToStrings<typeof en>;
export type Language = "en" | "bn";

export const translations: Record<Language, TranslationKeys> = {
  en,
  bn,
};
