# Gameplay controller and browser testing

## Architecture

- `src/gameplay/engine.js`: deterministic round rules and score calculations.
- `src/gameplay/round-controller.js`: owns pre-match delay, countdown, card-flip delay, cancellation and round lifecycle. Accepts callbacks rather than touching the DOM.
- `public/app/gameplay/match.js`: preserves visuals, vocabulary selection, mascot celebration and result persistence; delegates timer ownership to controller.
- `public/app/state/events.js`: UI event adapter delegates card selections to controller.
- `src/main.js`: wires controller into legacy UI callbacks. The remaining legacy global `S` contains navigation and profile data; this refactor removes independent gameplay timers and card-resolution logic from the legacy click handlers, not all application globals.

## Tests

Run `npm test` for deterministic unit tests (15 cases).

For Playwright browser tests:

```sh
npm install
npx playwright install chromium
npm run test:browser
```

Three browser scenarios cover completing six pairs + results, 30-second countdown while the menu remains open, and a wrong match followed by early exit. Browser tests use local front-end gameplay and do **not** validate Supabase multiplayer or server score submission.

## Known limitations

- A full Vite browser run has not been verified in this environment because npm registry DNS requests fail. Chromium itself is installed, but the environment blocks localhost navigation used by the attempted smoke test.
- The legacy navigation/profile `S` object, render templates, sound and celebration code are intentionally retained. Future work should isolate these controllers without changing the art and transitions.
- Dependency versions should be installed and locked before CI release.
