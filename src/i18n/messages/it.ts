import type { MessageSchema } from './en'
import { interfaceIt } from './interface-romance'

export const it = {
  meta: { title: 'DebGen - Crea sorgenti di pacchetti Debian', noScript: 'DebGen richiede JavaScript per generare sorgenti di pacchetti Debian.' },
  locale: {
    label: 'Seleziona lingua',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} prodotti', one: '{count} prodotto', two: '{count} prodotti', few: '{count} prodotti', many: '{count} prodotti', other: '{count} prodotti' },
    sources: { zero: '{count} sorgenti selezionate', one: '{count} sorgente selezionata', two: '{count} sorgenti selezionate', few: '{count} sorgenti selezionate', many: '{count} sorgenti selezionate', other: '{count} sorgenti selezionate' },
    packages: { zero: '{count} pacchetti', one: '{count} pacchetto', two: '{count} pacchetti', few: '{count} pacchetti', many: '{count} pacchetti', other: '{count} pacchetti' },
    files: { zero: '{count} file', one: '{count} file', two: '{count} file', few: '{count} file', many: '{count} file', other: '{count} file' },
  },
  ...interfaceIt,
} satisfies MessageSchema
