import { SUPPORTED_LOCALES, type SupportedLocale } from '../../i18n/locales'
import { messages, type MessageSchema } from '../../i18n/messages'
import { de } from './de'
import { en, type LocaleCopy } from './en'
import { es } from './es'
import { fr } from './fr'
import { it } from './it'
import { ja } from './ja'
import { pl } from './pl'
import { pt } from './pt'
import { ru } from './ru'
import { zhCN } from './zh-CN'

export type { LocaleCopy } from './en'

// The Workbench reuses the already translated catalog texts instead of duplicating them per locale.
const UI_GROUPS = ['locale', 'counts', 'controls', 'categories', 'vendor', 'vendorCard', 'compatibility', 'selection', 'warnings', 'install'] as const

export type InterfaceCopy = Pick<MessageSchema, typeof UI_GROUPS[number]>

export type SiteCopy = LocaleCopy & { readonly ui: InterfaceCopy }

const LOCALE_COPY: Record<SupportedLocale, LocaleCopy> = {
  en,
  de,
  es,
  fr,
  it,
  ru,
  pt,
  pl,
  'zh-CN': zhCN,
  ja,
}

const interfaceCopy = (locale: SupportedLocale): InterfaceCopy => {
  const source = messages[locale] as MessageSchema
  return Object.fromEntries(UI_GROUPS.map(group => [group, source[group]])) as InterfaceCopy
}

export const SITE_COPY: Record<SupportedLocale, SiteCopy> = Object.fromEntries(
  SUPPORTED_LOCALES.map(locale => [locale, { ...LOCALE_COPY[locale], ui: interfaceCopy(locale) }]),
) as Record<SupportedLocale, SiteCopy>

export const BUILD_TIME_FALLBACK_LOCALE = 'en' as const

export const getSiteCopyForBuild = (locale: SupportedLocale | undefined): SiteCopy =>
  SITE_COPY[locale ?? BUILD_TIME_FALLBACK_LOCALE]

export const siteLocales = SUPPORTED_LOCALES
