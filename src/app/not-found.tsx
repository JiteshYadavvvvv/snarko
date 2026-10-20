import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-foreground">
        404
      </h1>
      <p className="mt-4 max-w-sm text-muted-foreground">
        This page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md border border-border-strong px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-surface"
      >
        Back home
      </Link>
    </main>
  );
}
