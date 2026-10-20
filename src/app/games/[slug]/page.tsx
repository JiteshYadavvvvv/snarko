import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameArtwork } from "@/components/games/game-artwork";
import { GamePlayer } from "@/components/games/game-player";
import { PLAYABLE_GAME_COMPONENTS } from "@/components/games/game-registry";
import { RelatedGames } from "@/components/games/related-games";
import { AvailabilityIndicator } from "@/components/shared/availability-indicator";
import { Button } from "@/components/ui/button";
import { GAME_CATEGORY_META } from "@/constants/game-categories";
import { categoryRoute, gameRoute } from "@/constants/routes";
import {
  SAMPLE_GAMES,
  getRelatedSampleGames,
  getSampleGameBySlug,
} from "@/lib/sample-games";

export function generateStaticParams() {
  return SAMPLE_GAMES.map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = getSampleGameBySlug(slug);

  if (!game) {
    return {};
  }

  return {
    title: game.title,
    description: game.description,
    alternates: {
      canonical: gameRoute(game.slug),
    },
    openGraph: {
      title: game.title,
      description: game.description,
      url: gameRoute(game.slug),
    },
    twitter: {
      title: game.title,
      description: game.description,
    },
  };
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = getSampleGameBySlug(slug);

  if (!game) {
    notFound();
  }

  const categoryMeta = GAME_CATEGORY_META[game.category];
  const CategoryIcon = categoryMeta.icon;
  const relatedGames = getRelatedSampleGames(game);
  const PlayableComponent =
    game.availability === "playable"
      ? PLAYABLE_GAME_COMPONENTS[game.slug]
      : undefined;

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
          <li>
            <Link
              href={categoryRoute(game.category)}
              className="hover:text-foreground"
            >
              {categoryMeta.label}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            {game.title}
          </li>
        </ol>
      </nav>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <CategoryIcon className="size-4" aria-hidden="true" />
            {categoryMeta.label}
          </p>
          <h1 className="text-foreground mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            {game.title}
          </h1>
        </div>
        <AvailabilityIndicator availability={game.availability} />
      </div>

      {PlayableComponent ? (
        <div className="mt-8">
          <GamePlayer
            title={game.title}
            slug={game.slug}
            category={game.category}
            GameComponent={PlayableComponent}
          />
        </div>
      ) : (
        <>
          <div className="border-border relative mt-8 overflow-hidden rounded-lg border">
            <GameArtwork
              slug={game.slug}
              category={game.category}
              className="aspect-video"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button disabled>Not playable yet</Button>
            <p className="text-muted-foreground text-sm">
              {game.availability === "playable"
                ? "This game can't load right now — try refreshing the page."
                : "This is a sample catalogue entry — there's no working game behind it yet."}
            </p>
          </div>
        </>
      )}

      <div className="mt-10 max-w-2xl">
        <h2 className="text-foreground text-lg font-semibold">
          About this game
        </h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          {game.longDescription ?? game.description}
        </p>
        {game.inputs && game.inputs.length > 0 && (
          <p className="text-muted-foreground mt-4 text-sm">
            <span className="text-foreground font-medium">
              Supported inputs:
            </span>{" "}
            {game.inputs.join(", ")}
          </p>
        )}
      </div>

      <RelatedGames games={relatedGames} />
    </main>
  );
}
