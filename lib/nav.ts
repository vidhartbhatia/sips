// Public navigation, shared by the header and footer. Plain module: safe in client code.

export interface NavLink {
  href: string;
  label: string;
}

/**
 * The public nav. Stories appears only once a story is published. /map keeps its route but
 * gets no link, and /want-to-go is private, so neither is ever listed.
 */
export function publicNav(hasStories: boolean): NavLink[] {
  return [
    { href: "/cafes", label: "Cafes" },
    ...(hasStories ? [{ href: "/stories", label: "Stories" }] : []),
    { href: "/about", label: "About" },
  ];
}
