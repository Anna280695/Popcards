/** Owns round lifecycle and delayed card transitions, without DOM coupling. */
export function createRoundController({ engine, clock = globalThis, onChange = () => {}, onExpired = () => {}, onResolved = () => {}, onStart = () => {} }) {
  let round = null, countdown = null, pending = null, preparation = null, token = 0;
  function cancelTimers() {
    if (countdown !== null) clock.clearInterval(countdown);
    if (pending !== null) clock.clearTimeout(pending);
    if (preparation !== null) clock.clearTimeout(preparation);
    countdown = pending = preparation = null;
    token++;
  }
  function prepare(mode, delay) {
    cancelTimers(); const own = token;
    preparation = clock.setTimeout(() => { preparation = null; if (own === token) onStart(mode); }, delay);
  }
  function begin(nextRound) {
    cancelTimers(); round = nextRound;
    const own = token;
    if (round.mode !== 'review') countdown = clock.setInterval(() => {
      if (own !== token || round.status !== 'playing') return;
      const result = engine.tickRound(round);
      onChange(round);
      if (result.expired) { stop(); onExpired(round); }
    }, 1000);
    onChange(round);
  }
  function select(index) {
    if (!round || round.cluePending) return { accepted: false };
    const active = round; const action = engine.pickCard(active, index);
    if (!action.accepted) return action;
    onChange(active, action);
    if (action.type !== 'first') {
      const own = token;
      pending = clock.setTimeout(() => {
        pending = null;
        if (own !== token || active !== round || active.status !== 'playing') return;
        const outcome = engine.resolvePick(active);
        onResolved(active, outcome);
        onChange(active, outcome);
      }, action.delay);
    }
    return action;
  }
  function useClue() {
    if (!round || !engine.showClue(round)) return false;
    const [first, second] = round.h;
    select(first);
    select(second);
    return true;
  }
  function stop() { cancelTimers(); }
  function end(kind) { stop(); if (!round) return null; return engine.finishRound(round,kind); }
  return { prepare, begin, select, useClue, stop, end, getRound:()=>round, getActiveTimers:()=>({countdown,pending,preparation}) };
}
