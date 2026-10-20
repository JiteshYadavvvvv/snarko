"use client";

import { useState, type ComponentType } from "react";
import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GamePlayer({
  title,
  GameComponent,
}: {
  title: string;
  GameComponent: ComponentType;
}) {
  const [started, setStarted] = useState(false);

  if (started) {
    return <GameComponent />;
  }

  return (
    <div className="bg-surface-elevated border-border relative flex aspect-video flex-col items-center justify-center gap-4 overflow-hidden rounded-lg border">
      <Gamepad2
        aria-hidden="true"
        className="text-border-strong size-20"
        strokeWidth={1}
      />
      <Button onClick={() => setStarted(true)}>Play {title}</Button>
    </div>
  );
}
