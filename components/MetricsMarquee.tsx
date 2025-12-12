"use client";

import { motion, useReducedMotion } from "framer-motion";

interface MetricItem {
  label: string;
  value: string;
}

interface MetricsMarqueeProps {
  items: MetricItem[];
  speed?: number;
  className?: string;
}

const DEFAULT_METRICS: MetricItem[] = [
  { label: "TVL", value: "$14.2M" },
  { label: "Active Tags", value: "8,420" },
  { label: "Fraud Prevented", value: "$2.1M" },
];

function parseMetricValue(value: string): { prefix: string; number: string; suffix: string } {
  const match = value.match(/^([^\d]*)(\d[\d,.]*\d|\d)(.*)$/);
  if (!match) {
    return { prefix: "", number: value, suffix: "" };
  }
  return {
    prefix: match[1] || "",
    number: match[2] || "",
    suffix: match[3] || "",
  };
}

export function MetricsMarquee({
  items = DEFAULT_METRICS,
  speed = 30,
  className = "",
}: MetricsMarqueeProps) {
  const prefersReducedMotion = useReducedMotion();

  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div
      className={`overflow-hidden border-y border-slate-800 bg-slate-900/30 ${className}`}
      aria-label="Platform metrics"
    >
      <motion.div
        className="flex items-center gap-12 py-4 whitespace-nowrap"
        animate={prefersReducedMotion ? undefined : { x: [0, -33.33 + "%"] }}
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration: speed,
                repeat: Infinity,
                ease: "linear",
              }
        }
      >
        {duplicatedItems.map((item, index) => {
          const { prefix, number, suffix } = parseMetricValue(item.value);

          return (
            <div
              key={`${item.label}-${index}`}
              className="flex items-center gap-3 px-6"
            >
              <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                {item.label}:
              </span>
              <span className="text-lg">
                <span className="text-slate-400">{prefix}</span>
                <span className="font-mono text-proveniq-success font-semibold">
                  {number}
                </span>
                <span className="text-slate-400">{suffix}</span>
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
