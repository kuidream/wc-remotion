export const LOGICAL_WIDTH = 448;
export const HEADER_HEIGHT = 144;
export const SCORE_HEIGHT = 64;
export const LOGICAL_HEIGHT = 844;
export const ARENA_HEIGHT = LOGICAL_HEIGHT - HEADER_HEIGHT - SCORE_HEIGHT;

export const VIDEO_SCALE = 2;
export const VIDEO_WIDTH = LOGICAL_WIDTH * VIDEO_SCALE;
export const VIDEO_HEIGHT = LOGICAL_HEIGHT * VIDEO_SCALE;
export const VIDEO_FPS = 60;

export const ARENA_MARGIN = 40;
export const BALL_RADIUS = 18;
export const MIN_SPEED = 1.0;

export const SIM_YEARS = 60;
export const TICKS_PER_YEAR = 60;
export const PHYSICS_SUBSTEPS = 1;
export const FRAMES_PER_YEAR = TICKS_PER_YEAR / PHYSICS_SUBSTEPS;

export const PRE_DURATION_SECONDS = 2.5;
export const POST_DURATION_SECONDS = 3.5;
export const PRE_DURATION_FRAMES = Math.round(PRE_DURATION_SECONDS * VIDEO_FPS);
export const POST_DURATION_FRAMES = Math.round(POST_DURATION_SECONDS * VIDEO_FPS);

export const SIMULATION_SEED = 77;

// 动力学 demo 量纲参考（arenaRadius=290）
export const DEMO_ARENA_RADIUS = 290;
export const DEMO_CHASE_ACCEL = 0.2;
export const DEMO_WALL_BOUNCE = 0.8;
export const DEMO_RESTITUTION = 0.8;
export const DEMO_STUN_DAMPING = 0.9;

export const getArenaScale = (arenaRadius: number) =>
  arenaRadius / DEMO_ARENA_RADIUS;

export const INITIAL_WEALTH = 10000;
// 乘法规则：吃收益 / 撞风险按净值比例变动
export const BASE_YIELD_RATE = 0.022;
export const BASE_RISK_RATE = 0.038;
export const SORTINO_REF = 10;
export const TTR_REF = 150;

export const COIN_RADIUS = 7;
export const MAX_COINS = 5;
export const COIN_SPAWN_INTERVAL = 45;

export const HAZARD_SPAWN_INTERVAL = 180;
export const MAX_HAZARDS = 2;
export const HAZARD_LIFETIME = 240;
export const HAZARD_MIN_W = 34;
export const HAZARD_MAX_W = 46;
export const HAZARD_MIN_H = 20;
export const HAZARD_MAX_H = 28;

// 球间软斥力：在接触半径外就开始推开，避免缠绕
export const BALL_SOFT_SEP_RATIO = 4.2;
export const BALL_SOFT_REPULSE = 0.14;
export const BALL_HARD_SEP_BOOST = 1.35;

export const INDEX_RADIUS = 28;
