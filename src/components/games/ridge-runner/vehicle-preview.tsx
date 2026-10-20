import type { VehicleDefinition } from "@/components/games/ridge-runner/engine/types";

const TIRE_COLOR = "#17171a";
const RIM_COLOR = "#c9c9ce";
const GLASS_COLOR = "#2c3e46";
const LIGHT_COLOR = "#ffe9a8";

function Wheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={TIRE_COLOR} />
      <circle cx={cx} cy={cy} r={r * 0.55} fill={RIM_COLOR} />
    </g>
  );
}

interface SilhouetteProps {
  bodyColor: string;
  accentColor: string;
}

function BuggySilhouette({ bodyColor, accentColor }: SilhouetteProps) {
  return (
    <g>
      <path d="M 30 78 L 36 52 L 92 44 L 112 54 L 112 78 Z" fill={bodyColor} />
      <path
        d="M 54 50 L 50 20 L 78 20 L 70 48"
        fill="none"
        stroke={accentColor}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <circle
        cx={34}
        cy={60}
        r={7}
        fill="#101014"
        stroke={RIM_COLOR}
        strokeWidth={2}
      />
      <circle cx={110} cy={48} r={6} fill={LIGHT_COLOR} />
      <Wheel cx={40} cy={78} r={16} />
      <Wheel cx={104} cy={78} r={16} />
    </g>
  );
}

function TruckSilhouette({ bodyColor, accentColor }: SilhouetteProps) {
  return (
    <g>
      <rect x={28} y={56} width={44} height={24} rx={3} fill={bodyColor} />
      <rect x={66} y={24} width={40} height={36} rx={6} fill={bodyColor} />
      <rect x={70} y={30} width={20} height={18} rx={3} fill={GLASS_COLOR} />
      <rect x={60} y={18} width={22} height={6} rx={2} fill={accentColor} />
      <circle cx={64} cy={22} r={2.4} fill={LIGHT_COLOR} />
      <circle cx={78} cy={22} r={2.4} fill={LIGHT_COLOR} />
      <rect x={104} y={62} width={10} height={16} rx={2} fill={accentColor} />
      <circle cx={112} cy={60} r={5} fill={LIGHT_COLOR} />
      <Wheel cx={40} cy={80} r={18} />
      <Wheel cx={100} cy={80} r={18} />
    </g>
  );
}

function HatchSilhouette({ bodyColor, accentColor }: SilhouetteProps) {
  return (
    <g>
      <path
        d="M 30 78 L 30 52 L 66 20 L 92 28 L 100 52 L 104 78 Z"
        fill={bodyColor}
      />
      <path d="M 44 50 L 62 26 L 82 30 L 90 50 Z" fill={GLASS_COLOR} />
      <path
        d="M 22 36 L 22 48 M 16 36 L 16 48"
        stroke={accentColor}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <rect x={10} y={32} width={14} height={6} rx={2} fill={accentColor} />
      <circle cx={102} cy={58} r={6} fill={LIGHT_COLOR} />
      <Wheel cx={38} cy={78} r={14} />
      <Wheel cx={96} cy={78} r={14} />
    </g>
  );
}

const SILHOUETTES: Record<
  string,
  (props: SilhouetteProps) => React.ReactElement
> = {
  "hauler-truck": TruckSilhouette,
  "rally-hatch": HatchSilhouette,
};

export function VehiclePreview({
  vehicle,
  className = "",
}: {
  vehicle: VehicleDefinition;
  className?: string;
}) {
  const Silhouette = SILHOUETTES[vehicle.id] ?? BuggySilhouette;

  return (
    <svg
      viewBox="0 0 160 100"
      className={className}
      role="img"
      aria-label={`${vehicle.name} preview`}
    >
      <Silhouette
        bodyColor={vehicle.bodyColor}
        accentColor={vehicle.accentColor}
      />
    </svg>
  );
}
