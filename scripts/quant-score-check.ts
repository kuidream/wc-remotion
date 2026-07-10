import { ARENA_HEIGHT, LOGICAL_WIDTH } from "../src/QuantArena/constants";
import {
  buildPhysicsProfile,
  resolveAssetStats,
} from "../src/QuantArena/asset-stats";
import { defaultQuantArenaProps } from "../src/QuantArena/schema";
import {
  QUANT_ARENA_DURATION,
  createInitialState,
  tickSimulation,
} from "../src/QuantArena/simulation";

const stats = resolveAssetStats(defaultQuantArenaProps);
const arenaR = Math.min(LOGICAL_WIDTH, ARENA_HEIGHT) / 2 - 40;
console.log(
  "BTC",
  buildPhysicsProfile(
    stats.btcSharpe,
    stats.btcSortino,
    stats.btcRsq,
    stats.btcTtr,
    arenaR,
  ),
);
console.log(
  "ETH",
  buildPhysicsProfile(
    stats.ethSharpe,
    stats.ethSortino,
    stats.ethRsq,
    stats.ethTtr,
    arenaR,
  ),
);

const state = createInitialState(LOGICAL_WIDTH, ARENA_HEIGHT, stats);
for (let f = 0; f < QUANT_ARENA_DURATION; f++) {
  tickSimulation(state, f);
}
console.log(
  `Final BTC=${Math.round(state.scoreA)} ETH=${Math.round(state.scoreB)} year=${state.year} status=${state.status}`,
);
