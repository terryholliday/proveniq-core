import { Locale, rtlLocales } from "@/lib/i18n";

export function isRtl(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

export function getTextDirection(locale: Locale): "ltr" | "rtl" {
  return isRtl(locale) ? "rtl" : "ltr";
}

export function getTextAlign(locale: Locale): "left" | "right" {
  return isRtl(locale) ? "right" : "left";
}

// CSS classes for RTL support
export function getRtlClasses(locale: Locale): string {
  if (!isRtl(locale)) return "";
  
  return "rtl";
}

// Flip horizontal values for RTL
export function flipHorizontal<T extends string>(
  locale: Locale,
  ltrValue: T,
  rtlValue: T
): T {
  return isRtl(locale) ? rtlValue : ltrValue;
}

// Common RTL transformations
export const rtlTransforms = {
  // Margin/Padding
  marginLeft: (locale: Locale) => flipHorizontal(locale, "ml", "mr"),
  marginRight: (locale: Locale) => flipHorizontal(locale, "mr", "ml"),
  paddingLeft: (locale: Locale) => flipHorizontal(locale, "pl", "pr"),
  paddingRight: (locale: Locale) => flipHorizontal(locale, "pr", "pl"),
  
  // Position
  left: (locale: Locale) => flipHorizontal(locale, "left", "right"),
  right: (locale: Locale) => flipHorizontal(locale, "right", "left"),
  
  // Border
  borderLeft: (locale: Locale) => flipHorizontal(locale, "border-l", "border-r"),
  borderRight: (locale: Locale) => flipHorizontal(locale, "border-r", "border-l"),
  
  // Rounded corners
  roundedLeft: (locale: Locale) => flipHorizontal(locale, "rounded-l", "rounded-r"),
  roundedRight: (locale: Locale) => flipHorizontal(locale, "rounded-r", "rounded-l"),
  
  // Text align
  textLeft: (locale: Locale) => flipHorizontal(locale, "text-left", "text-right"),
  textRight: (locale: Locale) => flipHorizontal(locale, "text-right", "text-left"),
  
  // Flex
  flexRowReverse: (locale: Locale) => isRtl(locale) ? "flex-row-reverse" : "flex-row",
};

// Hook-friendly RTL utilities
export function useRtl(locale: Locale) {
  const isRtlLocale = isRtl(locale);
  
  return {
    isRtl: isRtlLocale,
    direction: getTextDirection(locale),
    textAlign: getTextAlign(locale),
    
    // Utility functions
    flip: <T extends string>(ltr: T, rtl: T) => flipHorizontal(locale, ltr, rtl),
    
    // Common class helpers
    ml: (size: string) => `${rtlTransforms.marginLeft(locale)}-${size}`,
    mr: (size: string) => `${rtlTransforms.marginRight(locale)}-${size}`,
    pl: (size: string) => `${rtlTransforms.paddingLeft(locale)}-${size}`,
    pr: (size: string) => `${rtlTransforms.paddingRight(locale)}-${size}`,
  };
}

// CSS custom properties for RTL
export const rtlCssVariables = `
  :root {
    --direction: ltr;
    --text-align: left;
    --start: left;
    --end: right;
  }
  
  [dir="rtl"] {
    --direction: rtl;
    --text-align: right;
    --start: right;
    --end: left;
  }
`;
