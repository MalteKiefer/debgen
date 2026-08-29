import type { MessageSchema } from './en'
import { interfaceZhCN } from './interface-slavic-asian'

export const zhCN = {
  meta: { title: 'DebGen - 创建 Debian 软件包源', noScript: 'DebGen 需要 JavaScript 才能生成 Debian 软件包源。' },
  locale: {
    label: '选择语言',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} 个产品', one: '{count} 个产品', two: '{count} 个产品', few: '{count} 个产品', many: '{count} 个产品', other: '{count} 个产品' },
    sources: { zero: '已选择 {count} 个源', one: '已选择 {count} 个源', two: '已选择 {count} 个源', few: '已选择 {count} 个源', many: '已选择 {count} 个源', other: '已选择 {count} 个源' },
    files: { zero: '{count} 个文件', one: '{count} 个文件', two: '{count} 个文件', few: '{count} 个文件', many: '{count} 个文件', other: '{count} 个文件' },
  },
  ...interfaceZhCN,
} satisfies MessageSchema
