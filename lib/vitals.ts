import type { Metric } from "web-vitals";

export interface VitalsPayload {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
  navigationType: string;
  url: string;
  timestamp: string;
}

export function reportWebVitals(metric: Metric) {
  const payload: VitalsPayload = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType || "unknown",
    url: typeof window !== "undefined" ? window.location.href : "",
    timestamp: new Date().toISOString(),
  };

  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.log("[WebVitals]", payload.name, payload.value, payload.rating);
  }

  // Send to analytics endpoint
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    navigator.sendBeacon(
      "/api/analytics/vitals",
      JSON.stringify(payload)
    );
  } else {
    fetch("/api/analytics/vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }
}

export async function initWebVitals() {
  if (typeof window === "undefined") return;

  const { onCLS, onINP, onFCP, onLCP, onTTFB } = await import("web-vitals");

  onCLS(reportWebVitals);
  onINP(reportWebVitals);
  onFCP(reportWebVitals);
  onLCP(reportWebVitals);
  onTTFB(reportWebVitals);
}

// Thresholds for each metric (in ms or unitless for CLS)
export const VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

export function getVitalsRating(name: string, value: number): "good" | "needs-improvement" | "poor" {
  const threshold = VITALS_THRESHOLDS[name as keyof typeof VITALS_THRESHOLDS];
  if (!threshold) return "good";

  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}
