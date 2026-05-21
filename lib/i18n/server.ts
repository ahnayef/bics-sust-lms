import { cookies } from "next/headers";
import { translations, TranslationKeys, Language } from "./translations";

export async function getTranslation(): Promise<{ t: TranslationKeys; language: Language }> {
  const cookieStore = await cookies();
  const language = (cookieStore.get("language")?.value as Language) || "en";
  
  return {
    t: translations[language] || translations.en,
    language,
  };
}
