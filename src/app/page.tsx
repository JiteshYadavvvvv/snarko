import { Badge } from "@/components/ui/badge";
import { AnimatedReveal } from "@/components/shared/animated-reveal";
import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <AnimatedReveal>
        <Badge>Phase 0 &middot; Foundation</Badge>
        <h1 className="mt-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          {siteConfig.name}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
          {siteConfig.tagline}
        </p>
        <p className="mx-auto mt-8 max-w-sm text-sm text-muted-foreground">
          The platform is under active development. Nothing is playable yet
          &mdash; check back soon.
        </p>
      </AnimatedReveal>
    </main>
  );
}
