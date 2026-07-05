import {
  ARENA_HEIGHT,
  ARENA_MARGIN,
  BALL_RADIUS,
  BASE_SPEED,
  FRAMES_PER_MATCH_MINUTE,
  GOAL_RESET_DELAY,
  INJURY_TIME_MAX,
  INJURY_TIME_MIN,
  LOGICAL_WIDTH,
  MAX_SPEED,
  MIN_SPEED,
  PHYSICS_SUBSTEPS,
  POST_DURATION_FRAMES,
  PRE_DURATION_FRAMES,
  REGULATION_MINUTES,
  SIMULATION_SEED,
  TICKS_PER_MATCH_MINUTE,
} from "./constants";
import { hashFrame, mulberry32 } from "./random";
import { defaultMatchSimProps } from "./schema";
import {
  defenseDischargeWeight,
  getEffectiveOffenseShares,
  getRingArcs,
  INNER_RING_BONUS_CAP,
  PLAYER_DISCHARGE_BASE_CHANCE,
  goalPenetrationFromShare,
  goalPenetrationFromStar,
  pocketPunchFromShare,
  pocketPunchFromStar,
  ringBoostFromShare,
  ringSlowFromShare,
  resolveTeamStats,
  starInnerBonusFactor,
  starInnerBoostMultiplier,
  starInnerSlowMultiplier,
  teamStarShare,
  type TeamStats,
} from "./team-stats";
import type { Ball, GameState, Particle, Player } from "./types";

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

const defaultTeamStats = resolveTeamStats(defaultMatchSimProps);

const addTeam = (
  team: "MEX" | "ENG",
  baseX: number,
  baseY: number,
  dir: number,
  rand: () => number,
): Player[] => {
  const players: Player[] = [];
  const spacingX = 22;
  const spacingY = 18;

  players.push({
    id: `${team}-GK`,
    team,
    type: "goalkeeper",
    x: baseX - dir * spacingX * 2,
    y: baseY,
    charge: 0,
    cooldown: Math.floor(rand() * 120),
  });
  for (let i = 0; i < 4; i++) {
    players.push({
      id: `${team}-DEF${i}`,
      team,
      type: "defender",
      x: baseX - dir * spacingX,
      y: baseY - spacingY * 1.5 + i * spacingY,
      charge: 0,
      cooldown: Math.floor(rand() * 120),
    });
  }
  for (let i = 0; i < 3; i++) {
    players.push({
      id: `${team}-MID${i}`,
      team,
      type: "midfielder",
      x: baseX,
      y: baseY - spacingY + i * spacingY,
      charge: 0,
      cooldown: Math.floor(rand() * 120),
    });
  }
  for (let i = 0; i < 3; i++) {
    players.push({
      id: `${team}-FWD${i}`,
      team,
      type: "forward",
      x: baseX + dir * spacingX,
      y: baseY - spacingY + i * spacingY,
      charge: 0,
      cooldown: Math.floor(rand() * 120),
    });
  }
  return players;
};

export const createInitialState = (
  width: number,
  height: number,
  teamStats: TeamStats,
): GameState => {
  const rand = mulberry32(SIMULATION_SEED);
  const arenaCenter = { x: width / 2, y: height / 2 - 10 };
  const arenaRadius = Math.min(width, height) / 2 - ARENA_MARGIN;
  const injuryTime =
    INJURY_TIME_MIN +
    Math.floor(rand() * (INJURY_TIME_MAX - INJURY_TIME_MIN + 1));
  const matchLength = REGULATION_MINUTES + injuryTime;

  const balls: Ball[] = [
    {
      id: "MEX",
      team: teamStats.teamAName,
      x: arenaCenter.x - BALL_RADIUS,
      y: arenaCenter.y,
      vx: 2.0,
      vy: -1.0,
      radius: BALL_RADIUS,
      rotation: 0,
      angularVelocity: 0.05,
      color: "#006847",
      glowColor: "#ce1126",
      coreColor: "#ffffff",
      tail: [],
    },
    {
      id: "ENG",
      team: teamStats.teamBName,
      x: arenaCenter.x + BALL_RADIUS,
      y: arenaCenter.y,
      vx: -2.0,
      vy: 1.0,
      radius: BALL_RADIUS,
      rotation: 0,
      angularVelocity: -0.05,
      color: "#f8fafc",
      glowColor: "#cf081f",
      coreColor: "#ffffff",
      tail: [],
    },
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
    scoreA: 0,
    scoreB: 0,
    matchLength,
    injuryTime,
    matchMinute: 0,
    balls,
    particles,
    arena: {
      x: arenaCenter.x,
      y: arenaCenter.y,
      radius: arenaRadius,
      pocketAngle: -Math.PI / 2,
      pocketWidth: Math.PI / 8,
    },
    width,
    height,
    frames: 0,
    shake: 0,
    hitStop: 0,
    goalFlash: 0,
    ringBonuses: { MEX: { inner: 0, outer: 0 }, ENG: { inner: 0, outer: 0 } },
    players: [
      ...addTeam("MEX", width / 2 - 120, 35, 1, rand),
      ...addTeam("ENG", width / 2 + 120, 35, -1, rand),
    ],
    lightnings: [],
    goalResetAt: -1,
    goalCooldownUntil: -1,
    simFrame: 0,
    teamStats,
    audioEvents: [],
  };
};

const isAngleInRing = (angle: number, start: number, end: number) => {
  const a = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const s = ((start % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const e = ((end % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  if (s <= e) return a >= s && a <= e;
  return a >= s || a <= e;
};

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
  const count = big ? 25 : 6;
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    const speed = big ? rand() * 10 + 4 : rand() * 4 + 2;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: big ? 20 + rand() * 10 : 10 + rand() * 10,
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
      maxLife: 15,
      size: 40,
      color: color1,
      type: "shockwave",
    });
  }
};

const resetBallPositions = (state: GameState) => {
  const { width, height } = state;
  const arenaCenter = { x: width / 2, y: height / 2 - 10 };

  if (state.balls[0]) {
    state.balls[0].x = arenaCenter.x - BALL_RADIUS;
    state.balls[0].y = arenaCenter.y;
    state.balls[0].vx = 2.0;
    state.balls[0].vy = -1.0;
    state.balls[0].angularVelocity = 0.05;
    state.balls[0].tail = [];
  }
  if (state.balls[1]) {
    state.balls[1].x = arenaCenter.x + BALL_RADIUS;
    state.balls[1].y = arenaCenter.y;
    state.balls[1].vx = -2.0;
    state.balls[1].vy = 1.0;
    state.balls[1].angularVelocity = -0.05;
    state.balls[1].tail = [];
  }
};

const triggerGoal = (
  state: GameState,
  scorerId: string,
  simStep: number,
  compFrame: number,
) => {
  state.shake = 40;
  state.hitStop = 20;
  state.goalFlash = 1.0;
  state.goalResetAt = compFrame + GOAL_RESET_DELAY;
  state.goalCooldownUntil = compFrame + GOAL_RESET_DELAY + 15;

  const b1 = state.balls[0];
  const b2 = state.balls[1];
  spawnSparks(state, state.arena.x, state.arena.y, b1.glowColor, b2.glowColor, true, simStep);

  if (scorerId === "MEX") {
    state.scoreA += 1;
  } else {
    state.scoreB += 1;
  }

  pushAudioEvent(state, compFrame, "goal");
};

const updatePhysics = (state: GameState, simStep: number, compFrame: number) => {
  if (state.status !== "sim") return;

  if (state.goalResetAt >= 0 && compFrame >= state.goalResetAt) {
    resetBallPositions(state);
    state.goalResetAt = -1;
  }

  if (state.hitStop > 0) {
    state.hitStop--;
    return;
  }

  const rand = mulberry32(hashFrame(SIMULATION_SEED, simStep));

  state.arena.pocketAngle += 0.005;
  if (state.arena.pocketAngle > Math.PI * 2) {
    state.arena.pocketAngle -= Math.PI * 2;
  }

  state.timeTicker += 1;
  const simulatedMinute = Math.floor(state.timeTicker / TICKS_PER_MATCH_MINUTE);

  if (simulatedMinute > state.matchMinute && simulatedMinute <= state.matchLength) {
    state.matchMinute = simulatedMinute;
  }

  if (simulatedMinute >= state.matchLength) {
    state.status = "post";
    return;
  }

  const { arena, balls, ringBonuses, players } = state;
  const slowSpin = state.frames * 0.005;

  ringBonuses.MEX.inner *= 0.995;
  ringBonuses.MEX.outer *= 0.995;
  ringBonuses.ENG.inner *= 0.995;
  ringBonuses.ENG.outer *= 0.995;
  ringBonuses.MEX.inner = Math.min(ringBonuses.MEX.inner, INNER_RING_BONUS_CAP);
  ringBonuses.MEX.outer = Math.min(ringBonuses.MEX.outer, INNER_RING_BONUS_CAP);
  ringBonuses.ENG.inner = Math.min(ringBonuses.ENG.inner, INNER_RING_BONUS_CAP);
  ringBonuses.ENG.outer = Math.min(ringBonuses.ENG.outer, INNER_RING_BONUS_CAP);

  const mexStarShare = teamStarShare(
    state.teamStats.mexStarQuality,
    state.teamStats.engStarQuality,
  );
  const engStarShare = teamStarShare(
    state.teamStats.engStarQuality,
    state.teamStats.mexStarQuality,
  );

  players.forEach((p) => {
    if (p.cooldown > 0) {
      p.cooldown--;
      return;
    }

    const starQuality =
      p.team === "MEX"
        ? state.teamStats.mexStarQuality
        : state.teamStats.engStarQuality;
    const defense =
      p.team === "MEX"
        ? state.teamStats.mexDefense
        : state.teamStats.engDefense;

    let dischargeChance = PLAYER_DISCHARGE_BASE_CHANCE;
    if (p.type === "defender" || p.type === "goalkeeper") {
      dischargeChance =
        PLAYER_DISCHARGE_BASE_CHANCE * defenseDischargeWeight(defense);
    }

    if (rand() >= dischargeChance) {
      return;
    }

    p.cooldown = 120 + Math.floor(rand() * 180);
    let targetRing = arena.radius - 10;
    let color = p.team === "MEX" ? "#006847" : "#cf081f";

    if (p.type === "forward") {
      targetRing = arena.radius - 30;
      color = p.team === "MEX" ? "#22c55e" : "#fca5a5";
      const innerFactor = starInnerBonusFactor(starQuality);
      ringBonuses[p.team].inner +=
        (Math.PI * 0.6 - ringBonuses[p.team].inner) * innerFactor;
    } else if (p.type === "defender" || p.type === "goalkeeper") {
      ringBonuses[p.team].outer +=
        (Math.PI * 0.6 - ringBonuses[p.team].outer) * 0.25;
    } else {
      ringBonuses[p.team].inner +=
        (Math.PI * 0.6 - ringBonuses[p.team].inner) * 0.12;
      ringBonuses[p.team].outer +=
        (Math.PI * 0.6 - ringBonuses[p.team].outer) * 0.12;
    }

    const angleToCenter = Math.atan2(arena.y - p.y, arena.x - p.x);
    state.lightnings.push({
      startX: p.x,
      startY: p.y,
      endX: arena.x - Math.cos(angleToCenter) * targetRing,
      endY: arena.y - Math.sin(angleToCenter) * targetRing,
      life: 15,
      maxLife: 15,
      color,
      jitterSeed: hashFrame(SIMULATION_SEED, simStep, p.x),
    });
  });

  state.lightnings = state.lightnings.filter((l) => l.life-- > 0);

  const arcs = getRingArcs(state.teamStats, slowSpin, ringBonuses);

  const mexInnerStart = arcs.mexInnerStart;
  const mexInnerEnd = arcs.mexInnerEnd;
  const engInnerStart = arcs.engInnerStart;
  const engInnerEnd = arcs.engInnerEnd;

  const mexOuterStart = arcs.mexOuterStart;
  const mexOuterEnd = arcs.mexOuterEnd;
  const engOuterStart = arcs.engOuterStart;
  const engOuterEnd = arcs.engOuterEnd;

  const offenseShares = getEffectiveOffenseShares(state.teamStats);
  const mexOffenseShare = offenseShares.mexOffenseShare;
  const engOffenseShare = offenseShares.engOffenseShare;

  balls.forEach((b) => {
    if (b.x < 0) {
      return;
    }

    b.rotation += b.angularVelocity;

    const centerPullX = (arena.x - b.x) * 0.0002;
    const centerPullY = (arena.y - b.y) * 0.0002;
    b.vx += centerPullX + (rand() - 0.5) * 0.05;
    b.vy += centerPullY + (rand() - 0.5) * 0.05;

    const speed = Math.hypot(b.vx, b.vy);
    const offenseShare = b.id === "MEX" ? mexOffenseShare : engOffenseShare;
    const starShare = b.id === "MEX" ? mexStarShare : engStarShare;

    const distToCenterForRings = Math.hypot(b.x - arena.x, b.y - arena.y);
    const angleToCenter = Math.atan2(b.y - arena.y, b.x - arena.x);
    const inMexInner = isAngleInRing(angleToCenter, mexInnerStart, mexInnerEnd);
    const inEngInner = isAngleInRing(angleToCenter, engInnerStart, engInnerEnd);

    if (speed > 0) {
      const speedDiff = BASE_SPEED - speed;
      b.vx += (b.vx / speed) * speedDiff * 0.02;
      b.vy += (b.vy / speed) * speedDiff * 0.02;
    }

    if (
      distToCenterForRings > arena.radius - 50 &&
      distToCenterForRings < arena.radius - 10
    ) {
      if (inMexInner && !inEngInner) {
        if (b.id === "MEX") {
          const mult =
            ringBoostFromShare(mexOffenseShare) *
            starInnerBoostMultiplier(mexStarShare);
          b.vx *= mult;
          b.vy *= mult;
        } else {
          const mult =
            ringSlowFromShare(mexOffenseShare) *
            starInnerSlowMultiplier(mexStarShare);
          b.vx *= mult;
          b.vy *= mult;
        }
      } else if (inEngInner && !inMexInner) {
        if (b.id === "ENG") {
          const mult =
            ringBoostFromShare(engOffenseShare) *
            starInnerBoostMultiplier(engStarShare);
          b.vx *= mult;
          b.vy *= mult;
        } else {
          const mult =
            ringSlowFromShare(engOffenseShare) *
            starInnerSlowMultiplier(engStarShare);
          b.vx *= mult;
          b.vy *= mult;
        }
      }
    }

    const pAngle = arena.pocketAngle;
    let pocketAngleDiff = Math.abs(angleToCenter - pAngle) % (Math.PI * 2);
    if (pocketAngleDiff > Math.PI) pocketAngleDiff = Math.PI * 2 - pocketAngleDiff;
    const nearPocket =
      distToCenterForRings > arena.radius - 28 &&
      pocketAngleDiff < arena.pocketWidth / 2;

    if (nearPocket) {
      const pocketNx = Math.cos(pAngle);
      const pocketNy = Math.sin(pAngle);
      const radialOut = b.vx * pocketNx + b.vy * pocketNy;
      if (radialOut > 0.15) {
        const currentSpeed = Math.hypot(b.vx, b.vy);
        const punch =
          pocketPunchFromShare(offenseShare, currentSpeed, MAX_SPEED) +
          pocketPunchFromStar(starShare, currentSpeed, MAX_SPEED);
        b.vx += pocketNx * punch;
        b.vy += pocketNy * punch;
      }
    }

    const newSpeed = Math.hypot(b.vx, b.vy);
    if (newSpeed > MAX_SPEED) {
      b.vx = (b.vx / newSpeed) * MAX_SPEED;
      b.vy = (b.vy / newSpeed) * MAX_SPEED;
    } else if (newSpeed < MIN_SPEED) {
      b.vx = (b.vx / newSpeed) * MIN_SPEED;
      b.vy = (b.vy / newSpeed) * MIN_SPEED;
    }

    b.x += b.vx;
    b.y += b.vy;

    b.tail.unshift({ x: b.x, y: b.y });
    if (b.tail.length > 30) b.tail.pop();

    const distToCenter = Math.hypot(b.x - arena.x, b.y - arena.y);
    if (distToCenter + b.radius > arena.radius) {
      const angleToCenter = Math.atan2(b.y - arena.y, b.x - arena.x);

      let inPocket = false;
      const normAngle = angleToCenter;
      const pAngle = arena.pocketAngle;
      let angleDiff = Math.abs(normAngle - pAngle) % (Math.PI * 2);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

      if (angleDiff < arena.pocketWidth / 2) {
        inPocket = true;
      }

      if (inPocket) {
        let blocked = false;
        if (b.id === "MEX") {
          if (isAngleInRing(normAngle, engOuterStart, engOuterEnd)) {
            blocked = true;
          }
        } else if (b.id === "ENG") {
          if (isAngleInRing(normAngle, mexOuterStart, mexOuterEnd)) {
            blocked = true;
          }
        }

        if (blocked) {
          inPocket = false;
          spawnSparks(state, b.x, b.y, b.glowColor, "#ffffff", false, simStep);
          pushAudioEvent(state, compFrame, "block");
        }
      }

      if (inPocket && compFrame >= state.goalCooldownUntil) {
        const rimSpeed = Math.hypot(b.vx, b.vy);
        const penetrate =
          goalPenetrationFromShare(offenseShare, rimSpeed, MAX_SPEED) +
          goalPenetrationFromStar(starShare, rimSpeed, MAX_SPEED);
        const goalLine = arena.radius + b.radius * (1 - penetrate);
        if (distToCenter > goalLine) {
          b.vx = 0;
          b.vy = 0;
          triggerGoal(state, b.id, simStep, compFrame);
          b.x = -1000;
          b.y = -1000;
          return;
        }
      } else if (distToCenter + b.radius > arena.radius) {
        const trueNx = (b.x - arena.x) / distToCenter;
        const trueNy = (b.y - arena.y) / distToCenter;

        const overlap = distToCenter + b.radius - arena.radius;
        b.x -= trueNx * overlap;
        b.y -= trueNy * overlap;

        const angle = Math.atan2(trueNy, trueNx) + (rand() - 0.5) * 0.1;
        const nx = Math.cos(angle);
        const ny = Math.sin(angle);

        const dot = b.vx * nx + b.vy * ny;
        b.vx = b.vx - 2 * dot * nx;
        b.vy = b.vy - 2 * dot * ny;

        spawnSparks(
          state,
          b.x + nx * b.radius,
          b.y + ny * b.radius,
          b.glowColor,
          "#ffffff",
          false,
          simStep,
        );
        state.shake = 1;
        pushAudioEvent(state, compFrame, "hit", hitVolume(0.5));
      }
    }
  });

  const b1 = balls[0];
  const b2 = balls[1];
  const dx = b2.x - b1.x;
  const dy = b2.y - b1.y;
  const dist = Math.hypot(dx, dy);

  if (dist < b1.radius + b2.radius) {
    const overlap = (b1.radius + b2.radius - dist) / 2;
    const nx = dx / dist;
    const ny = dy / dist;

    b1.x -= nx * overlap;
    b1.y -= ny * overlap;
    b2.x += nx * overlap;
    b2.y += ny * overlap;

    const dvx = b2.vx - b1.vx;
    const dvy = b2.vy - b1.vy;
    const nv = dvx * nx + dvy * ny;

    if (nv < 0) {
      pushAudioEvent(state, compFrame, "hit", hitVolume(Math.abs(nv) * 0.2));

      const restitution = 1.0;
      const impulse = (-(1 + restitution) * nv) / 2;

      b1.vx -= impulse * nx;
      b1.vy -= impulse * ny;
      b2.vx += impulse * nx;
      b2.vy += impulse * ny;

      b1.angularVelocity = (b1.angularVelocity + (rand() - 0.5) * 0.1) * 0.95;
      b2.angularVelocity = (b2.angularVelocity + (rand() - 0.5) * 0.1) * 0.95;

      spawnSparks(
        state,
        b1.x + nx * b1.radius,
        b1.y + ny * b1.radius,
        b1.glowColor,
        b2.glowColor,
        true,
        simStep,
      );

      const impactForce = Math.abs(impulse);
      state.shake = Math.min(8, impactForce * 1.5);

      if (impactForce > 6) {
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

    if (p.type === "spark") {
      p.vx *= 0.96;
      p.vy *= 0.96;
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
    state.matchMinute = 0;
    state.scoreA = 0;
    state.scoreB = 0;
    state.simFrame = 0;
  }

  if (state.status === "post") {
    return;
  }

  for (let substep = 0; substep < PHYSICS_SUBSTEPS; substep++) {
    if (state.status !== "sim") {
      break;
    }

    const simStep = state.frames;
    updatePhysics(state, simStep, absoluteFrame);
    updateParticles(state, simStep);

    if (state.goalFlash > 0) {
      state.goalFlash -= 0.03;
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
  teamStats: TeamStats,
  endFrame: number,
) => {
  const state = createInitialState(LOGICAL_WIDTH, ARENA_HEIGHT, teamStats);
  for (let f = 0; f <= endFrame; f++) {
    tickSimulation(state, f);
  }
  return state.audioEvents;
};

export const simulateToFrame = (
  targetFrame: number,
  width = LOGICAL_WIDTH,
  height: number,
  teamStats: TeamStats = defaultTeamStats,
): GameState => {
  const state = createInitialState(width, height, teamStats);

  for (let f = 0; f <= targetFrame; f++) {
    tickSimulation(state, f);
  }

  return state;
};

export const getMatchDurationFrames = (): number => {
  const state = createInitialState(LOGICAL_WIDTH, 636, defaultTeamStats);
  return (
    PRE_DURATION_FRAMES +
    state.matchLength * FRAMES_PER_MATCH_MINUTE +
    POST_DURATION_FRAMES
  );
};

export const MATCH_SIM_DURATION = getMatchDurationFrames();
