import type { MessageSchema } from './en'

export const fr = {
  meta: { title: 'DebGen - Créer des sources de paquets Debian' },
  locale: {
    label: 'Choisir la langue',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} produits', one: '{count} produit', two: '{count} produits', few: '{count} produits', many: '{count} produits', other: '{count} produits' },
    sources: { zero: '{count} sources', one: '{count} source', two: '{count} sources', few: '{count} sources', many: '{count} sources', other: '{count} sources' },
    files: { zero: '{count} fichiers', one: '{count} fichier', two: '{count} fichiers', few: '{count} fichiers', many: '{count} fichiers', other: '{count} fichiers' },
  },
} satisfies MessageSchema
