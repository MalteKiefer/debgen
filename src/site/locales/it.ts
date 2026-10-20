import type { LocaleCopy } from './en'

export const it = {
  skipLink: 'Vai alla configurazione',
  hero: { title: 'Configuriamo {release}.', lead: 'Scegli la tua versione di Debian e il software che desideri. DebGen scrive i file delle sorgenti e mostra ogni comando prima che tu lo esegua.' },
  sections: { system: 'Il tuo sistema', software: 'Il tuo software', files: 'I tuoi file', install: 'Come installare' },
  software: { selected: '{count} selezionati' },
  files: { downloadAll: 'Scarica tutti i file (.tar)' },
  install: { debian: 'Installa le sorgenti Debian', vendor: 'Aggiungi i repository dei produttori', packages: 'Aggiorna e installa' },
  footer: { notAffiliated: 'Creato per gli utenti Debian. Non affiliato al progetto Debian.', catalog: '{products} applicazioni da {sources} repository dei produttori.', source: 'Codice sorgente su GitHub', report: 'Segnala un problema' },
  actions: { copy: 'Copia', download: 'Scarica', copied: 'Copiato.', downloaded: 'Scaricato.' },
  errors: { copyFailed: 'Copia non riuscita. Copia il contenuto manualmente.', downloadFailed: 'Download non riuscito. Salva il file manualmente.' },
  trust: { review: 'Verifica ogni sorgente, chiave e comando prima dell’uso.' },
  seo: { workbenchTitle: 'Workbench DebGen', workbenchDescription: 'Crea configurazioni trasparenti delle sorgenti di pacchetti Debian e verifica ogni repository prima dell’uso.', repositoryDescription: 'Verifica provenienza, chiavi di firma, pacchetti e compatibilità Debian di un repository.', sourceDescription: 'Ispeziona una sorgente di pacchetti, la chiave di firma e i sistemi Debian supportati.', categoryDescription: 'Esplora le sorgenti di pacchetti Debian verificate per categoria.' },
} satisfies LocaleCopy
