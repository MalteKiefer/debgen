import type { MessageSchema } from './en'
import { interfaceFr } from './interface-romance'

export const fr = {
  meta: { title: 'DebGen - Créer des sources de paquets Debian', noScript: 'DebGen nécessite JavaScript pour générer des sources de paquets Debian.' },
  locale: {
    label: 'Choisir la langue',
    names: {
      en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
      ru: 'Русский', pt: 'Português', pl: 'Polski', 'zh-CN': '简体中文', ja: '日本語',
    },
  },
  counts: {
    products: { zero: '{count} produits', one: '{count} produit', two: '{count} produits', few: '{count} produits', many: '{count} produits', other: '{count} produits' },
    sources: { zero: '{count} source sélectionnée', one: '{count} source sélectionnée', two: '{count} sources sélectionnées', few: '{count} sources sélectionnées', many: '{count} sources sélectionnées', other: '{count} sources sélectionnées' },
    files: { zero: '{count} fichiers', one: '{count} fichier', two: '{count} fichiers', few: '{count} fichiers', many: '{count} fichiers', other: '{count} fichiers' },
  },
  ...interfaceFr,
} satisfies MessageSchema
