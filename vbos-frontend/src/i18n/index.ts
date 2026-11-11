import { useCallback } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { bi, en, fr, type MessageKey } from "./messages";

export type Lang = "en" | "fr" | "bi";

export const LANGUAGES: { code: Lang; name: string }[] = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "bi", name: "Bislama" },
];

const DICTIONARIES = { en, fr, bi };
/** Locale used for dates and numbers; Bislama follows British English conventions. */
const LOCALES: Record<Lang, string> = { en: "en-GB", fr: "fr-FR", bi: "en-GB" };

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

function applyToDocument(lang: Lang) {
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: "en",
      setLang: (lang) => {
        applyToDocument(lang);
        set({ lang });
      },
    }),
    {
      name: "drmis-lang",
      onRehydrateStorage: () => (state) => applyToDocument(state?.lang ?? "en"),
    },
  ),
);

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function translate(lang: Lang, key: MessageKey, vars?: Record<string, string | number>) {
  const template = DICTIONARIES[lang][key] ?? en[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match,
  );
}

/** Returns the translate function and the locale to use for dates and numbers. */
export function useT(): { t: Translate; locale: string; lang: Lang } {
  const lang = useLangStore((s) => s.lang);
  const t = useCallback<Translate>((key, vars) => translate(lang, key, vars), [lang]);
  return { t, locale: LOCALES[lang], lang };
}
