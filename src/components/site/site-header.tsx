"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/site/brand-mark";
import { MobileNav } from "@/components/site/mobile-nav";
import { IconButton } from "@/components/ui/icon-button";
import { SearchBar } from "@/components/ui/search-bar";
import { useGameDiscovery } from "@/components/home/game-discovery-context";
import { NAV_ITEMS } from "@/constants/routes";

const MOBILE_NAV_ID = "mobile-nav";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { query, setQuery } = useGameDiscovery();

  return (
    <header className="bg-background/95 border-border sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
        <BrandMark />
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-foreground hover:bg-surface block rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <SearchBar
          value={query}
          onChange={setQuery}
          label="Search games"
          className="ml-auto hidden max-w-xs md:flex"
        />
        <IconButton
          icon={mobileOpen ? X : Menu}
          label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls={MOBILE_NAV_ID}
          onClick={() => setMobileOpen((value) => !value)}
          className="ml-auto md:hidden"
        />
      </div>
      <MobileNav
        id={MOBILE_NAV_ID}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
    </header>
  );
}
