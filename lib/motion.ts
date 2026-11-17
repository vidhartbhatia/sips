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
