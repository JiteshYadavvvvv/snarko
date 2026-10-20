"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { filterSampleGames } from "@/lib/sample-games";
import type { Game } from "@/types/game";

interface GameDiscoveryValue {
  query: string;
  setQuery: (query: string) => void;
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
  const filteredGames = useMemo(
    () => filterSampleGames(games, { query }),
    [games, query],
  );

  const value: GameDiscoveryValue = {
    query,
    setQuery,
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
