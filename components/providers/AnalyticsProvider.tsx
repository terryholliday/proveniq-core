"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface AnalyticsContextValue {
  track: (event: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
  page: (name?: string, properties?: Record<string, unknown>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }
  return context;
}

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const track = (event: string, properties?: Record<string, unknown>) => {
    if (typeof window === "undefined") return;

    const payload = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        path: pathname,
      },
    };

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Track:", payload);
    }

    // Send to analytics endpoint
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silently fail - analytics should not break the app
    });
  };

  const identify = (userId: string, traits?: Record<string, unknown>) => {
    if (typeof window === "undefined") return;

    const payload = {
      userId,
      traits: {
        ...traits,
        timestamp: new Date().toISOString(),
      },
    };

    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Identify:", payload);
    }

    fetch("/api/analytics/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  };

  const page = (name?: string, properties?: Record<string, unknown>) => {
    if (typeof window === "undefined") return;

    const payload = {
      name: name || pathname,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        path: pathname,
        search: searchParams?.toString(),
        referrer: document.referrer,
      },
    };

    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Page:", payload);
    }

    fetch("/api/analytics/page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  };

  // Auto-track page views
  useEffect(() => {
    page();
  }, [pathname, searchParams]);

  return (
    <AnalyticsContext.Provider value={{ track, identify, page }}>
      {children}
    </AnalyticsContext.Provider>
  );
}
