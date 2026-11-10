# Localization coverage

## Changes

- Additional language keys for gameplay, social, profile, learning library, onboarding, and results screens.
- Vietnamese now has an extended UI catalog; seven other languages have additional key labels alongside the existing baseline.
- `PopcardsI18n.translate(root)` also handles `aria-label`, `title`, `placeholder`, and `alt` attributes, while excluding word cards, learning content, form values, code, and illustrations.
- `PopcardsI18n.coverage()` exposes the active-language dictionary entry count and missing runtime strings for localization QA; `has(key,locale)` checks a translation's availability.

## Important known gaps

The application still uses legacy embedded strings in templates, dynamic notifications, toasts, and account/backend responses. The offline dictionaries are **not** 100% complete for all eight non-English locales. Missing keys fall back to English; they are not machine-translated or replaced with false translations. Review and translate the missing strings by opening app screens in each locale and running `PopcardsI18n.coverage()` in browser console.

Translations should be reviewed by native speakers before shipping. In-app study words and meaning pairs deliberately remain governed by learning-language preferences, not interface language.

## QA

Run `npm test`. To check browser navigation, run `npm run test:browser` after installing dependencies and Chromium. Browser tests have not been executed in this environment.
