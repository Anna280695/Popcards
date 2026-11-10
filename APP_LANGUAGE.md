# App language settings

Settings now contains **App language**, separate from learning and definition languages. English and a device-locale-suggested language appear. The user chooses manually and the choice persists across sessions in `popcards.appLanguage.v1`. No GPS or network geolocation is used. Region is inferred from `navigator.language` where provided, not from actual physical location.

Current translations cover common app navigation, settings and gameplay labels in Vietnamese, Thai, Spanish, French, Japanese, Korean, Chinese and German. Strings without a translation remain in English; lesson words and card content are intentionally never translated by this setting. For a fully localized release, migrate all view strings to keyed translations and add linguistic QA.

Run `npm test` for locale selection and existing gameplay tests.
