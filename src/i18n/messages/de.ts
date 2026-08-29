import type { MessageSchema } from './en'

export const de = {
  meta: { title: 'DebGen - Debian-Paketquellen erstellen' },
  locale: {
    label: 'Sprache auswählen',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} Produkte', one: '{count} Produkt', two: '{count} Produkte', few: '{count} Produkte', many: '{count} Produkte', other: '{count} Produkte' },
    sources: { zero: '{count} Quellen', one: '{count} Quelle', two: '{count} Quellen', few: '{count} Quellen', many: '{count} Quellen', other: '{count} Quellen' },
    files: { zero: '{count} Dateien', one: '{count} Datei', two: '{count} Dateien', few: '{count} Dateien', many: '{count} Dateien', other: '{count} Dateien' },
  },
} satisfies MessageSchema
