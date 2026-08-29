import type { MessageSchema } from './en'

export const zhCN = {
  meta: { title: 'DebGen - 创建 Debian 软件包源' },
  locale: {
    label: '选择语言',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} 个产品', one: '{count} 个产品', two: '{count} 个产品', few: '{count} 个产品', many: '{count} 个产品', other: '{count} 个产品' },
    sources: { zero: '{count} 个源', one: '{count} 个源', two: '{count} 个源', few: '{count} 个源', many: '{count} 个源', other: '{count} 个源' },
    files: { zero: '{count} 个文件', one: '{count} 个文件', two: '{count} 个文件', few: '{count} 个文件', many: '{count} 个文件', other: '{count} 个文件' },
  },
} satisfies MessageSchema
