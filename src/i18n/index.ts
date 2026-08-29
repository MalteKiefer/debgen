import type { WritableComputedRef } from 'vue'
import { createI18n } from 'vue-i18n'
import {
  de as vuetifyDe,
  en as vuetifyEn,
  es as vuetifyEs,
  fr as vuetifyFr,
  it as vuetifyIt,
  ja as vuetifyJa,
  pl as vuetifyPl,
  pt as vuetifyPt,
  ru as vuetifyRu,
  zhHans as vuetifyZhCN,
} from 'vuetify/locale'
import type { SupportedLocale } from './locales'
import {
  readStoredLocale,
  resolveLocale,
  writeStoredLocale,
} from './locales'
import { messages } from './messages'

const i18nMessages = {
  en: { ...messages.en, $vuetify: vuetifyEn },
  de: { ...messages.de, $vuetify: vuetifyDe },
  es: { ...messages.es, $vuetify: vuetifyEs },
  fr: { ...messages.fr, $vuetify: vuetifyFr },
  it: { ...messages.it, $vuetify: vuetifyIt },
  ru: { ...messages.ru, $vuetify: vuetifyRu },
  pt: { ...messages.pt, $vuetify: vuetifyPt },
  pl: { ...messages.pl, $vuetify: vuetifyPl },
  'zh-CN': { ...messages['zh-CN'], $vuetify: vuetifyZhCN },
  ja: { ...messages.ja, $vuetify: vuetifyJa },
}

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: i18nMessages,
})

export const locale = i18n.global.locale as WritableComputedRef<SupportedLocale>

interface LocaleDocument {
  readonly documentElement: { lang: string }
  title: string
}

interface LocaleStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

interface LocaleRuntimeOptions {
  readonly document?: LocaleDocument | null
  readonly languages?: readonly string[]
  readonly storage?: LocaleStorage | null
}

function defaultDocument(): LocaleDocument | null {
  return globalThis.document ?? null
}

function defaultLanguages(): readonly string[] {
  return globalThis.navigator?.languages ?? []
}

function defaultStorage(): LocaleStorage | null {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

function optionDocument(options: LocaleRuntimeOptions): LocaleDocument | null {
  return options.document === undefined ? defaultDocument() : options.document
}

function optionStorage(options: LocaleRuntimeOptions): LocaleStorage | null {
  return options.storage === undefined ? defaultStorage() : options.storage
}

function synchronizeDocument(nextLocale: SupportedLocale, target: LocaleDocument | null): void {
  if (!target) return
  target.documentElement.lang = nextLocale
  target.title = messages[nextLocale].meta.title
}

export function initializeLocale(options: LocaleRuntimeOptions = {}): SupportedLocale {
  const storage = optionStorage(options)
  const nextLocale = resolveLocale(
    readStoredLocale(storage),
    options.languages ?? defaultLanguages(),
  )

  locale.value = nextLocale
  synchronizeDocument(nextLocale, optionDocument(options))
  return nextLocale
}

export function setLocale(
  nextLocale: SupportedLocale,
  options: LocaleRuntimeOptions = {},
): void {
  locale.value = nextLocale
  synchronizeDocument(nextLocale, optionDocument(options))
  writeStoredLocale(optionStorage(options), nextLocale)
}

export type { SupportedLocale } from './locales'
export { SUPPORTED_LOCALES } from './locales'
