# Task 5 – Debian Studio Shell

## RED

- Neue Komponententests für Kopfbereich, Drei-Schritt-Navigation, Systemschritt und responsive Auswahlzusammenfassung scheiterten zunächst erwartungsgemäß, weil die vier Komponenten nicht existierten.
- Der Test für die Architekturauswahl scheiterte zunächst, weil `GeneratorControls` noch keinen Architekturzustand bereitstellte.
- Der Test für den deutschen Veröffentlichungsstatus scheiterte zunächst erwartungsgemäß an der vorhandenen Ausgabe `stable`.

## GREEN

- `StudioHeader`, `StudioProgress`, `SystemStep` und `SelectionSummary` bilden die zugängliche, deutsche Studio-Hülle.
- Der oberste Generator hält Version und Architektur als gemeinsamen Zustand; die vorhandene Debian-Quellgenerierung bleibt unverändert und weiterhin erreichbar.
- Schrittwechsel funktionieren per Schaltfläche sowie Enter und Leertaste. Navigation, Landmarks, Live-Status, sichtbare Fokusmarkierung, 44-Pixel-Ziele und reduzierter Bewegungsmodus sind berücksichtigt.
- Die Zusammenfassung zeigt Version, Architektur, Anzahl und Ausgabemodus; auf kleinen Ansichten erscheint ihre kompakte mobile Variante als untere, klebende Leiste.
- Sämtliche bearbeiteten UI-Texte sind deutsch; technische Dateinamen, Befehle und Paketquelleninhalt bleiben unverändert.

## Tests und Prüfung

- RED: `npm run test:run -- src/components/StudioHeader.test.ts src/components/StudioProgress.test.ts src/components/SystemStep.test.ts src/components/SelectionSummary.test.ts src/components/GeneratorControls.test.ts` – erwartete Fehlermeldungen für fehlende Komponenten/Architektursteuerung.
- GREEN: `npm run test:run` – 16 Dateien, 162 Tests erfolgreich.
- `npm run typecheck` – erfolgreich.
- `npm run lint` – erfolgreich.
- `git diff --check` – ohne Whitespace-Fehler.

## Dateien

- Neu: `StudioHeader`, `StudioProgress`, `SystemStep`, `SelectionSummary` sowie die zugehörigen Komponententests.
- Aktualisiert: App-Hülle, Generator und Steuerung, Ausgabe-Komponente und ihre Tests sowie die responsiven Studio-Stile.
- Nicht geändert: Debian- und Vendor-Generierungslogik.

## Commit

- `feat: introduce Debian Studio workflow`

## Selbstreview

- Brief und UI-Abschnitt der freigegebenen Spec abgeglichen: drei Schritte, Architekturzustand, deutsche Texte, Tastaturbedienung und responsive Zusammenfassung sind abgedeckt.
- Keine Vendor-Generator- oder Katalogdatei wurde verändert.
- Bekannte Einschränkung: Die Inhalte für die Schritte „Offizielle Software“ und „Prüfen und exportieren“ sind bewusst Platzhalter für die nachfolgenden Tasks; die Systemauswahl bleibt beim Wechsel erhalten.
