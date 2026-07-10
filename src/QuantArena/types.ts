import type { AssetStats, PhysicsProfile } from "./asset-stats";

export interface Ball {
  id: "BTC" | "ETH";
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  angularVelocity: number;
  color: string;
  glowColor: string;
  coreColor: string;
  label: string;
  mass: number;
  maxSpeed: number;
  accel: number;
  stunFrames: number;
  stunDamping: number;
  gravityPull: number;
  yieldRate: number;
  riskRate: number;
  stun: number;
  tail: { x: number; y: number }[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: "spark" | "spore" | "flash" | "shockwave" | "coinBurst";
}

export interface Coin {
  id: number;
  x: number;
  y: number;
  life: number;
  pulse: number;
}

export interface Hazard {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  life: number;
  maxLife: number;
  angle: number;
}

export interface IndexField {
  x: number;
  y: number;
  angle: number;
  radius: number;
}

export interface Arena {
  x: number;
  y: number;
  radius: number;
}

export type MatchStatus = "pre" | "sim" | "post";

export type AudioEventType = "hit" | "collect" | "hazard";

export interface AudioEvent {
  frame: number;
  type: AudioEventType;
  intensity?: number;
}

export interface GameState {
  status: MatchStatus;
  timeTicker: number;
  scoreA: number;
  scoreB: number;
  simYears: number;
  year: number;
  balls: Ball[];
  particles: Particle[];
  coins: Coin[];
  hazards: Hazard[];
  indexField: IndexField;
  arena: Arena;
  width: number;
  height: number;
  frames: number;
  shake: number;
  hitStop: number;
  collectFlash: number;
  coinSpawnTimer: number;
  hazardSpawnTimer: number;
  nextCoinId: number;
  nextHazardId: number;
  simFrame: number;
  assetStats: AssetStats;
  profiles: { BTC: PhysicsProfile; ETH: PhysicsProfile };
  audioEvents: AudioEvent[];
}
