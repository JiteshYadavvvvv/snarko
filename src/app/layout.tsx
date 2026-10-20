import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GameDiscoveryProvider } from "@/components/home/game-discovery-context";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { siteConfig } from "@/config/site";
import { SAMPLE_GAMES } from "@/lib/sample-games";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    url: "/",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    locale: siteConfig.ogLocale,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="bg-brand-red text-brand-red-foreground sr-only rounded-md px-4 py-2 text-sm font-semibold focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
        >
          Skip to main content
        </a>
        <GameDiscoveryProvider games={SAMPLE_GAMES}>
          <SiteHeader />
          <div id="main-content" className="flex flex-1 flex-col">
            {children}
          </div>
          <SiteFooter />
        </GameDiscoveryProvider>
      </body>
    </html>
  );
}
