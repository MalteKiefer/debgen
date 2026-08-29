# Translation maintenance

The interface supports exactly these locales:

```ts
export const SUPPORTED_LOCALES = [
  'en', 'de', 'es', 'fr', 'it', 'ru', 'pt', 'pl', 'zh-CN', 'ja',
] as const
```

English is the canonical typed message schema and production fallback. The other nine message modules must have exactly the same keys as English: no missing keys and no extra keys. Keep messages statically bundled and typed. A translation lookup failure is a development error; production falls back to English without showing a raw key.

## What belongs in a message module

Translate all visible interface copy: labels, help text, headings, category names, warnings, compatibility explanations, output descriptions, tooltips, ARIA labels, live announcements, errors, and plural forms. Domain code returns stable structured reason and warning descriptors, then the presentation layer resolves them.

Never translate technical values. This includes URLs, paths, package names, fingerprints, Debian codenames, suites, architectures, DEB822 field names, shell commands, filenames, product IDs, source IDs, and the static API's machine-readable fields. Do not alter technical token punctuation while translating nearby prose.

Visible translation strings must not contain Unicode en dash (`U+2013`) or em dash (`U+2014`). Use a normal ASCII hyphen where punctuation needs one. Hyphens that are part of technical data must remain exactly as supplied.

## Adding or changing a string

1. Add the English key and message first. Keep nesting meaningful and stable rather than encoding UI layout in the key name.
2. Add that exact key to `de`, `es`, `fr`, `it`, `ru`, `pt`, `pl`, `zh-CN`, and `ja` in the same change.
3. Preserve interpolation names, markup expectations, and any explicit technical token exactly in each locale.
4. Use `Intl.PluralRules` through the locale formatting helper for counts. Do not implement English singular/plural assumptions in components.
5. Run schema-completeness, dash-scan, locale-resolution, plural, component, typecheck, and lint tests. Review a representative narrow and wide layout before merging.

Russian and Polish need their locale-correct plural categories, not a two-form translation. Use native language names in the language selector. Search normalizes human language input in a locale-aware manner, but must preserve exact technical search tokens.

## Locale selection and fallback

Locale resolution is deliberately deterministic:

1. A valid stored user choice wins.
2. Match a normalized entry from `navigator.languages` exactly.
3. Match its language base, such as `de-AT` to `de` or `pt-BR` to `pt`.
4. Map supported Chinese variants to `zh-CN`.
5. Fall back to `en`.

Invalid or stale storage must not block startup. A language change updates Vue I18n, the Vuetify locale, `document.documentElement.lang`, and persistent local storage. The selector must remain keyboard accessible and available in the header.

## Translation review checklist

- Verify all ten modules have the canonical English key set.
- Confirm interpolations and technical tokens are unchanged.
- Confirm no visible message contains `U+2013` or `U+2014`.
- Exercise singular, plural, and large counts in English, German, Russian, Polish, and simplified Chinese.
- Check ARIA labels, live announcements, tooltips, warning text, and error states as well as ordinary page text.
- Change locale during a selection and confirm the source files, scripts, URLs, package names, fingerprints, commands, and filenames are byte-identical.
- Confirm a stored invalid locale and unsupported browser locale fall back to English.
