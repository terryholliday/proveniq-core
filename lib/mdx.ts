import { PROVENIQ_DNA } from "@/lib/config";

/**
 * MDX Intelligence Layer
 * Validators and utilities for documentation.
 */

export const SIMULATED_METRICS = {
    label: "SIMULATED_METRICS",
    tps: 15000,
    latency: "12ms",
    uptime: "99.999%"
} as const;

export function validateDocSlug(slug: string): boolean {
    return PROVENIQ_DNA.products.some(p => p.docSlug === slug);
}

export function getDocTitle(slug: string): string | undefined {
    return PROVENIQ_DNA.products.find(p => p.docSlug === slug)?.label;
}
