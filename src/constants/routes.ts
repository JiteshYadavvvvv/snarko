import type { GameCategory } from "@/types/game";

/**
 * Static, always-crawlable routes. `sitemap.ts` combines this with the
 * catalogue-derived game and category routes, so the sitemap can never drift
 * from what the app actually serves.
 */
export const PUBLIC_ROUTES = ["/"] as const;

export const NAV_ITEMS = [
  { label: "Games", href: "/#games" },
  { label: "Categories", href: "/#categories" },
] as const;

export function gameRoute(slug: string): string {
  return `/games/${slug}`;
}

export function categoryRoute(category: GameCategory): string {
  return `/games/category/${category}`;
}
