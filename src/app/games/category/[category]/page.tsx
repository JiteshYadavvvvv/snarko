import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameCard } from "@/components/home/game-card";
import { CategoryNav } from "@/components/shared/category-nav";
import {
  GAME_CATEGORIES,
  GAME_CATEGORY_META,
  isGameCategory,
} from "@/constants/game-categories";
import { categoryRoute } from "@/constants/routes";
import { SAMPLE_GAMES, filterSampleGames } from "@/lib/sample-games";

export function generateStaticParams() {
  return GAME_CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  if (!isGameCategory(category)) {
    return {};
  }

  const meta = GAME_CATEGORY_META[category];

  return {
    title: `${meta.label} games`,
    description: meta.description,
    alternates: {
      canonical: categoryRoute(category),
    },
    openGraph: {
      title: `${meta.label} games`,
      description: meta.description,
      url: categoryRoute(category),
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!isGameCategory(category)) {
    notFound();
  }

  const meta = GAME_CATEGORY_META[category];
  const games = filterSampleGames(SAMPLE_GAMES, { category });

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <nav aria-label="Breadcrumb">
        <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
          <li>
            <Link href="/" className="hover:text-foreground">
              Games
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            {meta.label}
          </li>
        </ol>
      </nav>

      <h1 className="text-foreground mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
        {meta.label} games
      </h1>
      <p className="text-muted-foreground mt-2 max-w-xl">{meta.description}</p>

      <CategoryNav
        categories={GAME_CATEGORIES}
        active={category}
        className="mt-8"
      />

      {games.length > 0 ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </ul>
      ) : (
        <div className="border-border mt-8 flex flex-col items-center gap-3 rounded-md border py-16 text-center">
          <p className="text-foreground font-medium">
            No {meta.label.toLowerCase()} games yet.
          </p>
          <p className="text-muted-foreground text-sm">
            Check back soon, or browse another category above.
          </p>
        </div>
      )}
    </main>
  );
}
