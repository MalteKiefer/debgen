import type { SiteCopy } from './en'

export const fr = {
  steps: { system: 'Système', debian: 'Sources Debian', repositories: 'Dépôts', review: 'Vérifier', export: 'Exporter' },
  actions: { continue: 'Continuer', back: 'Retour', copy: 'Copier', download: 'Télécharger', export: 'Exporter le plan' },
  errors: { invalidSelection: 'La configuration sélectionnée n’est pas valide.', copyFailed: 'La copie a échoué. Copiez le contenu manuellement.', downloadFailed: 'Le téléchargement a échoué. Enregistrez le fichier manuellement.' },
  audit: { source: 'Source', operator: 'Opérateur', repository: 'Dépôt', signingKey: 'Clé de signature', fingerprint: 'Empreinte', compatibility: 'Compatibilité', lastVerified: 'Dernière vérification' },
  search: { label: 'Rechercher des dépôts', placeholder: 'Rechercher des logiciels, paquets ou hôtes de dépôts', empty: 'Aucun dépôt ne correspond à votre recherche.' },
  trust: { official: 'Source officielle du projet ou du fabricant', endorsed: 'Source communautaire explicitement recommandée par le projet', review: 'Vérifiez chaque source, clé et commande avant utilisation.' },
  seo: { workbenchTitle: 'Atelier DebGen', workbenchDescription: 'Créez des configurations transparentes de sources Debian et vérifiez chaque dépôt avant utilisation.', repositoryDescription: 'Vérifiez la provenance, les clés de signature, les paquets et la compatibilité Debian d’un dépôt.', sourceDescription: 'Inspectez une source de paquets, sa clé de signature et les systèmes Debian pris en charge.', categoryDescription: 'Explorez les sources de paquets Debian vérifiées par catégorie.' },
} satisfies SiteCopy
