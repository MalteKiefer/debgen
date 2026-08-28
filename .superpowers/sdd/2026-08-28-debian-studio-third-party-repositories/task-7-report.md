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

## Fix-Runde 1

### Status

Alle Review-Findings wurden testgetrieben behoben. Das Setup-Skript bleibt durchgehend ein `GeneratedArtifact`; Dateiname, MIME-Typ, Vorschau, Kopieren und eigener Download sind getrennt verfügbar. Die Dateireiter besitzen vollständige ARIA-Beziehungen und unterstützen Pfeiltasten, Pos1 und Ende. Rückmeldungen aus laufenden Kopiervorgängen werden bei geänderten Befehls-Props sicher verworfen.

Die Kollisionsprüfung umfasst nun die komplette Debian- und Hersteller-Artefaktliste, einschließlich `debian.sources` und `debian.list`. Der Paketinstallationsbefehl wird ausschließlich von der reinen Generierungsschicht erzeugt. Alle Vuetify-Auswahlsteuerelemente erhalten global eine Mindesthöhe von 44 Pixeln; scrollbare Vorschauen sind per Tastatur erreichbar, benannt und sichtbar fokussiert. Kategorien werden mit deutschen Bezeichnungen ausgegeben.

### RED-Evidenz

1. Der neue Generator-Test schlug zunächst fehl, weil `generatePackageInstallCommand` nicht existierte.
2. Der Download-Test zeigte den fest verdrahteten MIME-Typ `text/plain` statt `text/x-shellscript`.
3. Die Installationskomponente kannte nur den Skriptinhalt, nicht das vollständige Artefakt, und bot keinen separaten Download.
4. Prop-Wechsel ließen bestätigte und noch ausstehende Kopier-Rückmeldungen sichtbar werden.
5. Die ARIA-Tests fanden `aria-controls`-Ziele ohne existierende `tabpanel`-Elemente.
6. Die Kollisionsfälle mit Debian-Basisdateien scheiterten, weil nur Herstellerartefakte geprüft wurden.
7. Der Laufzeittest maß für Vuetify-Auswahlsteuerelemente eine Mindesthöhe von 0 statt 44 Pixeln.
8. Dateivorschauen besaßen weder `tabindex` noch einen zugänglichen Namen.
9. Kategoriegruppen verwendeten interne englische Kennungen statt deutscher Beschreibungen.

### GREEN-Evidenz

- Fokussierter Integrationslauf: 8 Testdateien, 86 Tests, 0 Fehler.
- Vollständiger Projektcheck: `npm run check` grün.
- Ergebnis des vollständigen Laufs: 21 Testdateien, 208 Tests, 0 Fehler.
- `vue-tsc -b`, `eslint .`, API-Erzeugung und Vite-Produktions-Build: grün.
- Tastaturnavigation wurde mit echten Fokuswechseln für Pfeil links/rechts, Pos1 und Ende getestet.
- Prop-Wechsel während laufender Kopiervorgänge sowie nach bestätigtem Feedback sind abgedeckt.
- Der visuelle Browser-Smoke-Test konnte in dieser Fix-Runde nicht erneut ausgeführt werden, weil die lokale Browser-Anbindung kein Browser-Backend bereitstellte. Die vorherige Task-7-Prüfung bei Desktop- und Mobilbreite war grün; die aktuelle automatisierte Komponenten-, Typ-, Lint- und Build-Prüfung ist vollständig grün.

### Geänderte Dateien

- `src/components/GeneratedFileTabs.vue` und zugehörige Tests
- `src/components/GeneratorControls.test.ts`
- `src/components/InstallCommands.vue` und zugehörige Tests
- `src/components/ReviewStep.vue`
- `src/features/sources/download.ts` und zugehörige Tests
- `src/features/vendors/generate.ts` und zugehörige Tests
- `src/features/vendors/group.ts` und zugehörige Tests
- `src/plugins/vuetify.ts`
- `src/styles/main.scss`

### Selbstreview

- Keine Paketbefehlsrekonstruktion in der UI; Reihenfolge und Shell-Quoting stammen aus der reinen Generierungsschicht.
- Kollisionsfehler werden vor und nach der Gruppierung geprüft und können die Debian-Basisdatei nicht umgehen.
- Veraltete asynchrone Rückmeldungen werden versionsgebunden verworfen.
- Alle `aria-controls`-Referenzen zeigen auf dauerhaft vorhandene Panels; nur das aktive Panel ist sichtbar und fokussierbar.
- Der 44-Pixel-Test prüft den tatsächlich berechneten Laufzeitstil statt nur einen CSS-Quelltexttreffer.
- Keine offenen Code- oder Test-Findings im Umfang der Fix-Runde.

### Commit

Vorgesehener neutraler Commit: `fix: address repository review findings`
