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

## Fix-Runde 1

### RED

- Der semantische Responsive-Test fand keine separate Desktop-Zusammenfassung und zeigte, dass die mobile Variante nur Quellenanzahl und Architektur enthielt.
- Die Tests für Kopfbereich und Generator-Aktionen belegten, dass die einheitliche Touchziel-Klasse fehlte.

### GREEN

- Desktop und Mobil zeigen nun jeweils Release, Architektur, Repository-Anzahl und Ausgabemodus als eigene sichtbare Zusammenfassungen.
- Alle in Task 5 eingeführten `v-btn`-Aktionen im Kopfbereich und Generator nutzen `studio-touch-target`; die CSS-Regel garantiert mindestens 44 Pixel Höhe.
- Tests decken Space-Tastennavigation sowie den Erhalt von Release und Architektur nach einem Schrittwechsel ab.

### Prüfung

- Fokussiert: 4 Dateien, 22 Tests erfolgreich.
- Gesamt: `npm run test:run` – 16 Dateien, 165 Tests erfolgreich.
- `npm run typecheck`, `npm run lint` und `git diff --check` erfolgreich.

### Commit

- `fix: complete mobile studio summary`

## Fix-Runde 2

### RED

- Der Viewport-Test mit einem `matchMedia('(max-width: 700px)')`-Stub zeigte, dass Desktop- und mobile Zusammenfassung gleichzeitig im DOM lagen. Damit ließ sich ihre tatsächliche Sichtbarkeit bei kleinen Ansichten nicht nachweisen.

### GREEN

- `SelectionSummary` bindet die Ansicht an die Media Query und reagiert auf deren Änderungsereignis.
- Bei Desktop-Breite wird ausschließlich die vollständige Desktop-Zusammenfassung gerendert; bei maximal 700 Pixeln ausschließlich die vollständige mobile Zusammenfassung.
- Der mobile Test prüft Release, Architektur, Repository-Anzahl und Ausgabemodus im einzigen gerenderten Mobile-Block.
- Der fehlende ESLint-Global für den DOM-Typ `MediaQueryListEvent` wurde analog zu `ResizeObserver` ergänzt.

### Prüfung

- RED: `npm run test:run -- src/components/SelectionSummary.test.ts` – zwei erwartete Sichtbarkeitsfehler.
- GREEN, fokussiert: 2 Tests erfolgreich.
- Gesamt: `npm run test:run` – 16 Dateien, 166 Tests erfolgreich.
- `npm run typecheck`, `npm run lint` und `git diff --check` erfolgreich.

### Commit

- `fix: render one responsive studio summary`
