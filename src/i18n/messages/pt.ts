import type { MessageSchema } from './en'

export const pt = {
  meta: { title: 'DebGen - Criar fontes de pacotes Debian' },
  locale: {
    label: 'Selecionar idioma',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} produtos', one: '{count} produto', two: '{count} produtos', few: '{count} produtos', many: '{count} produtos', other: '{count} produtos' },
    sources: { zero: '{count} fontes', one: '{count} fonte', two: '{count} fontes', few: '{count} fontes', many: '{count} fontes', other: '{count} fontes' },
    files: { zero: '{count} ficheiros', one: '{count} ficheiro', two: '{count} ficheiros', few: '{count} ficheiros', many: '{count} ficheiros', other: '{count} ficheiros' },
  },
} satisfies MessageSchema
