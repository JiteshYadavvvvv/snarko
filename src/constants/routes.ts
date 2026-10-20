/**
 * Canonical list of public, crawlable routes.
 * `sitemap.ts` reads this directly so the generated sitemap can never drift
 * from what the app actually serves, and never invents game or catalog pages.
 */
export const PUBLIC_ROUTES = ["/"] as const;

export const NAV_ITEMS = [
  { label: "Games", href: "/#games" },
  { label: "Categories", href: "/#categories" },
] as const;
