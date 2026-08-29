import type { MessageSchema } from './en'
import { interfaceEs } from './interface-romance'

export const es = {
  meta: { title: 'DebGen - Crear fuentes de paquetes de Debian', noScript: 'DebGen necesita JavaScript para generar fuentes de paquetes de Debian.' },
  locale: {
    label: 'Seleccionar idioma',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} productos', one: '{count} producto', two: '{count} productos', few: '{count} productos', many: '{count} productos', other: '{count} productos' },
    sources: { zero: '{count} fuentes seleccionadas', one: '{count} fuente seleccionada', two: '{count} fuentes seleccionadas', few: '{count} fuentes seleccionadas', many: '{count} fuentes seleccionadas', other: '{count} fuentes seleccionadas' },
    packages: { zero: '{count} paquetes', one: '{count} paquete', two: '{count} paquetes', few: '{count} paquetes', many: '{count} paquetes', other: '{count} paquetes' },
    files: { zero: '{count} archivos', one: '{count} archivo', two: '{count} archivos', few: '{count} archivos', many: '{count} archivos', other: '{count} archivos' },
  },
  ...interfaceEs,
} satisfies MessageSchema
