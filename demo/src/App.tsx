/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import MatchSim from './components/MatchSim';

export default function App() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-950">
      <div className="w-full h-full max-w-md bg-black relative overflow-hidden shadow-2xl border-x border-zinc-800/50">
        <MatchSim />
      </div>
    </div>
  );
}
