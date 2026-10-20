import { FeaturedShelf } from "@/components/home/featured-shelf";
import { GameDiscoverySection } from "@/components/home/game-discovery-section";
import { Hero } from "@/components/home/hero";
import { SAMPLE_GAMES } from "@/lib/sample-games";

export default function Home() {
  const featuredGames = SAMPLE_GAMES.filter((game) => game.featured);

  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <FeaturedShelf games={featuredGames} />
      <GameDiscoverySection />
    </main>
  );
}
