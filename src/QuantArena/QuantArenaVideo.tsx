import React, { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  ARENA_HEIGHT,
  LOGICAL_WIDTH,
  VIDEO_HEIGHT,
  VIDEO_SCALE,
  VIDEO_WIDTH,
} from "./constants";
import { drawGameCanvas, getShakeOffset } from "./draw-canvas";
import { QuantArenaAudio } from "./QuantArenaAudio";
import {
  PhoneFrame,
  QuantArenaHeader,
  QuantArenaOverlay,
  QuantArenaScoreBar,
  QuantArenaStatsPanel,
} from "./QuantArenaUI";
import type { QuantArenaProps } from "./schema";
import { QUANT_ARENA_DURATION, collectAudioEvents } from "./simulation";
import { resolveAssetStats } from "./asset-stats";
import { useQuantArenaState } from "./useQuantArenaState";

export const QuantArenaVideo: React.FC<QuantArenaProps> = (props) => {
  const assetStats = useMemo(() => resolveAssetStats(props), [props]);
  const audioEvents = useMemo(
    () => collectAudioEvents(assetStats, QUANT_ARENA_DURATION - 1),
    [assetStats],
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const state = useQuantArenaState(assetStats);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = LOGICAL_WIDTH;
    canvas.height = ARENA_HEIGHT;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const shakeOffset = getShakeOffset(state, frame);
    drawGameCanvas(ctx, state, shakeOffset);
  }, [state, frame]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <QuantArenaAudio events={audioEvents} />
      <div
        style={{
          width: VIDEO_WIDTH,
          height: VIDEO_HEIGHT,
        }}
      >
        <PhoneFrame>
          <div
            className="relative w-full h-full font-sans flex flex-col overflow-hidden select-none"
            style={{ height: VIDEO_HEIGHT, background: "transparent" }}
          >
            <QuantArenaHeader />
            <QuantArenaScoreBar state={state} />

            <div
              className="relative flex-grow w-full overflow-hidden"
              style={{ background: "transparent" }}
            >
              <canvas
                ref={canvasRef}
                className="block w-full h-full"
                style={{
                  width: LOGICAL_WIDTH * VIDEO_SCALE,
                  height: ARENA_HEIGHT * VIDEO_SCALE,
                }}
              />
              <QuantArenaStatsPanel assetStats={assetStats} />
              <QuantArenaOverlay state={state} />
            </div>
          </div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};
