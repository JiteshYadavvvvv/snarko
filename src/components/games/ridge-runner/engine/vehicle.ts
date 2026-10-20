import { groundHeightAt } from "@/components/games/ridge-runner/engine/terrain";
import type {
  Terrain,
  VehicleConfig,
  VehicleInput,
  VehicleState,
  VehicleStepResult,
} from "@/components/games/ridge-runner/engine/types";

export const GRAVITY = 1400;
export const INERTIA_FACTOR = 900;
export const LINEAR_DRAG = 62;
export const ANGULAR_DRAG = 20000;
export const CRASH_MARGIN = 3;
export const STOP_SPEED_THRESHOLD = 8;

export const BASE_VEHICLE_CONFIG: VehicleConfig = {
  mass: 20,
  wheelRadius: 16,
  wheelBaseHalf: 46,
  chassisHalfLength: 50,
  chassisHalfHeight: 14,
  enginePower: 16000,
  brakeForce: 14000,
  suspensionRestLength: 34,
  suspensionStiffness: 700,
  suspensionDamping: 140,
  tireGrip: 1.3,
  airControlTorque: 65000,
  maxFuel: 100,
  fuelBurnPerUnit: 0.045,
  fuelBurnIdlePerSecond: 0.6,
};

export function createVehicleState(
  startX: number,
  groundY: number,
): VehicleState {
  return {
    startX,
    position: { x: startX, y: groundY - 60 },
    velocity: { x: 0, y: 0 },
    angle: 0,
    angularVelocity: 0,
    rearWheel: { compression: 0, grounded: false },
    frontWheel: { compression: 0, grounded: false },
    fuel: 100,
    distanceTraveled: 0,
    airborne: true,
  };
}

function cross(
  relX: number,
  relY: number,
  forceX: number,
  forceY: number,
): number {
  return relX * forceY - relY * forceX;
}

function stepWheel(
  offsetX: number,
  previous: { compression: number; grounded: boolean },
  position: { x: number; y: number },
  cos: number,
  sin: number,
  terrain: Terrain,
  config: VehicleConfig,
  dtSeconds: number,
) {
  const anchorX = position.x + cos * offsetX;
  const anchorY = position.y + sin * offsetX;
  const groundY = groundHeightAt(terrain, anchorX);
  const restBottomY =
    anchorY + config.suspensionRestLength + config.wheelRadius;
  const penetration = restBottomY - groundY;
  const compression = Math.max(
    0,
    Math.min(config.suspensionRestLength, penetration),
  );
  const grounded = compression > 0.001;
  const compressionVelocity =
    dtSeconds > 0 ? (compression - previous.compression) / dtSeconds : 0;
  const springForce = Math.max(
    0,
    config.suspensionStiffness * compression +
      config.suspensionDamping * compressionVelocity,
  );

  return {
    anchorX,
    anchorY,
    compression,
    grounded,
    springForce,
  };
}

export function stepVehicle(
  state: VehicleState,
  config: VehicleConfig,
  terrain: Terrain,
  input: VehicleInput,
  dtSeconds: number,
): VehicleStepResult {
  const cos = Math.cos(state.angle);
  const sin = Math.sin(state.angle);

  const rear = stepWheel(
    -config.wheelBaseHalf,
    state.rearWheel,
    state.position,
    cos,
    sin,
    terrain,
    config,
    dtSeconds,
  );
  const front = stepWheel(
    config.wheelBaseHalf,
    state.frontWheel,
    state.position,
    cos,
    sin,
    terrain,
    config,
    dtSeconds,
  );

  let forceX = 0;
  let forceY = config.mass * GRAVITY;
  let torque = 0;

  forceY += -rear.springForce;
  torque += cross(
    rear.anchorX - state.position.x,
    rear.anchorY - state.position.y,
    0,
    -rear.springForce,
  );

  forceY += -front.springForce;
  torque += cross(
    front.anchorX - state.position.x,
    front.anchorY - state.position.y,
    0,
    -front.springForce,
  );

  const grounded = rear.grounded || front.grounded;

  if (rear.grounded && input.gas && state.fuel > 0) {
    const driveForce = Math.min(
      config.enginePower,
      config.tireGrip * rear.springForce,
    );
    forceX += cos * driveForce;
    forceY += sin * driveForce;
    torque += cross(
      rear.anchorX - state.position.x,
      rear.anchorY - state.position.y,
      cos * driveForce,
      sin * driveForce,
    );
  } else if (rear.grounded && input.brake) {
    const forwardSpeed = state.velocity.x * cos + state.velocity.y * sin;
    const brakeDirection = forwardSpeed > 0 ? -1 : 1;
    const brakeForceMag = Math.min(
      config.brakeForce,
      config.tireGrip * rear.springForce,
    );
    const bx = cos * brakeDirection * brakeForceMag;
    const by = sin * brakeDirection * brakeForceMag;
    forceX += bx;
    forceY += by;
    torque += cross(
      rear.anchorX - state.position.x,
      rear.anchorY - state.position.y,
      bx,
      by,
    );
  }

  if (!grounded) {
    if (input.gas) {
      torque += config.airControlTorque;
    } else if (input.brake) {
      torque += -config.airControlTorque;
    }
  }

  forceX += -state.velocity.x * LINEAR_DRAG;
  forceY += -state.velocity.y * LINEAR_DRAG;
  torque += -state.angularVelocity * ANGULAR_DRAG;

  const momentOfInertia = config.mass * INERTIA_FACTOR;
  const accelerationX = forceX / config.mass;
  const accelerationY = forceY / config.mass;
  const angularAcceleration = torque / momentOfInertia;

  const velocity = {
    x: state.velocity.x + accelerationX * dtSeconds,
    y: state.velocity.y + accelerationY * dtSeconds,
  };
  const position = {
    x: state.position.x + velocity.x * dtSeconds,
    y: state.position.y + velocity.y * dtSeconds,
  };
  const angularVelocity =
    state.angularVelocity + angularAcceleration * dtSeconds;
  const angle = state.angle + angularVelocity * dtSeconds;

  const distanceDelta = position.x - state.position.x;
  const movementBurn = Math.abs(distanceDelta) * config.fuelBurnPerUnit;
  const idleBurn = input.gas ? config.fuelBurnIdlePerSecond * dtSeconds : 0;
  const fuel = Math.max(0, state.fuel - movementBurn - idleBurn);

  const distanceTraveled = Math.max(
    state.distanceTraveled,
    position.x - state.startX,
  );

  const nextCos = Math.cos(angle);
  const nextSin = Math.sin(angle);
  const corners = [
    { lx: -config.chassisHalfLength, ly: -config.chassisHalfHeight },
    { lx: config.chassisHalfLength, ly: -config.chassisHalfHeight },
    { lx: -config.chassisHalfLength, ly: config.chassisHalfHeight },
    { lx: config.chassisHalfLength, ly: config.chassisHalfHeight },
  ];

  let crashed = false;
  for (const corner of corners) {
    const worldX = position.x + nextCos * corner.lx - nextSin * corner.ly;
    const worldY = position.y + nextSin * corner.lx + nextCos * corner.ly;
    const groundY = groundHeightAt(terrain, worldX);
    if (worldY > groundY - CRASH_MARGIN) {
      crashed = true;
      break;
    }
  }

  const wasAirborne = state.airborne;
  const nowAirborne = !grounded;

  return {
    state: {
      startX: state.startX,
      position,
      velocity,
      angle,
      angularVelocity,
      rearWheel: { compression: rear.compression, grounded: rear.grounded },
      frontWheel: { compression: front.compression, grounded: front.grounded },
      fuel,
      distanceTraveled,
      airborne: nowAirborne,
    },
    crashed,
    justLanded: wasAirborne && !nowAirborne,
  };
}
