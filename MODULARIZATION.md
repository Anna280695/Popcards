# Popcards code modules

## Current architecture

- `src/main.js` — Vite entry point and Supabase initialization.
- `src/online/index.js` — online feature coordinator and compatibility bridge to the original prototype UI.
- `src/online/services/social.js` — friend/challenge fetching, friend selectors, realtime subscriptions.
- `src/online/services/rankings.js` — verified leaderboard RPC and score view-model conversion.
- `src/online/services/clues.js` — server-controlled clue RPC access.
- `src/online/ui/escape.js` — HTML escaping utility.
- `src/styles/` — original visual styles, kept unchanged.
- `public/app/` — existing prototype game, artwork, rendering, events, state, and audio.

## Important compatibility note

The original game relies on shared lexical globals across ordered classic scripts in `index.html`. Those scripts remain in place to preserve functionality and animation timings. This is **not yet a complete migration** to isolated ES modules: `src/online/index.js` still adapts `S`, `render`, and `finish` from the legacy game. A future migration should inject a documented game controller interface, replace global event interception with screen-specific handlers, and migrate each legacy file with automated behavior tests.

## Development

`npm install` then `npm run dev` or `npm run build`. Supabase environment variables remain in `.env.example`.

## Gameplay engine and tests (2026-10-27)

- `src/gameplay/engine.js` owns deterministic round creation, card selection, matching resolution, combo/rare bonuses, timer changes, clue reveal, and result calculation. It has no DOM, browser storage, network, or timers.
- `public/app/gameplay/match.js` handles round scheduling, UI celebration, and account/stat side effects through the engine.
- `public/app/state/events.js` delegates tile and clue actions to the engine and keeps existing UI event routing.
- `tests/engine.test.js` tests 11 scenarios with Node's built-in test runner. Run `npm test` (no test dependencies).

**Migration boundary:** This refactor extracts gameplay *rules* and their state transitions, but screen navigation, rendering, UI event delegation, stat persistence, and the legacy `S` object remain in classic scripts as a compatibility layer. It is not a complete elimination of all globals. The tests are unit tests; browser, animation, Supabase, and end-to-end tests remain outstanding.
