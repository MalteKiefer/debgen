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
