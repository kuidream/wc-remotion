import { useRef } from "react";
import { useCurrentFrame } from "remotion";
import {
  ARENA_HEIGHT,
  LOGICAL_WIDTH,
  PRE_DURATION_FRAMES,
  VIDEO_FPS,
} from "./constants";
import { createInitialState, tickSimulation } from "./simulation";
import type { AssetStats } from "./asset-stats";
import type { GameState } from "./types";

const getStatsKey = (assetStats: AssetStats) =>
  `${assetStats.btcSharpe}-${assetStats.ethSharpe}-${assetStats.btcSortino}-${assetStats.ethSortino}-${assetStats.btcRsq}-${assetStats.ethRsq}-${assetStats.btcTtr}-${assetStats.ethTtr}-${assetStats.assetAName}-${assetStats.assetBName}`;

export const useQuantArenaState = (assetStats: AssetStats): GameState => {
  const frame = useCurrentFrame();
  const cacheRef = useRef<{
    state: GameState;
    lastFrame: number;
    statsKey: string;
  } | null>(null);
  const statsKey = getStatsKey(assetStats);

  if (
    !cacheRef.current ||
    frame < cacheRef.current.lastFrame ||
    cacheRef.current.statsKey !== statsKey
  ) {
    const state = createInitialState(LOGICAL_WIDTH, ARENA_HEIGHT, assetStats);
    for (let f = 0; f <= frame; f++) {
      tickSimulation(state, f);
    }
    cacheRef.current = { state, lastFrame: frame, statsKey };
  } else if (frame > cacheRef.current.lastFrame) {
    for (let f = cacheRef.current.lastFrame + 1; f <= frame; f++) {
      tickSimulation(cacheRef.current.state, f);
    }
    cacheRef.current.lastFrame = frame;
  }

  return cacheRef.current.state;
};

export const useOverlayOpacity = (status: GameState["status"]) => {
  const frame = useCurrentFrame();

  if (status === "pre") {
    const fadeFrames = Math.round(0.5 * VIDEO_FPS);
    const fadeStart = PRE_DURATION_FRAMES - fadeFrames;
    if (frame >= fadeStart) {
      return Math.max(0, 1 - (frame - fadeStart) / fadeFrames);
    }
    return 1;
  }

  if (status === "post") {
    return 1;
  }

  return 0;
};
