export const SUPPORTED_LOCALES = [
  'en',
  'de',
  'es',
  'fr',
  'it',
  'ru',
  'pt',
  'pl',
  'zh-CN',
  'ja',
] as const

export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

export const LOCALE_STORAGE_KEY = 'debgen.locale'

export interface LocaleStorageReader {
  getItem(key: string): string | null
}

export interface LocaleStorageWriter {
  setItem(key: string, value: string): void
}

const supportedLocaleSet = new Set<string>(SUPPORTED_LOCALES)

function canonicalizeLocale(locale: string): string | null {
  try {
    return Intl.getCanonicalLocales(locale)[0] ?? null
  } catch {
    return null
  }
}

function exactSupportedLocale(locale: string | null | undefined): SupportedLocale | null {
  if (!locale) return null

  const canonical = canonicalizeLocale(locale)
  return canonical && supportedLocaleSet.has(canonical)
    ? canonical as SupportedLocale
    : null
}

export function resolveLocale(
  storedLocale: string | null | undefined,
  browserLocales: readonly string[],
): SupportedLocale {
  const stored = exactSupportedLocale(storedLocale)
  if (stored) return stored

  const canonicalBrowserLocales = browserLocales
    .map(canonicalizeLocale)
    .filter((locale): locale is string => locale !== null)

  for (const locale of canonicalBrowserLocales) {
    const exact = exactSupportedLocale(locale)
    if (exact) return exact
  }

  for (const locale of canonicalBrowserLocales) {
    const base = locale.split('-')[0]
    const supportedBase = exactSupportedLocale(base)
    if (supportedBase) return supportedBase
  }

  if (canonicalBrowserLocales.some((locale) => locale.split('-')[0] === 'zh')) {
    return 'zh-CN'
  }

  return 'en'
}

export function readStoredLocale(storage: LocaleStorageReader | null | undefined): string | null {
  if (!storage) return null

  try {
    return storage.getItem(LOCALE_STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeStoredLocale(
  storage: LocaleStorageWriter | null | undefined,
  locale: SupportedLocale,
): boolean {
  if (!storage) return false

  try {
    storage.setItem(LOCALE_STORAGE_KEY, locale)
    return true
  } catch {
    return false
  }
}
