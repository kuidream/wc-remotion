import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  ARENA_HEIGHT,
  LOGICAL_WIDTH,
  VIDEO_HEIGHT,
  VIDEO_SCALE,
  VIDEO_WIDTH,
} from "./constants";
import { drawGameCanvas, getShakeOffset } from "./draw-canvas";
import { MatchSimAudio } from "./MatchSimAudio";
import {
  MatchSimHeader,
  MatchSimOverlay,
  MatchSimScoreBar,
  MatchSimStatsPanel,
  PhoneFrame,
} from "./MatchSimUI";
import type { MatchSimProps } from "./schema";
import { MATCH_SIM_DURATION, collectAudioEvents } from "./simulation";
import { resolveTeamStats } from "./team-stats";
import { useMatchSimState } from "./useMatchSimState";

export const MatchSimVideo: React.FC<MatchSimProps> = (props) => {
  const teamStats = useMemo(() => resolveTeamStats(props), [props]);
  const audioEvents = useMemo(
    () => collectAudioEvents(teamStats, MATCH_SIM_DURATION - 1),
    [teamStats],
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flagsRef = useRef<{
    mx: HTMLImageElement | null;
    eng: HTMLImageElement | null;
  }>({ mx: null, eng: null });
  const frame = useCurrentFrame();
  const state = useMatchSimState(teamStats);

  useEffect(() => {
    const imgMx = new Image();
    imgMx.crossOrigin = "anonymous";
    imgMx.src = "https://flagcdn.com/w160/mx.png";
    imgMx.onload = () => {
      flagsRef.current.mx = imgMx;
    };

    const imgEng = new Image();
    imgEng.crossOrigin = "anonymous";
    imgEng.src = "https://flagcdn.com/w160/gb-eng.png";
    imgEng.onload = () => {
      flagsRef.current.eng = imgEng;
    };
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = LOGICAL_WIDTH;
    canvas.height = ARENA_HEIGHT;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const shakeOffset = getShakeOffset(state, frame);
    drawGameCanvas(ctx, state, flagsRef.current, shakeOffset);
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
      <MatchSimAudio events={audioEvents} />
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
            <MatchSimHeader />
            <MatchSimScoreBar state={state} />

            <div className="relative flex-grow w-full overflow-hidden" style={{ background: "transparent" }}>
              <canvas
                ref={canvasRef}
                className="block w-full h-full"
                style={{
                  width: LOGICAL_WIDTH * VIDEO_SCALE,
                  height: ARENA_HEIGHT * VIDEO_SCALE,
                }}
              />
              <MatchSimStatsPanel teamStats={teamStats} />
              <MatchSimOverlay state={state} />
            </div>
          </div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};
