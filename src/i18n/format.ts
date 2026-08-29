import type { SupportedLocale } from './locales'

export type PluralCategory = Intl.LDMLPluralRule

export type PluralForms = Readonly<Record<PluralCategory, string>>

export function formatPlural(
  locale: SupportedLocale,
  count: number,
  forms: PluralForms,
): string {
  const category = new Intl.PluralRules(locale).select(count)
  return forms[category].replaceAll('{count}', String(count))
}

function normalizeHumanSearch(value: string, locale: SupportedLocale): string {
  return value.normalize('NFC').toLocaleLowerCase(locale)
}

export function matchesSearch(
  query: string,
  humanValues: readonly string[],
  technicalValues: readonly string[],
  locale: SupportedLocale,
): boolean {
  const trimmedQuery = query.trim()
  if (trimmedQuery === '') return true

  const normalizedQuery = normalizeHumanSearch(trimmedQuery, locale)
  if (humanValues.some((value) => normalizeHumanSearch(value, locale).includes(normalizedQuery))) {
    return true
  }

  return technicalValues.some((value) => value.includes(trimmedQuery))
}
