# Popcards — installable web application

This is the original Popcards UI packaged as a production-buildable Vite application. All original SVG illustrations, gameplay/score/levels, 30-second timer, flips, celebratory effects, sound, profile, words, and 3-clues-per-24-hours logic have been retained. The mobile layout runs edge-to-edge, while desktop displays a centered app. Open `/?preview` to access the original screen explorer for QA.

## Run on your computer

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open http://localhost:5173. The dev server prints the actual address. Stop it with Ctrl+C. Use `npm run build` to produce `dist/`, then `npm run preview` to test the built app. Deploy `dist/` on a static HTTPS host, with SPA fallback to `index.html`.

## Enable real accounts, friends, and synchronized challenges

1. Create a Supabase project. Run `schema.sql` in the SQL editor.
2. Enable Email authentication in Supabase Authentication. Configure the correct site URL and redirect URLs for your deployed host.
3. Copy `.env.example` to `.env` and populate `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (use only a **public** anon/publishable key). Restart the dev server after changing `.env`.
4. Turn on Realtime replication for `friend_requests` and `challenges` in Supabase.
5. Create accounts in two browsers, then send/accept a friend request and issue/finish a challenge.

### Browser end-to-end tests

The social-flow suite covers login, profile editing, adding a friend, accepting a request, and sending a challenge. It uses two dedicated Supabase QA accounts and skips automatically when they are not configured:

```bash
export POPCARDS_QA_USER_A='qa-a@example.com'
export POPCARDS_QA_PASS_A='...'
export POPCARDS_QA_USER_B='qa-b@example.com'
export POPCARDS_QA_PASS_B='...'
npx playwright test tests/browser/social-flows.spec.js
```

Use test-only accounts with no personal data. The profile test restores account A's original display name and username; the friend and challenge tests intentionally leave their database records for repeatable inspection.

Both QA accounts must already exist in Supabase Auth and have confirmed email addresses (or email confirmation must be disabled in the disposable QA project). Export these variables in the same terminal session where Playwright is run.

**Without Supabase credentials, offline/guest solo play is available with browser-local progress and clues; signing in, real friends and synchronized matches require Supabase.** An online challenge requires a network connection.

## Launch-readiness boundaries

- Production competitive scores are reported by the browser, not validated by a trusted server. Implement authoritative challenge timer, match validation, and scoring with an Edge Function before launching competitive public leaderboards.
- The original sample leaderboard and demo friends visible in some views are *sample content*, not server data. Online friend requests/challenges in the dedicated panel are backed by the database.
- Add password reset, account deletion/export, blocking/reporting, email confirmation, push notifications and moderation as appropriate prior to a broad release.
- PWA offline caching supports previously loaded static app assets; multiplayer needs connectivity. Browser install support varies by device/browser. This ZIP is not a native iOS/Android App Store package.

## Competitive score validation (new)

After applying `schema.sql`, **run `competitive.sql` in the Supabase SQL editor** (existing installations must run it too). It removes browser permissions to update challenge scores and installs three authenticated RPCs:

- `start_competitive_match(challenge_id)` starts a single, server-timed 30-second match. The deck is stored only in the private database schema and cannot be requested in full.
- `end_competitive_match(challenge_id)` records a quit/timeout as a zero-score one-time attempt.
- `flip_competitive_card(challenge_id, card_index)` checks each move, returns only the revealed card, counts mistakes and combos, and writes the completed score in one database transaction.

The current server scoring preserves base, time, perfect, mistake penalty and combo bonuses. Rare-word bonus is excluded from ranked results until vocabulary difficulty is controlled on the server. Solo scores and the **legacy sample leaderboard are NOT verified**; do not label them competitive rankings. `target_score` for challenges is still sender-reported, so treat targets as informal until the sender has a verified scored run.

Security limitations: no client game is fully bot-proof. This enforces authoritative score/timer/matches and hides unflipped cards, but a skilled attacker can automate legal timed flips. Add suspicious-match detection, request rate limits, account abuse monitoring, and a real server-backed leaderboard before high-stakes ranking. SQL has not been tested against a live Supabase project in this environment.


## Leaderboard setup
Run `schema.sql`, `competitive.sql`, then `rankings.sql` in the Supabase SQL Editor. Existing installations must rerun `rankings.sql` for the total-score update. This adds `profiles.total_score` and the `save_total_score` RPC. Global ranks all accounts by saved total score; Friends uses accepted friend IDs.

Missing leaderboard or clue migrations do not block signing in or loading friends. The leaderboard displays migration instructions when its database function is unavailable. Scores remain local until the total-score migration is installed and are synchronized on the next sign-in or finished round.

Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`; `config.js` public values are also supported as a fallback. Restart Vite after editing `.env`.

## Code organization (refactor)

The original visual and interaction code has been extracted from `index.html` without
redesigning the screens. The scripts under `public/app/` are **classic browser scripts**,
loaded in the exact original execution order because they share top-level bindings.
They are not independent ES modules yet; do not add `type="module"` or rearrange them
without first explicitly migrating dependencies and tests.

- `public/app/state/bootstrap.js`: vocabulary definitions, local state and persistence, clues and review state.
- `public/app/screens/artwork.js`: reusable SVG illustrations, UI constants, and icon functions.
- `public/app/gameplay/match.js`: matching tiles, 30-second timer, scoring, match outcome, and celebration.
- `public/app/screens/views.js`: screen templates and reusable screen rendering helpers.
- `public/app/gameplay/audio.js`: game sound and sound preference handling.
- `public/app/screens/render.js`: page render and screen explorer navigation.
- `public/app/state/events.js`: interaction event dispatch, keyboard handlers, and startup.
- `src/styles/base.css`: original primary styles.
- `src/styles/refinements.css`: additional override styles in original cascade order.
- `app.css`: existing Vite/mobile-specific styles.
- `public/online.js`: Supabase account, challenge, and server-verified leaderboard adapter.

### Important caveat

This is a **non-behavior-changing structural extraction** rather than a full rewrite into
isolated modules. The original global shared-scope event code remains, and verified
leaderboard support still requires the Supabase SQL migrations and integration testing.

## Password recovery and account management

The **Online account → Account settings** panel now supports profile editing, password change, email change, sign-out, and permanent deletion. The login panel contains a **Forgot password?** link. Password-reset links open the app and show the new-password screen.

1. In **Supabase → Authentication → URL Configuration**, set your app URL as the Site URL. Add your local URL (for example `http://localhost:5173/`) and production origin with trailing `/` to the allowed Redirect URLs. Password recovery requires working SMTP and email templates in Supabase Auth.
2. Enable Supabase email authentication, confirm sign-up/password-reset email delivery, and configure email-change confirmation policy in the Auth dashboard.
3. To enable account deletion, install Supabase CLI, link the project, then run `supabase functions deploy delete-account` from this project directory. **Keep JWT verification enabled**. The Edge Function verifies the caller with `auth.getUser(token)` and deletes only that user's own auth identity using the server-only service role credential. Ensure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` exist in the function runtime; never put the service role key in Vite `.env` files.
4. Verify that all relevant user tables use `ON DELETE CASCADE` for user foreign keys. Supabase storage files or external analytics records are **not** automatically deleted: add appropriate server-side cleanup if those features are later introduced.
5. Test: forgot password email → callback → new password → login; wrong current password; email-change verification; cancel deletion; type DELETE and delete a test account; then confirm sign-in fails and its profile, friendship, and challenge data are removed.

Password reset links are handled by Supabase Auth; the browser never stores password data in Popcards game state. If Supabase token handling fails or the confirmation email expires, restart recovery from the login form.

Leaderboard totals: run `rankings.sql` after `schema.sql` to add saved account total scores and update the rankings RPC. The app saves totals at sign-in and after rounds; Global includes all accounts, including zero-score players.

UI preview: open `/?preview` for refreshed sample rankings (eight players including a new zero-score player), friend cards, requests, and a completed round. Preview mode skips Supabase initialization and does not save gameplay changes to the normal account storage. Reload to reset samples.
