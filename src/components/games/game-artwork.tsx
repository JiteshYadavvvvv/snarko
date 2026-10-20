import type { ComponentType, SVGProps } from "react";
import { GAME_CATEGORY_META } from "@/constants/game-categories";
import type { GameCategory } from "@/types/game";

type ArtProps = SVGProps<SVGSVGElement>;

const NEON_BREAKER_COLORS = ["#E63B42", "#3BC9E6", "#E6B93B", "#8B5CF6"];

function NeonBreakerArt(props: ArtProps) {
  return (
    <svg viewBox="0 0 160 100" {...props}>
      {[0, 1, 2].map((row) =>
        Array.from({ length: 6 }).map((_, col) => (
          <rect
            key={`${row}-${col}`}
            x={8 + col * 24}
            y={14 + row * 14}
            width={20}
            height={9}
            rx={2}
            fill={NEON_BREAKER_COLORS[(row + col) % NEON_BREAKER_COLORS.length]}
            opacity={0.9}
          />
        )),
      )}
      <circle cx={80} cy={66} r={4} fill="#202024" />
      <rect x={58} y={82} width={28} height={6} rx={3} fill="#202024" />
    </svg>
  );
}

function TunnelRushArt(props: ArtProps) {
  const sizes = [84, 64, 46, 30, 16];
  return (
    <svg viewBox="0 0 160 100" {...props}>
      {sizes.map((size, i) => (
        <rect
          key={size}
          x={80 - size / 2}
          y={50 - size / 2}
          width={size}
          height={size}
          rx={size * 0.18}
          fill="none"
          stroke={i % 2 === 0 ? "#E63B42" : "#71717A"}
          strokeWidth={2.5}
          opacity={1 - i * 0.12}
        />
      ))}
    </svg>
  );
}

function GridlockArt(props: ArtProps) {
  const cells = [];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      cells.push({ row, col });
    }
  }
  return (
    <svg viewBox="0 0 160 100" {...props}>
      {cells.map(({ row, col }) => (
        <rect
          key={`${row}-${col}`}
          x={32 + col * 26}
          y={10 + row * 20}
          width={20}
          height={14}
          rx={3}
          fill={row === 1 && col === 2 ? "#E63B42" : "#71717A"}
          opacity={row === 1 && col === 2 ? 1 : 0.35}
        />
      ))}
    </svg>
  );
}

function HexshiftArt(props: ArtProps) {
  function hexPoints(cx: number, cy: number, r: number) {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(" ");
  }
  const r = 16;
  const centers = [
    [80, 50],
    [80 - r * 1.73, 50],
    [80 + r * 1.73, 50],
    [80 - r * 0.87, 50 - r * 1.5],
    [80 + r * 0.87, 50 - r * 1.5],
    [80 - r * 0.87, 50 + r * 1.5],
    [80 + r * 0.87, 50 + r * 1.5],
  ];
  return (
    <svg viewBox="0 0 160 100" {...props}>
      {centers.map(([cx, cy], i) => (
        <polygon
          key={`${cx}-${cy}`}
          points={hexPoints(cx, cy, r - 2)}
          fill="none"
          stroke={i === 0 ? "#E63B42" : "#71717A"}
          strokeWidth={2.5}
          opacity={i === 0 ? 1 : 0.4}
        />
      ))}
    </svg>
  );
}

function ScrapCircuitArt(props: ArtProps) {
  return (
    <svg viewBox="0 0 160 100" {...props}>
      <path
        d="M10 80 C40 80 40 50 70 50 S100 20 130 20 S150 20 150 20"
        fill="none"
        stroke="#71717A"
        strokeWidth={14}
        strokeLinecap="round"
        opacity={0.3}
      />
      <path
        d="M10 80 C40 80 40 50 70 50 S100 20 130 20 S150 20 150 20"
        fill="none"
        stroke="#E63B42"
        strokeWidth={3}
        strokeDasharray="10 8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LastAlleyStandingArt(props: ArtProps) {
  return (
    <svg viewBox="0 0 160 100" {...props}>
      <polygon
        points="80,16 92,42 120,38 98,58 110,84 80,68 50,84 62,58 40,38 68,42"
        fill="#E63B42"
      />
      <polygon
        points="80,30 86,46 100,44 88,55 94,70 80,61 66,70 72,55 60,44 74,46"
        fill="#202024"
        opacity={0.85}
      />
    </svg>
  );
}

function InkAndIronArt(props: ArtProps) {
  return (
    <svg viewBox="0 0 160 100" {...props}>
      <circle cx={56} cy={46} r={22} fill="#202024" opacity={0.85} />
      <circle cx={80} cy={64} r={13} fill="#202024" opacity={0.6} />
      <circle cx={100} cy={38} r={16} fill="#E63B42" opacity={0.9} />
      <circle cx={112} cy={62} r={8} fill="#E63B42" opacity={0.6} />
      <circle cx={40} cy={66} r={7} fill="#202024" opacity={0.5} />
    </svg>
  );
}

function PaperStackerArt(props: ArtProps) {
  return (
    <svg viewBox="0 0 160 100" {...props}>
      <rect
        x={54}
        y={66}
        width={52}
        height={12}
        rx={2}
        fill="#71717A"
        opacity={0.5}
        transform="rotate(-2 80 72)"
      />
      <rect
        x={50}
        y={50}
        width={60}
        height={13}
        rx={2}
        fill="#71717A"
        opacity={0.7}
        transform="rotate(3 80 56)"
      />
      <rect
        x={56}
        y={33}
        width={48}
        height={13}
        rx={2}
        fill="#71717A"
        opacity={0.85}
        transform="rotate(-4 80 39)"
      />
      <rect
        x={60}
        y={17}
        width={38}
        height={12}
        rx={2}
        fill="#E63B42"
        transform="rotate(5 80 23)"
      />
    </svg>
  );
}

const ART_BY_SLUG: Record<string, ComponentType<ArtProps>> = {
  "neon-breaker": NeonBreakerArt,
  "tunnel-rush": TunnelRushArt,
  gridlock: GridlockArt,
  hexshift: HexshiftArt,
  "scrap-circuit": ScrapCircuitArt,
  "last-alley-standing": LastAlleyStandingArt,
  "ink-and-iron": InkAndIronArt,
  "paper-stacker": PaperStackerArt,
};

export function GameArtwork({
  slug,
  category,
  className = "",
}: {
  slug: string;
  category: GameCategory;
  className?: string;
}) {
  const Art = ART_BY_SLUG[slug];
  const CategoryIcon = GAME_CATEGORY_META[category].icon;

  return (
    <div
      aria-hidden="true"
      className={`bg-surface-elevated flex items-center justify-center overflow-hidden ${className}`.trim()}
    >
      {Art ? (
        <Art className="h-full w-full" preserveAspectRatio="xMidYMid meet" />
      ) : (
        <CategoryIcon
          className="text-border-strong size-10"
          strokeWidth={1.25}
        />
      )}
    </div>
  );
}
