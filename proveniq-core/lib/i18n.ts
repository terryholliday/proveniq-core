export const locales = ["en", "es", "fr", "de", "zh", "ja", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  zh: "中文",
  ja: "日本語",
  ar: "العربية",
};

export const rtlLocales: Locale[] = ["ar"];

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return isRtlLocale(locale) ? "rtl" : "ltr";
}

// Load messages for a locale
export async function getMessages(locale: Locale): Promise<Record<string, unknown>> {
  try {
    return (await import(`../messages/${locale}.json`)).default;
  } catch {
    // Fallback to English
    return (await import("../messages/en.json")).default;
  }
}

// Get locale from cookie or header
export function getLocaleFromRequest(
  cookieLocale?: string,
  acceptLanguage?: string
): Locale {
  // Check cookie first
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  // Parse Accept-Language header
  if (acceptLanguage) {
    const preferred = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].trim().substring(0, 2))
      .find((lang) => locales.includes(lang as Locale));
    
    if (preferred) {
      return preferred as Locale;
    }
  }

  return defaultLocale;
}
