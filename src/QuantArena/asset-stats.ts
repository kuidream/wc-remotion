import type { QuantArenaProps } from "./schema";
import {
  BASE_RISK_RATE,
  BASE_YIELD_RATE,
  DEMO_CHASE_ACCEL,
  SORTINO_REF,
  TTR_REF,
  getArenaScale,
} from "./constants";

export interface AssetStats {
  assetAName: string;
  assetBName: string;
  btcSharpe: number;
  ethSharpe: number;
  btcSortino: number;
  ethSortino: number;
  btcRsq: number;
  ethRsq: number;
  btcTtr: number;
  ethTtr: number;
}

export interface PhysicsProfile {
  maxSpeed: number;
  mass: number;
  accel: number;
  stunFrames: number;
  stunDamping: number;
  gravityPull: number;
  yieldRate: number;
  riskRate: number;
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export const resolveAssetStats = (props: QuantArenaProps): AssetStats => ({
  assetAName: props.assetAName,
  assetBName: props.assetBName,
  btcSharpe: props.assetASharpe,
  ethSharpe: props.assetBSharpe,
  btcSortino: props.assetASortino,
  ethSortino: props.assetBSortino,
  btcRsq: props.assetARsq,
  ethRsq: props.assetBRsq,
  btcTtr: props.assetATtr,
  ethTtr: props.assetBTtr,
});

/**
 * 夏普决定速度上限（差距压缩，避免纯速度碾压）。
 * 所提诺放大质量、收益倍率、抗冲击。
 * TTR 放大硬直时长、硬直阻尼、回撤比例。
 */
export const buildPhysicsProfile = (
  sharpe: number,
  sortino: number,
  rsq: number,
  ttr: number,
  arenaRadius: number,
): PhysicsProfile => {
  const scale = getArenaScale(arenaRadius);

  // 速度差距收窄：夏普只提供有限优势
  const maxSpeed = (2.5 + sharpe * 0.55) * scale;

  // 所提诺质量拉开：BTC 13.65 → ~4.9，ETH 10.54 → ~3.8
  const mass = clamp(sortino / 2.8, 2, 6);

  // TTR 硬直加重：153→70 帧，243→110 帧
  const stunFrames = Math.round(clamp(ttr / 2.2, 28, 130));

  // 长 TTR 硬直时减速更狠
  const stunDamping = clamp(0.94 - (ttr / TTR_REF) * 0.06, 0.82, 0.92);

  // 所提诺越高，出硬直后加速越快
  const accel =
    DEMO_CHASE_ACCEL * scale * clamp(0.75 + (sortino / SORTINO_REF) * 0.45, 0.8, 1.6);

  const gravityPull = 0.00005 + (rsq / 100) * 0.0007;

  // 乘法收益：所提诺越高，吃到绿点涨得越多
  const yieldRate = BASE_YIELD_RATE * clamp(sortino / SORTINO_REF, 0.7, 1.8);

  // 乘法回撤：TTR 越长亏越多，所提诺越高亏越少
  const riskRate =
    BASE_RISK_RATE *
    clamp(ttr / TTR_REF, 0.7, 2.2) *
    clamp(SORTINO_REF / sortino, 0.55, 1.45);

  return {
    maxSpeed,
    mass,
    accel,
    stunFrames,
    stunDamping,
    gravityPull,
    yieldRate,
    riskRate,
  };
};

export const formatMetric = (value: number, digits = 2) =>
  value.toFixed(digits);

export const formatWealth = (value: number) =>
  Math.round(value).toLocaleString("en-US");
