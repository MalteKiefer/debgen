import type { MessageSchema } from './en'
import { interfaceRu } from './interface-slavic-asian'

export const ru = {
  meta: { title: 'DebGen - Создание источников пакетов Debian', noScript: 'Для создания источников пакетов Debian в DebGen требуется JavaScript.' },
  locale: {
    label: 'Выбрать язык',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} продуктов', one: '{count} продукт', two: '{count} продукта', few: '{count} продукта', many: '{count} продуктов', other: '{count} продукта' },
    sources: { zero: 'Выбрано источников: {count}', one: 'Выбран {count} источник', two: 'Выбрано {count} источника', few: 'Выбрано {count} источника', many: 'Выбрано {count} источников', other: 'Выбрано {count} источника' },
    packages: { zero: '{count} пакетов', one: '{count} пакет', two: '{count} пакета', few: '{count} пакета', many: '{count} пакетов', other: '{count} пакета' },
    files: { zero: '{count} файлов', one: '{count} файл', two: '{count} файла', few: '{count} файла', many: '{count} файлов', other: '{count} файла' },
  },
  ...interfaceRu,
} satisfies MessageSchema
