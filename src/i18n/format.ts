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
  return value
    .normalize('NFKD')
    .replaceAll(/\p{Mark}/gu, '')
    .toLocaleLowerCase(locale)
}

export function matchesSearch(
  query: string,
  humanValues: readonly string[],
  technicalValues: readonly string[],
  locale: SupportedLocale,
): boolean {
  const trimmedQuery = query.trim()
  if (trimmedQuery === '') return true

  const humanHaystack = humanValues.map((value) => normalizeHumanSearch(value, locale))
  const queryTokens = trimmedQuery.split(/\s+/u)
  const matchesHumanText = queryTokens.every((token) => {
    const normalizedToken = normalizeHumanSearch(token, locale)
    return humanHaystack.some((value) => value.includes(normalizedToken))
  })

  return matchesHumanText || technicalValues.some((value) => value.includes(trimmedQuery))
}
