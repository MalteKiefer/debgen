import type { MessageSchema } from './en'
import { interfaceJa } from './interface-slavic-asian'

export const ja = {
  meta: { title: 'DebGen - Debian パッケージソースを作成', noScript: 'DebGen で Debian パッケージソースを生成するには JavaScript が必要です。' },
  locale: {
    label: '言語を選択',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} 個の製品', one: '{count} 個の製品', two: '{count} 個の製品', few: '{count} 個の製品', many: '{count} 個の製品', other: '{count} 個の製品' },
    sources: { zero: '{count} 個のソースを選択', one: '{count} 個のソースを選択', two: '{count} 個のソースを選択', few: '{count} 個のソースを選択', many: '{count} 個のソースを選択', other: '{count} 個のソースを選択' },
    packages: { zero: '{count} 個のパッケージ', one: '{count} 個のパッケージ', two: '{count} 個のパッケージ', few: '{count} 個のパッケージ', many: '{count} 個のパッケージ', other: '{count} 個のパッケージ' },
    files: { zero: '{count} 個のファイル', one: '{count} 個のファイル', two: '{count} 個のファイル', few: '{count} 個のファイル', many: '{count} 個のファイル', other: '{count} 個のファイル' },
  },
  ...interfaceJa,
} satisfies MessageSchema
