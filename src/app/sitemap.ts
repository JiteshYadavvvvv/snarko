import type { MetadataRoute } from "next";
import { GAME_CATEGORIES } from "@/constants/game-categories";
import { PUBLIC_ROUTES, categoryRoute, gameRoute } from "@/constants/routes";
import { absoluteUrl } from "@/lib/url";
import { SAMPLE_GAMES } from "@/lib/sample-games";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  }));

  const categoryEntries: MetadataRoute.Sitemap = GAME_CATEGORIES.map(
    (category) => ({
      url: absoluteUrl(categoryRoute(category)),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );

  const gameEntries: MetadataRoute.Sitemap = SAMPLE_GAMES.map((game) => ({
    url: absoluteUrl(gameRoute(game.slug)),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticEntries, ...categoryEntries, ...gameEntries];
}
