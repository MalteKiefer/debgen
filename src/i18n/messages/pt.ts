import type { MessageSchema } from './en'
import { interfacePt } from './interface-romance'

export const pt = {
  meta: { title: 'DebGen - Criar fontes de pacotes Debian', noScript: 'O DebGen precisa de JavaScript para gerar fontes de pacotes Debian.' },
  locale: {
    label: 'Selecionar idioma',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} produtos', one: '{count} produto', two: '{count} produtos', few: '{count} produtos', many: '{count} produtos', other: '{count} produtos' },
    sources: { zero: '{count} fontes selecionadas', one: '{count} fonte selecionada', two: '{count} fontes selecionadas', few: '{count} fontes selecionadas', many: '{count} fontes selecionadas', other: '{count} fontes selecionadas' },
    files: { zero: '{count} ficheiros', one: '{count} ficheiro', two: '{count} ficheiros', few: '{count} ficheiros', many: '{count} ficheiros', other: '{count} ficheiros' },
  },
  ...interfacePt,
} satisfies MessageSchema
