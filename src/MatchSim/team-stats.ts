import type { MatchSimProps } from "./schema";

// 50/50 时的总弧长，后续只调整两队占比，不改变总长度
export const OUTER_RING_TOTAL_ARC = Math.PI * 1.6;
export const INNER_RING_TOTAL_ARC = Math.PI * 1.0;

export interface TeamStats {
  teamAName: string;
  teamBName: string;
  pryOffense: number;
  pryDefense: number;
  fraOffense: number;
  fraDefense: number;
}

export const resolveTeamStats = (props: MatchSimProps): TeamStats => ({
  teamAName: props.teamAName,
  teamBName: props.teamBName,
  pryOffense: props.teamAOffense,
  pryDefense: props.teamADefense,
  fraOffense: props.teamBOffense,
  fraDefense: props.teamBDefense,
});

const shareOfTotal = (value: number, total: number) => {
  if (total <= 0) return 0.5;
  return value / total;
};

export interface RingArcs {
  pryOuterStart: number;
  pryOuterEnd: number;
  fraOuterStart: number;
  fraOuterEnd: number;
  pryInnerStart: number;
  pryInnerEnd: number;
  fraInnerStart: number;
  fraInnerEnd: number;
}

export const getRingArcs = (
  teamStats: TeamStats,
  slowSpin: number,
  ringBonuses: {
    PRY: { inner: number; outer: number };
    FRA: { inner: number; outer: number };
  },
): RingArcs => {
  const offenseTotal = teamStats.pryOffense + teamStats.fraOffense;
  const defenseTotal = teamStats.pryDefense + teamStats.fraDefense;

  const pryDefenseArc =
    shareOfTotal(teamStats.pryDefense, defenseTotal) * OUTER_RING_TOTAL_ARC +
    ringBonuses.PRY.outer;
  const fraDefenseArc =
    shareOfTotal(teamStats.fraDefense, defenseTotal) * OUTER_RING_TOTAL_ARC +
    ringBonuses.FRA.outer;
  const pryOffenseArc =
    shareOfTotal(teamStats.pryOffense, offenseTotal) * INNER_RING_TOTAL_ARC +
    ringBonuses.PRY.inner;
  const fraOffenseArc =
    shareOfTotal(teamStats.fraOffense, offenseTotal) * INNER_RING_TOTAL_ARC +
    ringBonuses.FRA.inner;

  return {
    pryOuterStart: slowSpin,
    pryOuterEnd: slowSpin + pryDefenseArc,
    fraOuterStart: -slowSpin + Math.PI,
    fraOuterEnd: -slowSpin + Math.PI + fraDefenseArc,
    pryInnerStart: slowSpin * 1.5 + Math.PI / 2,
    pryInnerEnd: slowSpin * 1.5 + Math.PI / 2 + pryOffenseArc,
    fraInnerStart: -slowSpin * 1.5 + Math.PI * 1.5,
    fraInnerEnd: -slowSpin * 1.5 + Math.PI * 1.5 + fraOffenseArc,
  };
};

export const formatPercent = (value: number) => `${value.toFixed(1)}%`;
