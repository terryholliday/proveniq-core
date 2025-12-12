"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check, ChevronDown } from "lucide-react";
import { locales, localeNames, Locale, isRtlLocale } from "@/lib/i18n";

interface LanguageSwitcherProps {
  currentLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

export function LanguageSwitcher({
  currentLocale,
  onLocaleChange,
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span>{localeNames[currentLocale]}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 bg-black border border-white/20 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="py-1">
                {locales.map((locale) => (
                  <button
                    key={locale}
                    onClick={() => {
                      onLocaleChange(locale);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                      locale === currentLocale
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "text-gray-300 hover:bg-white/10"
                    }`}
                    dir={isRtlLocale(locale) ? "rtl" : "ltr"}
                  >
                    <span>{localeNames[locale]}</span>
                    {locale === currentLocale && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact version for header
export function LanguageSwitcherCompact({
  currentLocale,
  onLocaleChange,
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        title={localeNames[currentLocale]}
      >
        <Globe className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 mt-2 w-40 bg-black border border-white/20 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="py-1 max-h-64 overflow-y-auto">
                {locales.map((locale) => (
                  <button
                    key={locale}
                    onClick={() => {
                      onLocaleChange(locale);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                      locale === currentLocale
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <span>{localeNames[locale]}</span>
                    {locale === currentLocale && (
                      <Check className="w-3 h-3" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
