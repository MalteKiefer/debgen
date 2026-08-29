import type { SupportedLocale } from '../locales'
import { de } from './de'
import { en, type MessageSchema } from './en'
import { es } from './es'
import { fr } from './fr'
import { it } from './it'
import { ja } from './ja'
import { pl } from './pl'
import { pt } from './pt'
import { ru } from './ru'
import { zhCN } from './zh-CN'

export const messages = {
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
} as const satisfies Record<SupportedLocale, MessageSchema>

export type { MessageSchema } from './en'
