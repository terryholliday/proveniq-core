/**
 * Reduced Motion Utilities
 * L4.2.3 - Accessibility compliance for motion-sensitive users
 * 
 * Respects the prefers-reduced-motion media query and provides
 * utilities for conditionally applying animations.
 */

'use client';

import { useEffect, useState } from 'react';

// ============================================
// MEDIA QUERY DETECTION
// ============================================

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Check if the user prefers reduced motion (SSR-safe)
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false; // Default to animations on server
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * React hook that tracks the user's reduced motion preference
 * Updates reactively when the preference changes
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    
    // Set initial value
    setReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Legacy browsers (Safari < 14)
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return reducedMotion;
}

// ============================================
// MOTION-SAFE ANIMATION VARIANTS
// ============================================

/**
 * Framer Motion variants that respect reduced motion preference
 * Use these instead of custom variants for accessibility
 */
export const motionSafeVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeInUp: {
    initial: (reducedMotion: boolean) => ({
      opacity: 0,
      y: reducedMotion ? 0 : 20,
    }),
    animate: {
      opacity: 1,
      y: 0,
    },
    exit: (reducedMotion: boolean) => ({
      opacity: 0,
      y: reducedMotion ? 0 : -20,
    }),
  },
  fadeInScale: {
    initial: (reducedMotion: boolean) => ({
      opacity: 0,
      scale: reducedMotion ? 1 : 0.95,
    }),
    animate: {
      opacity: 1,
      scale: 1,
    },
    exit: (reducedMotion: boolean) => ({
      opacity: 0,
      scale: reducedMotion ? 1 : 0.95,
    }),
  },
  slideInLeft: {
    initial: (reducedMotion: boolean) => ({
      opacity: 0,
      x: reducedMotion ? 0 : -20,
    }),
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: (reducedMotion: boolean) => ({
      opacity: 0,
      x: reducedMotion ? 0 : 20,
    }),
  },
  slideInRight: {
    initial: (reducedMotion: boolean) => ({
      opacity: 0,
      x: reducedMotion ? 0 : 20,
    }),
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: (reducedMotion: boolean) => ({
      opacity: 0,
      x: reducedMotion ? 0 : -20,
    }),
  },
};

// ============================================
// TRANSITION HELPERS
// ============================================

/**
 * Get motion-safe transition config
 * Returns instant transitions when reduced motion is preferred
 */
export function getMotionSafeTransition(
  reducedMotion: boolean,
  options: {
    duration?: number;
    delay?: number;
    ease?: string | number[];
  } = {}
) {
  if (reducedMotion) {
    return {
      duration: 0,
      delay: 0,
    };
  }

  return {
    duration: options.duration ?? 0.3,
    delay: options.delay ?? 0,
    ease: options.ease ?? [0.25, 0.1, 0.25, 1], // ease-out
  };
}

/**
 * Get motion-safe spring config
 * Returns instant transitions when reduced motion is preferred
 */
export function getMotionSafeSpring(
  reducedMotion: boolean,
  options: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  } = {}
) {
  if (reducedMotion) {
    return {
      type: 'tween' as const,
      duration: 0,
    };
  }

  return {
    type: 'spring' as const,
    stiffness: options.stiffness ?? 300,
    damping: options.damping ?? 30,
    mass: options.mass ?? 1,
  };
}

// ============================================
// CSS UTILITIES
// ============================================

/**
 * CSS class that disables transitions when reduced motion is preferred
 * Add to tailwind.config.ts or use inline
 */
export const reducedMotionCSS = `
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;

/**
 * Tailwind classes for motion-safe animations
 * Usage: className={cn("transition-opacity", motionSafeClasses.transition)}
 */
export const motionSafeClasses = {
  transition: 'motion-safe:transition-all motion-reduce:transition-none',
  animate: 'motion-safe:animate-pulse motion-reduce:animate-none',
  transform: 'motion-safe:hover:scale-105 motion-reduce:hover:scale-100',
};

// ============================================
// ANIMATION CONTROL
// ============================================

/**
 * Conditionally return animation props based on reduced motion preference
 */
export function withReducedMotion<T extends object>(
  reducedMotion: boolean,
  animationProps: T,
  fallbackProps: Partial<T> = {}
): T | Partial<T> {
  return reducedMotion ? fallbackProps : animationProps;
}

/**
 * Create a motion-safe animation config
 * Automatically handles reduced motion preference
 */
export function createMotionSafeAnimation(config: {
  animate: object;
  reducedAnimate?: object;
  transition?: object;
  reducedTransition?: object;
}) {
  return (reducedMotion: boolean) => ({
    animate: reducedMotion 
      ? (config.reducedAnimate ?? { opacity: 1 }) 
      : config.animate,
    transition: reducedMotion
      ? (config.reducedTransition ?? { duration: 0 })
      : (config.transition ?? { duration: 0.3 }),
  });
}
