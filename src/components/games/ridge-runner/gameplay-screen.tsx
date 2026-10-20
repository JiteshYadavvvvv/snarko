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
import { Button } from "@/components/ui/button";

const LOGICAL_WIDTH = 960;
const LOGICAL_HEIGHT = 540;
const CAMERA_LEAD = 180;
const CAMERA_SMOOTHING = 4.5;
const MAX_FRAME_DELTA = 1 / 20;
const WHEEL_COLOR = "#202024";
const WHEEL_RIM = "#f4f1ea";

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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

function GameCanvas({
  runStateRef,
  terrain,
  collectibles,
  configRef,
  palette,
  vehicleColors,
  onHudChange,
  announce,
  onInitError,
}: {
  runStateRef: React.RefObject<RunState>;
  terrain: Terrain;
  collectibles: CollectiblePlacement[];
  configRef: React.RefObject<VehicleConfig>;
  palette: StagePalette;
  vehicleColors: { bodyColor: string; accentColor: string };
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
      const cssWidth = rect.width;
      const cssHeight = cssWidth * (LOGICAL_HEIGHT / LOGICAL_WIDTH);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      scaleRef.current = (cssWidth * dpr) / LOGICAL_WIDTH;
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

    function spawnCrashParticles(x: number, y: number) {
      const particles: Particle[] = [];
      for (let i = 0; i < 14; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 160;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 80,
          life: 0.5 + Math.random() * 0.4,
          maxLife: 0.5 + Math.random() * 0.4,
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
    }

    function drawTerrainLayer(
      parallax: number,
      verticalOffset: number,
      fillColor: string,
      drawEdge: boolean,
    ) {
      const worldLeft = cameraRef.current.x - LOGICAL_WIDTH / 2 - 120;
      const worldRight = cameraRef.current.x + LOGICAL_WIDTH / 2 + 120;
      const step = 24;

      ctx!.beginPath();
      let started = false;
      for (let x = worldLeft; x <= worldRight; x += step) {
        const sampledX =
          cameraRef.current.x + (x - cameraRef.current.x) * parallax;
        const groundY = groundHeightAt(terrain, sampledX) + verticalOffset;
        const screen = worldToScreen(x, groundY);
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
        } else {
          ctx!.fillStyle = "#3bc9e6";
          ctx!.beginPath();
          ctx!.roundRect(screen.x - 9, screen.y - 13, 18, 26, 4);
          ctx!.fill();
          ctx!.fillStyle = "#1a4452";
          ctx!.fillRect(screen.x - 9, screen.y - 4, 18, 5);
        }
      }
    }

    function drawVehicle() {
      const state = runStateRef.current;
      const config = configRef.current;
      const vehicle = state.vehicle;
      const screen = worldToScreen(vehicle.position.x, vehicle.position.y);

      ctx!.save();
      ctx!.translate(screen.x, screen.y);
      ctx!.rotate(vehicle.angle);

      ctx!.fillStyle = WHEEL_COLOR;
      const rearCompressionOffset =
        config.suspensionRestLength - vehicle.rearWheel.compression;
      const frontCompressionOffset =
        config.suspensionRestLength - vehicle.frontWheel.compression;

      ctx!.beginPath();
      ctx!.arc(
        -config.wheelBaseHalf,
        rearCompressionOffset,
        config.wheelRadius,
        0,
        Math.PI * 2,
      );
      ctx!.fill();
      ctx!.beginPath();
      ctx!.arc(
        config.wheelBaseHalf,
        frontCompressionOffset,
        config.wheelRadius,
        0,
        Math.PI * 2,
      );
      ctx!.fill();

      ctx!.fillStyle = WHEEL_RIM;
      ctx!.beginPath();
      ctx!.arc(
        -config.wheelBaseHalf,
        rearCompressionOffset,
        config.wheelRadius * 0.4,
        0,
        Math.PI * 2,
      );
      ctx!.fill();
      ctx!.beginPath();
      ctx!.arc(
        config.wheelBaseHalf,
        frontCompressionOffset,
        config.wheelRadius * 0.4,
        0,
        Math.PI * 2,
      );
      ctx!.fill();

      ctx!.fillStyle = vehicleColors.bodyColor;
      ctx!.beginPath();
      ctx!.roundRect(
        -config.chassisHalfLength,
        -config.chassisHalfHeight,
        config.chassisHalfLength * 2,
        config.chassisHalfHeight * 2,
        8,
      );
      ctx!.fill();

      ctx!.fillStyle = vehicleColors.accentColor;
      ctx!.beginPath();
      ctx!.roundRect(
        -config.chassisHalfLength * 0.15,
        -config.chassisHalfHeight * 2.1,
        config.chassisHalfLength * 0.95,
        config.chassisHalfHeight * 1.6,
        6,
      );
      ctx!.fill();

      ctx!.restore();
    }

    function drawParticles(dt: number) {
      const next: Particle[] = [];
      for (const particle of particlesRef.current) {
        const life = particle.life - dt;
        if (life <= 0) continue;
        const vy = particle.vy + 320 * dt;
        const x = particle.x + particle.vx * dt;
        const y = particle.y + vy * dt;
        const screen = worldToScreen(x, y);
        const alpha = Math.max(0, life / particle.maxLife);
        ctx!.fillStyle = `rgba(113, 113, 122, ${alpha.toFixed(2)})`;
        ctx!.beginPath();
        ctx!.arc(screen.x, screen.y, 3.5, 0, Math.PI * 2);
        ctx!.fill();
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

      for (const event of result.events) {
        if (event.type === "crashed") {
          announce("Crashed.");
          spawnCrashParticles(
            result.state.vehicle.position.x,
            result.state.vehicle.position.y,
          );
        }
        if (event.type === "out-of-fuel") {
          announce("Out of fuel.");
        }
        if (event.type === "fuel-collected") {
          announce("Fuel collected.");
        }
        if (event.type === "coin-collected") {
          announce("Coin collected.");
        }
      }

      const vehicle = result.state.vehicle;
      const targetCameraX = vehicle.position.x + CAMERA_LEAD;
      const targetCameraY = vehicle.position.y;
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
      drawTerrainLayer(0.5, -70, palette.groundFarFill, false);
      drawTerrainLayer(1, 0, palette.groundFill, true);
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
    announce,
    collectibles,
    configRef,
    onHudChange,
    onInitError,
    palette,
    runStateRef,
    terrain,
    vehicleColors,
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
        <div className="flex items-center gap-4">
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
          configRef={configRef}
          palette={stage.palette}
          vehicleColors={{
            bodyColor: vehicleDefinition.bodyColor,
            accentColor: vehicleDefinition.accentColor,
          }}
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
