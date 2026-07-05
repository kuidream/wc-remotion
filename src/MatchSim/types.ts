import type { TeamStats } from "./team-stats";

export interface Ball {
  id: string;
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
  team: string;
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
  type: "spark" | "spore" | "flash" | "shockwave";
}

export interface Player {
  id: string;
  team: "MEX" | "ENG";
  type: "goalkeeper" | "defender" | "midfielder" | "forward";
  x: number;
  y: number;
  charge: number;
  cooldown: number;
}

export interface Lightning {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  life: number;
  maxLife: number;
  color: string;
  jitterSeed: number;
}

export interface Arena {
  x: number;
  y: number;
  radius: number;
  pocketAngle: number;
  pocketWidth: number;
}

export type MatchStatus = "pre" | "sim" | "post";

export type AudioEventType = "hit" | "block" | "goal";

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
  matchLength: number;
  injuryTime: number;
  matchMinute: number;
  balls: Ball[];
  particles: Particle[];
  arena: Arena;
  width: number;
  height: number;
  frames: number;
  shake: number;
  hitStop: number;
  goalFlash: number;
  ringBonuses: {
    MEX: { inner: number; outer: number };
    ENG: { inner: number; outer: number };
  };
  players: Player[];
  lightnings: Lightning[];
  goalResetAt: number;
  goalCooldownUntil: number;
  simFrame: number;
  teamStats: TeamStats;
  audioEvents: AudioEvent[];
}
