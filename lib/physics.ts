/**
 * Global Physics & Tunables
 * Single source of truth for all magic numbers, timings, and constants.
 */

export const LAYOUT = {
    headerHeight: 64,
    sidebarWidth: 256,
    maxWidth: 1440,
} as const;

export const TIMING = {
    fast: 200,
    normal: 300,
    slow: 500,
    debounce: 300,
} as const;

export const OPACITY = {
    dim: 0.5,
    disabled: 0.3,
    hover: 0.9,
} as const;

export const Z_INDEX = {
    base: 0,
    dropdown: 100,
    modal: 1000,
    toast: 2000,
} as const;

export const BUDGET = {
    flywheel: {
        maxParticles: 12,
        maxTransforms: 20,
    },
    animation: {
        use: ['transform', 'opacity'], // Whitelist
    }
} as const;
