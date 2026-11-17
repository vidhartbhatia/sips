"use client";

import { useReducedMotion } from "framer-motion";

/**
 * Returns animation props that respect prefers-reduced-motion.
 * When reduced motion is preferred, transitions are instant.
 */
export function useMotionSafe() {
  const shouldReduce = useReducedMotion();

  return {
    shouldReduce,
    /** Wraps transition to be instant when reduced motion is preferred */
    safeTransition: (transition: Record<string, unknown>) =>
      shouldReduce ? { duration: 0 } : transition,
  };
}

/** Fade-in-up animation preset — respects reduced motion */
export const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

/** Stagger children preset */
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};
