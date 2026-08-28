# debgen

debgen ist ein clientseitiger Generator für Debian-Paketquellen. Er erstellt APT-Konfigurationen aus einem geprüften, eingebauten Release- und Herstellerkatalog und veröffentlicht kanonische Konfigurationen als statische Dateien.

## Voraussetzungen und Entwicklung

Verwenden Sie Node.js `>=24.15.0 <25` und die darin enthaltene npm-Version.

```sh
npm ci
npm run dev
```

Verfügbare Projektbefehle:

- `npm run dev` — lokalen Vite-Entwicklungsserver starten.
- `npm run test` — Tests im Watch-Modus ausführen.
- `npm run test:run` — Tests einmal ausführen.
- `npm run typecheck` — Anwendung und Build-Werkzeuge typprüfen.
- `npm run lint` — Repository prüfen.
- `npm run generate:api` — statische API unter `public/api/v1/` neu erzeugen.
- `npm run build` — API erzeugen, typprüfen und die Produktionsseite in `dist/` bauen.
- `npm run check` — Tests, Typprüfung, Linting und Produktions-Build ausführen.
- `npm audit --audit-level=high` — bei Abhängigkeiten mit hohem oder kritischem Hinweis fehlschlagen.

Führen Sie vor einer Änderung `npm run check` aus.

## Unterstützte Releases und Formate

| Release | Debian-Status | Formate | Hinweise |
| --- | --- | --- | --- |
| Trixie | stable | DEB822 `.sources` | Enthält stabile Sicherheitsaktualisierungen, Updates und optionale Backports. |
| Bookworm | oldstable / LTS | DEB822 `.sources`, Legacy-`.list` | Enthält Sicherheit und Updates. Backport-Support endete am 2026-08-09 und ist nicht verfügbar. |
| Bullseye | oldoldstable / LTS | DEB822 `.sources`, Legacy-`.list` | LTS endet am 2026-08-31; enthält Sicherheit und Updates, aber keine Backports. |
| Forky | testing | DEB822 `.sources` | Bietet keine Sicherheitsunterstützung auf Stable-Niveau. |
| Sid | unstable | DEB822 `.sources` | Bietet keine Sicherheitsunterstützung auf Stable-Niveau. |

DEB822 ist das bevorzugte Format. Das veraltete einzeilige Format wird ausschließlich für die Kompatibilität mit Bookworm und Bullseye bereitgestellt.

Jeder erzeugte Eintrag verwendet HTTPS und beschränkt die Archivprüfung auf den mit dem Debian-Release ausgelieferten Schlüsselbund (bzw. die entsprechende `signed-by`-Option im Legacy-Ausgabeformat). Bookworm und Bullseye verwenden `/usr/share/keyrings/debian-archive-keyring.gpg`; Trixie, Forky und Sid verwenden `/usr/share/keyrings/debian-archive-keyring.pgp`. Beide Dateien stammen aus dem Paket `debian-archive-keyring` des jeweiligen Releases; debgen lädt keine Vertrauensschlüssel herunter, verändert sie nicht und ersetzt sie nicht.

Erzeugte Konfigurationen können Paketquellen eines Systems verändern. Wählen Sie nur das zur installierten Debian-Version passende Release, prüfen Sie Komponenten und Suites und lesen Sie die vollständige Ausgabe vor der Installation. Testing und Unstable sind rollende Suites und bieten keine Sicherheitsunterstützung auf Stable-Niveau.

## Offizieller Drittanbieter-Katalog

Der eingebaute Herstellerkatalog ist eine manuell geprüfte, statische Liste. Er enthält nur Repositories des genannten Herstellers oder Upstream-Projekts; PPAs, Community-Mirrors, `apt-key`, unsignierte Quellen und Hersteller-Setup-Skripte sind ausgeschlossen. Jeder Katalogeintrag verweist auf die Installationsdokumentation des Herstellers und wurde am **2026-08-28** verifiziert. Ein Drittanbieter-Repository erweitert die Vertrauensgrenze über Debian hinaus und kann sich unabhängig ändern. Prüfen Sie daher Quellen und Installationsanweisungen immer vor der Verwendung.

| Product | Compatible DebGen releases | Architectures / limitation |
| --- | --- | --- |
| Brave Browser | Trixie, Bookworm, Bullseye, Forky, Sid | amd64, arm64 |
| Mozilla Firefox | Trixie, Bookworm, Bullseye | amd64, arm64; Mozilla pinning is included |
| Google Chrome | Trixie, Bookworm, Bullseye, Forky, Sid | amd64 |
| Microsoft Edge | Trixie, Bookworm, Bullseye, Forky, Sid | amd64 |
| Vivaldi | Trixie, Forky, Sid | amd64, arm64; Debian 13 or newer |
| Opera | Trixie, Bookworm, Bullseye, Forky, Sid | amd64 |
| Signal Desktop | Trixie, Bookworm, Bullseye, Forky, Sid | amd64 |
| Proton VPN | Trixie | amd64, arm64; GNOME desktop only, not headless |
| Mullvad VPN | Trixie, Bookworm, Forky, Sid | amd64, arm64; Debian 12 or newer |
| Tor | Trixie, Bookworm, Bullseye | amd64, arm64; daemon/client, not Tor Browser |
| Docker Engine | Trixie, Bookworm, Bullseye | amd64, arm64, armhf; can affect firewall rules |
| Kubernetes tools v1.36 | Trixie, Bookworm, Bullseye, Forky, Sid | amd64, arm64; versioned `pkgs.k8s.io` channel |
| Google Cloud CLI | Trixie, Bookworm, Bullseye | amd64, arm64 |
| Microsoft Azure CLI | Bookworm, Bullseye | amd64, arm64; no verified Trixie suite |
| GitHub CLI | Trixie, Bookworm, Bullseye, Forky, Sid | amd64, arm64 |
| HashiCorp Terraform | Trixie, Bookworm, Bullseye | amd64, arm64 |
| PostgreSQL PGDG | Trixie, Bookworm, Bullseye, Forky, Sid | amd64, arm64; `<codename>-pgdg` suites |
| MongoDB Community 8.0 | Bookworm | amd64 only |
| Grafana | Trixie, Bookworm, Bullseye, Forky, Sid | amd64, arm64 |
| NVIDIA Container Toolkit | Trixie, Bookworm, Bullseye, Forky, Sid | amd64, arm64; supported NVIDIA GPU, driver, and runtime required |
| MariaDB Community 11.8 | Trixie, Bookworm, Bullseye, Sid | amd64, arm64; no vendor setup script |
| Redis Open Source | Trixie, Bookworm | amd64, arm64 |
| ClickHouse | Trixie, Bookworm, Bullseye, Forky, Sid | amd64, arm64; distribution-independent repository |
| InfluxDB 3 Core | Trixie, Bookworm, Forky, Sid | amd64, arm64; Debian 12 or newer |
| Zabbix 7.4 | Trixie, Bookworm, Bullseye | amd64, arm64 |

### Katalogpflege

Bei einer Katalogänderung sind die aktuelle offizielle Installationsdokumentation, `Release`- oder `InRelease`-Metadaten, URL des Signaturschlüssels, Suite, Komponente, Paketname und veröffentlichte Architekturunterstützung erneut zu prüfen. Versionskanäle bleiben explizit: Kubernetes v1.36, MongoDB 8.0, MariaDB 11.8 und Zabbix 7.4 dürfen niemals zu einem ungebundenen `latest` werden. Aktualisieren Sie zugleich Verifizierungsdatum, Kompatibilitätstests und gegebenenfalls den vom Hersteller veröffentlichten Fingerprint. Verschwindet ein offizielles Repository, entfernen oder deaktivieren Sie den Eintrag; ersetzen Sie niemals eigenmächtig den Host.

## Statische API

Die öffentliche GitHub-Pages-API beginnt unter `https://maltekiefer.github.io/debgen/api/v1/`. Forks verwenden ihren eigenen Pages-Host und Repository-Namen. Die API ist statisch und umfasst diese Endpunkte:

- `https://maltekiefer.github.io/debgen/api/v1/releases.json`
- `https://maltekiefer.github.io/debgen/api/v1/vendors.json`
- `https://maltekiefer.github.io/debgen/api/v1/catalog.json`
- `https://maltekiefer.github.io/debgen/api/v1/trixie/debian.sources`
- `https://maltekiefer.github.io/debgen/api/v1/bookworm/debian.sources`
- `https://maltekiefer.github.io/debgen/api/v1/bookworm/debian.list`
- `https://maltekiefer.github.io/debgen/api/v1/bullseye/debian.sources`
- `https://maltekiefer.github.io/debgen/api/v1/bullseye/debian.list`
- `https://maltekiefer.github.io/debgen/api/v1/forky/debian.sources`
- `https://maltekiefer.github.io/debgen/api/v1/sid/debian.sources`

`releases.json` enthält unverändert Release-Status, unterstützte Formate, Dateinamen und manifest-relative URLs wie `trixie/debian.sources`. `vendors.json` enthält zu jedem offiziellen Produkt Metadaten, Dokumentations-URL, Verifizierungsdatum und ausschließlich kompatible Release-/Architektur-Kombinationen. Jede dieser Kombinationen verlinkt auf:

- `vendors/<produkt-id>/<release>/<architektur>/<produkt-id>.sources` für die einzelne kanonische DEB822-Quelle;
- `vendors/<produkt-id>/<release>/<architektur>/install.sh` für das geprüfte Ein-Produkt-Installationsskript.

`catalog.json` verlinkt die beiden Manifeste. Alle Manifest-URLs sind relativ zu ihrem Manifest und zeigen auf vorhandene Dateien; inkompatible Kombinationen werden weder verlinkt noch erzeugt. Lösen Sie eine `url` gegen die URL des Manifests auf, beispielsweise mit `new URL(file.url, manifestUrl)`, damit dies auf der Hauptseite und in Forks unter `/api/v1/` funktioniert.

### Ausgabemodi im Studio

- **Pro Hersteller** (Standard): Debian-Basisquellen, je Hersteller eine vorhersagbar benannte `.sources`-Datei, getrennte Präferenzdateien und ein geprüftes Installationsskript.
- **Kombiniert:** eine gemeinsame `vendors.sources`, wenn alle ausgewählten Quellen sicher als DEB822 darstellbar sind; Schlüssel bleiben getrennt.
- **Nach Kategorie:** Debian-Basisquellen und bei Bedarf eine `.sources`-Datei je Kategorie, etwa `browser.sources` oder `database.sources`.

Neue Herstellerquellen verwenden immer DEB822. Legacy-`.list` bleibt auf die bestehenden Debian-Endpunkte für Bookworm und Bullseye beschränkt.

### Eine geprüfte Konfiguration installieren

Laden Sie Dateien zuerst ohne erhöhte Rechte herunter und prüfen Sie sie lokal. Ein Hersteller-Skript wird ausdrücklich nicht über `curl | sh` ausgeführt:

```sh
api_root=https://maltekiefer.github.io/debgen/api/v1
curl -fsSLo /tmp/brave-browser.sources "$api_root/vendors/brave-browser/trixie/amd64/brave-browser.sources"
curl -fsSLo /tmp/brave-browser-install.sh "$api_root/vendors/brave-browser/trixie/amd64/install.sh"
sed -n '1,220p' /tmp/brave-browser.sources
sed -n '1,260p' /tmp/brave-browser-install.sh
bash -n /tmp/brave-browser-install.sh
```

Erst wenn Release, Architektur, Schlüssel-URL, Pfade, Pakete und Befehle bestätigt sind, darf das Skript ausgeführt werden:

```sh
chmod 0755 /tmp/brave-browser-install.sh
sudo /tmp/brave-browser-install.sh
```

Für Debian-Basisquellen speichern und prüfen Sie ebenso zunächst die Datei. Sie schreiben erst nach der Prüfung in APTs Quellverzeichnis:

```sh
curl -fsSLo /tmp/debian.sources "$api_root/trixie/debian.sources"
sed -n '1,220p' /tmp/debian.sources
sudo install -m 0644 /tmp/debian.sources /etc/apt/sources.list.d/debian.sources
```

Für ein System, das zwingend das veraltete Format benötigt, verwenden Sie nach derselben Prüfung `bookworm/debian.list` oder `bullseye/debian.list` und als Ziel eine `.list`-Datei. Sichern oder entfernen Sie kollidierende bestehende Quellen getrennt; die gezeigten Befehle überschreiben nur die jeweilige Zieldatei.

## GitHub Pages

Der Pages-Workflow läuft nur bei Pushes nach `master`. Sein Verifizierungsjob installiert gesperrte Abhängigkeiten, führt den vollständigen Check und das Sicherheitsaudit aus, leitet den Site-Basispfad aus `GITHUB_REPOSITORY` ab, baut die Seite und lädt `dist/` hoch. Die Bereitstellung startet erst nach erfolgreicher Verifizierung und erfolgt über die geschützte Umgebung `github-pages`.

Um die Bereitstellung für ein Repository zu aktivieren, öffnen Sie **Settings → Pages → Build and deployment** und wählen **GitHub Actions** als Quelle. Der Workflow braucht keinen fest codierten Repository-Namen; daher bauen Forks und umbenannte Repositories unter ihrem eigenen Basispfad `/<repository-name>/`.
