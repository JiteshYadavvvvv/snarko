import Link from "next/link";
import { BrandMark } from "@/components/site/brand-mark";
import { NAV_ITEMS } from "@/constants/routes";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface-strong">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <BrandMark className="text-foreground-on-strong" />
          <p className="text-muted-foreground-on-strong max-w-sm text-sm">
            A browser gaming platform in development. Only Neon Breaker is
            playable so far.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex items-center gap-4">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted-foreground-on-strong hover:text-foreground-on-strong text-sm font-medium transition-colors duration-150"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-border-on-strong border-t px-6 py-4">
        <p className="text-muted-foreground-on-strong mx-auto max-w-6xl text-xs">
          &copy; {year} Snarko.
        </p>
      </div>
    </footer>
  );
}
