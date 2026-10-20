import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { GameArtwork } from "@/components/games/game-artwork";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-6 pt-10 pb-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12 lg:pt-14 lg:pb-10">
      <AnimatedReveal>
        <Badge>Neon Breaker is live</Badge>
        <h1 className="text-foreground mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem]">
          Browser games, no waiting around.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-md text-lg">
          Pick a game, hit play, done. Snarko is a growing catalogue of fast,
          free browser games &mdash; no downloads, no accounts.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button href="/#games">Browse games</Button>
          <Button href="/#categories" variant="secondary">
            View categories
          </Button>
        </div>
      </AnimatedReveal>
      <div
        aria-hidden="true"
        className="relative hidden h-64 items-center justify-center lg:flex"
      >
        <div className="border-border bg-surface absolute h-40 w-32 -translate-x-16 -rotate-6 overflow-hidden rounded-xl border shadow-sm">
          <GameArtwork
            slug="hexshift"
            category="puzzle"
            className="h-full w-full"
          />
        </div>
        <div className="border-border bg-surface absolute h-40 w-32 translate-x-16 rotate-6 overflow-hidden rounded-xl border shadow-sm">
          <GameArtwork
            slug="scrap-circuit"
            category="racing"
            className="h-full w-full"
          />
        </div>
        <div className="border-border bg-surface relative z-10 h-48 w-36 overflow-hidden rounded-xl border shadow-md">
          <GameArtwork
            slug="neon-breaker"
            category="arcade"
            className="h-full w-full"
          />
        </div>
      </div>
    </section>
  );
}
