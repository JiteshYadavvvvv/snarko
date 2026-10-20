import type { VehicleDefinition } from "@/components/games/ridge-runner/engine/types";

export function VehiclePreview({
  vehicle,
  className = "",
}: {
  vehicle: VehicleDefinition;
  className?: string;
}) {
  const { chassisHalfLength, chassisHalfHeight, wheelRadius, wheelBaseHalf } =
    vehicle.baseConfig;
  const scale = 1.6;
  const cx = 80;
  const cy = 60;

  return (
    <svg
      viewBox="0 0 160 100"
      className={className}
      role="img"
      aria-label={`${vehicle.name} preview`}
    >
      <circle
        cx={cx - wheelBaseHalf * scale * 0.5}
        cy={cy + chassisHalfHeight * scale * 0.4}
        r={wheelRadius * scale * 0.5}
        fill={vehicle.accentColor}
      />
      <circle
        cx={cx + wheelBaseHalf * scale * 0.5}
        cy={cy + chassisHalfHeight * scale * 0.4}
        r={wheelRadius * scale * 0.5}
        fill={vehicle.accentColor}
      />
      <rect
        x={cx - chassisHalfLength * scale * 0.5}
        y={cy - chassisHalfHeight * scale * 0.5}
        width={chassisHalfLength * scale}
        height={chassisHalfHeight * scale}
        rx={6}
        fill={vehicle.bodyColor}
      />
      <rect
        x={cx - chassisHalfLength * scale * 0.18}
        y={cy - chassisHalfHeight * scale * 1.6}
        width={chassisHalfLength * scale * 0.5}
        height={chassisHalfHeight * scale * 1.1}
        rx={4}
        fill={vehicle.accentColor}
      />
    </svg>
  );
}
