import type { MessageSchema } from './en'
import { interfaceDe } from './interface'

export const de = {
  meta: { title: 'DebGen - Debian-Paketquellen erstellen', noScript: 'DebGen benötigt JavaScript, um Debian-Paketquellen zu erzeugen.' },
  locale: {
    label: 'Sprache auswählen',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} Produkte', one: '{count} Produkt', two: '{count} Produkte', few: '{count} Produkte', many: '{count} Produkte', other: '{count} Produkte' },
    sources: { zero: '{count} Paketquellen ausgewählt', one: '{count} Paketquelle ausgewählt', two: '{count} Paketquellen ausgewählt', few: '{count} Paketquellen ausgewählt', many: '{count} Paketquellen ausgewählt', other: '{count} Paketquellen ausgewählt' },
    packages: { zero: '{count} Pakete', one: '{count} Paket', two: '{count} Pakete', few: '{count} Pakete', many: '{count} Pakete', other: '{count} Pakete' },
    files: { zero: '{count} Dateien', one: '{count} Datei', two: '{count} Dateien', few: '{count} Dateien', many: '{count} Dateien', other: '{count} Dateien' },
  },
  ...interfaceDe,
} satisfies MessageSchema
