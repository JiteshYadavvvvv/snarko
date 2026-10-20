import type { GameAvailability } from "@/types/game";

const AVAILABILITY_LABEL: Record<GameAvailability, string> = {
  "coming-soon": "Coming soon",
  playable: "Playable now",
};

export function AvailabilityIndicator({
  availability,
  className = "",
}: {
  availability: GameAvailability;
  className?: string;
}) {
  return (
    <span
      className={`border-border-strong text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`.trim()}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${
          availability === "playable" ? "bg-brand-red" : "bg-muted-foreground"
        }`}
      />
      {AVAILABILITY_LABEL[availability]}
    </span>
  );
}
