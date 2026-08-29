export const en = {
  meta: {
    title: 'DebGen - Create Debian package sources',
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
      zero: '{count} sources',
      one: '{count} source',
      two: '{count} sources',
      few: '{count} sources',
      many: '{count} sources',
      other: '{count} sources',
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
} as const

type RecursiveStringSchema<T> = {
  readonly [Key in keyof T]: T[Key] extends string ? string : RecursiveStringSchema<T[Key]>
}

export type MessageSchema = RecursiveStringSchema<typeof en>
