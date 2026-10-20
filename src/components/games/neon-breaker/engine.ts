export const LOGICAL_WIDTH = 800;
export const LOGICAL_HEIGHT = 500;

export const PADDLE_WIDTH = 110;
export const PADDLE_HEIGHT = 14;
export const PADDLE_Y = LOGICAL_HEIGHT - 32;
export const PADDLE_SPEED = 640;

export const BALL_RADIUS = 8;
export const BASE_BALL_SPEED = 320;
export const BALL_SPEED_PER_LEVEL = 0.12;

export const STARTING_LIVES = 3;
export const MAX_LEVEL = 5;

export const BLOCK_COLS = 8;
export const BLOCK_HEIGHT = 20;
export const BLOCK_GAP = 6;
export const BLOCK_TOP_MARGIN = 56;
export const BLOCK_SIDE_MARGIN = 24;

export type NeonBreakerStatus =
  "idle" | "playing" | "paused" | "level-complete" | "game-over" | "won";

export interface Vector2 {
  x: number;
  y: number;
}

export interface Paddle {
  x: number;
  width: number;
  height: number;
  y: number;
}

export interface Ball {
  position: Vector2;
  velocity: Vector2;
  radius: number;
}

export interface Block {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  colorIndex: number;
  destroyed: boolean;
}

export interface NeonBreakerState {
  status: NeonBreakerStatus;
  level: number;
  score: number;
  lives: number;
  ballLaunched: boolean;
  paddle: Paddle;
  ball: Ball;
  blocks: Block[];
}

function rowsForLevel(level: number): number {
  return Math.min(2 + level, 7);
}

function ballSpeedForLevel(level: number): number {
  return BASE_BALL_SPEED * (1 + (level - 1) * BALL_SPEED_PER_LEVEL);
}

export function createLevelBlocks(level: number): Block[] {
  const rows = rowsForLevel(level);
  const playableWidth = LOGICAL_WIDTH - BLOCK_SIDE_MARGIN * 2;
  const blockWidth =
    (playableWidth - BLOCK_GAP * (BLOCK_COLS - 1)) / BLOCK_COLS;
  const blocks: Block[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < BLOCK_COLS; col += 1) {
      blocks.push({
        id: `${row}-${col}`,
        x: BLOCK_SIDE_MARGIN + col * (blockWidth + BLOCK_GAP),
        y: BLOCK_TOP_MARGIN + row * (BLOCK_HEIGHT + BLOCK_GAP),
        width: blockWidth,
        height: BLOCK_HEIGHT,
        colorIndex: row % 4,
        destroyed: false,
      });
    }
  }

  return blocks;
}

function createPaddle(): Paddle {
  return {
    x: LOGICAL_WIDTH / 2 - PADDLE_WIDTH / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    y: PADDLE_Y,
  };
}

function ballRestingOnPaddle(paddle: Paddle): Ball {
  return {
    position: {
      x: paddle.x + paddle.width / 2,
      y: paddle.y - BALL_RADIUS - 1,
    },
    velocity: { x: 0, y: 0 },
    radius: BALL_RADIUS,
  };
}

function createLevelState(
  level: number,
  score: number,
  lives: number,
): NeonBreakerState {
  const paddle = createPaddle();
  return {
    status: "playing",
    level,
    score,
    lives,
    ballLaunched: false,
    paddle,
    ball: ballRestingOnPaddle(paddle),
    blocks: createLevelBlocks(level),
  };
}

export function createIdleState(): NeonBreakerState {
  const paddle = createPaddle();
  return {
    status: "idle",
    level: 1,
    score: 0,
    lives: STARTING_LIVES,
    ballLaunched: false,
    paddle,
    ball: ballRestingOnPaddle(paddle),
    blocks: createLevelBlocks(1),
  };
}

export function startGame(): NeonBreakerState {
  return createLevelState(1, 0, STARTING_LIVES);
}

export function restartGame(): NeonBreakerState {
  return createLevelState(1, 0, STARTING_LIVES);
}

export function continueToNextLevel(state: NeonBreakerState): NeonBreakerState {
  return createLevelState(state.level + 1, state.score, state.lives);
}

export function launchBall(state: NeonBreakerState): NeonBreakerState {
  if (state.status !== "playing" || state.ballLaunched) {
    return state;
  }

  const speed = ballSpeedForLevel(state.level);
  const launchAngle = (-65 * Math.PI) / 180;

  return {
    ...state,
    ballLaunched: true,
    ball: {
      ...state.ball,
      velocity: {
        x: speed * Math.cos(launchAngle),
        y: speed * Math.sin(launchAngle),
      },
    },
  };
}

export function pauseGame(state: NeonBreakerState): NeonBreakerState {
  if (state.status !== "playing") {
    return state;
  }
  return { ...state, status: "paused" };
}

export function resumeGame(state: NeonBreakerState): NeonBreakerState {
  if (state.status !== "paused") {
    return state;
  }
  return { ...state, status: "playing" };
}

function clampPaddleX(x: number, width: number): number {
  return Math.max(0, Math.min(LOGICAL_WIDTH - width, x));
}

function movePaddleToward(
  paddle: Paddle,
  targetX: number,
  dtSeconds: number,
): Paddle {
  const maxDelta = PADDLE_SPEED * dtSeconds;
  const desiredX = clampPaddleX(targetX - paddle.width / 2, paddle.width);
  const delta = desiredX - paddle.x;
  const clampedDelta = Math.max(-maxDelta, Math.min(maxDelta, delta));

  return { ...paddle, x: paddle.x + clampedDelta };
}

function reflect(velocity: Vector2, axis: "x" | "y"): Vector2 {
  return axis === "x"
    ? { x: -velocity.x, y: velocity.y }
    : { x: velocity.x, y: -velocity.y };
}

function resolveWallCollisions(ball: Ball): Ball {
  let { position, velocity } = ball;

  if (position.x - ball.radius < 0) {
    position = { ...position, x: ball.radius };
    velocity = reflect(velocity, "x");
  } else if (position.x + ball.radius > LOGICAL_WIDTH) {
    position = { ...position, x: LOGICAL_WIDTH - ball.radius };
    velocity = reflect(velocity, "x");
  }

  if (position.y - ball.radius < 0) {
    position = { ...position, y: ball.radius };
    velocity = reflect(velocity, "y");
  }

  return { ...ball, position, velocity };
}

function resolvePaddleCollision(ball: Ball, paddle: Paddle): Ball {
  const withinX =
    ball.position.x + ball.radius >= paddle.x &&
    ball.position.x - ball.radius <= paddle.x + paddle.width;
  const withinY =
    ball.position.y + ball.radius >= paddle.y &&
    ball.position.y <= paddle.y + paddle.height;

  if (!withinX || !withinY || ball.velocity.y <= 0) {
    return ball;
  }

  const paddleCenter = paddle.x + paddle.width / 2;
  const hitOffset = (ball.position.x - paddleCenter) / (paddle.width / 2);
  const clampedOffset = Math.max(-1, Math.min(1, hitOffset));
  const speed = Math.hypot(ball.velocity.x, ball.velocity.y);
  const maxBounceAngle = (65 * Math.PI) / 180;
  const angle = clampedOffset * maxBounceAngle - Math.PI / 2;

  return {
    ...ball,
    position: { ...ball.position, y: paddle.y - ball.radius - 1 },
    velocity: {
      x: speed * Math.cos(angle),
      y: speed * Math.sin(angle),
    },
  };
}

function resolveBlockCollisions(
  ball: Ball,
  blocks: Block[],
): { ball: Ball; blocks: Block[]; scoreGain: number } {
  for (const block of blocks) {
    if (block.destroyed) {
      continue;
    }

    const closestX = Math.max(
      block.x,
      Math.min(ball.position.x, block.x + block.width),
    );
    const closestY = Math.max(
      block.y,
      Math.min(ball.position.y, block.y + block.height),
    );
    const distanceX = ball.position.x - closestX;
    const distanceY = ball.position.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;

    if (distanceSquared > ball.radius * ball.radius) {
      continue;
    }

    const overlapX =
      ball.radius -
      Math.abs(distanceX || ball.position.x - block.x - block.width / 2);
    const overlapY =
      ball.radius -
      Math.abs(distanceY || ball.position.y - block.y - block.height / 2);

    const nextBlocks = blocks.map((candidate) =>
      candidate.id === block.id ? { ...candidate, destroyed: true } : candidate,
    );

    if (Math.abs(overlapX) < Math.abs(overlapY)) {
      return {
        ball: reflectAwayFromBlock(ball, block, "x"),
        blocks: nextBlocks,
        scoreGain: 10,
      };
    }

    return {
      ball: reflectAwayFromBlock(ball, block, "y"),
      blocks: nextBlocks,
      scoreGain: 10,
    };
  }

  return { ball, blocks, scoreGain: 0 };
}

function reflectAwayFromBlock(ball: Ball, block: Block, axis: "x" | "y"): Ball {
  const velocity = reflect(ball.velocity, axis);
  let position = ball.position;

  if (axis === "y") {
    const pushDirection = ball.position.y < block.y + block.height / 2 ? -1 : 1;
    const edgeY = pushDirection === -1 ? block.y : block.y + block.height;
    position = { ...position, y: edgeY + pushDirection * (ball.radius + 0.5) };
  } else {
    const pushDirection = ball.position.x < block.x + block.width / 2 ? -1 : 1;
    const edgeX = pushDirection === -1 ? block.x : block.x + block.width;
    position = { ...position, x: edgeX + pushDirection * (ball.radius + 0.5) };
  }

  return { ...ball, position, velocity };
}

export interface StepResult {
  state: NeonBreakerState;
  events: StepEvent[];
}

export type StepEvent =
  | { type: "block-destroyed" }
  | { type: "ball-lost" }
  | { type: "level-complete" }
  | { type: "game-over" }
  | { type: "won" };

export function step(
  state: NeonBreakerState,
  dtSeconds: number,
  targetPaddleX: number,
): StepResult {
  if (state.status !== "playing") {
    return { state, events: [] };
  }

  const paddle = movePaddleToward(state.paddle, targetPaddleX, dtSeconds);

  if (!state.ballLaunched) {
    return {
      state: { ...state, paddle, ball: ballRestingOnPaddle(paddle) },
      events: [],
    };
  }

  const events: StepEvent[] = [];
  let ball: Ball = {
    ...state.ball,
    position: {
      x: state.ball.position.x + state.ball.velocity.x * dtSeconds,
      y: state.ball.position.y + state.ball.velocity.y * dtSeconds,
    },
  };

  ball = resolveWallCollisions(ball);
  ball = resolvePaddleCollision(ball, paddle);

  const blockResult = resolveBlockCollisions(ball, state.blocks);
  ball = blockResult.ball;
  const blocks = blockResult.blocks;
  const score = state.score + blockResult.scoreGain;
  if (blockResult.scoreGain > 0) {
    events.push({ type: "block-destroyed" });
  }

  if (ball.position.y - ball.radius > LOGICAL_HEIGHT) {
    const lives = state.lives - 1;
    events.push({ type: "ball-lost" });

    if (lives <= 0) {
      events.push({ type: "game-over" });
      return {
        state: { ...state, status: "game-over", lives: 0, score, blocks },
        events,
      };
    }

    return {
      state: {
        ...state,
        lives,
        score,
        blocks,
        paddle,
        ballLaunched: false,
        ball: ballRestingOnPaddle(paddle),
      },
      events,
    };
  }

  const remainingBlocks = blocks.filter((block) => !block.destroyed).length;
  if (remainingBlocks === 0) {
    if (state.level >= MAX_LEVEL) {
      events.push({ type: "won" });
      return {
        state: { ...state, status: "won", score, blocks, paddle, ball },
        events,
      };
    }

    events.push({ type: "level-complete" });
    return {
      state: {
        ...state,
        status: "level-complete",
        score,
        blocks,
        paddle,
        ball,
      },
      events,
    };
  }

  return {
    state: { ...state, paddle, ball, blocks, score },
    events,
  };
}
