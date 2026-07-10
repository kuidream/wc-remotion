import {
  ARENA_HEIGHT,
  ARENA_MARGIN,
  BALL_RADIUS,
  COIN_RADIUS,
  COIN_SPAWN_INTERVAL,
  DEMO_RESTITUTION,
  DEMO_WALL_BOUNCE,
  FRAMES_PER_YEAR,
  HAZARD_LIFETIME,
  HAZARD_MAX_H,
  HAZARD_MAX_W,
  HAZARD_MIN_H,
  HAZARD_MIN_W,
  HAZARD_SPAWN_INTERVAL,
  INDEX_RADIUS,
  INITIAL_WEALTH,
  LOGICAL_WIDTH,
  MAX_COINS,
  MAX_HAZARDS,
  MIN_SPEED,
  PHYSICS_SUBSTEPS,
  POST_DURATION_FRAMES,
  PRE_DURATION_FRAMES,
  BALL_HARD_SEP_BOOST,
  BALL_SOFT_REPULSE,
  BALL_SOFT_SEP_RATIO,
  SIM_YEARS,
  SIMULATION_SEED,
  TICKS_PER_YEAR,
  getArenaScale,
} from "./constants";
import {
  buildPhysicsProfile,
  resolveAssetStats,
  type AssetStats,
} from "./asset-stats";
import { hashFrame, mulberry32 } from "../MatchSim/random";
import { defaultQuantArenaProps } from "./schema";
import type { Ball, Coin, GameState, Hazard, Particle } from "./types";

const defaultAssetStats = resolveAssetStats(defaultQuantArenaProps);

const HAZARD_LABELS = ["高波动", "最大回撤", "黑天鹅", "流动性枯竭"];

const pushAudioEvent = (
  state: GameState,
  frame: number,
  type: GameState["audioEvents"][number]["type"],
  intensity?: number,
) => {
  state.audioEvents.push({ frame, type, intensity });
};

const hitVolume = (intensity = 1) =>
  Math.max(0.01, 0.3 * Math.min(intensity, 2));

const spawnSparks = (
  state: GameState,
  x: number,
  y: number,
  color1: string,
  color2: string,
  big = false,
  frame: number,
) => {
  const rand = mulberry32(hashFrame(SIMULATION_SEED, frame, Math.floor(x + y)));
  const count = big ? 22 : 6;
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    const speed = big ? rand() * 9 + 3 : rand() * 4 + 2;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: big ? 18 + rand() * 10 : 10 + rand() * 8,
      size: rand() * 1.5 + 0.5,
      color: rand() > 0.5 ? color1 : color2,
      type: "spark",
    });
  }

  if (big) {
    state.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 14,
      size: 36,
      color: color1,
      type: "shockwave",
    });
  }
};

const spawnYieldBurst = (
  state: GameState,
  x: number,
  y: number,
  frame: number,
) => {
  const rand = mulberry32(hashFrame(SIMULATION_SEED, frame, 333));
  for (let i = 0; i < 10; i++) {
    const angle = rand() * Math.PI * 2;
    const speed = rand() * 3 + 1;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 16 + rand() * 10,
      size: rand() * 2 + 1,
      color: rand() > 0.4 ? "#10b981" : "#6ee7b7",
      type: "coinBurst",
    });
  }
};

const placeInArena = (
  arena: GameState["arena"],
  rand: () => number,
  margin: number,
) => {
  const angle = rand() * Math.PI * 2;
  const dist = margin + rand() * (arena.radius - margin * 2);
  return {
    x: arena.x + Math.cos(angle) * dist,
    y: arena.y + Math.sin(angle) * dist,
  };
};

const nearestCoin = (
  ball: Ball,
  coins: Coin[],
  avoidId: number | null = null,
) => {
  let best: Coin | null = null;
  let bestDist = Infinity;
  let fallback: Coin | null = null;
  let fallbackDist = Infinity;

  for (const coin of coins) {
    const d = Math.hypot(coin.x - ball.x, coin.y - ball.y);
    if (d < fallbackDist) {
      fallbackDist = d;
      fallback = coin;
    }
    if (avoidId !== null && coin.id === avoidId) continue;
    if (d < bestDist) {
      bestDist = d;
      best = coin;
    }
  }

  return best ?? fallback;
};

const pickChaseTargets = (balls: Ball[], coins: Coin[]) => {
  if (coins.length === 0) {
    return new Map<string, Coin | null>();
  }

  const targets = new Map<string, Coin | null>();
  const [a, b] = balls;

  // 先让离某币更近的球锁定该币，另一球尽量选别的，减少同点缠斗
  const aNearest = nearestCoin(a, coins);
  const bNearest = nearestCoin(b, coins);

  if (!aNearest || !bNearest) {
    targets.set(a.id, aNearest);
    targets.set(b.id, bNearest);
    return targets;
  }

  if (aNearest.id !== bNearest.id) {
    targets.set(a.id, aNearest);
    targets.set(b.id, bNearest);
    return targets;
  }

  const distA = Math.hypot(aNearest.x - a.x, aNearest.y - a.y);
  const distB = Math.hypot(bNearest.x - b.x, bNearest.y - b.y);

  if (distA <= distB) {
    targets.set(a.id, aNearest);
    targets.set(b.id, nearestCoin(b, coins, aNearest.id));
  } else {
    targets.set(b.id, bNearest);
    targets.set(a.id, nearestCoin(a, coins, bNearest.id));
  }

  return targets;
};

const createBall = (
  id: "BTC" | "ETH",
  label: string,
  x: number,
  y: number,
  vx: number,
  vy: number,
  profile: ReturnType<typeof buildPhysicsProfile>,
  colors: { color: string; glowColor: string; coreColor: string },
): Ball => ({
  id,
  label,
  x,
  y,
  vx,
  vy,
  radius: BALL_RADIUS,
  rotation: 0,
  angularVelocity: id === "BTC" ? 0.05 : -0.05,
  color: colors.color,
  glowColor: colors.glowColor,
  coreColor: colors.coreColor,
  mass: profile.mass,
  maxSpeed: profile.maxSpeed,
  accel: profile.accel,
  stunFrames: profile.stunFrames,
  stunDamping: profile.stunDamping,
  gravityPull: profile.gravityPull,
  yieldRate: profile.yieldRate,
  riskRate: profile.riskRate,
  stun: 0,
  tail: [],
});

export const createInitialState = (
  width: number,
  height: number,
  assetStats: AssetStats,
): GameState => {
  const rand = mulberry32(SIMULATION_SEED);
  const arenaCenter = { x: width / 2, y: height / 2 - 10 };
  const arenaRadius = Math.min(width, height) / 2 - ARENA_MARGIN;
  const scale = getArenaScale(arenaRadius);

  const btcProfile = buildPhysicsProfile(
    assetStats.btcSharpe,
    assetStats.btcSortino,
    assetStats.btcRsq,
    assetStats.btcTtr,
    arenaRadius,
  );
  const ethProfile = buildPhysicsProfile(
    assetStats.ethSharpe,
    assetStats.ethSortino,
    assetStats.ethRsq,
    assetStats.ethTtr,
    arenaRadius,
  );

  const balls: Ball[] = [
    createBall(
      "BTC",
      assetStats.assetAName,
      arenaCenter.x - BALL_RADIUS * 1.4,
      arenaCenter.y + 20,
      1.6 * scale,
      -1.2 * scale,
      btcProfile,
      { color: "#f7931a", glowColor: "#fbbf24", coreColor: "#fff7ed" },
    ),
    createBall(
      "ETH",
      assetStats.assetBName,
      arenaCenter.x + BALL_RADIUS * 1.4,
      arenaCenter.y - 20,
      -1.5 * scale,
      1.3 * scale,
      ethProfile,
      { color: "#627eea", glowColor: "#a5b4fc", coreColor: "#eef2ff" },
    ),
  ];

  const particles: Particle[] = [];
  const count = (width * height) / 8000;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: rand() * width,
      y: rand() * height,
      vx: (rand() - 0.5) * 0.3,
      vy: (rand() - 0.5) * 0.3 - 0.2,
      life: rand() * 100,
      maxLife: 200 + rand() * 200,
      size: rand() * 2 + 0.5,
      color: rand() > 0.5 ? "#a5f3fc" : "#bfdbfe",
      type: "spore",
    });
  }

  return {
    status: "pre",
    timeTicker: 0,
    scoreA: INITIAL_WEALTH,
    scoreB: INITIAL_WEALTH,
    simYears: SIM_YEARS,
    year: 0,
    balls,
    particles,
    coins: [],
    hazards: [],
    indexField: {
      x: arenaCenter.x,
      y: arenaCenter.y,
      angle: 0,
      radius: INDEX_RADIUS,
    },
    arena: {
      x: arenaCenter.x,
      y: arenaCenter.y,
      radius: arenaRadius,
    },
    width,
    height,
    frames: 0,
    shake: 0,
    hitStop: 0,
    collectFlash: 0,
    coinSpawnTimer: 20,
    hazardSpawnTimer: 90,
    nextCoinId: 1,
    nextHazardId: 1,
    simFrame: 0,
    assetStats,
    profiles: { BTC: btcProfile, ETH: ethProfile },
    audioEvents: [],
  };
};

const spawnCoin = (state: GameState, simStep: number) => {
  if (state.coins.length >= MAX_COINS) return;
  const rand = mulberry32(hashFrame(SIMULATION_SEED, simStep, 501));
  const pos = placeInArena(state.arena, rand, 50);
  const distToIndex = Math.hypot(
    pos.x - state.indexField.x,
    pos.y - state.indexField.y,
  );
  if (distToIndex < state.indexField.radius + 30) return;

  state.coins.push({
    id: state.nextCoinId++,
    x: pos.x,
    y: pos.y,
    life: 0,
    pulse: rand() * Math.PI * 2,
  });
};

const spawnHazard = (state: GameState, simStep: number) => {
  if (state.hazards.length >= MAX_HAZARDS) return;
  const rand = mulberry32(hashFrame(SIMULATION_SEED, simStep, 777));
  const pos = placeInArena(state.arena, rand, 70);
  const distToIndex = Math.hypot(
    pos.x - state.indexField.x,
    pos.y - state.indexField.y,
  );
  if (distToIndex < state.indexField.radius + 40) return;

  const w = HAZARD_MIN_W + rand() * (HAZARD_MAX_W - HAZARD_MIN_W);
  const h = HAZARD_MIN_H + rand() * (HAZARD_MAX_H - HAZARD_MIN_H);
  state.hazards.push({
    id: state.nextHazardId++,
    x: pos.x,
    y: pos.y,
    w,
    h,
    label: HAZARD_LABELS[Math.floor(rand() * HAZARD_LABELS.length)],
    life: HAZARD_LIFETIME,
    maxLife: HAZARD_LIFETIME,
    angle: (rand() - 0.5) * 0.4,
  });
};

const applyStun = (ball: Ball) => {
  ball.stun = ball.stunFrames;
  ball.vx *= 0.35;
  ball.vy *= 0.35;
};

const updateIndexField = (state: GameState) => {
  const { arena, indexField, frames } = state;
  indexField.angle += 0.008;
  const orbitR = arena.radius * 0.22;
  const wobble = Math.sin(frames * 0.012) * 8;
  indexField.x = arena.x + Math.cos(indexField.angle) * (orbitR + wobble);
  indexField.y = arena.y + Math.sin(indexField.angle * 0.85) * (orbitR * 0.7);
};

const collideBallHazard = (
  state: GameState,
  ball: Ball,
  hazard: Hazard,
  simStep: number,
  compFrame: number,
) => {
  const cos = Math.cos(-hazard.angle);
  const sin = Math.sin(-hazard.angle);
  const dx = ball.x - hazard.x;
  const dy = ball.y - hazard.y;
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  const halfW = hazard.w / 2 + ball.radius;
  const halfH = hazard.h / 2 + ball.radius;

  if (Math.abs(localX) > halfW || Math.abs(localY) > halfH) return false;

  const overlapX = halfW - Math.abs(localX);
  const overlapY = halfH - Math.abs(localY);
  const pushLocalX = overlapX < overlapY ? Math.sign(localX) * overlapX : 0;
  const pushLocalY = overlapX < overlapY ? 0 : Math.sign(localY) * overlapY;
  const pushX = pushLocalX * cos + pushLocalY * sin;
  const pushY = -pushLocalX * sin + pushLocalY * cos;
  ball.x += pushX;
  ball.y += pushY;

  const nx = pushX || Math.sign(dx) || 1;
  const ny = pushY || Math.sign(dy) || 0;
  const len = Math.hypot(nx, ny) || 1;
  const nnx = nx / len;
  const nny = ny / len;
  const dot = ball.vx * nnx + ball.vy * nny;
  ball.vx -= 2 * dot * nnx;
  ball.vy -= 2 * dot * nny;

  const massFactor = 1 / ball.mass;
  // 所提诺高：撞击动能损失更小
  ball.vx *= 0.72 + massFactor * 0.08;
  ball.vy *= 0.72 + massFactor * 0.08;

  // 乘法回撤：按净值比例扣减
  if (ball.id === "BTC") {
    state.scoreA = Math.max(0, state.scoreA * (1 - ball.riskRate));
  } else {
    state.scoreB = Math.max(0, state.scoreB * (1 - ball.riskRate));
  }

  applyStun(ball);
  spawnSparks(state, ball.x, ball.y, "#ef4444", ball.glowColor, true, simStep);
  state.shake = Math.min(10, 4 + ball.stunFrames * 0.12);
  pushAudioEvent(state, compFrame, "hazard", hitVolume(1.2));
  return true;
};

const updatePhysics = (state: GameState, simStep: number, compFrame: number) => {
  if (state.status !== "sim") return;

  if (state.hitStop > 0) {
    state.hitStop--;
    return;
  }

  const rand = mulberry32(hashFrame(SIMULATION_SEED, simStep));
  const scale = getArenaScale(state.arena.radius);
  const minSpeed = MIN_SPEED * scale;

  state.timeTicker += 1;
  const year = Math.floor(state.timeTicker / TICKS_PER_YEAR);
  if (year > state.year && year <= state.simYears) {
    state.year = year;
  }
  if (year >= state.simYears) {
    state.status = "post";
    return;
  }

  updateIndexField(state);

  state.coinSpawnTimer--;
  if (state.coinSpawnTimer <= 0) {
    spawnCoin(state, simStep);
    state.coinSpawnTimer = COIN_SPAWN_INTERVAL + Math.floor(rand() * 20);
  }

  state.hazardSpawnTimer--;
  if (state.hazardSpawnTimer <= 0) {
    spawnHazard(state, simStep);
    state.hazardSpawnTimer = HAZARD_SPAWN_INTERVAL + Math.floor(rand() * 60);
  }

  state.hazards.forEach((h) => {
    h.life--;
  });
  state.hazards = state.hazards.filter((h) => h.life > 0);

  state.coins.forEach((c) => {
    c.life++;
    c.pulse += 0.08;
  });

  const { arena, balls, indexField } = state;
  const chaseTargets = pickChaseTargets(balls, state.coins);

  // 球间软斥力：未接触时就开始推开
  {
    const b1 = balls[0];
    const b2 = balls[1];
    const dx = b2.x - b1.x;
    const dy = b2.y - b1.y;
    const dist = Math.hypot(dx, dy);
    const softRange = (b1.radius + b2.radius) * BALL_SOFT_SEP_RATIO;
    if (dist > 0.001 && dist < softRange) {
      const nx = dx / dist;
      const ny = dy / dist;
      const strength =
        BALL_SOFT_REPULSE * Math.pow(1 - dist / softRange, 2);
      b1.vx -= (nx * strength) / b1.mass;
      b1.vy -= (ny * strength) / b1.mass;
      b2.vx += (nx * strength) / b2.mass;
      b2.vy += (ny * strength) / b2.mass;
    }
  }

  balls.forEach((b) => {
    if (b.stun > 0) {
      b.stun--;
      b.vx *= b.stunDamping;
      b.vy *= b.stunDamping;
      b.angularVelocity *= 0.96;
    } else {
      const target = chaseTargets.get(b.id) ?? null;
      if (target) {
        const dx = target.x - b.x;
        const dy = target.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.001) {
          b.vx += (dx / dist) * b.accel;
          b.vy += (dy / dist) * b.accel;
        }
      } else {
        b.vx += (rand() - 0.5) * 0.05;
        b.vy += (rand() - 0.5) * 0.05;
      }
    }

    b.rotation += b.angularVelocity;

    // 拟合度 -> 大盘引力
    b.vx += (indexField.x - b.x) * b.gravityPull;
    b.vy += (indexField.y - b.y) * b.gravityPull;

    // 夏普上限
    let speed = Math.hypot(b.vx, b.vy);
    if (speed > b.maxSpeed && b.stun <= 0) {
      b.vx = (b.vx / speed) * b.maxSpeed;
      b.vy = (b.vy / speed) * b.maxSpeed;
    } else if (speed < minSpeed && b.stun <= 0) {
      if (speed < 0.01) {
        const a = rand() * Math.PI * 2;
        b.vx = Math.cos(a) * minSpeed;
        b.vy = Math.sin(a) * minSpeed;
      } else {
        b.vx = (b.vx / speed) * minSpeed;
        b.vy = (b.vy / speed) * minSpeed;
      }
    }

    b.x += b.vx;
    b.y += b.vy;

    b.tail.unshift({ x: b.x, y: b.y });
    if (b.tail.length > 28) b.tail.pop();

    const distToCenter = Math.hypot(b.x - arena.x, b.y - arena.y);
    if (distToCenter + b.radius > arena.radius) {
      const nx = (b.x - arena.x) / distToCenter;
      const ny = (b.y - arena.y) / distToCenter;
      b.x = arena.x + nx * (arena.radius - b.radius);
      b.y = arena.y + ny * (arena.radius - b.radius);
      b.vx *= -DEMO_WALL_BOUNCE;
      b.vy *= -DEMO_WALL_BOUNCE;

      spawnSparks(
        state,
        b.x + nx * b.radius,
        b.y + ny * b.radius,
        b.glowColor,
        "#ffffff",
        false,
        simStep,
      );
      state.shake = 1.2;
      pushAudioEvent(state, compFrame, "hit", hitVolume(0.4));
    }

    const distToIndex = Math.hypot(b.x - indexField.x, b.y - indexField.y);
    if (distToIndex < indexField.radius + b.radius * 0.35) {
      const nx = (b.x - indexField.x) / (distToIndex || 1);
      const ny = (b.y - indexField.y) / (distToIndex || 1);
      b.x = indexField.x + nx * (indexField.radius + b.radius * 0.4);
      b.y = indexField.y + ny * (indexField.radius + b.radius * 0.4);
      const tangential = 0.35 * scale;
      b.vx += -ny * tangential + nx * 0.2;
      b.vy += nx * tangential + ny * 0.2;
    }

    for (const hazard of state.hazards) {
      if (b.stun <= 0) {
        collideBallHazard(state, b, hazard, simStep, compFrame);
      }
    }
  });

  const remaining: Coin[] = [];
  for (const coin of state.coins) {
    let collected = false;
    for (const b of balls) {
      const d = Math.hypot(coin.x - b.x, coin.y - b.y);
      if (d < b.radius + COIN_RADIUS) {
        // 乘法收益：按净值比例增长，所提诺越高涨幅越大
        if (b.id === "BTC") state.scoreA *= 1 + b.yieldRate;
        else state.scoreB *= 1 + b.yieldRate;
        spawnYieldBurst(state, coin.x, coin.y, simStep);
        state.collectFlash = 0.35;
        pushAudioEvent(state, compFrame, "collect", 0.45);
        collected = true;
        break;
      }
    }
    if (!collected) remaining.push(coin);
  }
  state.coins = remaining;

  const b1 = balls[0];
  const b2 = balls[1];
  const dx = b2.x - b1.x;
  const dy = b2.y - b1.y;
  const dist = Math.hypot(dx, dy);
  const minDist = (b1.radius + b2.radius) * BALL_HARD_SEP_BOOST;

  if (dist < minDist && dist > 0.001) {
    const nx = dx / dist;
    const ny = dy / dist;

    // 重叠时始终推开，避免粘连
    const overlap = (minDist - dist) / 2;
    b1.x -= nx * overlap;
    b1.y -= ny * overlap;
    b2.x += nx * overlap;
    b2.y += ny * overlap;

    const rvx = b1.vx - b2.vx;
    const rvy = b1.vy - b2.vy;
    const velAlongNormal = rvx * nx + rvy * ny;

    if (velAlongNormal > 0) {
      const impulse =
        ((1 + DEMO_RESTITUTION) * velAlongNormal) /
        (1 / b1.mass + 1 / b2.mass);

      b1.vx -= (nx * impulse) / b1.mass;
      b1.vy -= (ny * impulse) / b1.mass;
      b2.vx += (nx * impulse) / b2.mass;
      b2.vy += (ny * impulse) / b2.mass;

      // 额外弹开一截，减少贴脸缠斗
      const kick = 0.55 * scale;
      b1.vx -= (nx * kick) / b1.mass;
      b1.vy -= (ny * kick) / b1.mass;
      b2.vx += (nx * kick) / b2.mass;
      b2.vy += (ny * kick) / b2.mass;

      b1.angularVelocity = (b1.angularVelocity + (rand() - 0.5) * 0.12) * 0.95;
      b2.angularVelocity = (b2.angularVelocity + (rand() - 0.5) * 0.12) * 0.95;

      spawnSparks(
        state,
        b1.x + nx * b1.radius,
        b1.y + ny * b1.radius,
        b1.glowColor,
        b2.glowColor,
        true,
        simStep,
      );

      state.shake = Math.min(9, Math.abs(impulse) * 0.4);
      pushAudioEvent(
        state,
        compFrame,
        "hit",
        hitVolume(Math.abs(velAlongNormal) * 0.18),
      );

      if (Math.abs(impulse) > 8) {
        state.hitStop = 2;
      }
    }
  }
};

const updateParticles = (state: GameState, simStep: number) => {
  const rand = mulberry32(hashFrame(SIMULATION_SEED, simStep, 999));

  state.particles.forEach((p) => {
    if (state.hitStop > 0 && p.type !== "shockwave") return;

    p.x += p.vx;
    p.y += p.vy;
    p.life++;

    if (p.type === "spark" || p.type === "coinBurst") {
      p.vx *= 0.95;
      p.vy *= 0.95;
    } else if (p.type === "spore") {
      p.x += Math.sin(state.frames * 0.02 + p.life * 0.1) * 0.5;
      if (p.life > p.maxLife) {
        p.y = state.height + 10;
        p.x = rand() * state.width;
        p.life = 0;
      }
    }
  });

  state.particles = state.particles.filter(
    (p) => p.type === "spore" || p.life < p.maxLife,
  );
};

export const tickSimulation = (state: GameState, absoluteFrame: number) => {
  if (absoluteFrame < PRE_DURATION_FRAMES) {
    state.status = "pre";
    return;
  }

  if (state.status === "pre") {
    state.status = "sim";
    state.timeTicker = 0;
    state.year = 0;
    state.scoreA = INITIAL_WEALTH;
    state.scoreB = INITIAL_WEALTH;
    state.simFrame = 0;
  }

  if (state.status === "post") {
    return;
  }

  for (let substep = 0; substep < PHYSICS_SUBSTEPS; substep++) {
    if (state.status !== "sim") break;

    const simStep = state.frames;
    updatePhysics(state, simStep, absoluteFrame);
    updateParticles(state, simStep);

    if (state.collectFlash > 0) {
      state.collectFlash -= 0.04;
    }

    if (state.shake > 0) {
      state.shake *= 0.85;
      if (state.shake < 0.5) state.shake = 0;
    }

    state.frames++;
  }

  state.simFrame++;
};

export const collectAudioEvents = (
  assetStats: AssetStats,
  endFrame: number,
) => {
  const state = createInitialState(LOGICAL_WIDTH, ARENA_HEIGHT, assetStats);
  for (let f = 0; f <= endFrame; f++) {
    tickSimulation(state, f);
  }
  return state.audioEvents;
};

export const getQuantArenaDurationFrames = (): number => {
  return (
    PRE_DURATION_FRAMES +
    SIM_YEARS * FRAMES_PER_YEAR +
    POST_DURATION_FRAMES
  );
};

export const QUANT_ARENA_DURATION = getQuantArenaDurationFrames();

export { defaultAssetStats };
