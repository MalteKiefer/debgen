import type { MessageSchema } from './en'

export const it = {
  meta: { title: 'DebGen - Crea sorgenti di pacchetti Debian' },
  locale: {
    label: 'Seleziona lingua',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} prodotti', one: '{count} prodotto', two: '{count} prodotti', few: '{count} prodotti', many: '{count} prodotti', other: '{count} prodotti' },
    sources: { zero: '{count} sorgenti', one: '{count} sorgente', two: '{count} sorgenti', few: '{count} sorgenti', many: '{count} sorgenti', other: '{count} sorgenti' },
    files: { zero: '{count} file', one: '{count} file', two: '{count} file', few: '{count} file', many: '{count} file', other: '{count} file' },
  },
} satisfies MessageSchema
