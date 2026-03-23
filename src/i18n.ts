import type { PluginSettings, SyncSummary } from "./types";
import { ar } from "./locales/ar";
import { de } from "./locales/de";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { hi } from "./locales/hi";
import { it } from "./locales/it";
import { ja } from "./locales/ja";
import { ko } from "./locales/ko";
import { ptBR } from "./locales/pt-BR";
import { ru } from "./locales/ru";
import type { TranslationMessages } from "./locales/schema";
import { zhCN } from "./locales/zh-CN";
import { zhTW } from "./locales/zh-TW";

export type LanguagePreference = PluginSettings["uiLanguage"];

export const LANGUAGE_LABELS = {
  auto: "Auto",
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  ja: "日本語",
  ko: "한국어",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  "pt-BR": "Português (Brasil)",
  ru: "Русский",
  ar: "العربية",
  hi: "हिन्दी",
} as const;

export type SupportedLocale = Exclude<LanguagePreference, "auto">;

const dictionaries: Record<SupportedLocale, TranslationMessages> = {
  en,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  ja,
  ko,
  es,
  fr,
  de,
  it,
  "pt-BR": ptBR,
  ru,
  ar,
  hi,
};

export type TranslationKey = keyof TranslationMessages;

export function resolveLocale(preference: LanguagePreference, appLanguage?: string): SupportedLocale {
  if (preference !== "auto") {
    return preference;
  }

  const detected =
    appLanguage ||
    globalThis.localStorage?.getItem("language") ||
    globalThis.navigator?.language ||
    "en";
  const normalized = detected.toLowerCase();
  if (normalized.startsWith("zh-tw") || normalized.startsWith("zh-hk") || normalized.startsWith("zh-hant")) {
    return "zh-TW";
  }
  if (normalized.startsWith("zh")) return "zh-CN";
  if (normalized.startsWith("ja")) return "ja";
  if (normalized.startsWith("ko")) return "ko";
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("fr")) return "fr";
  if (normalized.startsWith("de")) return "de";
  if (normalized.startsWith("it")) return "it";
  if (normalized.startsWith("pt")) return "pt-BR";
  if (normalized.startsWith("ru")) return "ru";
  if (normalized.startsWith("ar")) return "ar";
  if (normalized.startsWith("hi")) return "hi";
  return "en";
}

export function t(
  preference: LanguagePreference,
  key: TranslationKey,
  vars: Record<string, string | number> = {},
  appLanguage?: string,
): string {
  const locale = resolveLocale(preference, appLanguage);
  const template = dictionaries[locale][key] ?? dictionaries.en[key];
  return template.replace(/\{(\w+)\}/g, (_, token) => String(vars[token] ?? ""));
}

export function formatSyncSummaryI18n(
  summary: SyncSummary,
  preference: LanguagePreference,
  appLanguage?: string,
): string {
  const base = t(
    preference,
    "summary.base",
    {
      created: summary.created,
      updated: summary.updated,
      deleted: summary.deleted,
      failed: summary.failed,
    },
    appLanguage,
  );
  if (summary.errors.length === 0) {
    return base;
  }
  return t(
    preference,
    "summary.errors",
    {
      base,
      details: summary.errors.slice(0, 3).join(" | "),
    },
    appLanguage,
  );
}
