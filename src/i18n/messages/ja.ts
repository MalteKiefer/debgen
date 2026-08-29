import type { MessageSchema } from './en'

export const ja = {
  meta: { title: 'DebGen - Debian パッケージソースを作成' },
  locale: {
    label: '言語を選択',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} 個の製品', one: '{count} 個の製品', two: '{count} 個の製品', few: '{count} 個の製品', many: '{count} 個の製品', other: '{count} 個の製品' },
    sources: { zero: '{count} 個のソース', one: '{count} 個のソース', two: '{count} 個のソース', few: '{count} 個のソース', many: '{count} 個のソース', other: '{count} 個のソース' },
    files: { zero: '{count} 個のファイル', one: '{count} 個のファイル', two: '{count} 個のファイル', few: '{count} 個のファイル', many: '{count} 個のファイル', other: '{count} 個のファイル' },
  },
} satisfies MessageSchema
