import type { ReactNode } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import {
  HEADER_HEIGHT,
  LOGICAL_WIDTH,
  SCORE_HEIGHT,
  SIM_YEARS,
  VIDEO_SCALE,
} from "./constants";
import { formatMetric, formatWealth, type AssetStats } from "./asset-stats";
import type { GameState } from "./types";
import { useOverlayOpacity } from "./useQuantArenaState";

const AssetBadge = ({
  label,
  color,
  glowColor,
}: {
  label: string;
  color: string;
  glowColor: string;
}) => (
  <div
    className="relative rounded-full overflow-hidden border border-white/15 flex items-center justify-center font-black text-white"
    style={{
      width: 40 * VIDEO_SCALE,
      height: 40 * VIDEO_SCALE,
      background: `linear-gradient(145deg, ${color}, #111827)`,
      boxShadow: `0 0 15px ${glowColor}`,
      fontSize: 14 * VIDEO_SCALE,
    }}
  >
    {label}
    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent mix-blend-overlay" />
  </div>
);

export const QuantArenaHeader = () => (
  <div
    className="relative w-full shrink-0 flex overflow-hidden"
    style={{
      height: HEADER_HEIGHT * VIDEO_SCALE,
      boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
      zIndex: 20,
    }}
  >
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(to bottom, rgba(6, 21, 48, 0.72), rgba(2, 5, 10, 0.72))",
        backdropFilter: `blur(${6 * VIDEO_SCALE}px)`,
      }}
    />

    <div
      className="absolute rounded-full mix-blend-screen"
      style={{
        top: -40 * VIDEO_SCALE,
        left: -40 * VIDEO_SCALE,
        width: 160 * VIDEO_SCALE,
        height: 160 * VIDEO_SCALE,
        background: "rgba(247, 147, 26, 0.22)",
        filter: `blur(${40 * VIDEO_SCALE}px)`,
      }}
    />
    <div
      className="absolute rounded-full mix-blend-screen"
      style={{
        top: -40 * VIDEO_SCALE,
        right: -40 * VIDEO_SCALE,
        width: 160 * VIDEO_SCALE,
        height: 160 * VIDEO_SCALE,
        background: "rgba(98, 126, 234, 0.22)",
        filter: `blur(${40 * VIDEO_SCALE}px)`,
      }}
    />

    <div
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
        backgroundSize: `${15 * VIDEO_SCALE}px ${15 * VIDEO_SCALE}px`,
      }}
    />

    <div className="absolute inset-0 flex flex-col items-center justify-center z-30 text-center pointer-events-none">
      <div
        className="text-white/50 uppercase tracking-[0.35em]"
        style={{ fontSize: 9 * VIDEO_SCALE, marginBottom: 6 * VIDEO_SCALE }}
      >
        QUANT COLLISION ARENA
      </div>
      <div
        className="font-black text-white tracking-wide"
        style={{
          fontSize: 22 * VIDEO_SCALE,
          textShadow: "0 0 18px rgba(255,255,255,0.25)",
        }}
      >
        60年量化角斗场
      </div>
      <div
        className="text-white/55"
        style={{ fontSize: 10 * VIDEO_SCALE, marginTop: 6 * VIDEO_SCALE }}
      >
        夏普=速度 · 索提诺=质量 · TTR=硬直 · 拟合=引力
      </div>
    </div>
  </div>
);

export const QuantArenaScoreBar = ({ state }: { state: GameState }) => (
  <div
    className="w-full border-b border-gray-800/60 flex items-center justify-center shrink-0 relative"
    style={{
      height: SCORE_HEIGHT * VIDEO_SCALE,
      zIndex: 30,
      boxShadow: "0 5px 20px rgba(0,0,0,0.5)",
      background:
        "linear-gradient(to bottom, rgba(10, 10, 10, 0.72), rgba(5, 5, 5, 0.72))",
      backdropFilter: `blur(${6 * VIDEO_SCALE}px)`,
    }}
  >
    <div className="flex items-center z-10" style={{ gap: 16 * VIDEO_SCALE }}>
      <AssetBadge
        label="B"
        color="#f7931a"
        glowColor="rgba(247,147,26,0.45)"
      />

      <span
        className="font-black text-white text-center tabular-nums"
        style={{
          fontSize: 22 * VIDEO_SCALE,
          minWidth: 72 * VIDEO_SCALE,
          textShadow: "0 2px 4px rgba(0,0,0,0.8)",
        }}
      >
        {formatWealth(state.scoreA)}
      </span>

      <span
        className="font-black text-[#ff6600] text-center tracking-tighter"
        style={{
          fontSize: 20 * VIDEO_SCALE,
          width: 72 * VIDEO_SCALE,
          textShadow: "0 0 12px rgba(255,100,0,0.8)",
        }}
      >
        Y{state.year}/{SIM_YEARS}
      </span>

      <span
        className="font-black text-white text-center tabular-nums"
        style={{
          fontSize: 22 * VIDEO_SCALE,
          minWidth: 72 * VIDEO_SCALE,
          textShadow: "0 2px 4px rgba(0,0,0,0.8)",
        }}
      >
        {formatWealth(state.scoreB)}
      </span>

      <AssetBadge
        label="E"
        color="#627eea"
        glowColor="rgba(98,126,234,0.45)"
      />
    </div>
  </div>
);

export const QuantArenaStatsPanel = ({
  assetStats,
}: {
  assetStats: AssetStats;
}) => (
  <div
    className="absolute left-0 right-0 z-30 flex justify-center pointer-events-none"
    style={{
      bottom: 12 * VIDEO_SCALE,
      paddingLeft: 12 * VIDEO_SCALE,
      paddingRight: 12 * VIDEO_SCALE,
      gap: 10 * VIDEO_SCALE,
    }}
  >
    <div
      className="flex-1 border border-white/15 text-left"
      style={{
        borderRadius: 6 * VIDEO_SCALE,
        padding: `${10 * VIDEO_SCALE}px ${12 * VIDEO_SCALE}px`,
        maxWidth: 200 * VIDEO_SCALE,
        background: "rgba(0, 0, 0, 0.42)",
        backdropFilter: `blur(${10 * VIDEO_SCALE}px)`,
      }}
    >
      <div
        className="font-bold"
        style={{
          fontSize: 13 * VIDEO_SCALE,
          marginBottom: 6 * VIDEO_SCALE,
          color: "#fbbf24",
        }}
      >
        {assetStats.assetAName}
      </div>
      <div
        className="text-white/90"
        style={{ fontSize: 10 * VIDEO_SCALE, lineHeight: 1.55 }}
      >
        <div>夏普: {formatMetric(assetStats.btcSharpe)}</div>
        <div>索提诺: {formatMetric(assetStats.btcSortino)}</div>
        <div>拟合: {formatMetric(assetStats.btcRsq, 1)}%</div>
        <div>TTR: {assetStats.btcTtr}天</div>
      </div>
    </div>

    <div
      className="flex-1 border border-white/15 text-right"
      style={{
        borderRadius: 6 * VIDEO_SCALE,
        padding: `${10 * VIDEO_SCALE}px ${12 * VIDEO_SCALE}px`,
        maxWidth: 200 * VIDEO_SCALE,
        background: "rgba(0, 0, 0, 0.42)",
        backdropFilter: `blur(${10 * VIDEO_SCALE}px)`,
      }}
    >
      <div
        className="font-bold"
        style={{
          fontSize: 13 * VIDEO_SCALE,
          marginBottom: 6 * VIDEO_SCALE,
          color: "#a5b4fc",
        }}
      >
        {assetStats.assetBName}
      </div>
      <div
        className="text-white/90"
        style={{ fontSize: 10 * VIDEO_SCALE, lineHeight: 1.55 }}
      >
        <div>夏普: {formatMetric(assetStats.ethSharpe)}</div>
        <div>索提诺: {formatMetric(assetStats.ethSortino)}</div>
        <div>拟合: {formatMetric(assetStats.ethRsq, 1)}%</div>
        <div>TTR: {assetStats.ethTtr}天</div>
      </div>
    </div>
  </div>
);

export const QuantArenaOverlay = ({ state }: { state: GameState }) => {
  const frame = useCurrentFrame();
  const opacity = useOverlayOpacity(state.status);

  if (opacity <= 0) return null;

  if (state.status === "pre") {
    const buttonGlow = interpolate(frame, [0, 30], [0.4, 0.65], {
      extrapolateRight: "clamp",
    });

    return (
      <div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center"
        style={{
          background: "rgba(0,0,0,0.6)",
          backdropFilter: `blur(${12 * VIDEO_SCALE}px)`,
          opacity,
        }}
      >
        <div
          className="text-white/70 uppercase tracking-[0.3em]"
          style={{ fontSize: 11 * VIDEO_SCALE, marginBottom: 18 * VIDEO_SCALE }}
        >
          BTC vs ETH
        </div>
        <div
          className="text-white font-black tracking-widest uppercase border border-cyan-300"
          style={{
            padding: `${16 * VIDEO_SCALE}px ${40 * VIDEO_SCALE}px`,
            background: "linear-gradient(to right, #b45309, #2563eb, #4f46e5)",
            borderRadius: 2 * VIDEO_SCALE,
            boxShadow: `0 0 ${30 * VIDEO_SCALE}px rgba(0,255,255,${buttonGlow})`,
            transform: "skewX(-12deg)",
            fontSize: 13 * VIDEO_SCALE,
          }}
        >
          <span
            className="inline-block"
            style={{
              transform: "skewX(12deg)",
              textShadow: "0 0 8px rgba(255,255,255,0.8)",
            }}
          >
            Start Arena
          </span>
        </div>
      </div>
    );
  }

  if (state.status === "post") {
    const winner =
      state.scoreA === state.scoreB
        ? "平局"
        : state.scoreA > state.scoreB
          ? `${state.assetStats.assetAName} 胜出`
          : `${state.assetStats.assetBName} 胜出`;

    return (
      <div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center"
        style={{
          background: "rgba(0,0,0,0.8)",
          backdropFilter: `blur(${24 * VIDEO_SCALE}px)`,
          opacity,
        }}
      >
        <h2
          className="font-black tracking-[0.25em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500"
          style={{
            fontSize: 28 * VIDEO_SCALE,
            marginBottom: 16 * VIDEO_SCALE,
            textShadow: "0 0 20px rgba(255,255,255,0.35)",
          }}
        >
          60年终局
        </h2>
        <div
          className="text-white font-bold"
          style={{
            fontSize: 18 * VIDEO_SCALE,
            marginBottom: 10 * VIDEO_SCALE,
          }}
        >
          {winner}
        </div>
        <div
          className="text-white/70"
          style={{ fontSize: 14 * VIDEO_SCALE, marginBottom: 28 * VIDEO_SCALE }}
        >
          {formatWealth(state.scoreA)} - {formatWealth(state.scoreB)}
        </div>
        <div
          className="text-gray-300 font-bold tracking-[0.2em] uppercase border border-gray-600"
          style={{
            padding: `${12 * VIDEO_SCALE}px ${36 * VIDEO_SCALE}px`,
            background: "#0a0a0a",
            borderRadius: 2 * VIDEO_SCALE,
            transform: "skewX(-12deg)",
            fontSize: 11 * VIDEO_SCALE,
          }}
        >
          <span className="inline-block" style={{ transform: "skewX(12deg)" }}>
            Replay
          </span>
        </div>
      </div>
    );
  }

  return null;
};

export const PhoneFrame = ({ children }: { children: ReactNode }) => (
  <div
    className="w-full h-full flex items-center justify-center"
    style={{ width: LOGICAL_WIDTH * VIDEO_SCALE }}
  >
    <div
      className="w-full h-full relative overflow-hidden border-x border-zinc-800/40"
      style={{
        maxWidth: LOGICAL_WIDTH * VIDEO_SCALE,
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
        background: "rgba(0, 0, 0, 0.35)",
        backdropFilter: `blur(${4 * VIDEO_SCALE}px)`,
      }}
    >
      {children}
    </div>
  </div>
);
