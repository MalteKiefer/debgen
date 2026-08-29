import type { MessageSchema } from './en'

export const ru = {
  meta: { title: 'DebGen - Создание источников пакетов Debian' },
  locale: {
    label: 'Выбрать язык',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} продуктов', one: '{count} продукт', two: '{count} продукта', few: '{count} продукта', many: '{count} продуктов', other: '{count} продукта' },
    sources: { zero: '{count} источников', one: '{count} источник', two: '{count} источника', few: '{count} источника', many: '{count} источников', other: '{count} источника' },
    files: { zero: '{count} файлов', one: '{count} файл', two: '{count} файла', few: '{count} файла', many: '{count} файлов', other: '{count} файла' },
  },
} satisfies MessageSchema
