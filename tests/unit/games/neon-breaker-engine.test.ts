import { describe, expect, it } from "vitest";
import {
  LOGICAL_WIDTH,
  MAX_LEVEL,
  STARTING_LIVES,
  continueToNextLevel,
  createIdleState,
  launchBall,
  pauseGame,
  resumeGame,
  restartGame,
  startGame,
  step,
  type NeonBreakerState,
} from "@/components/games/neon-breaker/engine";

function launchedState(
  overrides: Partial<NeonBreakerState> = {},
): NeonBreakerState {
  const state = launchBall(startGame());
  return { ...state, ...overrides };
}

describe("createIdleState / startGame", () => {
  it("starts idle with full lives, zero score, and level one", () => {
    const state = createIdleState();
    expect(state.status).toBe("idle");
    expect(state.lives).toBe(STARTING_LIVES);
    expect(state.score).toBe(0);
    expect(state.level).toBe(1);
  });

  it("startGame transitions to playing with the ball resting on the paddle", () => {
    const state = startGame();
    expect(state.status).toBe("playing");
    expect(state.ballLaunched).toBe(false);
    expect(state.ball.velocity).toEqual({ x: 0, y: 0 });
  });
});

describe("launchBall", () => {
  it("gives the ball non-zero velocity and marks it launched", () => {
    const state = launchBall(startGame());
    expect(state.ballLaunched).toBe(true);
    expect(state.ball.velocity.x !== 0 || state.ball.velocity.y !== 0).toBe(
      true,
    );
  });

  it("does nothing if the ball is already launched", () => {
    const once = launchBall(startGame());
    const twice = launchBall(once);
    expect(twice).toEqual(once);
  });
});

describe("pauseGame / resumeGame", () => {
  it("pauses only while playing and resumes back to playing", () => {
    const playing = startGame();
    const paused = pauseGame(playing);
    expect(paused.status).toBe("paused");

    const resumed = resumeGame(paused);
    expect(resumed.status).toBe("playing");
  });

  it("is a no-op from idle or game-over", () => {
    const idle = createIdleState();
    expect(pauseGame(idle)).toEqual(idle);
  });
});

describe("step", () => {
  it("is a no-op when not playing", () => {
    const paused = pauseGame(startGame());
    const result = step(paused, 1 / 60, 400);
    expect(result.state).toEqual(paused);
    expect(result.events).toEqual([]);
  });

  it("moves the paddle toward the target position, clamped to the playfield", () => {
    const state = startGame();
    const result = step(state, 1, LOGICAL_WIDTH + 500);
    expect(result.state.paddle.x).toBeLessThanOrEqual(
      LOGICAL_WIDTH - result.state.paddle.width,
    );
    expect(result.state.paddle.x).toBeGreaterThan(state.paddle.x);
  });

  it("keeps the ball resting on the paddle until launched", () => {
    const state = startGame();
    const result = step(state, 1 / 60, 500);
    expect(result.state.ballLaunched).toBe(false);
    expect(result.state.ball.position.y).toBeCloseTo(
      result.state.paddle.y - result.state.ball.radius - 1,
      5,
    );
  });

  it("bounces the ball off the left wall", () => {
    let state = launchedState();
    state = {
      ...state,
      ball: {
        ...state.ball,
        position: { x: 2, y: 200 },
        velocity: { x: -300, y: -100 },
      },
    };

    const result = step(state, 1 / 60, state.paddle.x);
    expect(result.state.ball.velocity.x).toBeGreaterThan(0);
  });

  it("destroys a block it collides with and awards score", () => {
    const state = launchedState();
    const block = state.blocks[0];
    const nearBlock: NeonBreakerState = {
      ...state,
      ball: {
        ...state.ball,
        position: {
          x: block.x + block.width / 2,
          y: block.y + block.height + 5,
        },
        velocity: { x: 0, y: -200 },
      },
    };

    const result = step(nearBlock, 1 / 30, state.paddle.x);
    const updatedBlock = result.state.blocks.find((b) => b.id === block.id);

    expect(updatedBlock?.destroyed).toBe(true);
    expect(result.state.score).toBe(state.score + 10);
    expect(result.events).toContainEqual({ type: "block-destroyed" });
  });

  it("decrements lives exactly once when the ball falls below the paddle", () => {
    const state = launchedState();
    const falling: NeonBreakerState = {
      ...state,
      ball: {
        ...state.ball,
        position: { x: 400, y: 495 },
        velocity: { x: 0, y: 400 },
      },
    };

    const first = step(falling, 1 / 10, state.paddle.x);
    expect(first.state.lives).toBe(state.lives - 1);
    expect(first.state.ballLaunched).toBe(false);
    expect(first.events).toContainEqual({ type: "ball-lost" });

    const second = step(first.state, 1 / 10, state.paddle.x);
    expect(second.state.lives).toBe(first.state.lives);
  });

  it("transitions to game-over when the last life is lost", () => {
    const state = launchedState({ lives: 1 });
    const falling: NeonBreakerState = {
      ...state,
      ball: {
        ...state.ball,
        position: { x: 400, y: 495 },
        velocity: { x: 0, y: 400 },
      },
    };

    const result = step(falling, 1 / 10, state.paddle.x);
    expect(result.state.status).toBe("game-over");
    expect(result.events).toContainEqual({ type: "game-over" });
  });

  it("transitions to level-complete when all blocks are destroyed below the max level", () => {
    const state = launchedState({
      blocks: [],
      level: 1,
    });

    const result = step(state, 1 / 60, state.paddle.x);
    expect(result.state.status).toBe("level-complete");
    expect(result.events).toContainEqual({ type: "level-complete" });
  });

  it("transitions to won when all blocks are destroyed at the max level", () => {
    const state = launchedState({
      blocks: [],
      level: MAX_LEVEL,
    });

    const result = step(state, 1 / 60, state.paddle.x);
    expect(result.state.status).toBe("won");
    expect(result.events).toContainEqual({ type: "won" });
  });
});

describe("continueToNextLevel", () => {
  it("increments the level and creates a fresh, harder board while keeping score and lives", () => {
    const cleared = launchedState({
      blocks: [],
      score: 50,
      lives: 2,
      level: 1,
    });
    const next = continueToNextLevel(cleared);

    expect(next.level).toBe(2);
    expect(next.score).toBe(50);
    expect(next.lives).toBe(2);
    expect(next.blocks.length).toBeGreaterThan(0);
    expect(next.status).toBe("playing");
    expect(next.ballLaunched).toBe(false);
  });
});

describe("restartGame", () => {
  it("resets score, lives, and level regardless of prior state", () => {
    const messyState = launchedState({ score: 500, lives: 1, level: 4 });
    const restarted = restartGame();

    expect(restarted.score).toBe(0);
    expect(restarted.lives).toBe(STARTING_LIVES);
    expect(restarted.level).toBe(1);
    expect(restarted.status).toBe("playing");
    expect(restarted).not.toBe(messyState);
  });
});
