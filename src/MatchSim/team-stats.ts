import type { MatchSimProps } from "./schema";

export interface TeamStats {
  teamAName: string;
  teamBName: string;
  mexOffense: number;
  mexDefense: number;
  engOffense: number;
  engDefense: number;
  mexStarQuality: number;
  engStarQuality: number;
}

export interface RingArcs {
  mexOuterStart: number;
  mexOuterEnd: number;
  engOuterStart: number;
  engOuterEnd: number;
  mexInnerStart: number;
  mexInnerEnd: number;
  engInnerStart: number;
  engInnerEnd: number;
}

export const resolveTeamStats = (props: MatchSimProps): TeamStats => ({
  teamAName: props.teamAName,
  teamBName: props.teamBName,
  mexOffense: props.teamAOffense,
  mexDefense: props.teamADefense,
  engOffense: props.teamBOffense,
  engDefense: props.teamBDefense,
  mexStarQuality: props.teamAStarQuality,
  engStarQuality: props.teamBStarQuality,
});

export const PLAYER_DISCHARGE_BASE_CHANCE = 0.005;

/** demo 固定环弧几何，与 MatchSim.tsx 一致 */
export const getDemoRingArcs = (
  slowSpin: number,
  ringBonuses: {
    MEX: { inner: number; outer: number };
    ENG: { inner: number; outer: number };
  },
): RingArcs => ({
  mexOuterStart: slowSpin,
  mexOuterEnd: slowSpin + Math.PI * 0.8 + ringBonuses.MEX.outer,
  engOuterStart: -slowSpin + Math.PI,
  engOuterEnd: -slowSpin + Math.PI * 1.8 + ringBonuses.ENG.outer,
  mexInnerStart: slowSpin * 1.5 + Math.PI / 2,
  mexInnerEnd: slowSpin * 1.5 + Math.PI + ringBonuses.MEX.inner,
  engInnerStart: -slowSpin * 1.5 + Math.PI * 1.5,
  engInnerEnd: -slowSpin * 1.5 + Math.PI * 2 + ringBonuses.ENG.inner,
});

export const formatPercent = (value: number) => `${value.toFixed(1)}%`;
