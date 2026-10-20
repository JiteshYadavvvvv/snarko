import { Zap } from "lucide-react";
import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-6 pt-14 pb-10 lg:grid-cols-2 lg:items-center lg:pt-20 lg:pb-14">
      <AnimatedReveal>
        <Badge>In development</Badge>
        <h1 className="text-foreground mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Play now. Argue later.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-md text-lg">
          Snarko is a browser gaming platform taking shape &mdash; fast,
          free-to-play games with no downloads and no excuses.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/#games">Browse games</Button>
          <Button href="/#categories" variant="secondary">
            View categories
          </Button>
        </div>
      </AnimatedReveal>
      <div
        aria-hidden="true"
        className="relative hidden h-72 items-center justify-center lg:flex"
      >
        <div className="border-border bg-surface absolute h-56 w-56 -rotate-6 rounded-lg border" />
        <div className="border-border bg-surface-elevated absolute h-48 w-48 rotate-3 rounded-lg border" />
        <div className="bg-brand-red relative flex h-40 w-40 rotate-6 items-center justify-center rounded-lg">
          <Zap
            className="text-brand-red-foreground size-16 -rotate-6"
            strokeWidth={1.5}
          />
        </div>
      </div>
    </section>
  );
}
