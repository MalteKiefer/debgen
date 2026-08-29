import { SUPPORTED_LOCALES, type SupportedLocale } from '../../i18n/locales'
import { de } from './de'
import { en, type SiteCopy } from './en'
import { es } from './es'
import { fr } from './fr'
import { it } from './it'
import { ja } from './ja'
import { pl } from './pl'
import { pt } from './pt'
import { ru } from './ru'
import { zhCN } from './zh-CN'

export type { SiteCopy } from './en'

export const SITE_COPY: Record<SupportedLocale, SiteCopy> = {
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

export const BUILD_TIME_FALLBACK_LOCALE = 'en' as const

export const getSiteCopyForBuild = (locale: SupportedLocale | undefined): SiteCopy =>
  SITE_COPY[locale ?? BUILD_TIME_FALLBACK_LOCALE]

export const siteLocales = SUPPORTED_LOCALES
