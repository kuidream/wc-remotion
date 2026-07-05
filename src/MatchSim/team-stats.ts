import type { MatchSimProps } from "./schema";

export const OUTER_RING_TOTAL_ARC = Math.PI * 1.6;
export const INNER_RING_TOTAL_ARC = Math.PI * 1.0;

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

export const INNER_RING_BONUS_CAP = Math.PI * 0.35;

/** ????????????????????????*/
export const starInnerBonusFactor = (starQuality: number) =>
  0.18 + (starQuality / 100) * 0.14;
export const teamStarShare = (teamStar: number, oppStar: number) => {
  const total = teamStar + oppStar;
  if (total <= 0) return 0.5;
  return teamStar / total;
};

/** ????????????????????*/
export const starInnerBoostMultiplier = (starShare: number) =>
  1 + starShare * 0.16;

/** ??????????????????????*/
export const starInnerSlowMultiplier = (ownerStarShare: number) =>
  1 - ownerStarShare * 0.06;

/** ??????????*/
export const pocketPunchFromStar = (
  starShare: number,
  speed: number,
  maxSpeed: number,
) => starShare * 0.07 * Math.min(1, speed / maxSpeed);

/** ????????? */
export const goalPenetrationFromStar = (
  starShare: number,
  speed: number,
  maxSpeed: number,
) => starShare * Math.min(1, speed / maxSpeed) * 0.12;

/** ????????????????1 ????????2 ???? */
export const STAR_OFFENSE_WEIGHT = 2.04;
const MIN_EFFECTIVE_OFFENSE = 10;

export const getEffectiveOffenseShares = (teamStats: TeamStats) => {
  const mexEff = Math.max(
    MIN_EFFECTIVE_OFFENSE,
    teamStats.mexOffense +
      (teamStats.mexStarQuality - teamStats.engStarQuality) *
        STAR_OFFENSE_WEIGHT,
  );
  const engEff = Math.max(
    MIN_EFFECTIVE_OFFENSE,
    teamStats.engOffense +
      (teamStats.engStarQuality - teamStats.mexStarQuality) *
        STAR_OFFENSE_WEIGHT,
  );
  const total = mexEff + engEff;
  return {
    mexOffenseShare: mexEff / total,
    engOffenseShare: engEff / total,
  };
};

/** 50 ?????????????????????? */
export const defenseDischargeWeight = (defense: number) =>
  Math.max(0.25, defense / 50);

export const getTeamStatsSeed = (teamStats: TeamStats) =>
  Math.floor(
    teamStats.mexOffense +
      teamStats.engOffense * 17 +
      teamStats.mexDefense * 289 +
      teamStats.engDefense * 4913 +
      teamStats.mexStarQuality * 83521 +
      teamStats.engStarQuality * 1419857,
  );

/** ??????????? demo ??1.05 */
export const ringBoostFromShare = (share: number) => 1 + share * 0.05;

/** ?????????????????? demo ??0.95 */
export const ringSlowFromShare = (share: number) => 1 - share * 0.05;

/** ??????????????????????????*/
export const pocketPunchFromShare = (share: number, speed: number, maxSpeed: number) => {
  const speedFactor = Math.min(1, speed / maxSpeed);
  return (0.03 + share * 0.1) * speedFactor;
};

/** ???????????????????? */
export const goalPenetrationFromShare = (
  share: number,
  speed: number,
  maxSpeed: number,
) => share * Math.min(1, speed / maxSpeed) * 0.35;

const shareOfTotal = (value: number, total: number) => {
  if (total <= 0) return 0.5;
  return value / total;
};

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

export const getRingArcs = (
  teamStats: TeamStats,
  slowSpin: number,
  ringBonuses: {
    MEX: { inner: number; outer: number };
    ENG: { inner: number; outer: number };
  },
): RingArcs => {
  const offenseTotal = teamStats.mexOffense + teamStats.engOffense;
  const defenseTotal = teamStats.mexDefense + teamStats.engDefense;

  const mexDefenseArc =
    shareOfTotal(teamStats.mexDefense, defenseTotal) * OUTER_RING_TOTAL_ARC +
    ringBonuses.MEX.outer;
  const engDefenseArc =
    shareOfTotal(teamStats.engDefense, defenseTotal) * OUTER_RING_TOTAL_ARC +
    ringBonuses.ENG.outer;
  const mexOffenseArc =
    shareOfTotal(teamStats.mexOffense, offenseTotal) * INNER_RING_TOTAL_ARC +
    ringBonuses.MEX.inner;
  const engOffenseArc =
    shareOfTotal(teamStats.engOffense, offenseTotal) * INNER_RING_TOTAL_ARC +
    ringBonuses.ENG.inner;

  return {
    mexOuterStart: slowSpin,
    mexOuterEnd: slowSpin + mexDefenseArc,
    engOuterStart: -slowSpin + Math.PI,
    engOuterEnd: -slowSpin + Math.PI + engDefenseArc,
    mexInnerStart: slowSpin * 1.5 + Math.PI / 2,
    mexInnerEnd: slowSpin * 1.5 + Math.PI / 2 + mexOffenseArc,
    engInnerStart: -slowSpin * 1.5 + Math.PI * 1.5,
    engInnerEnd: -slowSpin * 1.5 + Math.PI * 1.5 + engOffenseArc,
  };
};

export const formatPercent = (value: number) => `${value.toFixed(1)}%`;
