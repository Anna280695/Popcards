# Popcards end-to-end QA

## Run on a machine with npm network access

```sh
npm install
npx playwright install chromium
npm test
npm run build
npm run test:browser
```

The Playwright suite now includes gameplay, registered screen sweep, main navigation, modal dismissal, all supported UI languages across registered screens, language persistence, and separate authentication of two configured Supabase test accounts.

## Real Supabase QA

Configure `.env` from `.env.example`. Use **only dedicated test accounts** (not customer accounts):

```
POPCARDS_QA_USER_A=qa-a@example.test
POPCARDS_QA_PASS_A=<test-account-password>
POPCARDS_QA_USER_B=qa-b@example.test
POPCARDS_QA_PASS_B=<test-account-password>
```

Confirm both users in Supabase Authentication → Users before running the suite. If email confirmation is enabled, an unconfirmed test account will remain on the guest screen and the dependent serial tests will not run.

The two-account automated test verifies independent authentication only. Manually verify A sends friend request → B accepts → A sends challenge → B plays → rankings update on both screens. Also test sign-out, account recovery and account deletion in a disposable Supabase project. Never use service role keys in Vite client env.

## Execution notes for this inspection

`node --test tests/*.test.js`: 25 passing. Dependency installation timed out, and localhost browser traffic was blocked by the execution environment; therefore the browser suite and production build were not run. Supabase URL/publishable key are placeholders, so live two-account flows were not validated. No passing browser results are claimed.
