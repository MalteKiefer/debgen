import type { MessageSchema } from './en'
import { interfacePl } from './interface-slavic-asian'

export const pl = {
  meta: { title: 'DebGen - Tworzenie źródeł pakietów Debiana', noScript: 'DebGen wymaga JavaScript do tworzenia źródeł pakietów Debiana.' },
  locale: {
    label: 'Wybierz język',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} produktów', one: '{count} produkt', two: '{count} produkty', few: '{count} produkty', many: '{count} produktów', other: '{count} produktu' },
    sources: { zero: 'Wybrano {count} źródeł', one: 'Wybrano {count} źródło', two: 'Wybrano {count} źródła', few: 'Wybrano {count} źródła', many: 'Wybrano {count} źródeł', other: 'Wybrano {count} źródła' },
    packages: { zero: '{count} pakietów', one: '{count} pakiet', two: '{count} pakiety', few: '{count} pakiety', many: '{count} pakietów', other: '{count} pakietu' },
    files: { zero: '{count} plików', one: '{count} plik', two: '{count} pliki', few: '{count} pliki', many: '{count} plików', other: '{count} pliku' },
  },
  ...interfacePl,
} satisfies MessageSchema
