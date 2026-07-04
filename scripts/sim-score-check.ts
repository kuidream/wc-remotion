import { ARENA_HEIGHT } from "../src/MatchSim/constants";
import { balancedMatchSimProps, defaultMatchSimProps } from "../src/MatchSim/schema";
import { MATCH_SIM_DURATION, createInitialState, tickSimulation } from "../src/MatchSim/simulation";
import { resolveTeamStats } from "../src/MatchSim/team-stats";

const run = (label: string, props: typeof defaultMatchSimProps) => {
  const stats = resolveTeamStats(props);
  const state = createInitialState(448, ARENA_HEIGHT, stats);
  for (let f = 0; f < MATCH_SIM_DURATION; f++) {
    tickSimulation(state, f);
  }
  console.log(`${label}: ${state.scoreA}-${state.scoreB}`);
};

run("France boost", defaultMatchSimProps);
run("50/50", balancedMatchSimProps);
