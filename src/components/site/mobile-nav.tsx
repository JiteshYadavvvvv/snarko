"use client";

import { useEffect } from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { useGameDiscovery } from "@/components/home/game-discovery-context";
import { NAV_ITEMS } from "@/constants/routes";

interface MobileNavProps {
  id: string;
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ id, open, onClose }: MobileNavProps) {
  const { query, setQuery } = useGameDiscovery();

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      id={id}
      className="border-border bg-background border-t px-6 py-4 md:hidden"
    >
      <SearchBar
        value={query}
        onChange={setQuery}
        label="Search games"
        className="mb-4"
      />
      <nav aria-label="Primary">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={onClose}
                className="text-foreground hover:bg-surface block rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
