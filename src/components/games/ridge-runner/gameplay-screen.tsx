"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Coins,
  Flag,
  Fuel,
  Pause,
  Play,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { ACHIEVEMENTS } from "@/components/games/ridge-runner/engine/achievements";
import { buildVehicleConfig } from "@/components/games/ridge-runner/engine/economy";
import {
  OBJECTIVES,
  getObjectivesForStage,
} from "@/components/games/ridge-runner/engine/objectives";
import {
  applyRunResult,
  persistSave,
} from "@/components/games/ridge-runner/engine/progression";
import {
  generateCollectibles,
  generateTerrain,
  groundHeightAt,
} from "@/components/games/ridge-runner/engine/terrain";
import { generateSceneryProps } from "@/components/games/ridge-runner/engine/scenery";
import {
  getNextStage,
  getStageDefinition,
  isStageUnlocked,
} from "@/components/games/ridge-runner/engine/stages";
import {
  RUN_START_X,
  pauseRun,
  resumeRun,
  startRun,
  step,
} from "@/components/games/ridge-runner/engine/run";
import { getVehicleDefinition } from "@/components/games/ridge-runner/engine/vehicles";
import type {
  CollectiblePlacement,
  RunResult,
  RunState,
  RunStatus,
  SaveData,
  StagePalette,
  Terrain,
  VehicleConfig,
  VehicleInput,
} from "@/components/games/ridge-runner/engine/types";
import type { SceneryProp } from "@/components/games/ridge-runner/engine/scenery";
import { Button } from "@/components/ui/button";

const LOGICAL_WIDTH = 960;
const LOGICAL_HEIGHT = 540;
const CAMERA_LEAD = 180;
const CAMERA_SMOOTHING = 4.5;
const MAX_FRAME_DELTA = 1 / 20;
const TIRE_COLOR = "#17171a";
const RIM_COLOR = "#c9c9ce";
const RIM_HUB_COLOR = "#2a2a2e";
const GLASS_COLOR = "#2c3e46";
const GLASS_HIGHLIGHT = "rgba(255,255,255,0.22)";
const LIGHT_COLOR = "#ffe9a8";
const TAIL_LIGHT_COLOR = "#e6453b";
const BUMPER_COLOR = "#232327";
const SHADOW_COLOR = "rgba(10, 14, 12, 0.32)";

function shadeColor(hex: string, percent: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const num = parseInt(normalized, 16);
  const amt = Math.round(2.55 * percent);
  const clamp = (value: number) => Math.max(0, Math.min(255, value));
  const r = clamp((num >> 16) + amt);
  const g = clamp(((num >> 8) & 0x00ff) + amt);
  const b = clamp((num & 0x0000ff) + amt);
  return `rgb(${r}, ${g}, ${b})`;
}

interface HudSnapshot {
  status: RunStatus;
  distance: number;
  fuel: number;
  coinsThisRun: number;
}

function toHudSnapshot(state: RunState): HudSnapshot {
  return {
    status: state.status,
    distance: Math.round(state.distance),
    fuel: Math.round(state.vehicle.fuel),
    coinsThisRun: state.coinsThisRun,
  };
}

function hudEqual(a: HudSnapshot, b: HudSnapshot): boolean {
  return (
    a.status === b.status &&
    a.distance === b.distance &&
    a.fuel === b.fuel &&
    a.coinsThisRun === b.coinsThisRun
  );
}

function formatDistance(value: number): string {
  return `${value}m`;
}

function fuelBarColor(fuel: number): string {
  if (fuel <= 20) return "#e63b42";
  if (fuel <= 50) return "#e6b93b";
  return "#3f9d5c";
}

type ParticleKind = "crash" | "dust" | "sparkle";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  kind: ParticleKind;
}

function GameCanvas({
  runStateRef,
  terrain,
  collectibles,
  sceneryProps,
  configRef,
  vehicleId,
  stageId,
  finishDistance,
  palette,
  bodyColor,
  accentColor,
  onHudChange,
  announce,
  onInitError,
}: {
  runStateRef: React.RefObject<RunState>;
  terrain: Terrain;
  collectibles: CollectiblePlacement[];
  sceneryProps: SceneryProp[];
  configRef: React.RefObject<VehicleConfig>;
  vehicleId: string;
  stageId: string;
  finishDistance: number;
  palette: StagePalette;
  bodyColor: string;
  accentColor: string;
  onHudChange: (snapshot: HudSnapshot) => void;
  announce: (message: string) => void;
  onInitError: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scaleRef = useRef(1);
  const inputRef = useRef<VehicleInput>({ gas: false, brake: false });
  const cameraRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const wheelSpinRef = useRef(0);
  const hudRef = useRef<HudSnapshot>({
    status: "idle",
    distance: 0,
    fuel: 100,
    coinsThisRun: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onInitError();
      return undefined;
    }

    cameraRef.current = {
      x: runStateRef.current.vehicle.position.x + CAMERA_LEAD,
      y: runStateRef.current.vehicle.position.y,
    };
    hudRef.current = toHudSnapshot(runStateRef.current);

    function resize() {
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const cssWidthRounded = Math.round(rect.width);
      const nextWidth = Math.round(cssWidthRounded * dpr);
      const nextHeight = Math.round(
        cssWidthRounded * (LOGICAL_HEIGHT / LOGICAL_WIDTH) * dpr,
      );
      if (canvas.width === nextWidth && canvas.height === nextHeight) {
        return;
      }

      const cssHeight = cssWidthRounded * (LOGICAL_HEIGHT / LOGICAL_WIDTH);
      canvas.style.width = `${cssWidthRounded}px`;
      canvas.style.height = `${cssHeight}px`;
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      scaleRef.current = (cssWidthRounded * dpr) / LOGICAL_WIDTH;
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    function setKey(key: string, pressed: boolean) {
      if (key === "ArrowUp" || key === "w" || key === "W") {
        inputRef.current = { ...inputRef.current, gas: pressed };
      }
      if (key === "ArrowDown" || key === "s" || key === "S") {
        inputRef.current = { ...inputRef.current, brake: pressed };
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (
        ["ArrowUp", "ArrowDown", "w", "W", "s", "S", " ", "Escape"].includes(
          event.key,
        )
      ) {
        event.preventDefault();
      }
      setKey(event.key, true);
      if (event.key === "Escape") {
        const current = runStateRef.current;
        if (current.status === "playing") {
          runStateRef.current = pauseRun(current);
        } else if (current.status === "paused") {
          runStateRef.current = resumeRun(current);
        }
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      setKey(event.key, false);
    }

    container.addEventListener("keydown", onKeyDown);
    container.addEventListener("keyup", onKeyUp);

    let frameId: number;
    let lastTime = performance.now();

    function spawnParticles(
      x: number,
      y: number,
      count: number,
      kind: ParticleKind,
      color: string,
      speedMin: number,
      speedMax: number,
      lifeMin: number,
      lifeMax: number,
      upwardBias: number,
    ) {
      const particles: Particle[] = [...particlesRef.current];
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = speedMin + Math.random() * (speedMax - speedMin);
        const life = lifeMin + Math.random() * (lifeMax - lifeMin);
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - upwardBias,
          life,
          maxLife: life,
          color,
          kind,
        });
      }
      particlesRef.current = particles;
    }

    function worldToScreen(worldX: number, worldY: number) {
      return {
        x: worldX - cameraRef.current.x + LOGICAL_WIDTH / 2,
        y: worldY - cameraRef.current.y + LOGICAL_HEIGHT / 2,
      };
    }

    function drawBackground() {
      const gradient = ctx!.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
      gradient.addColorStop(0, palette.skyTop);
      gradient.addColorStop(1, palette.skyBottom);
      ctx!.fillStyle = gradient;
      ctx!.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      const sunParallax = 0.05;
      const sunScreenX =
        LOGICAL_WIDTH * 0.78 - cameraRef.current.x * sunParallax * 0.001;
      ctx!.save();
      ctx!.globalAlpha = 0.85;
      ctx!.fillStyle = "#ffffff";
      ctx!.beginPath();
      ctx!.arc(
        ((sunScreenX % (LOGICAL_WIDTH * 1.4)) + LOGICAL_WIDTH * 1.4) %
          (LOGICAL_WIDTH * 1.4),
        LOGICAL_HEIGHT * 0.16,
        34,
        0,
        Math.PI * 2,
      );
      ctx!.fill();
      ctx!.restore();

      const cloudParallax = 0.08;
      const cloudBaseX = -((cameraRef.current.x * cloudParallax) % 420) - 420;
      for (let i = 0; i < 6; i += 1) {
        const cx = cloudBaseX + i * 420;
        const cy = 60 + (i % 3) * 26;
        ctx!.save();
        ctx!.globalAlpha = 0.5;
        ctx!.fillStyle = "#ffffff";
        ctx!.beginPath();
        ctx!.ellipse(cx, cy, 46, 16, 0, 0, Math.PI * 2);
        ctx!.ellipse(cx + 30, cy + 6, 32, 13, 0, 0, Math.PI * 2);
        ctx!.ellipse(cx - 28, cy + 8, 28, 12, 0, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }
    }

    function mountainHeightAt(x: number, phase: number, scale: number) {
      return (
        LOGICAL_HEIGHT * 0.42 +
        scale * 70 * Math.sin(x * 0.0016 + phase) +
        scale * 34 * Math.sin(x * 0.0041 + phase * 1.7)
      );
    }

    function drawMountainLayer(
      parallax: number,
      phase: number,
      scale: number,
      fillColor: string,
    ) {
      const worldLeft = cameraRef.current.x - LOGICAL_WIDTH / 2 - 200;
      const worldRight = cameraRef.current.x + LOGICAL_WIDTH / 2 + 200;
      const step = 48;

      ctx!.beginPath();
      let started = false;
      for (let x = worldLeft; x <= worldRight; x += step) {
        const sampledX =
          cameraRef.current.x + (x - cameraRef.current.x) * parallax;
        const y = mountainHeightAt(sampledX, phase, scale);
        const screen = worldToScreen(x, y);
        if (!started) {
          ctx!.moveTo(screen.x, screen.y);
          started = true;
        } else {
          ctx!.lineTo(screen.x, screen.y);
        }
      }
      ctx!.lineTo(LOGICAL_WIDTH + 60, LOGICAL_HEIGHT + 60);
      ctx!.lineTo(-60, LOGICAL_HEIGHT + 60);
      ctx!.closePath();
      ctx!.fillStyle = fillColor;
      ctx!.fill();
    }

    function drawTerrainLayer(
      parallax: number,
      verticalOffset: number,
      fillColor: string,
      drawEdge: boolean,
      drawTexture: boolean,
    ) {
      const worldLeft = cameraRef.current.x - LOGICAL_WIDTH / 2 - 120;
      const worldRight = cameraRef.current.x + LOGICAL_WIDTH / 2 + 120;
      const step = 24;

      const points: { screen: { x: number; y: number }; worldX: number }[] = [];
      ctx!.beginPath();
      let started = false;
      for (let x = worldLeft; x <= worldRight; x += step) {
        const sampledX =
          cameraRef.current.x + (x - cameraRef.current.x) * parallax;
        const groundY = groundHeightAt(terrain, sampledX) + verticalOffset;
        const screen = worldToScreen(x, groundY);
        points.push({ screen, worldX: sampledX });
        if (!started) {
          ctx!.moveTo(screen.x, screen.y);
          started = true;
        } else {
          ctx!.lineTo(screen.x, screen.y);
        }
      }

      if (drawEdge) {
        ctx!.save();
        ctx!.strokeStyle = palette.groundEdge;
        ctx!.lineWidth = 3;
        ctx!.lineJoin = "round";
        ctx!.stroke();
        ctx!.restore();
      }

      ctx!.lineTo(LOGICAL_WIDTH + 40, LOGICAL_HEIGHT + 40);
      ctx!.lineTo(-40, LOGICAL_HEIGHT + 40);
      ctx!.closePath();
      ctx!.fillStyle = fillColor;
      ctx!.fill();

      if (drawTexture) {
        ctx!.save();
        ctx!.strokeStyle = palette.groundEdge;
        ctx!.globalAlpha = 0.22;
        ctx!.lineWidth = 2;
        for (let i = 0; i < points.length; i += 3) {
          const point = points[i];
          ctx!.beginPath();
          ctx!.moveTo(point.screen.x, point.screen.y + 3);
          ctx!.lineTo(point.screen.x, point.screen.y + 11);
          ctx!.stroke();
        }
        ctx!.restore();
      }
    }

    function drawTree(screenX: number, screenY: number, scale: number) {
      ctx!.fillStyle = palette.groundEdge;
      ctx!.fillRect(
        screenX - 2 * scale,
        screenY - 14 * scale,
        4 * scale,
        14 * scale,
      );
      ctx!.fillStyle = palette.mountainFill;
      ctx!.beginPath();
      ctx!.moveTo(screenX, screenY - 42 * scale);
      ctx!.lineTo(screenX + 15 * scale, screenY - 12 * scale);
      ctx!.lineTo(screenX - 15 * scale, screenY - 12 * scale);
      ctx!.closePath();
      ctx!.moveTo(screenX, screenY - 32 * scale);
      ctx!.lineTo(screenX + 12 * scale, screenY - 6 * scale);
      ctx!.lineTo(screenX - 12 * scale, screenY - 6 * scale);
      ctx!.closePath();
      ctx!.fill();
    }

    function drawBush(screenX: number, screenY: number, scale: number) {
      ctx!.fillStyle = palette.mountainFill;
      ctx!.beginPath();
      ctx!.ellipse(
        screenX,
        screenY - 6 * scale,
        14 * scale,
        9 * scale,
        0,
        0,
        Math.PI * 2,
      );
      ctx!.ellipse(
        screenX - 10 * scale,
        screenY - 3 * scale,
        9 * scale,
        7 * scale,
        0,
        0,
        Math.PI * 2,
      );
      ctx!.ellipse(
        screenX + 10 * scale,
        screenY - 3 * scale,
        9 * scale,
        7 * scale,
        0,
        0,
        Math.PI * 2,
      );
      ctx!.fill();
    }

    function drawFence(screenX: number, screenY: number, scale: number) {
      ctx!.fillStyle = palette.groundEdge;
      ctx!.fillRect(
        screenX - 14 * scale,
        screenY - 20 * scale,
        3 * scale,
        20 * scale,
      );
      ctx!.fillRect(
        screenX + 11 * scale,
        screenY - 20 * scale,
        3 * scale,
        20 * scale,
      );
      ctx!.strokeStyle = palette.groundEdge;
      ctx!.lineWidth = Math.max(1.5, 2.5 * scale);
      ctx!.beginPath();
      ctx!.moveTo(screenX - 15 * scale, screenY - 15 * scale);
      ctx!.lineTo(screenX + 15 * scale, screenY - 15 * scale);
      ctx!.moveTo(screenX - 15 * scale, screenY - 6 * scale);
      ctx!.lineTo(screenX + 15 * scale, screenY - 6 * scale);
      ctx!.stroke();
    }

    function drawRockCluster(screenX: number, screenY: number, scale: number) {
      ctx!.fillStyle = palette.groundEdge;
      ctx!.beginPath();
      ctx!.moveTo(screenX - 16 * scale, screenY);
      ctx!.lineTo(screenX - 10 * scale, screenY - 16 * scale);
      ctx!.lineTo(screenX, screenY - 10 * scale);
      ctx!.lineTo(screenX + 9 * scale, screenY - 18 * scale);
      ctx!.lineTo(screenX + 17 * scale, screenY);
      ctx!.closePath();
      ctx!.fill();
      ctx!.fillStyle = palette.mountainFill;
      ctx!.beginPath();
      ctx!.moveTo(screenX - 8 * scale, screenY);
      ctx!.lineTo(screenX - 3 * scale, screenY - 9 * scale);
      ctx!.lineTo(screenX + 4 * scale, screenY - 5 * scale);
      ctx!.lineTo(screenX + 10 * scale, screenY);
      ctx!.closePath();
      ctx!.fill();
    }

    function drawRockSpire(screenX: number, screenY: number, scale: number) {
      ctx!.fillStyle = palette.mountainFill;
      ctx!.beginPath();
      ctx!.moveTo(screenX, screenY - 60 * scale);
      ctx!.lineTo(screenX + 10 * scale, screenY - 24 * scale);
      ctx!.lineTo(screenX + 18 * scale, screenY);
      ctx!.lineTo(screenX - 18 * scale, screenY);
      ctx!.lineTo(screenX - 9 * scale, screenY - 22 * scale);
      ctx!.closePath();
      ctx!.fill();
      ctx!.fillStyle = palette.groundEdge;
      ctx!.globalAlpha = 0.45;
      ctx!.beginPath();
      ctx!.moveTo(screenX, screenY - 60 * scale);
      ctx!.lineTo(screenX + 10 * scale, screenY - 24 * scale);
      ctx!.lineTo(screenX + 4 * scale, screenY - 20 * scale);
      ctx!.closePath();
      ctx!.fill();
      ctx!.globalAlpha = 1;
    }

    function drawEvergreen(screenX: number, screenY: number, scale: number) {
      ctx!.fillStyle = "#5a4634";
      ctx!.fillRect(
        screenX - 2 * scale,
        screenY - 12 * scale,
        4 * scale,
        12 * scale,
      );
      ctx!.fillStyle = palette.mountainFill;
      for (let tier = 0; tier < 3; tier += 1) {
        const tierY = screenY - 14 * scale - tier * 13 * scale;
        const width = (20 - tier * 4) * scale;
        ctx!.beginPath();
        ctx!.moveTo(screenX, tierY - 16 * scale);
        ctx!.lineTo(screenX + width * 0.5, tierY);
        ctx!.lineTo(screenX - width * 0.5, tierY);
        ctx!.closePath();
        ctx!.fill();
      }
      ctx!.fillStyle = "#ffffff";
      ctx!.globalAlpha = 0.55;
      for (let tier = 0; tier < 3; tier += 1) {
        const tierY = screenY - 14 * scale - tier * 13 * scale;
        const width = (20 - tier * 4) * scale;
        ctx!.beginPath();
        ctx!.moveTo(screenX, tierY - 16 * scale);
        ctx!.lineTo(screenX + width * 0.18, tierY - 4 * scale);
        ctx!.lineTo(screenX - width * 0.12, tierY - 4 * scale);
        ctx!.closePath();
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    function drawIceCrystals(screenX: number, screenY: number, scale: number) {
      ctx!.fillStyle = "#e8f4f8";
      ctx!.strokeStyle = palette.groundEdge;
      ctx!.lineWidth = 1;
      for (const [dx, h] of [
        [-10, 22],
        [0, 32],
        [10, 18],
      ] as const) {
        ctx!.beginPath();
        ctx!.moveTo(screenX + dx * scale, screenY);
        ctx!.lineTo(screenX + dx * scale + 5 * scale, screenY - h * scale * 0.4);
        ctx!.lineTo(screenX + dx * scale, screenY - h * scale);
        ctx!.lineTo(screenX + dx * scale - 5 * scale, screenY - h * scale * 0.4);
        ctx!.closePath();
        ctx!.fill();
        ctx!.stroke();
      }
    }

    function drawSnowDrift(screenX: number, screenY: number, scale: number) {
      ctx!.fillStyle = "#eef6f8";
      ctx!.beginPath();
      ctx!.ellipse(
        screenX,
        screenY - 4 * scale,
        20 * scale,
        9 * scale,
        0,
        0,
        Math.PI * 2,
      );
      ctx!.ellipse(
        screenX - 12 * scale,
        screenY - 2 * scale,
        11 * scale,
        6 * scale,
        0,
        0,
        Math.PI * 2,
      );
      ctx!.fill();
      ctx!.fillStyle = palette.groundEdge;
      ctx!.globalAlpha = 0.25;
      ctx!.beginPath();
      ctx!.ellipse(
        screenX,
        screenY - 2 * scale,
        18 * scale,
        5 * scale,
        0,
        0,
        Math.PI * 2,
      );
      ctx!.fill();
      ctx!.globalAlpha = 1;
    }

    const SCENERY_BY_STAGE: Record<
      string,
      ((x: number, y: number, scale: number) => void)[]
    > = {
      countryside: [drawTree, drawBush, drawFence],
      "dusk-ridge": [drawTree, drawRockCluster, drawRockSpire],
      frostline: [drawEvergreen, drawIceCrystals, drawSnowDrift],
    };

    function drawScenery() {
      const variants = SCENERY_BY_STAGE[stageId] ?? SCENERY_BY_STAGE.countryside;
      for (const prop of sceneryProps) {
        const screen = worldToScreen(prop.x, prop.groundY);
        if (screen.x < -60 || screen.x > LOGICAL_WIDTH + 60) continue;
        const draw = variants[prop.variant] ?? variants[0];
        draw(screen.x, screen.y, prop.scale);
      }
    }

    function drawFinishMarker() {
      const screen = worldToScreen(
        finishDistance + RUN_START_X,
        groundHeightAt(terrain, finishDistance + RUN_START_X),
      );
      if (screen.x < -80 || screen.x > LOGICAL_WIDTH + 80) return;

      const poleHeight = 118;
      ctx!.strokeStyle = "#3a3a3e";
      ctx!.lineWidth = 5;
      ctx!.beginPath();
      ctx!.moveTo(screen.x, screen.y + 4);
      ctx!.lineTo(screen.x, screen.y - poleHeight);
      ctx!.stroke();

      const checkSize = 9;
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          ctx!.fillStyle = (row + col) % 2 === 0 ? "#1a1a1d" : "#f4f4f6";
          ctx!.fillRect(
            screen.x + col * checkSize,
            screen.y - poleHeight + row * checkSize,
            checkSize,
            checkSize,
          );
        }
      }
      ctx!.strokeStyle = "#1a1a1d";
      ctx!.lineWidth = 1.5;
      ctx!.strokeRect(
        screen.x,
        screen.y - poleHeight,
        checkSize * 4,
        checkSize * 4,
      );
    }

    function drawCollectibles() {
      for (const collectible of collectibles) {
        if (runStateRef.current.collectedIds.includes(collectible.id)) {
          continue;
        }
        const screen = worldToScreen(collectible.x, collectible.y);
        if (screen.x < -40 || screen.x > LOGICAL_WIDTH + 40) continue;

        if (collectible.kind === "coin") {
          ctx!.beginPath();
          ctx!.fillStyle = "#e6b93b";
          ctx!.arc(screen.x, screen.y, 10, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.strokeStyle = "#8a6a1c";
          ctx!.lineWidth = 1.5;
          ctx!.stroke();
          ctx!.strokeStyle = "rgba(255,255,255,0.65)";
          ctx!.lineWidth = 1.5;
          ctx!.beginPath();
          ctx!.arc(screen.x, screen.y, 5.5, 0, Math.PI * 2);
          ctx!.stroke();
        } else {
          ctx!.fillStyle = "#3bc9e6";
          ctx!.beginPath();
          ctx!.roundRect(screen.x - 9, screen.y - 13, 18, 26, 4);
          ctx!.fill();
          ctx!.fillStyle = "#1a4452";
          ctx!.fillRect(screen.x - 9, screen.y - 4, 18, 5);
          ctx!.fillStyle = "rgba(255,255,255,0.4)";
          ctx!.fillRect(screen.x - 6, screen.y - 10, 3, 6);
        }
      }
    }

    function drawWheel(cx: number, cy: number, radius: number, spin: number) {
      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(spin);
      ctx!.fillStyle = TIRE_COLOR;
      ctx!.beginPath();
      ctx!.arc(0, 0, radius, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = RIM_COLOR;
      ctx!.beginPath();
      ctx!.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = "#5a5a60";
      ctx!.lineWidth = Math.max(1.4, radius * 0.12);
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2;
        ctx!.beginPath();
        ctx!.moveTo(0, 0);
        ctx!.lineTo(Math.cos(a) * radius * 0.5, Math.sin(a) * radius * 0.5);
        ctx!.stroke();
      }
      ctx!.fillStyle = RIM_HUB_COLOR;
      ctx!.beginPath();
      ctx!.arc(0, 0, radius * 0.18, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();
    }

    function drawStrut(anchorOffsetX: number, bodyY: number, wheelY: number) {
      ctx!.strokeStyle = accentColor;
      ctx!.lineWidth = 3;
      ctx!.beginPath();
      ctx!.moveTo(anchorOffsetX, bodyY);
      ctx!.lineTo(anchorOffsetX, wheelY);
      ctx!.stroke();
    }

    function bodyGradient(x0: number, y0: number, x1: number, y1: number) {
      const gradient = ctx!.createLinearGradient(x0, y0, x1, y1);
      gradient.addColorStop(0, shadeColor(bodyColor, 26));
      gradient.addColorStop(0.55, bodyColor);
      gradient.addColorStop(1, shadeColor(bodyColor, -22));
      return gradient;
    }

    function drawGroundShadow(halfWidth: number, y: number) {
      ctx!.save();
      ctx!.fillStyle = SHADOW_COLOR;
      ctx!.beginPath();
      ctx!.ellipse(0, y, halfWidth, halfWidth * 0.22, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();
    }

    function drawBuggyBody(config: VehicleConfig) {
      const l = config.chassisHalfLength;
      const h = config.chassisHalfHeight;

      drawGroundShadow(l * 1.3, h * 1.5);

      ctx!.fillStyle = bodyGradient(-l, 0, l, 0);
      ctx!.beginPath();
      ctx!.moveTo(-l * 1.08, h * 1.05);
      ctx!.lineTo(-l * 1.1, -h * 0.05);
      ctx!.quadraticCurveTo(-l * 1.05, -h * 0.55, -l * 0.55, -h * 0.7);
      ctx!.lineTo(l * 0.35, -h * 0.85);
      ctx!.quadraticCurveTo(l * 0.75, -h * 0.75, l * 0.95, -h * 0.35);
      ctx!.lineTo(l * 1.15, h * 0.2);
      ctx!.lineTo(l * 1.15, h * 1.05);
      ctx!.closePath();
      ctx!.fill();
      ctx!.strokeStyle = shadeColor(bodyColor, -32);
      ctx!.lineWidth = 1.4;
      ctx!.stroke();

      ctx!.fillStyle = shadeColor(bodyColor, -18);
      ctx!.beginPath();
      ctx!.ellipse(-l * 1.0, h * 0.2, l * 0.26, h * 0.6, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.beginPath();
      ctx!.ellipse(l * 1.0, h * 0.2, l * 0.26, h * 0.6, 0, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.strokeStyle = accentColor;
      ctx!.lineWidth = Math.max(3, h * 0.24);
      ctx!.lineCap = "round";
      ctx!.lineJoin = "round";
      ctx!.beginPath();
      ctx!.moveTo(-l * 0.4, -h * 0.65);
      ctx!.lineTo(-l * 0.45, -h * 2.0);
      ctx!.lineTo(l * 0.15, -h * 2.0);
      ctx!.lineTo(l * 0.25, -h * 0.75);
      ctx!.moveTo(-l * 0.3, -h * 1.35);
      ctx!.lineTo(l * 0.05, -h * 1.35);
      ctx!.stroke();

      ctx!.fillStyle = "#1c1c20";
      ctx!.beginPath();
      ctx!.roundRect(-l * 0.22, -h * 1.9, l * 0.35, h * 0.55, 3);
      ctx!.fill();

      ctx!.fillStyle = shadeColor(accentColor, 50);
      ctx!.globalAlpha = 0.5;
      ctx!.beginPath();
      ctx!.moveTo(-l * 0.9, -h * 0.5);
      ctx!.lineTo(-l * 0.3, -h * 0.65);
      ctx!.lineTo(-l * 0.3, -h * 0.4);
      ctx!.lineTo(-l * 0.9, -h * 0.25);
      ctx!.closePath();
      ctx!.fill();
      ctx!.globalAlpha = 1;

      ctx!.fillStyle = "#101014";
      ctx!.beginPath();
      ctx!.arc(-l * 1.18, h * 0.15, config.wheelRadius * 0.42, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = RIM_COLOR;
      ctx!.lineWidth = 2;
      ctx!.stroke();

      ctx!.fillStyle = BUMPER_COLOR;
      ctx!.beginPath();
      ctx!.roundRect(l * 0.95, h * 0.05, l * 0.28, h * 0.24, 3);
      ctx!.fill();
      ctx!.beginPath();
      ctx!.roundRect(-l * 1.2, h * 0.65, l * 0.3, h * 0.24, 3);
      ctx!.fill();

      ctx!.fillStyle = LIGHT_COLOR;
      ctx!.beginPath();
      ctx!.arc(l * 1.05, -h * 0.25, h * 0.24, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = shadeColor(LIGHT_COLOR, -20);
      ctx!.lineWidth = 1;
      ctx!.stroke();
    }

    function drawTruckBody(config: VehicleConfig) {
      const l = config.chassisHalfLength;
      const h = config.chassisHalfHeight;

      drawGroundShadow(l * 1.3, h * 1.6);

      ctx!.fillStyle = shadeColor(bodyColor, -28);
      ctx!.beginPath();
      ctx!.roundRect(-l * 1.1, h * 0.55, l * 2.2, h * 0.35, 3);
      ctx!.fill();

      ctx!.fillStyle = bodyGradient(-l, -h, l, h);
      ctx!.beginPath();
      ctx!.roundRect(-l * 1.1, -h * 0.35, l * 0.95, h * 1.35, 5);
      ctx!.fill();
      ctx!.beginPath();
      ctx!.roundRect(-l * 0.18, -h * 1.85, l * 1.18, h * 2.05, 9);
      ctx!.fill();
      ctx!.strokeStyle = shadeColor(bodyColor, -32);
      ctx!.lineWidth = 1.2;
      ctx!.beginPath();
      ctx!.moveTo(l * 0.35, -h * 1.8);
      ctx!.lineTo(l * 0.35, h * 0.9);
      ctx!.stroke();

      ctx!.fillStyle = BUMPER_COLOR;
      ctx!.beginPath();
      ctx!.roundRect(-l * 1.05, -h * 0.2, l * 0.85, h * 0.18, 2);
      ctx!.fill();

      ctx!.fillStyle = GLASS_COLOR;
      ctx!.beginPath();
      ctx!.roundRect(l * 0.0, -h * 1.6, l * 0.58, h * 0.95, 4);
      ctx!.fill();
      ctx!.fillStyle = GLASS_HIGHLIGHT;
      ctx!.beginPath();
      ctx!.moveTo(l * 0.04, -h * 1.55);
      ctx!.lineTo(l * 0.22, -h * 1.55);
      ctx!.lineTo(l * 0.1, -h * 0.75);
      ctx!.lineTo(l * 0.04, -h * 0.75);
      ctx!.closePath();
      ctx!.fill();

      ctx!.fillStyle = shadeColor(bodyColor, -10);
      ctx!.beginPath();
      ctx!.roundRect(l * 0.58, -h * 1.1, l * 0.12, h * 0.3, 2);
      ctx!.fill();

      ctx!.fillStyle = accentColor;
      ctx!.beginPath();
      ctx!.roundRect(l * 0.95, h * 0.08, l * 0.35, h * 0.72, 4);
      ctx!.fill();
      ctx!.strokeStyle = shadeColor(accentColor, -25);
      ctx!.lineWidth = 1.2;
      for (let i = 1; i < 3; i += 1) {
        ctx!.beginPath();
        ctx!.moveTo(l * 0.95, h * (0.08 + i * 0.22));
        ctx!.lineTo(l * 1.3, h * (0.08 + i * 0.22));
        ctx!.stroke();
      }

      ctx!.fillStyle = accentColor;
      ctx!.beginPath();
      ctx!.roundRect(-l * 0.05, -h * 2.1, l * 0.6, h * 0.22, 3);
      ctx!.fill();
      ctx!.fillStyle = LIGHT_COLOR;
      ctx!.beginPath();
      ctx!.arc(-l * 0.2, -h * 1.99, 2.6, 0, Math.PI * 2);
      ctx!.arc(l * 0.15, -h * 1.99, 2.6, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.fillStyle = BUMPER_COLOR;
      ctx!.beginPath();
      ctx!.roundRect(l * 1.0, -h * 0.35, l * 0.16, h * 0.4, 2);
      ctx!.fill();
      ctx!.fillStyle = LIGHT_COLOR;
      ctx!.beginPath();
      ctx!.arc(l * 1.1, -h * 0.15, h * 0.17, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.fillStyle = TAIL_LIGHT_COLOR;
      ctx!.beginPath();
      ctx!.roundRect(-l * 1.12, h * 0.05, l * 0.1, h * 0.3, 2);
      ctx!.fill();
    }

    function drawHatchBody(config: VehicleConfig) {
      const l = config.chassisHalfLength;
      const h = config.chassisHalfHeight;

      drawGroundShadow(l * 1.3, h * 1.4);

      ctx!.fillStyle = bodyGradient(-l, -h, l, h);
      ctx!.beginPath();
      ctx!.moveTo(-l * 1.05, h * 0.95);
      ctx!.lineTo(-l * 1.05, -h * 0.15);
      ctx!.quadraticCurveTo(-l * 0.8, -h * 1.3, l * 0.15, -h * 1.75);
      ctx!.quadraticCurveTo(l * 0.65, -h * 1.5, l * 1.0, -h * 0.25);
      ctx!.lineTo(l * 1.1, h * 0.35);
      ctx!.lineTo(l * 1.1, h * 0.95);
      ctx!.closePath();
      ctx!.fill();
      ctx!.strokeStyle = shadeColor(bodyColor, -32);
      ctx!.lineWidth = 1.2;
      ctx!.stroke();

      ctx!.fillStyle = GLASS_COLOR;
      ctx!.beginPath();
      ctx!.moveTo(-l * 0.58, -h * 0.2);
      ctx!.quadraticCurveTo(-l * 0.4, -h * 1.1, l * 0.1, -h * 1.5);
      ctx!.quadraticCurveTo(l * 0.5, -h * 1.3, l * 0.68, -h * 0.2);
      ctx!.closePath();
      ctx!.fill();
      ctx!.fillStyle = GLASS_HIGHLIGHT;
      ctx!.beginPath();
      ctx!.moveTo(-l * 0.5, -h * 0.35);
      ctx!.lineTo(-l * 0.3, -h * 0.9);
      ctx!.lineTo(-l * 0.18, -h * 0.85);
      ctx!.lineTo(-l * 0.35, -h * 0.25);
      ctx!.closePath();
      ctx!.fill();

      ctx!.strokeStyle = shadeColor(bodyColor, -30);
      ctx!.lineWidth = 1.2;
      ctx!.beginPath();
      ctx!.moveTo(-l * 0.12, -h * 0.15);
      ctx!.lineTo(l * 0.75, -h * 0.05);
      ctx!.stroke();
      ctx!.fillStyle = shadeColor(bodyColor, -25);
      ctx!.beginPath();
      ctx!.arc(l * 0.5, -h * 0.08, 2.2, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.fillStyle = shadeColor(bodyColor, 20);
      ctx!.globalAlpha = 0.5;
      ctx!.beginPath();
      ctx!.roundRect(-l * 0.95, h * 0.55, l * 1.6, h * 0.14, 2);
      ctx!.fill();
      ctx!.globalAlpha = 1;

      ctx!.strokeStyle = accentColor;
      ctx!.lineWidth = 3.5;
      ctx!.lineCap = "round";
      ctx!.beginPath();
      ctx!.moveTo(-l * 0.98, -h * 0.95);
      ctx!.lineTo(-l * 0.98, -h * 0.5);
      ctx!.moveTo(-l * 1.28, -h * 1.0);
      ctx!.lineTo(-l * 1.28, -h * 0.5);
      ctx!.stroke();
      ctx!.fillStyle = accentColor;
      ctx!.beginPath();
      ctx!.roundRect(-l * 1.33, -h * 1.12, l * 0.42, h * 0.2, 2);
      ctx!.fill();

      ctx!.fillStyle = BUMPER_COLOR;
      ctx!.beginPath();
      ctx!.roundRect(l * 0.95, -h * 0.05, l * 0.2, h * 0.5, 2);
      ctx!.fill();
      ctx!.beginPath();
      ctx!.roundRect(-l * 1.15, h * 0.15, l * 0.18, h * 0.5, 2);
      ctx!.fill();

      ctx!.fillStyle = LIGHT_COLOR;
      ctx!.beginPath();
      ctx!.arc(l * 1.02, h * 0.15, h * 0.24, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = TAIL_LIGHT_COLOR;
      ctx!.beginPath();
      ctx!.roundRect(-l * 1.12, h * 0.0, l * 0.1, h * 0.32, 2);
      ctx!.fill();
    }

    function drawVehicle() {
      const state = runStateRef.current;
      const config = configRef.current;
      const vehicle = state.vehicle;
      const screen = worldToScreen(vehicle.position.x, vehicle.position.y);

      ctx!.save();
      ctx!.translate(screen.x, screen.y);
      ctx!.rotate(vehicle.angle);

      const rearY = config.suspensionRestLength - vehicle.rearWheel.compression;
      const frontY =
        config.suspensionRestLength - vehicle.frontWheel.compression;

      drawStrut(-config.wheelBaseHalf, config.chassisHalfHeight * 0.6, rearY);
      drawStrut(config.wheelBaseHalf, config.chassisHalfHeight * 0.6, frontY);

      drawWheel(
        -config.wheelBaseHalf,
        rearY,
        config.wheelRadius,
        wheelSpinRef.current,
      );
      drawWheel(
        config.wheelBaseHalf,
        frontY,
        config.wheelRadius,
        wheelSpinRef.current,
      );

      if (vehicleId === "hauler-truck") {
        drawTruckBody(config);
      } else if (vehicleId === "rally-hatch") {
        drawHatchBody(config);
      } else {
        drawBuggyBody(config);
      }

      ctx!.restore();
    }

    function drawParticles(dt: number) {
      const next: Particle[] = [];
      for (const particle of particlesRef.current) {
        const life = particle.life - dt;
        if (life <= 0) continue;
        const gravity = particle.kind === "sparkle" ? 60 : 320;
        const vy = particle.vy + gravity * dt;
        const x = particle.x + particle.vx * dt;
        const y = particle.y + vy * dt;
        const screen = worldToScreen(x, y);
        const alpha = Math.max(0, life / particle.maxLife);
        const size =
          particle.kind === "sparkle"
            ? 2.6
            : particle.kind === "dust"
              ? 4
              : 3.5;
        ctx!.save();
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = particle.color;
        ctx!.beginPath();
        ctx!.arc(screen.x, screen.y, size, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
        next.push({ ...particle, x, y, vy, life });
      }
      particlesRef.current = next;
    }

    function frame(time: number) {
      const dt = Math.min(MAX_FRAME_DELTA, (time - lastTime) / 1000);
      lastTime = time;

      const current = runStateRef.current;
      const result = step(
        current,
        configRef.current,
        terrain,
        collectibles,
        inputRef.current,
        dt,
        finishDistance,
      );
      runStateRef.current = result.state;

      const vehicle = result.state.vehicle;
      const config = configRef.current;
      if (current.status === "playing") {
        const forwardSpeed =
          vehicle.velocity.x * Math.cos(vehicle.angle) +
          vehicle.velocity.y * Math.sin(vehicle.angle);
        wheelSpinRef.current += (forwardSpeed / config.wheelRadius) * dt;
      }

      for (const event of result.events) {
        if (event.type === "crashed") {
          announce("Crashed.");
          spawnParticles(
            vehicle.position.x,
            vehicle.position.y,
            16,
            "crash",
            "#71717a",
            60,
            220,
            0.5,
            0.9,
            80,
          );
        }
        if (event.type === "landed") {
          spawnParticles(
            vehicle.position.x,
            vehicle.position.y + config.wheelRadius,
            6,
            "dust",
            palette.groundFarFill,
            30,
            90,
            0.3,
            0.5,
            20,
          );
        }
        if (event.type === "out-of-fuel") {
          announce("Out of fuel.");
        }
        if (event.type === "finished") {
          announce("Stage finished.");
          spawnParticles(
            vehicle.position.x,
            vehicle.position.y,
            24,
            "sparkle",
            "#ffe9a8",
            60,
            180,
            0.5,
            0.9,
            90,
          );
          spawnParticles(
            vehicle.position.x,
            vehicle.position.y,
            16,
            "sparkle",
            "#3bc9e6",
            40,
            140,
            0.5,
            0.8,
            70,
          );
        }
        if (event.type === "fuel-collected") {
          announce("Fuel collected.");
          spawnParticles(
            vehicle.position.x,
            vehicle.position.y,
            10,
            "sparkle",
            "#3bc9e6",
            40,
            120,
            0.4,
            0.6,
            60,
          );
        }
        if (event.type === "coin-collected") {
          announce("Coin collected.");
          spawnParticles(
            vehicle.position.x,
            vehicle.position.y,
            10,
            "sparkle",
            "#e6b93b",
            40,
            120,
            0.4,
            0.6,
            60,
          );
        }
      }

      const verticalAnticipation = Math.max(
        -60,
        Math.min(60, vehicle.velocity.y * 0.12),
      );
      const targetCameraX = vehicle.position.x + CAMERA_LEAD;
      const targetCameraY = vehicle.position.y + verticalAnticipation;
      const smoothing = 1 - Math.exp(-CAMERA_SMOOTHING * dt);
      cameraRef.current = {
        x:
          cameraRef.current.x +
          (targetCameraX - cameraRef.current.x) * smoothing,
        y:
          cameraRef.current.y +
          (targetCameraY - cameraRef.current.y) * smoothing,
      };

      const scale = scaleRef.current;
      ctx!.save();
      ctx!.scale(scale, scale);

      drawBackground();
      drawMountainLayer(0.1, 0, 1, palette.mountainFarFill);
      drawMountainLayer(0.22, 2.4, 0.8, palette.mountainFill);
      drawTerrainLayer(0.5, -70, palette.groundFarFill, false, false);
      drawScenery();
      drawTerrainLayer(1, 0, palette.groundFill, true, true);
      drawFinishMarker();
      drawCollectibles();
      drawVehicle();
      drawParticles(dt);

      ctx!.restore();

      const snapshot = toHudSnapshot(result.state);
      if (!hudEqual(hudRef.current, snapshot)) {
        hudRef.current = snapshot;
        onHudChange(snapshot);
      }

      frameId = requestAnimationFrame(frame);
    }

    frameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      container.removeEventListener("keydown", onKeyDown);
      container.removeEventListener("keyup", onKeyUp);
    };
  }, [
    accentColor,
    announce,
    bodyColor,
    collectibles,
    configRef,
    finishDistance,
    onHudChange,
    onInitError,
    palette,
    runStateRef,
    sceneryProps,
    stageId,
    terrain,
    vehicleId,
  ]);

  function handlePointerInput(key: "gas" | "brake", pressed: boolean) {
    inputRef.current = { ...inputRef.current, [key]: pressed };
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="group"
      aria-label="Ridge Runner game surface"
      className="relative w-full touch-none rounded-lg select-none focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_rgba(230,59,66,0.28)]"
    >
      <canvas ref={canvasRef} className="block w-full rounded-lg" />
      <div className="absolute inset-x-0 bottom-3 flex justify-between px-3 sm:hidden">
        <button
          type="button"
          aria-label="Brake"
          className="bg-surface/80 text-foreground border-border-strong size-16 touch-none rounded-full border text-sm font-semibold backdrop-blur"
          onPointerDown={() => handlePointerInput("brake", true)}
          onPointerUp={() => handlePointerInput("brake", false)}
          onPointerLeave={() => handlePointerInput("brake", false)}
          onPointerCancel={() => handlePointerInput("brake", false)}
        >
          Brake
        </button>
        <button
          type="button"
          aria-label="Gas"
          className="bg-brand-red/90 text-brand-red-foreground size-16 touch-none rounded-full text-sm font-semibold backdrop-blur"
          onPointerDown={() => handlePointerInput("gas", true)}
          onPointerUp={() => handlePointerInput("gas", false)}
          onPointerLeave={() => handlePointerInput("gas", false)}
          onPointerCancel={() => handlePointerInput("gas", false)}
        >
          Gas
        </button>
      </div>
    </div>
  );
}

function GameOverlay({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const justify = className.includes("justify-") ? "" : "justify-center";
  return (
    <div
      className={`bg-background/90 absolute inset-0 flex flex-col items-center ${justify} gap-3 overflow-y-auto rounded-lg p-6 text-center ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export function GameplayScreen({
  stageId,
  vehicleId,
  save,
  onSaveChange,
  onExitToGarage,
  onExitToWorldMap,
  onNextStage,
}: {
  stageId: string;
  vehicleId: string;
  save: SaveData;
  onSaveChange: (save: SaveData) => void;
  onExitToGarage: () => void;
  onExitToWorldMap: () => void;
  onNextStage: (stageId: string) => void;
}) {
  const stage = useMemo(() => getStageDefinition(stageId), [stageId]);
  const vehicleDefinition = useMemo(
    () => getVehicleDefinition(vehicleId),
    [vehicleId],
  );
  const terrain = useMemo(() => generateTerrain(stage.terrainConfig), [stage]);
  const collectibles = useMemo(
    () => generateCollectibles(terrain, stage.terrainConfig.seed + 1),
    [terrain, stage],
  );
  const sceneryProps = useMemo(
    () => generateSceneryProps(terrain, stage.terrainConfig.seed + 2),
    [terrain, stage],
  );

  const [initialState] = useState<RunState>(() =>
    startRun(terrain, stageId, vehicleId),
  );
  const runStateRef = useRef<RunState>(initialState);
  const [hud, setHud] = useState<HudSnapshot>(() =>
    toHudSnapshot(initialState),
  );
  const vehicleSaveState = save.vehicles[vehicleId];
  const configRef = useRef<VehicleConfig>(
    buildVehicleConfig(
      vehicleDefinition.baseConfig,
      vehicleSaveState?.upgrades ?? { engine: 0, suspension: 0, tires: 0 },
    ),
  );
  const [initFailed, setInitFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const resultAppliedRef = useRef(false);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const [outcome, setOutcome] = useState<{
    isNewBest: boolean;
    newObjectiveLabels: string[];
    newAchievementNames: string[];
    newlyCompletedStage: boolean;
    completionReward: number;
    nextStageId: string | null;
  } | null>(null);

  useEffect(() => {
    if (
      (hud.status === "crashed" ||
        hud.status === "out-of-fuel" ||
        hud.status === "finished") &&
      !resultAppliedRef.current
    ) {
      resultAppliedRef.current = true;
      const previousBest = save.stageBestDistance[stageId] ?? 0;
      const result: RunResult = {
        stageId,
        vehicleId,
        distance: runStateRef.current.distance,
        coinsThisRun: runStateRef.current.coinsThisRun,
        crashed: hud.status === "crashed",
        outOfFuel: hud.status === "out-of-fuel",
        finished: hud.status === "finished",
      };
      const outcomeResult = applyRunResult(save, result);
      persistSave(outcomeResult.save);
      onSaveChange(outcomeResult.save);

      const nextStage = getNextStage(stageId);
      const nextStageUnlocked =
        nextStage !== undefined &&
        isStageUnlocked(nextStage, outcomeResult.save.stageBestDistance);

      setOutcome({
        isNewBest: Math.round(result.distance) > previousBest,
        newObjectiveLabels: OBJECTIVES.filter((o) =>
          outcomeResult.newObjectiveIds.includes(o.id),
        ).map((o) => o.label),
        newAchievementNames: ACHIEVEMENTS.filter((a) =>
          outcomeResult.newAchievementIds.includes(a.id),
        ).map((a) => a.name),
        newlyCompletedStage: outcomeResult.newlyCompletedStage,
        completionReward: outcomeResult.completionReward,
        nextStageId: nextStageUnlocked ? nextStage.id : null,
      });
    }
  }, [hud.status, onSaveChange, save, stageId, vehicleId]);

  const announce = useCallback((message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
    }
  }, []);

  const handleHudChange = useCallback((snapshot: HudSnapshot) => {
    setHud(snapshot);
  }, []);

  const handleInitError = useCallback(() => {
    setInitFailed(true);
  }, []);

  function focusGame() {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(
        '[aria-label="Ridge Runner game surface"]',
      );
      el?.focus();
    });
  }

  function handleRetry() {
    resultAppliedRef.current = false;
    setOutcome(null);
    runStateRef.current = startRun(terrain, stageId, vehicleId);
    setHud(toHudSnapshot(runStateRef.current));
    focusGame();
  }

  function handlePauseToggle() {
    if (runStateRef.current.status === "playing") {
      runStateRef.current = pauseRun(runStateRef.current);
    } else if (runStateRef.current.status === "paused") {
      runStateRef.current = resumeRun(runStateRef.current);
    }
    setHud(toHudSnapshot(runStateRef.current));
    focusGame();
  }

  if (initFailed) {
    return (
      <div className="bg-surface-elevated flex aspect-video flex-col items-center justify-center gap-3 rounded-lg text-center">
        <p className="text-foreground font-medium">
          The game couldn&apos;t start in this browser.
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            setInitFailed(false);
            setRetryKey((value) => value + 1);
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  const resultHeading =
    hud.status === "crashed"
      ? "Crashed"
      : hud.status === "out-of-fuel"
        ? "Out of fuel"
        : hud.status === "finished"
          ? "Victory!"
          : null;

  const nextObjective =
    hud.status === "playing" || hud.status === "paused"
      ? getObjectivesForStage(stageId).find(
          (objective) => !save.completedObjectiveIds.includes(objective.id),
        )
      : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div aria-live="polite" className="sr-only" ref={liveRegionRef} />
      <div className="text-foreground flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-4">
          <span>
            Distance:{" "}
            <span className="font-semibold" data-testid="ridge-runner-distance">
              {formatDistance(hud.distance)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Fuel className="text-brand-red size-4" aria-hidden="true" />
            Fuel:{" "}
            <span data-testid="ridge-runner-fuel" className="font-semibold">
              {hud.fuel}%
            </span>
            <span
              aria-hidden="true"
              className="border-border-strong ml-1 h-2 w-16 overflow-hidden rounded-full border"
            >
              <span
                className="block h-full rounded-full transition-[width]"
                style={{
                  width: `${hud.fuel}%`,
                  backgroundColor: fuelBarColor(hud.fuel),
                }}
              />
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Coins className="text-brand-red size-4" aria-hidden="true" />
            Coins:{" "}
            <span data-testid="ridge-runner-coins" className="font-semibold">
              {hud.coinsThisRun}
            </span>
          </span>
          {nextObjective && (
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
              <Flag className="size-3.5" aria-hidden="true" />
              Goal: {nextObjective.label}
            </span>
          )}
        </div>
        {(hud.status === "playing" || hud.status === "paused") && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handlePauseToggle}>
              {hud.status === "playing" ? (
                <>
                  <Pause className="size-4" aria-hidden="true" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="size-4" aria-hidden="true" />
                  Resume
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={onExitToGarage}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Garage
            </Button>
          </div>
        )}
      </div>

      <div className="relative" key={retryKey}>
        <GameCanvas
          runStateRef={runStateRef}
          terrain={terrain}
          collectibles={collectibles}
          sceneryProps={sceneryProps}
          configRef={configRef}
          vehicleId={vehicleId}
          stageId={stageId}
          finishDistance={stage.finishDistance}
          palette={stage.palette}
          bodyColor={vehicleDefinition.bodyColor}
          accentColor={vehicleDefinition.accentColor}
          onHudChange={handleHudChange}
          announce={announce}
          onInitError={handleInitError}
        />

        {hud.status === "paused" && (
          <GameOverlay>
            <h2 className="text-foreground text-2xl font-bold">Paused</h2>
            <Button onClick={handlePauseToggle}>Continue driving</Button>
          </GameOverlay>
        )}

        {resultHeading && (
          <GameOverlay>
            <h2
              className={`flex items-center gap-2 text-2xl font-bold ${
                hud.status === "finished"
                  ? "text-amber-400"
                  : "text-foreground"
              }`}
            >
              {hud.status === "finished" && (
                <Trophy className="size-6" aria-hidden="true" />
              )}
              {resultHeading}
            </h2>
            <p className="text-muted-foreground text-sm">
              Distance: {formatDistance(hud.distance)} &middot; Coins:{" "}
              {hud.coinsThisRun}
              {outcome?.isNewBest ? " · New best!" : ""}
            </p>
            {outcome && outcome.newlyCompletedStage && (
              <p className="text-xs font-semibold text-amber-400">
                Stage complete! +{outcome.completionReward} bonus coins
              </p>
            )}
            {outcome && outcome.newObjectiveLabels.length > 0 && (
              <p className="text-brand-red text-xs font-semibold">
                Objective complete: {outcome.newObjectiveLabels.join(", ")}
              </p>
            )}
            {outcome && outcome.newAchievementNames.length > 0 && (
              <p className="text-brand-red text-xs font-semibold">
                Achievement unlocked: {outcome.newAchievementNames.join(", ")}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={handleRetry}>Retry stage</Button>
              {outcome?.nextStageId && (
                <Button
                  variant="secondary"
                  onClick={() => onNextStage(outcome.nextStageId!)}
                >
                  Next Stage
                </Button>
              )}
              <Button variant="secondary" onClick={onExitToGarage}>
                Garage
              </Button>
              <Button variant="ghost" onClick={onExitToWorldMap}>
                World Map
              </Button>
            </div>
          </GameOverlay>
        )}
      </div>

      <div className="text-muted-foreground text-xs leading-relaxed">
        <span className="text-foreground font-medium">Controls:</span> Arrow Up
        or W for gas, Arrow Down or S to brake, Escape to pause. Gas and brake
        also tilt the car while airborne. On touch devices, use the Gas and
        Brake buttons on the game surface.
      </div>
    </div>
  );
}
