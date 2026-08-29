import { describe, expect, it } from 'vitest'
import {
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  readStoredLocale,
  resolveLocale,
  writeStoredLocale,
} from './locales'

describe('locale resolution', () => {
  it('keeps the exact supported locale list stable', () => {
    expect(SUPPORTED_LOCALES).toEqual([
      'en', 'de', 'es', 'fr', 'it', 'ru', 'pt', 'pl', 'zh-CN', 'ja',
    ])
  })

  it('prefers a valid stored choice over browser languages', () => {
    expect(resolveLocale('fr', ['de-DE', 'en-US'])).toBe('fr')
  })

  it('prefers an exact browser match before any regional base fallback', () => {
    expect(resolveLocale(null, ['en-US', 'pl'])).toBe('pl')
  })

  it.each([
    [['de-AT'], 'de'],
    [['pt-BR'], 'pt'],
    [['es-MX'], 'es'],
  ] as const)('falls back from %j to the supported language base', (languages, expected) => {
    expect(resolveLocale(null, languages)).toBe(expected)
  })

  it.each([
    ['zh-Hans-SG', 'zh-CN'],
    ['zh-Hant-TW', 'zh-CN'],
    ['zh', 'zh-CN'],
  ] as const)('maps the Chinese locale %s to simplified Chinese', (language, expected) => {
    expect(resolveLocale(null, [language])).toBe(expected)
  })

  it('normalizes supported locale casing and ignores malformed tags', () => {
    expect(resolveLocale('ZH-cn', ['de'])).toBe('zh-CN')
    expect(resolveLocale('not_a_locale', ['also_bad'])).toBe('en')
  })

  it('falls back to English when no candidate is supported', () => {
    expect(resolveLocale('nl', ['ko-KR', 'ar'])).toBe('en')
  })
})

describe('locale persistence', () => {
  it('reads and writes the locale under the stable storage key', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }

    expect(writeStoredLocale(storage, 'ja')).toBe(true)
    expect(values.get(LOCALE_STORAGE_KEY)).toBe('ja')
    expect(readStoredLocale(storage)).toBe('ja')
  })

  it('does not let unavailable storage block startup or locale changes', () => {
    const unavailableStorage = {
      getItem: () => { throw new DOMException('blocked', 'SecurityError') },
      setItem: () => { throw new DOMException('blocked', 'SecurityError') },
    }

    expect(readStoredLocale(unavailableStorage)).toBeNull()
    expect(writeStoredLocale(unavailableStorage, 'de')).toBe(false)
  })
})
