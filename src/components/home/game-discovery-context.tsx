"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { filterSampleGames, getSampleGameCategories } from "@/lib/sample-games";
import type { Game, GameCategory } from "@/types/game";

interface GameDiscoveryValue {
  query: string;
  setQuery: (query: string) => void;
  category: GameCategory | "all";
  setCategory: (category: GameCategory | "all") => void;
  categories: GameCategory[];
  games: Game[];
  filteredGames: Game[];
}

const GameDiscoveryContext = createContext<GameDiscoveryValue | null>(null);

export function GameDiscoveryProvider({
  games,
  children,
}: {
  games: Game[];
  children: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GameCategory | "all">("all");
  const categories = useMemo(() => getSampleGameCategories(), []);
  const filteredGames = useMemo(
    () => filterSampleGames(games, { query, category }),
    [games, query, category],
  );

  const value: GameDiscoveryValue = {
    query,
    setQuery,
    category,
    setCategory,
    categories,
    games,
    filteredGames,
  };

  return (
    <GameDiscoveryContext.Provider value={value}>
      {children}
    </GameDiscoveryContext.Provider>
  );
}

export function useGameDiscovery(): GameDiscoveryValue {
  const context = useContext(GameDiscoveryContext);
  if (!context) {
    throw new Error(
      "useGameDiscovery must be used within a GameDiscoveryProvider",
    );
  }
  return context;
}
