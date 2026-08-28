# Task 7 Report: Review, Export und Debian-Studio-Politur

## Status

Task 7 ist umgesetzt. Der Drei-Schritt-Flow verbindet Systemzustand, Herstellerwahl und Review; Dateien, Befehle, Warnungen und leere Auswahl werden aus den bestehenden reinen Generatoren komponiert.

## RED-Evidenz

1. Die ersten fokussierten Tests scheiterten erwartungsgemäß, weil `ReviewStep.vue`, `GeneratedFileTabs.vue` und `InstallCommands.vue` noch fehlten und Schritt 2 im Generator nur ein Platzhalter war.
2. Der Trennungstest schlug anschließend fehl, weil der Task-4-Installationsgenerator die gewählten Pakete noch in den als Repository-Einrichtung beschrifteten UI-Block einfügte.
3. Der Integrationsregressionstest reproduzierte einen Renderfehler, wenn eine Auswahl durch einen Systemwechsel inkompatibel wurde und direkt zu Schritt 3 gesprungen wurde.
4. Der Tastaturtest für lange Installationsausgaben schlug fehl, solange die scrollbaren Befehlsvorschauen keinen Fokus annehmen konnten.

## GREEN-Evidenz

- Fokussierte Komponenten- und Generatortests: grün.
- Vollständiger Projektcheck: `npm run check` grün.
- Ergebnis des vollständigen Laufs: 21 Testdateien, 195 Tests, 0 Fehler.
- `vue-tsc -b`: grün.
- `eslint .`: grün.
- API-Erzeugung und Vite-Produktions-Build: grün.
- Visuelle Prüfung bei 1440 × 1000 und 390 × 844 Pixeln: kein horizontaler Seitenüberlauf.
- Browserprüfung: drei Ausgabemodi, Dateireiter per Pfeiltasten, Warnungen, getrennte Befehle und leerer Review-Zustand funktionieren; keine Konsolenwarnungen oder -fehler.

## Umgesetzte Funktionen

- `perVendor` als Standard sowie `combined` und `byCategory` als zugängliche Radioauswahl.
- Debian-Basisdatei immer zuerst; Herstellerdateien werden über `generateVendorArtifacts` und `groupArtifacts` erzeugt.
- Einzelne Dateireiter mit Vorschau, Kopieren, Download, Live-Feedback und manueller Fehleralternative.
- Repository-Einrichtung und Paketinstallation als getrennte, einzeln kopierbare Befehlsblöcke.
- Produktbezogene Warnungen vor Export und Installation.
- Gültiger leerer Herstellerzustand mit ausschließlich der Debian-Datei.
- Automatische Bereinigung inkompatibler Auswahl nach Release- oder Architekturwechsel, auch bei direktem Sprung in den Review.
- Warm-dunkle Studio-Shell, helle Arbeitsfläche, Debian-Rot, responsive lineare Mobilansicht, mindestens 44 Pixel große Ziele, sichtbare Fokuszustände und reduzierte Bewegung.

## Dateien

Neu:

- `src/components/ReviewStep.vue`
- `src/components/ReviewStep.test.ts`
- `src/components/GeneratedFileTabs.vue`
- `src/components/GeneratedFileTabs.test.ts`
- `src/components/InstallCommands.vue`
- `src/components/InstallCommands.test.ts`

Geändert:

- `src/components/SourceGenerator.vue`
- `src/components/SourceGenerator.test.ts`
- `src/components/StudioHeader.vue`
- `src/features/vendors/generate.ts`
- `src/styles/main.scss`
- `src/plugins/vuetify.ts`
- `eslint.config.js`

## Selbstreview

- Keine herstellerspezifischen Repository-Zeichenketten in UI-Komponenten; die UI konsumiert Katalog und Generatoren.
- Der optionale Generatorparameter trennt die Paketinstallation nur für die UI. Der bisherige Standard von `generateInstallScript` bleibt für bestehende Aufrufer unverändert.
- Kopier- und Downloadfehler zerstören weder aktive Datei noch Vorschau.
- Alle neuen sichtbaren Texte sind Deutsch; technische Dateinamen, Paketnamen und Befehle bleiben exakt.
- Native Steuerelemente, Landmarken, Rollen, Live-Regionen, Fokusreihenfolge und reduzierte Bewegung wurden geprüft.
- Keine offenen Review-Funde im Task-7-Umfang.

## Commit

Vorgesehener neutraler Commit: `feat: add repository review and export`
