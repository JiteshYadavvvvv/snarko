"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  MAX_LEVEL,
  continueToNextLevel,
  createIdleState,
  launchBall,
  pauseGame,
  restartGame,
  resumeGame,
  startGame,
  step,
  type NeonBreakerState,
  type NeonBreakerStatus,
} from "@/components/games/neon-breaker/engine";

const BLOCK_COLORS = ["#E63B42", "#3BC9E6", "#E6B93B", "#8B5CF6"];
const MAX_FRAME_DELTA = 1 / 20;
const MOVEMENT_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "a",
  "A",
  "d",
  "D",
  " ",
  "Escape",
]);

interface HudSnapshot {
  status: NeonBreakerStatus;
  score: number;
  lives: number;
  level: number;
}

function toHudSnapshot(state: NeonBreakerState): HudSnapshot {
  return {
    status: state.status,
    score: state.score,
    lives: state.lives,
    level: state.level,
  };
}

function hudEqual(a: HudSnapshot, b: HudSnapshot): boolean {
  return (
    a.status === b.status &&
    a.score === b.score &&
    a.lives === b.lives &&
    a.level === b.level
  );
}

function GameCanvas({
  stateRef,
  initialHud,
  onHudChange,
  announce,
  onInitError,
}: {
  stateRef: React.RefObject<NeonBreakerState>;
  initialHud: HudSnapshot;
  onHudChange: (snapshot: HudSnapshot) => void;
  announce: (message: string) => void;
  onInitError: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerTargetXRef = useRef<number | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const scaleRef = useRef(1);
  const reducedMotionRef = useRef(false);
  const hudRef = useRef<HudSnapshot>(initialHud);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onInitError();
      return undefined;
    }

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

    function clientXToLogical(clientX: number): number {
      const rect = canvas!.getBoundingClientRect();
      const ratio = LOGICAL_WIDTH / rect.width;
      return (clientX - rect.left) * ratio;
    }

    function maybeLaunch() {
      const current = stateRef.current;
      if (current.status === "playing" && !current.ballLaunched) {
        stateRef.current = launchBall(current);
      }
    }

    function onMouseMove(event: MouseEvent) {
      pointerTargetXRef.current = clientXToLogical(event.clientX);
    }

    function onMouseDown() {
      maybeLaunch();
    }

    function onTouchMove(event: TouchEvent) {
      if (event.touches.length === 0) return;
      event.preventDefault();
      pointerTargetXRef.current = clientXToLogical(event.touches[0].clientX);
    }

    function onTouchStart(event: TouchEvent) {
      if (event.touches.length === 0) return;
      pointerTargetXRef.current = clientXToLogical(event.touches[0].clientX);
      maybeLaunch();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (MOVEMENT_KEYS.has(event.key)) {
        event.preventDefault();
      }
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        keysRef.current.add("left");
      }
      if (
        event.key === "ArrowRight" ||
        event.key === "d" ||
        event.key === "D"
      ) {
        keysRef.current.add("right");
      }
      if (event.key === " ") {
        maybeLaunch();
      }
      if (event.key === "Escape") {
        const current = stateRef.current;
        if (current.status === "playing") {
          stateRef.current = pauseGame(current);
        } else if (current.status === "paused") {
          stateRef.current = resumeGame(current);
        }
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        keysRef.current.delete("left");
      }
      if (
        event.key === "ArrowRight" ||
        event.key === "d" ||
        event.key === "D"
      ) {
        keysRef.current.delete("right");
      }
    }

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mousedown", onMouseDown);
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("keydown", onKeyDown);
    container.addEventListener("keyup", onKeyUp);

    let frameId: number;
    let lastTime = performance.now();

    function draw(state: NeonBreakerState) {
      const scale = scaleRef.current;
      ctx!.save();
      ctx!.scale(scale, scale);
      ctx!.fillStyle = "#0b0b0d";
      ctx!.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      for (const block of state.blocks) {
        if (block.destroyed) continue;
        const color = BLOCK_COLORS[block.colorIndex];
        ctx!.fillStyle = color;
        if (!reducedMotionRef.current) {
          ctx!.shadowColor = color;
          ctx!.shadowBlur = 6;
        } else {
          ctx!.shadowBlur = 0;
        }
        ctx!.fillRect(block.x, block.y, block.width, block.height);
      }

      ctx!.shadowBlur = 0;
      ctx!.fillStyle = "#f4f1ea";
      ctx!.fillRect(
        state.paddle.x,
        state.paddle.y,
        state.paddle.width,
        state.paddle.height,
      );

      ctx!.beginPath();
      ctx!.fillStyle = "#f4f1ea";
      if (!reducedMotionRef.current) {
        ctx!.shadowColor = "#f4f1ea";
        ctx!.shadowBlur = 10;
      }
      ctx!.arc(
        state.ball.position.x,
        state.ball.position.y,
        state.ball.radius,
        0,
        Math.PI * 2,
      );
      ctx!.fill();
      ctx!.shadowBlur = 0;
      ctx!.restore();
    }

    function frame(time: number) {
      const dt = Math.min(MAX_FRAME_DELTA, (time - lastTime) / 1000);
      lastTime = time;

      const current = stateRef.current;
      let targetX = current.paddle.x + current.paddle.width / 2;

      if (keysRef.current.has("left") && !keysRef.current.has("right")) {
        targetX = current.paddle.x - 9999;
      } else if (keysRef.current.has("right") && !keysRef.current.has("left")) {
        targetX = current.paddle.x + current.paddle.width + 9999;
      } else if (pointerTargetXRef.current !== null) {
        targetX = pointerTargetXRef.current;
      }

      const result = step(current, dt, targetX);
      stateRef.current = result.state;

      for (const event of result.events) {
        if (event.type === "ball-lost") {
          announce(
            `Ball lost. ${result.state.lives} ${
              result.state.lives === 1 ? "life" : "lives"
            } remaining.`,
          );
        }
        if (event.type === "game-over") {
          announce("Game over.");
        }
        if (event.type === "level-complete") {
          announce(`Level ${current.level} complete.`);
        }
        if (event.type === "won") {
          announce("You cleared every level. You win!");
        }
      }

      const snapshot = toHudSnapshot(result.state);
      if (!hudEqual(hudRef.current, snapshot)) {
        hudRef.current = snapshot;
        onHudChange(snapshot);
      }

      draw(result.state);
      frameId = requestAnimationFrame(frame);
    }

    frameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mousedown", onMouseDown);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("keydown", onKeyDown);
      container.removeEventListener("keyup", onKeyUp);
    };
  }, [announce, onHudChange, onInitError, stateRef]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="group"
      aria-label="Neon Breaker game surface"
      className="focus-visible:outline-brand-red relative w-full touch-none select-none"
    >
      <canvas ref={canvasRef} className="block w-full rounded-lg" />
    </div>
  );
}

export function NeonBreakerGame() {
  const [initialState] = useState<NeonBreakerState>(() => createIdleState());
  const stateRef = useRef<NeonBreakerState>(initialState);
  const [hud, setHud] = useState<HudSnapshot>(() =>
    toHudSnapshot(initialState),
  );
  const [initFailed, setInitFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

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
        '[aria-label="Neon Breaker game surface"]',
      );
      el?.focus();
    });
  }

  function handleStart() {
    stateRef.current = startGame();
    setHud(toHudSnapshot(stateRef.current));
    focusGame();
  }

  function handleRestart() {
    stateRef.current = restartGame();
    setHud(toHudSnapshot(stateRef.current));
    focusGame();
  }

  function handleContinue() {
    stateRef.current = continueToNextLevel(stateRef.current);
    setHud(toHudSnapshot(stateRef.current));
    focusGame();
  }

  function handlePauseToggle() {
    if (stateRef.current.status === "playing") {
      stateRef.current = pauseGame(stateRef.current);
    } else if (stateRef.current.status === "paused") {
      stateRef.current = resumeGame(stateRef.current);
    }
    setHud(toHudSnapshot(stateRef.current));
    focusGame();
  }

  if (initFailed) {
    return (
      <div className="theme-dark bg-background border-border rounded-xl border p-6">
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
      </div>
    );
  }

  return (
    <div className="theme-dark bg-background border-border rounded-xl border p-4 sm:p-6">
      <div className="flex flex-col gap-3">
        <div aria-live="polite" className="sr-only" ref={liveRegionRef} />
        <div className="text-foreground flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-4">
            <span>
              Score:{" "}
              <span className="font-semibold" data-testid="neon-breaker-score">
                {hud.score}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Heart
                className="text-brand-red size-4"
                fill="currentColor"
                aria-hidden="true"
              />
              Lives:{" "}
              <span data-testid="neon-breaker-lives" className="font-semibold">
                {hud.lives}
              </span>
            </span>
            <span>
              Level:{" "}
              <span className="font-semibold" data-testid="neon-breaker-level">
                {hud.level}/{MAX_LEVEL}
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
              <Button variant="ghost" onClick={handleRestart}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Restart
              </Button>
            </div>
          )}
        </div>

        <div className="relative" key={retryKey}>
          <GameCanvas
            stateRef={stateRef}
            initialHud={hud}
            onHudChange={handleHudChange}
            announce={announce}
            onInitError={handleInitError}
          />

          {hud.status === "idle" && (
            <GameOverlay>
              <h2 className="text-foreground text-2xl font-bold">
                Ready to play?
              </h2>
              <p className="text-muted-foreground max-w-xs text-sm">
                Break every block without losing all three lives. Five levels,
                each one faster than the last.
              </p>
              <Button onClick={handleStart}>Start</Button>
            </GameOverlay>
          )}

          {hud.status === "paused" && (
            <GameOverlay>
              <h2 className="text-foreground text-2xl font-bold">Paused</h2>
              <Button onClick={handlePauseToggle}>Continue playing</Button>
            </GameOverlay>
          )}

          {hud.status === "level-complete" && (
            <GameOverlay>
              <h2 className="text-foreground text-2xl font-bold">
                Level {hud.level} complete
              </h2>
              <p className="text-muted-foreground text-sm">
                Score: {hud.score}
              </p>
              <Button onClick={handleContinue}>Next level</Button>
            </GameOverlay>
          )}

          {hud.status === "game-over" && (
            <GameOverlay>
              <h2 className="text-foreground text-2xl font-bold">Game over</h2>
              <p className="text-muted-foreground text-sm">
                Final score: {hud.score}
              </p>
              <Button onClick={handleRestart}>Restart</Button>
            </GameOverlay>
          )}

          {hud.status === "won" && (
            <GameOverlay>
              <h2 className="text-foreground text-2xl font-bold">
                You cleared every level
              </h2>
              <p className="text-muted-foreground text-sm">
                Final score: {hud.score}
              </p>
              <Button onClick={handleRestart}>Play again</Button>
            </GameOverlay>
          )}
        </div>

        <div className="text-muted-foreground text-xs leading-relaxed">
          <span className="text-foreground font-medium">Controls:</span> Arrow
          keys or A/D to move, Space to launch the ball, Escape to pause. Move
          the mouse or drag with a finger to control the paddle; click or tap to
          launch.
        </div>
      </div>
    </div>
  );
}

function GameOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background/90 absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg p-6 text-center">
      {children}
    </div>
  );
}
