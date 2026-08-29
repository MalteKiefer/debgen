import type { SiteCopy } from './en'

export const it = {
  steps: { system: 'Sistema', debian: 'Sorgenti Debian', repositories: 'Repository', review: 'Verifica', export: 'Esporta' },
  actions: { continue: 'Continua', back: 'Indietro', copy: 'Copia', download: 'Scarica', export: 'Esporta piano' },
  errors: { invalidSelection: 'La configurazione selezionata non è valida.', copyFailed: 'Copia non riuscita. Copia il contenuto manualmente.', downloadFailed: 'Download non riuscito. Salva il file manualmente.' },
  audit: { source: 'Sorgente', operator: 'Operatore', repository: 'Repository', signingKey: 'Chiave di firma', fingerprint: 'Impronta digitale', compatibility: 'Compatibilità', lastVerified: 'Ultima verifica' },
  search: { label: 'Cerca repository', placeholder: 'Cerca software, pacchetti o host di repository', empty: 'Nessun repository corrisponde alla ricerca.' },
  trust: { official: 'Sorgente ufficiale del produttore o del progetto', endorsed: 'Sorgente della comunità esplicitamente consigliata dal progetto', review: 'Verifica ogni sorgente, chiave e comando prima dell’uso.' },
  seo: { workbenchTitle: 'Workbench DebGen', workbenchDescription: 'Crea configurazioni trasparenti delle sorgenti di pacchetti Debian e verifica ogni repository prima dell’uso.', repositoryDescription: 'Verifica provenienza, chiavi di firma, pacchetti e compatibilità Debian di un repository.', sourceDescription: 'Ispeziona una sorgente di pacchetti, la chiave di firma e i sistemi Debian supportati.', categoryDescription: 'Esplora le sorgenti di pacchetti Debian verificate per categoria.' },
} satisfies SiteCopy
