import { GameDiscoverySection } from "@/components/home/game-discovery-section";
import { Hero } from "@/components/home/hero";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <GameDiscoverySection />
    </main>
  );
}
