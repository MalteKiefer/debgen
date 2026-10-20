import type { LocaleCopy } from './en'

export const fr = {
  skipLink: 'Aller à la configuration',
  hero: { title: 'Configurons {release}.', lead: 'Choisissez votre version de Debian et les logiciels souhaités. DebGen écrit les fichiers de sources et affiche chaque commande avant que vous l’exécutiez.' },
  sections: { system: 'Votre système', software: 'Vos logiciels', files: 'Vos fichiers', install: 'Installation' },
  software: { selected: '{count} sélectionnés' },
  files: { downloadAll: 'Télécharger tous les fichiers (.tar)' },
  install: { debian: 'Installer les sources Debian', vendor: 'Ajouter les dépôts des éditeurs', packages: 'Mettre à jour et installer' },
  footer: { notAffiliated: 'Conçu pour les utilisateurs de Debian. Sans lien avec le projet Debian.', catalog: '{products} applications issues de {sources} dépôts d’éditeurs.', source: 'Code source sur GitHub', report: 'Signaler un problème' },
  actions: { copy: 'Copier', download: 'Télécharger', copied: 'Copié.', downloaded: 'Téléchargé.' },
  errors: { copyFailed: 'La copie a échoué. Copiez le contenu manuellement.', downloadFailed: 'Le téléchargement a échoué. Enregistrez le fichier manuellement.' },
  trust: { review: 'Vérifiez chaque source, clé et commande avant utilisation.' },
  seo: { workbenchTitle: 'Atelier DebGen', workbenchDescription: 'Créez des configurations transparentes de sources Debian et vérifiez chaque dépôt avant utilisation.', repositoryDescription: 'Vérifiez la provenance, les clés de signature, les paquets et la compatibilité Debian d’un dépôt.', sourceDescription: 'Inspectez une source de paquets, sa clé de signature et les systèmes Debian pris en charge.', categoryDescription: 'Explorez les sources de paquets Debian vérifiées par catégorie.' },
} satisfies LocaleCopy
