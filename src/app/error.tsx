"use client";

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
      <h1 className="text-5xl font-bold tracking-tight text-foreground">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-sm text-muted-foreground">
        An unexpected error occurred. You can try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-md bg-brand-red px-4 py-2 text-sm font-bold text-brand-red-foreground transition-colors duration-150 hover:opacity-90"
      >
        Try again
      </button>
    </main>
  );
}
