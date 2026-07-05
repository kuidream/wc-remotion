import { Img, interpolate, useCurrentFrame } from "remotion";
import {
  HEADER_HEIGHT,
  LOGICAL_WIDTH,
  SCORE_HEIGHT,
  VIDEO_SCALE,
} from "./constants";
import type { GameState } from "./types";
import { formatPercent, type TeamStats } from "./team-stats";
import { useOverlayOpacity } from "./useMatchSimState";
import { REGULATION_MINUTES } from "./constants";

const formatMatchMinute = (minute: number) => {
  if (minute <= REGULATION_MINUTES) return `${minute}'`;
  return `90+${minute - REGULATION_MINUTES}'`;
};

const FlagBadge = ({ src, alt, glowColor }: { src: string; alt: string; glowColor: string }) => (
  <div
    className="relative rounded-full overflow-hidden border border-white/10"
    style={{
      width: 40 * VIDEO_SCALE,
      height: 40 * VIDEO_SCALE,
      boxShadow: `0 0 15px ${glowColor}`,
    }}
  >
    <Img
      src={src}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.3)",
      }}
    />
    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/50 to-transparent mix-blend-overlay" />
    <div
      className="absolute inset-0 rounded-full"
      style={{ boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.6)" }}
    />
    <div className="absolute top-[5%] left-[15%] w-1/2 h-1/3 bg-gradient-to-b from-white/60 to-transparent rounded-full blur-[1px]" />
  </div>
);

export const MatchSimHeader = () => (
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
        background: "rgba(34, 211, 238, 0.2)",
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
        background: "rgba(244, 114, 182, 0.2)",
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

    <div className="absolute inset-0 flex flex-col items-center justify-start z-30 pt-2 text-center pointer-events-none">
      <div
        className="flex items-center justify-center opacity-60"
        style={{ gap: 40 * VIDEO_SCALE, marginTop: 4 * VIDEO_SCALE }}
      >
        <div className="flex items-center" style={{ gap: 8 * VIDEO_SCALE }}>
          <div
            style={{
              width: 12 * VIDEO_SCALE,
              height: 2 * VIDEO_SCALE,
              background: "#006847",
              boxShadow: "0 0 5px #006847",
            }}
          />
          <span
            className="text-white/80 uppercase tracking-wider"
            style={{ fontSize: 9 * VIDEO_SCALE }}
          >
            MEX DEFENSE
          </span>
        </div>
        <div className="flex items-center" style={{ gap: 8 * VIDEO_SCALE }}>
          <span
            className="text-white/80 uppercase tracking-wider"
            style={{ fontSize: 9 * VIDEO_SCALE }}
          >
            ENG DEFENSE
          </span>
          <div
            style={{
              width: 12 * VIDEO_SCALE,
              height: 2 * VIDEO_SCALE,
              background: "#cf081f",
              boxShadow: "0 0 5px #cf081f",
            }}
          />
        </div>
      </div>
    </div>
  </div>
);

export const MatchSimScoreBar = ({ state }: { state: GameState }) => (
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
    <div className="flex items-center z-10" style={{ gap: 32 * VIDEO_SCALE }}>
      <FlagBadge
        src="https://flagcdn.com/w160/mx.png"
        alt="Mexico"
        glowColor="rgba(0,104,71,0.45)"
      />

      <span
        className="font-black text-white text-center"
        style={{
          fontSize: 36 * VIDEO_SCALE,
          width: 40 * VIDEO_SCALE,
          textShadow: "0 2px 4px rgba(0,0,0,0.8)",
        }}
      >
        {state.scoreA}
      </span>

      <span
        className="font-black text-[#ff6600] text-center tracking-tighter"
        style={{
          fontSize: 28 * VIDEO_SCALE,
          width: 64 * VIDEO_SCALE,
          textShadow: "0 0 12px rgba(255,100,0,0.8)",
        }}
      >
        {formatMatchMinute(state.matchMinute)}
      </span>

      <span
        className="font-black text-white text-center"
        style={{
          fontSize: 36 * VIDEO_SCALE,
          width: 40 * VIDEO_SCALE,
          textShadow: "0 2px 4px rgba(0,0,0,0.8)",
        }}
      >
        {state.scoreB}
      </span>

      <FlagBadge
        src="https://flagcdn.com/w160/gb-eng.png"
        alt="England"
        glowColor="rgba(207,8,31,0.45)"
      />
    </div>

    <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-transparent via-orange-500/10 to-transparent"
        style={{ width: 192 * VIDEO_SCALE }}
      />
    </div>
  </div>
);

export const MatchSimStatsPanel = ({ teamStats }: { teamStats: TeamStats }) => (
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
        className="font-bold text-cyan-400"
        style={{ fontSize: 13 * VIDEO_SCALE, marginBottom: 6 * VIDEO_SCALE }}
      >
        {teamStats.teamAName}
      </div>
      <div
        className="text-white/90"
        style={{ fontSize: 11 * VIDEO_SCALE, lineHeight: 1.6 }}
      >
        <div>进攻: {formatPercent(teamStats.mexOffense)}</div>
        <div>防守: {formatPercent(teamStats.mexDefense)}</div>
        <div>球星成色: {formatPercent(teamStats.mexStarQuality)}</div>
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
        className="font-bold text-yellow-400"
        style={{ fontSize: 13 * VIDEO_SCALE, marginBottom: 6 * VIDEO_SCALE }}
      >
        {teamStats.teamBName}
      </div>
      <div
        className="text-white/90"
        style={{ fontSize: 11 * VIDEO_SCALE, lineHeight: 1.6 }}
      >
        <div>进攻: {formatPercent(teamStats.engOffense)}</div>
        <div>防守: {formatPercent(teamStats.engDefense)}</div>
        <div>球星成色: {formatPercent(teamStats.engStarQuality)}</div>
      </div>
    </div>
  </div>
);

export const MatchSimOverlay = ({ state }: { state: GameState }) => {
  const frame = useCurrentFrame();
  const opacity = useOverlayOpacity(state.status);

  if (opacity <= 0) return null;

  if (state.status === "pre") {
    const buttonGlow = interpolate(frame, [0, 30], [0.4, 0.6], {
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
          className="text-white font-black tracking-widest uppercase border border-cyan-300"
          style={{
            padding: `${16 * VIDEO_SCALE}px ${48 * VIDEO_SCALE}px`,
            background: "linear-gradient(to right, #0891b2, #2563eb, #9333ea)",
            borderRadius: 2 * VIDEO_SCALE,
            boxShadow: `0 0 ${30 * VIDEO_SCALE}px rgba(0,255,255,${buttonGlow})`,
            transform: "skewX(-12deg)",
            fontSize: 14 * VIDEO_SCALE,
          }}
        >
          <span
            className="inline-block"
            style={{
              transform: "skewX(12deg)",
              textShadow: "0 0 8px rgba(255,255,255,0.8)",
            }}
          >
            Simulate Match
          </span>
        </div>
      </div>
    );
  }

  if (state.status === "post") {
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
          className="font-black tracking-[0.3em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500"
          style={{
            fontSize: 36 * VIDEO_SCALE,
            marginBottom: 32 * VIDEO_SCALE,
            textShadow: "0 0 20px rgba(255,255,255,0.4)",
          }}
        >
          Full Time
        </h2>
        <div
          className="text-gray-300 font-bold tracking-[0.2em] uppercase border border-gray-600"
          style={{
            padding: `${12 * VIDEO_SCALE}px ${40 * VIDEO_SCALE}px`,
            background: "#0a0a0a",
            borderRadius: 2 * VIDEO_SCALE,
            transform: "skewX(-12deg)",
            fontSize: 12 * VIDEO_SCALE,
            boxShadow: `0 0 ${15 * VIDEO_SCALE}px rgba(0,0,0,1)`,
          }}
        >
          <span className="inline-block" style={{ transform: "skewX(12deg)" }}>
            Rematch
          </span>
        </div>
      </div>
    );
  }

  return null;
};

export const PhoneFrame = ({ children }: { children: React.ReactNode }) => (
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
