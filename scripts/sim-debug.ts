import { ARENA_HEIGHT } from "../src/MatchSim/constants";
import { balancedMatchSimProps } from "../src/MatchSim/schema";
import { MATCH_SIM_DURATION, createInitialState, tickSimulation } from "../src/MatchSim/simulation";
import { resolveTeamStats } from "../src/MatchSim/team-stats";

const stats = resolveTeamStats(balancedMatchSimProps);
const state = createInitialState(448, ARENA_HEIGHT, stats);

let pocket = 0;
let deep = 0;

for (let f = 0; f < MATCH_SIM_DURATION; f++) {
  const arena = state.arena;
  for (const b of state.balls) {
    if (b.x < 0) continue;
    const dist = Math.hypot(b.x - arena.x, b.y - arena.y);
    let angleDiff = Math.abs(Math.atan2(b.y - arena.y, b.x - arena.x) - arena.pocketAngle) % (Math.PI * 2);
    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
    if (dist + b.radius > arena.radius && angleDiff < arena.pocketWidth / 2) {
      pocket++;
      if (dist > arena.radius + b.radius) deep++;
    }
  }
  tickSimulation(state, f);
}

console.log({
  score: `${state.scoreA}-${state.scoreB}`,
  pocket,
  deep,
  duration: MATCH_SIM_DURATION,
});
