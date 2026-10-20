import type { LocaleCopy } from './en'

export const de = {
  skipLink: 'Zur Einrichtung springen',
  hero: { title: 'Richten wir {release} ein.', lead: 'Wähle deine Debian-Version und die gewünschte Software. DebGen schreibt die Quelldateien und zeigt jeden Befehl, bevor du ihn ausführst.' },
  sections: { system: 'Dein System', software: 'Deine Software', files: 'Deine Dateien', install: 'So installierst du' },
  software: { selected: '{count} ausgewählt' },
  files: { downloadAll: 'Alle Dateien herunterladen (.tar)' },
  install: { debian: 'Debian-Quellen installieren', vendor: 'Herstellerquellen hinzufügen', packages: 'Aktualisieren und installieren' },
  footer: { notAffiliated: 'Für Debian-Nutzer gemacht. Nicht mit dem Debian-Projekt verbunden.', catalog: '{products} Programme aus {sources} Herstellerquellen.', source: 'Quellcode auf GitHub', report: 'Problem melden' },
  actions: { copy: 'Kopieren', download: 'Herunterladen', copied: 'Kopiert.', downloaded: 'Heruntergeladen.' },
  errors: { copyFailed: 'Kopieren fehlgeschlagen. Kopiere den Inhalt manuell.', downloadFailed: 'Herunterladen fehlgeschlagen. Speichere die Datei manuell.' },
  trust: { review: 'Prüfe jede Quelle, jeden Schlüssel und jeden Befehl vor der Verwendung.' },
  seo: { workbenchTitle: 'DebGen Workbench', workbenchDescription: 'Erstelle transparente Debian-Paketquellen und prüfe jedes Repository vor der Verwendung.', repositoryDescription: 'Prüfe Herkunft, Signaturschlüssel, Pakete und Debian-Kompatibilität eines Repositorys.', sourceDescription: 'Untersuche eine Paketquelle, ihren Signaturschlüssel und unterstützte Debian-Systeme.', categoryDescription: 'Entdecke geprüfte Debian-Paketquellen nach Kategorie.' },
} satisfies LocaleCopy
