"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-foreground text-5xl font-bold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-muted-foreground mt-4 max-w-sm">
        An unexpected error occurred. You can try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-brand-red text-brand-red-foreground mt-8 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-colors duration-150 hover:opacity-90"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        Try again
      </button>
    </main>
  );
}
