import type { SiteConfig } from "@/types/site";

// Placeholder until the real production domain is live. Overridden by
// NEXT_PUBLIC_SITE_URL in any environment where it is set (see .env).
const FALLBACK_PRODUCTION_URL = "https://snarko.example";

function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return FALLBACK_PRODUCTION_URL;
}

export const siteConfig: SiteConfig = {
  name: "Snarko",
  shortName: "Snarko",
  tagline: "A premium home for browser games.",
  description:
    "Snarko is a browser gaming platform in development. Play instantly, no downloads.",
  url: resolveSiteUrl(),
  ogLocale: "en_US",
};
