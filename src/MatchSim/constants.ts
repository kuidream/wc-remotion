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
export const MAX_SPEED = 6.5;
export const MIN_SPEED = 1.5;
export const BALL_RADIUS = 20;
export const BASE_SPEED = 3.0;

export const PRE_DURATION_SECONDS = 2;
export const POST_DURATION_SECONDS = 3;
export const PRE_DURATION_FRAMES = PRE_DURATION_SECONDS * VIDEO_FPS;
export const POST_DURATION_FRAMES = POST_DURATION_SECONDS * VIDEO_FPS;

// demo: 每 30 个 tick（60 tick/s）= 1 比赛分钟
export const TICKS_PER_MATCH_MINUTE = 30;
// 60fps 合成，每帧 1 次物理步进 = 60 tick/s
export const PHYSICS_SUBSTEPS = 1;
export const FRAMES_PER_MATCH_MINUTE =
  TICKS_PER_MATCH_MINUTE / PHYSICS_SUBSTEPS;
export const GOAL_RESET_DELAY = VIDEO_FPS;

export const SIMULATION_SEED = 42;