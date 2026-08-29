import type { SiteCopy } from './en'

export const de = {
  steps: { system: 'System & Quellen', repositories: 'Repositorys', review: 'Prüfen', export: 'Exportieren' },
  actions: { continue: 'Weiter', back: 'Zurück', copy: 'Kopieren', download: 'Herunterladen', export: 'Plan exportieren' },
  errors: { invalidSelection: 'Die gewählte Konfiguration ist ungültig.', copyFailed: 'Kopieren fehlgeschlagen. Kopiere den Inhalt manuell.', downloadFailed: 'Herunterladen fehlgeschlagen. Speichere die Datei manuell.' },
  audit: { source: 'Quelle', operator: 'Betreiber', repository: 'Repository', signingKey: 'Signaturschlüssel', fingerprint: 'Fingerabdruck', compatibility: 'Kompatibilität', lastVerified: 'Zuletzt geprüft' },
  search: { label: 'Repositorys suchen', placeholder: 'Software, Pakete oder Repository-Hosts suchen', empty: 'Keine Repositorys entsprechen deiner Suche.' },
  trust: { official: 'Offizielle Upstream- oder Herstellerquelle', endorsed: 'Von Upstream ausdrücklich empfohlene Community-Quelle', review: 'Prüfe jede Quelle, jeden Schlüssel und jeden Befehl vor der Verwendung.' },
  seo: { workbenchTitle: 'DebGen Workbench', workbenchDescription: 'Erstelle transparente Debian-Paketquellen und prüfe jedes Repository vor der Verwendung.', repositoryDescription: 'Prüfe Herkunft, Signaturschlüssel, Pakete und Debian-Kompatibilität eines Repositorys.', sourceDescription: 'Untersuche eine Paketquelle, ihren Signaturschlüssel und unterstützte Debian-Systeme.', categoryDescription: 'Entdecke geprüfte Debian-Paketquellen nach Kategorie.' },
} satisfies SiteCopy
