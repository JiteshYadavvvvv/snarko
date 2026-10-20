import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-foreground text-5xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground mt-4 max-w-sm">
        This page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="border-border-strong text-foreground hover:bg-surface mt-8 rounded-md border px-4 py-2 text-sm font-medium transition-colors duration-150"
      >
        Back home
      </Link>
    </main>
  );
}
