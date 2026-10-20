# SEO

What's configured now, and what has to wait for a production domain and real
content.

## Site identity

`src/config/site.ts` is the single source of truth for the site's name,
tagline, description, and canonical origin. Everything else (metadata,
`robots.ts`, `sitemap.ts`, the OG image) reads from it rather than
hard-coding strings.

## Canonical production origin

The origin is resolved by `resolveSiteUrl()` in `src/config/site.ts`:

1. `NEXT_PUBLIC_SITE_URL`, if set (any environment).
2. `http://localhost:3000`, if `NODE_ENV === "development"` and the env var
   isn't set.
3. Otherwise, a clearly-fake placeholder (`https://snarko.example`).

This means a production build without `NEXT_PUBLIC_SITE_URL` set will **not**
leak `localhost` into metadata, `robots.txt`, or the sitemap — it falls back
to an obviously-placeholder domain instead.

**Before deploying to a real domain**, set `NEXT_PUBLIC_SITE_URL` in the
hosting provider's environment configuration (see
[`.env.example`](../.env.example)). This single variable drives:

- `metadataBase` in `src/app/layout.tsx` (canonical URL resolution for all
  relative Open Graph/metadata paths)
- `robots.ts` (the `Host` and `Sitemap` fields)
- `sitemap.ts` (every `<loc>`)
- `absoluteUrl()` in `src/lib/url.ts`, used by both of the above

## Metadata

`src/app/layout.tsx` sets root metadata via the App Router `Metadata` API:

- `title` (default + `%s | Snarko` template for child routes)
- `description`
- Open Graph (`type`, `url`, `siteName`, `title`, `description`, `locale`)
- Twitter card (`summary_large_image`)

The `favicon` file convention (`src/app/favicon.ico`) auto-generates its own
`<link rel="icon">` tag — don't also set `icons.icon` in `Metadata`, or the
tag gets duplicated.

## Open Graph image

`src/app/opengraph-image.tsx` generates a real (not fabricated-content) 1200×630
PNG at build/request time via `next/og`'s `ImageResponse`, using the site name
and tagline from `site.ts`. It is not a logo or finished brand asset — just a
legible fallback for link previews until real brand design exists.

## robots.txt and sitemap.xml

- `src/app/robots.ts` allows all crawlers and points to the sitemap.
- `src/app/sitemap.ts` lists only `PUBLIC_ROUTES`
  (`src/constants/routes.ts`) — currently just `/`. It does not, and must
  not, list invented game or catalog pages. Add a route to `PUBLIC_ROUTES`
  only when that route actually exists and should be indexed.

## Route-level metadata (for future pages)

Any new route under `src/app` should export its own `metadata` (or
`generateMetadata` for dynamic routes) rather than relying on the root
layout's defaults for anything route-specific — title, description, and
canonical path at minimum. Use the generated `PageProps<'/route'>` helper for
type-safe `params`/`searchParams` access (see
[DEVELOPMENT.md](./DEVELOPMENT.md)). When a route's `params` or
`searchParams` feed into `generateMetadata`, remember both are async in
Next.js 16.

## Structured data (deferred)

No JSON-LD is implemented yet, because there's no real content to describe.
Once individual game pages exist, `VideoGame` structured data
(schema.org) is the relevant type — but only with facts the platform actually
has (real title, real description, real release/category data). Do not
populate `aggregateRating`, review counts, or play counts unless that data is
real and currently accurate; fabricated ratings are a Google Search spam
violation, not just bad practice.

## What must wait

- **A real favicon/icon set and `apple-icon`.** Phase 0 keeps the default
  Next.js `favicon.ico` deliberately — SNARKO's visual identity (logo, icon)
  isn't designed yet. Add `src/app/icon.*` / `apple-icon.*` once it is.
- **Setting `NEXT_PUBLIC_SITE_URL` to the real domain** — only meaningful
  once a production domain exists.
- **Structured data for games** — only once real game pages exist.
- **Submitting the sitemap to Search Console** and any other indexing
  request — only after a real deploy on a real domain. Nothing here promises
  rankings or fast indexing; both depend on factors outside this repo.
