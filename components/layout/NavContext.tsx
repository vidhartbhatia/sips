// design-rules: enforced
"use client";

import { createContext, useContext, type ReactNode } from "react";

// The root layout (a server component) knows whether any story is published. Header and
// Footer are rendered by client components too (MapView, admin pages), so they read it from
// context instead of a prop.
const HasStoriesContext = createContext(false);

interface NavProviderProps {
  hasStories: boolean;
  children: ReactNode;
}

export function NavProvider({ hasStories, children }: NavProviderProps) {
  return <HasStoriesContext.Provider value={hasStories}>{children}</HasStoriesContext.Provider>;
}

/** True once at least one story is published. */
export function useHasStories(): boolean {
  return useContext(HasStoriesContext);
}
