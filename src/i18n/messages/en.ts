import { interfaceEn } from './interface'

export const en = {
  meta: {
    title: 'DebGen - Create Debian package sources',
    noScript: 'DebGen needs JavaScript to generate Debian package sources.',
  },
  locale: {
    label: 'Select language',
    names: {
      en: 'English',
      de: 'Deutsch',
      es: 'Español',
      fr: 'Français',
      it: 'Italiano',
      ru: 'Русский',
      pt: 'Português',
      pl: 'Polski',
      'zh-CN': '简体中文',
      ja: '日本語',
    },
  },
  counts: {
    products: {
      zero: '{count} products',
      one: '{count} product',
      two: '{count} products',
      few: '{count} products',
      many: '{count} products',
      other: '{count} products',
    },
    sources: {
      zero: '{count} sources selected',
      one: '{count} source selected',
      two: '{count} sources selected',
      few: '{count} sources selected',
      many: '{count} sources selected',
      other: '{count} sources selected',
    },
    files: {
      zero: '{count} files',
      one: '{count} file',
      two: '{count} files',
      few: '{count} files',
      many: '{count} files',
      other: '{count} files',
    },
  },
  ...interfaceEn,
} as const

type RecursiveStringSchema<T> = {
  readonly [Key in keyof T]: T[Key] extends string ? string : RecursiveStringSchema<T[Key]>
}

export type MessageSchema = RecursiveStringSchema<typeof en>
