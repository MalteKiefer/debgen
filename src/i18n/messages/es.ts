import type { MessageSchema } from './en'

export const es = {
  meta: { title: 'DebGen - Crear fuentes de paquetes de Debian' },
  locale: {
    label: 'Seleccionar idioma',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} productos', one: '{count} producto', two: '{count} productos', few: '{count} productos', many: '{count} productos', other: '{count} productos' },
    sources: { zero: '{count} fuentes', one: '{count} fuente', two: '{count} fuentes', few: '{count} fuentes', many: '{count} fuentes', other: '{count} fuentes' },
    files: { zero: '{count} archivos', one: '{count} archivo', two: '{count} archivos', few: '{count} archivos', many: '{count} archivos', other: '{count} archivos' },
  },
} satisfies MessageSchema
