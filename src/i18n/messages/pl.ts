import type { MessageSchema } from './en'

export const pl = {
  meta: { title: 'DebGen - Tworzenie źródeł pakietów Debiana' },
  locale: {
    label: 'Wybierz język',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} produktów', one: '{count} produkt', two: '{count} produkty', few: '{count} produkty', many: '{count} produktów', other: '{count} produktu' },
    sources: { zero: '{count} źródeł', one: '{count} źródło', two: '{count} źródła', few: '{count} źródła', many: '{count} źródeł', other: '{count} źródła' },
    files: { zero: '{count} plików', one: '{count} plik', two: '{count} pliki', few: '{count} pliki', many: '{count} plików', other: '{count} pliku' },
  },
} satisfies MessageSchema
