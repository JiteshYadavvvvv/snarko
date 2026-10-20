"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Coins, Fuel, Pause, Play, RotateCcw } from "lucide-react";
import { ACHIEVEMENTS } from "@/components/games/ridge-runner/engine/achievements";
import { buildVehicleConfig } from "@/components/games/ridge-runner/engine/economy";
import { OBJECTIVES } from "@/components/games/ridge-runner/engine/objectives";
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
import { getStageDefinition } from "@/components/games/ridge-runner/engine/stages";
import {
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
const LIGHT_COLOR = "#ffe9a8";

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

    function drawScenery() {
      for (const prop of sceneryProps) {
        const screen = worldToScreen(prop.x, prop.groundY);
        if (screen.x < -60 || screen.x > LOGICAL_WIDTH + 60) continue;
        if (prop.variant === 0) {
          drawTree(screen.x, screen.y, prop.scale);
        } else {
          drawBush(screen.x, screen.y, prop.scale);
        }
      }
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

    function drawBuggyBody(config: VehicleConfig) {
      const l = config.chassisHalfLength;
      const h = config.chassisHalfHeight;

      ctx!.fillStyle = bodyColor;
      ctx!.beginPath();
      ctx!.moveTo(-l, h * 0.95);
      ctx!.lineTo(-l * 0.9, -h * 0.1);
      ctx!.lineTo(l * 0.6, -h * 0.3);
      ctx!.lineTo(l * 1.05, h * 0.2);
      ctx!.lineTo(l * 1.05, h * 0.95);
      ctx!.closePath();
      ctx!.fill();

      ctx!.strokeStyle = accentColor;
      ctx!.lineWidth = Math.max(3, h * 0.22);
      ctx!.lineCap = "round";
      ctx!.beginPath();
      ctx!.moveTo(-l * 0.25, -h * 0.15);
      ctx!.lineTo(-l * 0.3, -h * 1.9);
      ctx!.lineTo(l * 0.1, -h * 1.9);
      ctx!.lineTo(l * 0.15, -h * 0.25);
      ctx!.stroke();

      ctx!.fillStyle = "#101014";
      ctx!.beginPath();
      ctx!.arc(-l * 1.05, h * 0.15, config.wheelRadius * 0.4, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = RIM_COLOR;
      ctx!.lineWidth = 2;
      ctx!.stroke();

      ctx!.strokeStyle = accentColor;
      ctx!.lineWidth = Math.max(2.5, h * 0.18);
      ctx!.beginPath();
      ctx!.moveTo(l * 0.9, h * 0.3);
      ctx!.lineTo(l * 1.2, h * 0.1);
      ctx!.moveTo(l * 0.9, h * 0.55);
      ctx!.lineTo(l * 1.2, h * 0.4);
      ctx!.stroke();

      ctx!.fillStyle = LIGHT_COLOR;
      ctx!.beginPath();
      ctx!.arc(l * 1.0, -h * 0.05, h * 0.22, 0, Math.PI * 2);
      ctx!.fill();
    }

    function drawTruckBody(config: VehicleConfig) {
      const l = config.chassisHalfLength;
      const h = config.chassisHalfHeight;

      ctx!.fillStyle = bodyColor;
      ctx!.beginPath();
      ctx!.roundRect(-l * 1.05, -h * 0.3, l * 0.95, h * 1.3, 4);
      ctx!.fill();
      ctx!.strokeStyle = accentColor;
      ctx!.lineWidth = 2;
      ctx!.strokeRect(-l * 1.0, -h * 0.2, l * 0.85, h * 0.18);

      ctx!.beginPath();
      ctx!.roundRect(-l * 0.12, -h * 1.8, l * 1.15, h * 2, 8);
      ctx!.fill();

      ctx!.fillStyle = GLASS_COLOR;
      ctx!.beginPath();
      ctx!.roundRect(l * 0.02, -h * 1.55, l * 0.55, h * 0.9, 4);
      ctx!.fill();

      ctx!.fillStyle = accentColor;
      ctx!.beginPath();
      ctx!.roundRect(l * 0.92, h * 0.1, l * 0.35, h * 0.75, 4);
      ctx!.fill();

      ctx!.beginPath();
      ctx!.roundRect(-l * 0.05, -h * 2.05, l * 0.6, h * 0.22, 3);
      ctx!.fill();
      ctx!.fillStyle = LIGHT_COLOR;
      ctx!.beginPath();
      ctx!.arc(-l * 0.2, -h * 1.94, 2.6, 0, Math.PI * 2);
      ctx!.arc(l * 0.15, -h * 1.94, 2.6, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.fillStyle = LIGHT_COLOR;
      ctx!.beginPath();
      ctx!.arc(l * 1.08, h * 0.2, h * 0.18, 0, Math.PI * 2);
      ctx!.fill();
    }

    function drawHatchBody(config: VehicleConfig) {
      const l = config.chassisHalfLength;
      const h = config.chassisHalfHeight;

      ctx!.fillStyle = bodyColor;
      ctx!.beginPath();
      ctx!.moveTo(-l, h * 0.9);
      ctx!.lineTo(-l, -h * 0.1);
      ctx!.lineTo(l * 0.5, -h * 1.6);
      ctx!.lineTo(l * 0.95, -h * 0.2);
      ctx!.lineTo(l * 1.05, h * 0.3);
      ctx!.lineTo(l * 1.05, h * 0.9);
      ctx!.closePath();
      ctx!.fill();

      ctx!.fillStyle = GLASS_COLOR;
      ctx!.beginPath();
      ctx!.moveTo(-l * 0.55, -h * 0.15);
      ctx!.lineTo(-l * 0.1, -h * 1.55);
      ctx!.lineTo(l * 0.35, -h * 1.55);
      ctx!.lineTo(l * 0.65, -h * 0.15);
      ctx!.closePath();
      ctx!.fill();

      ctx!.strokeStyle = accentColor;
      ctx!.lineWidth = 3;
      ctx!.beginPath();
      ctx!.moveTo(-l * 0.95, -h * 1.0);
      ctx!.lineTo(-l * 0.95, -h * 0.55);
      ctx!.moveTo(-l * 1.2, -h * 1.0);
      ctx!.lineTo(-l * 1.2, -h * 0.55);
      ctx!.stroke();
      ctx!.fillStyle = accentColor;
      ctx!.beginPath();
      ctx!.roundRect(-l * 1.25, -h * 1.15, l * 0.4, h * 0.22, 2);
      ctx!.fill();

      ctx!.fillStyle = LIGHT_COLOR;
      ctx!.beginPath();
      ctx!.arc(l * 1.0, h * 0.25, h * 0.26, 0, Math.PI * 2);
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
    onHudChange,
    onInitError,
    palette,
    runStateRef,
    sceneryProps,
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
      className="focus-visible:outline-brand-red relative w-full touch-none select-none"
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
}: {
  stageId: string;
  vehicleId: string;
  save: SaveData;
  onSaveChange: (save: SaveData) => void;
  onExitToGarage: () => void;
  onExitToWorldMap: () => void;
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
  } | null>(null);

  useEffect(() => {
    if (
      (hud.status === "crashed" || hud.status === "out-of-fuel") &&
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
      };
      const outcomeResult = applyRunResult(save, result);
      persistSave(outcomeResult.save);
      onSaveChange(outcomeResult.save);

      setOutcome({
        isNewBest: Math.round(result.distance) > previousBest,
        newObjectiveLabels: OBJECTIVES.filter((o) =>
          outcomeResult.newObjectiveIds.includes(o.id),
        ).map((o) => o.label),
        newAchievementNames: ACHIEVEMENTS.filter((a) =>
          outcomeResult.newAchievementIds.includes(a.id),
        ).map((a) => a.name),
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
        : null;

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
            <h2 className="text-foreground text-2xl font-bold">
              {resultHeading}
            </h2>
            <p className="text-muted-foreground text-sm">
              Distance: {formatDistance(hud.distance)} &middot; Coins:{" "}
              {hud.coinsThisRun}
              {outcome?.isNewBest ? " · New best!" : ""}
            </p>
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
