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
- `npm audit` — bei jedem gemeldeten Sicherheitshinweis fehlschlagen.

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

Der eingebaute Katalog ist eine manuell geprüfte, statische Liste mit **exakt 100 Produkten**. Alle Repository-Quellen stammen vom jeweiligen Hersteller oder Upstream-Projekt; sicherheitskritische Produkte verwenden keine Community-Infrastruktur. PPAs, Community-Mirrors, `apt-key`, unsignierte Quellen und Hersteller-Setup-Skripte sind ausgeschlossen. Dokumentation, Repository-Metadaten, Paketnamen, Schlüssel-URLs und veröffentlichte Architekturen wurden zuletzt am **2026-08-29** geprüft.

`Node.js` und `LibreOffice` werden Debian-nativ ohne zusätzliche Quelle installiert. Für Node.js wird ausdrücklich **kein NodeSource-Repository** verwendet. `Yarn Classic 1.x` nutzt das offizielle Yarn-APT-Repository; die Bezeichnung grenzt es bewusst von aktuellem Yarn über Corepack ab. Ein Drittanbieter-Repository erweitert die Vertrauensgrenze über Debian hinaus und kann sich unabhängig ändern, deshalb sind Quelle und generierte Installation vor jeder Verwendung erneut zu prüfen.

### Exakte Produktmatrix

In der Spalte „Installation / Provenienz / Support“ bedeutet `APT` eine zusätzliche geprüfte Quelle; Debian-native Einträge haben eine null-`sourceId`. „Sicherheitskritisch“ ist die verbindliche Katalogklassifikation.

| Produkt (stabile ID) | Installation / Provenienz / Support | Sicherheitskritisch | DebGen-Releases · Architekturen |
| --- | --- | --- | --- |
| Brave Browser (`brave-browser`) | APT `brave-browser` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Mozilla Firefox (`mozilla-firefox`) | APT `mozilla` / `upstream` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Google Chrome (`google-chrome`) | APT `google-chrome` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye, forky, sid · amd64 |
| Microsoft Edge (`microsoft-edge`) | APT `microsoft-edge` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye, forky, sid · amd64 |
| Vivaldi (`vivaldi`) | APT `vivaldi` / `manufacturer` / `explicit` | ja | trixie, forky, sid · amd64, arm64 |
| Opera (`opera`) | APT `opera` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye, forky, sid · amd64 |
| Signal Desktop (`signal-desktop`) | APT `signal` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye, forky, sid · amd64 |
| Proton VPN (`proton-vpn`) | APT `proton-vpn` / `manufacturer` / `explicit` | ja | trixie · amd64, arm64 |
| Mullvad VPN (`mullvad-vpn`) | APT `mullvad` / `manufacturer` / `explicit` | ja | trixie, bookworm, forky, sid · amd64, arm64 |
| Tor (`tor`) | APT `tor` / `upstream` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Docker Engine (`docker-engine`) | APT `docker` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64, armhf |
| Kubernetes tools v1.36 (`kubernetes-tools-v1-36`) | APT `kubernetes-v1-36` / `upstream` / `explicit` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Google Cloud CLI (`google-cloud-cli`) | APT `google-cloud` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Microsoft Azure CLI (`azure-cli`) | APT `microsoft-azure-cli` / `manufacturer` / `explicit` | ja | bookworm, bullseye · amd64, arm64 |
| GitHub CLI (`github-cli`) | APT `github-cli` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| HashiCorp Terraform (`hashicorp-terraform`) | APT `hashicorp` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| PostgreSQL PGDG (`postgresql-pgdg`) | APT `postgresql-pgdg` / `upstream` / `explicit` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| MongoDB Community 8.0 (`mongodb-community-8-0`) | APT `mongodb-community-8-0` / `manufacturer` / `explicit` | ja | bookworm · amd64 |
| Grafana (`grafana`) | APT `grafana` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| NVIDIA Container Toolkit (`nvidia-container-toolkit`) | APT `nvidia-container-toolkit` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| MariaDB Community 11.8 (`mariadb-community-11-8`) | APT `mariadb-community-11-8` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye, sid · amd64, arm64 |
| Redis Open Source (`redis-open-source`) | APT `redis-open-source` / `manufacturer` / `explicit` | ja | trixie, bookworm · amd64, arm64 |
| ClickHouse (`clickhouse`) | APT `clickhouse` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| InfluxDB 3 Core (`influxdb-3-core`) | APT `influxdb-3-core` / `manufacturer` / `explicit` | ja | trixie, bookworm, forky, sid · amd64, arm64 |
| Zabbix 7.4 (`zabbix-7-4`) | APT `zabbix-7-4` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Mullvad Browser (`mullvad-browser`) | APT `mullvad` / `manufacturer` / `explicit` | ja | trixie, bookworm · amd64 |
| 1Password (`onepassword`) | APT `onepassword` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64 |
| Visual Studio Code (`visual-studio-code`) | APT `visual-studio-code` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64, armhf |
| PowerShell 7.6 (`powershell-7-6`) | APT `microsoft-prod` / `manufacturer` / `explicit` | ja | trixie · amd64, arm64 |
| .NET SDK 10 (`dotnet-sdk-10`) | APT `microsoft-prod` / `manufacturer` / `explicit` | ja | trixie, bookworm · amd64, arm64 |
| Tailscale (`tailscale`) | APT `tailscale` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64, armhf, i386 |
| Cloudflare WARP (`cloudflare-warp`) | APT `cloudflare-warp` / `manufacturer` / `explicit` | ja | trixie, bookworm · amd64, arm64 |
| cloudflared (`cloudflared`) | APT `cloudflared` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64, armhf |
| OpenTofu (`opentofu`) | APT `opentofu` / `upstream` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64, armhf, i386 |
| AnyDesk (`anydesk`) | APT `anydesk` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Sublime Text (`sublime-text`) | APT `sublime` / `manufacturer` / `generic-debian` | nein | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Element Desktop (`element-desktop`) | APT `element` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Oracle VirtualBox 7.2 (`oracle-virtualbox-7-2`) | APT `oracle-virtualbox` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64 |
| GitLab Community Edition (`gitlab-ce`) | APT `gitlab-ce` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| GitLab Runner (`gitlab-runner`) | APT `gitlab-runner` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye, forky · amd64, arm64 |
| Jenkins LTS (`jenkins-lts`) | APT `jenkins-lts` / `upstream` / `explicit` | ja | trixie · amd64, arm64 |
| NGINX Stable (`nginx-stable`) | APT `nginx-stable` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| HashiCorp Vault (`hashicorp-vault`) | APT `hashicorp` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| HashiCorp Packer (`hashicorp-packer`) | APT `hashicorp` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Elastic Stack 9 (`elastic-stack-9`) | APT `elastic-9` / `manufacturer` / `explicit` | ja | trixie, bookworm · amd64, arm64 |
| Syncthing Stable v2 (`syncthing-stable-v2`) | APT `syncthing` / `upstream` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64, armhf |
| Amazon Corretto 21 (`amazon-corretto-21`) | APT `corretto` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Eclipse Temurin 25 (`eclipse-temurin-25`) | APT `adoptium` / `upstream` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Grafana Alloy (`grafana-alloy`) | APT `grafana` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Caddy (`caddy`) | APT `caddy` / `upstream` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64, armhf |
| Node.js (`nodejs`) | Debian-Paket / `debian-native` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64, armhf, i386 |
| Yarn Classic 1.x (`yarn-classic-1`) | APT `yarn` / `upstream` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64, armhf, i386 |
| LibreOffice (`libreoffice`) | Debian-Paket / `debian-native` | nein | trixie, bookworm, bullseye, forky, sid · amd64, arm64, armhf, i386 |
| Mozilla Thunderbird (`mozilla-thunderbird`) | APT `mozilla-thunderbird` / `upstream` / `explicit` | ja | trixie, bookworm, bullseye · amd64 |
| Firefox Developer Edition (`firefox-developer-edition`) | APT `mozilla` / `upstream` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| 1Password CLI (`onepassword-cli`) | APT `onepassword` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| GitLab Enterprise Edition (`gitlab-ee`) | APT `gitlab-ee` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Jenkins Weekly (`jenkins-weekly`) | APT `jenkins-weekly` / `upstream` / `explicit` | ja | trixie · amd64, arm64 |
| NGINX Mainline (`nginx-mainline`) | APT `nginx-mainline` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Grafana Enterprise (`grafana-enterprise`) | APT `grafana` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| HashiCorp Consul (`hashicorp-consul`) | APT `hashicorp` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| HashiCorp Nomad (`hashicorp-nomad`) | APT `hashicorp` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| HashiCorp Boundary (`hashicorp-boundary`) | APT `hashicorp` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Elastic Agent 9 (`elastic-agent-9`) | APT `elastic-9` / `manufacturer` / `explicit` | ja | trixie, bookworm · amd64, arm64 |
| Kubernetes Node Tools 1.36 (`kubernetes-node-tools-v1-36`) | APT `kubernetes-v1-36` / `upstream` / `explicit` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Microsoft OpenJDK 21 (`microsoft-openjdk-21`) | APT `microsoft-prod` / `manufacturer` / `explicit` | ja | bookworm · amd64, arm64 |
| Microsoft OpenJDK 25 (`microsoft-openjdk-25`) | APT `microsoft-prod` / `manufacturer` / `explicit` | ja | bookworm · amd64, arm64 |
| Eclipse Temurin 8 (`eclipse-temurin-8`) | APT `adoptium` / `upstream` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Eclipse Temurin 11 (`eclipse-temurin-11`) | APT `adoptium` / `upstream` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Eclipse Temurin 17 (`eclipse-temurin-17`) | APT `adoptium` / `upstream` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Eclipse Temurin 21 (`eclipse-temurin-21`) | APT `adoptium` / `upstream` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Amazon Corretto 8 (`amazon-corretto-8`) | APT `corretto` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Amazon Corretto 11 (`amazon-corretto-11`) | APT `corretto` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Amazon Corretto 17 (`amazon-corretto-17`) | APT `corretto` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Amazon Corretto 25 (`amazon-corretto-25`) | APT `corretto` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Azul Zulu JDK 21 (`azul-zulu-jdk-21`) | APT `azul-zulu` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| BellSoft Liberica JDK 21 (`bellsoft-liberica-jdk-21`) | APT `bellsoft-liberica` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| TeamViewer (`teamviewer`) | APT `teamviewer` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64 |
| Steam Launcher (`steam-launcher`) | APT `steam` / `manufacturer` / `generic-debian` | nein | trixie, bookworm, bullseye, forky, sid · amd64 |
| Google Earth Pro (`google-earth-pro`) | APT `google-earth` / `manufacturer` / `generic-debian` | nein | trixie, bookworm, bullseye, forky, sid · amd64 |
| Sublime Merge (`sublime-merge`) | APT `sublime` / `manufacturer` / `generic-debian` | nein | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Typora (`typora`) | APT `typora` / `manufacturer` / `generic-debian` | nein | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Warp Terminal (`warp-terminal`) | APT `warp` / `manufacturer` / `generic-debian` | nein | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| NordVPN (`nordvpn`) | APT `nordvpn` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| IVPN (`ivpn`) | APT `ivpn` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Teleport Community Edition 18 (`teleport-community-18`) | APT `teleport-18` / `upstream` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Wazuh Agent (`wazuh-agent`) | APT `wazuh` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64, i386 |
| Apache CouchDB 3.5 (`apache-couchdb-3-5`) | APT `apache-couchdb` / `upstream` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Neo4j Community Edition (`neo4j-community`) | APT `neo4j` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| Icinga 2 (`icinga2`) | APT `icinga` / `upstream` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| MySQL Community Server 8.4 LTS (`mysql-community-server-8-4-lts`) | APT `mysql-8-4` / `manufacturer` / `explicit` | ja | trixie, bookworm, bullseye · amd64 |
| OpenSearch 3 (`opensearch-3`) | APT `opensearch-3` / `upstream` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Datadog Agent 7 (`datadog-agent-7`) | APT `datadog` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Falco (`falco`) | APT `falco` / `upstream` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Trivy (`trivy`) | APT `trivy` / `upstream` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| CrowdSec Security Engine (`crowdsec-security-engine`) | APT `crowdsec` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Fluent Bit (`fluent-bit`) | APT `fluent-bit` / `upstream` / `explicit` | ja | trixie, bookworm, bullseye · amd64, arm64 |
| DBeaver Community (`dbeaver-community`) | APT `dbeaver` / `upstream` / `generic-debian` | nein | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Buildkite Agent (`buildkite-agent`) | APT `buildkite-agent` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |
| Buildkite CLI (`buildkite-cli`) | APT `buildkite-cli` / `manufacturer` / `generic-debian` | ja | trixie, bookworm, bullseye, forky, sid · amd64, arm64 |

### Provenienz- und Installationsregeln

Geteilte Herstellerquellen werden durch eine gemeinsame `sourceId` sichtbar, etwa Mullvad, HashiCorp, Grafana, Microsoft, Elastic, Adoptium, Corretto, Sublime und 1Password. Der Katalog bildet außerdem release-spezifische Schlüssel und Orte, mehrere OpenTofu-Schlüssel, komponentenlose Exact-Path-Repositories, die zusätzlichen debsig-Vertrauensdateien von 1Password unter `/etc/debsig/policies/AC2D62742012EA22/1password.pol` und `/usr/share/debsig/keyrings/AC2D62742012EA22/debsig.gpg` sowie die Pinning-Dateien von NGINX, Mozilla und Syncthing ab. Interaktive, privilegierte oder voraussetzungsreiche Installationen tragen stabile Warnschlüssel; debgen führt keine Hersteller-Setup-Skripte aus.

Das gemeinsame Schlüsselpaket für NGINX Stable und Mainline wird als vollständige Menge seiner drei Primärschlüssel geprüft: `573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62`, `8540A6F18833A80E9C1653A42FD21310B49F6B46` und `9E9BE90EACBCDE69FE9B204CBCDCD8A38D88A2B3`. Die Menge wurde am 2026-08-29 sowohl gegen das [live NGINX-Schlüsselpaket](https://nginx.org/keys/nginx_signing.key) als auch gegen die vom NGINX-Projekt im offiziellen [docker-nginx-Dockerfile](https://github.com/nginx/docker-nginx/blob/master/stable/debian/Dockerfile) veröffentlichte vollständige Liste geprüft; die [NGINX-Paketdokumentation](https://nginx.org/en/linux_packages.html) weist ausdrücklich auf zusätzliche Paketsignaturschlüssel im Paket hin.

Bei einer Katalogänderung sind offizielle Installationsdokumentation, `Release`- oder `InRelease`-Metadaten, Paketindex, Signaturschlüssel, veröffentlichter Fingerprint, Suite, Komponente, Paketname und Architekturunterstützung erneut zu prüfen. Versionskanäle wie Kubernetes 1.36, MongoDB 8.0, MariaDB 11.8, Zabbix 7.4, Elastic 9, Teleport 18, MySQL 8.4 LTS und OpenSearch 3 bleiben explizit. Verschwindet eine offizielle Quelle, wird der Kandidat entfernt oder ausschließlich nach der freigegebenen Reserveliste ersetzt; die Provenienzregeln werden nicht abgeschwächt.

### Bewusste Ausschlüsse

Tor Browser, Docker Desktop, Discord, Zoom, Slack, JetBrains Toolbox, Postman, Bitwarden Desktop, GitKraken, RustDesk, OBS Studio und Dropbox fehlen, weil ihre offizielle Linux-Auslieferung die Repository-Richtlinie nicht erfüllt. Spotify ist kein Primäreintrag, da der Hersteller Linux nicht aktiv unterstützt.

RabbitMQ, Percona, Puppet Core, Netdata, New Relic, TimescaleDB, CockroachDB, Kopia, OpenVPN Access Server und Helm bleiben ebenfalls außerhalb dieser Freigabe: Setup, Transport, Schlüssel, Community-Provenienz oder Versionskopplung erfüllen die Richtlinie nicht oder würden ein hier nicht benötigtes Modell verlangen. Insbesondere Helm wird nicht über community-betriebene APT-Infrastruktur für einen sicherheitskritischen Einsatz aufgenommen.

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

`releases.json` enthält unverändert Release-Status, unterstützte Formate, Dateinamen und manifest-relative URLs wie `trixie/debian.sources`. `vendors.json` enthält exakt alle 100 offiziellen Produkte mit nullable `sourceId`, Paketmenge, optionaler Dokumentations-URL, Verifizierungsdatum und ausschließlich kompatiblen Release-/Architektur-Kombinationen. Bei Produkten mit zusätzlicher APT-Quelle verlinkt jede Kombination auf:

- `vendors/<produkt-id>/<release>/<architektur>/<produkt-id>.sources` für die einzelne kanonische DEB822-Quelle;
- `vendors/<produkt-id>/<release>/<architektur>/install.sh` für das geprüfte Ein-Produkt-Installationsskript.

Die Debian-nativen Produkte `nodejs` und `libreoffice` stehen ebenfalls in `vendors.json`: Ihre `sourceId` ist `null`, und jede kompatible Kombination enthält ausschließlich die Debian-Paketmenge. Für sie werden bewusst weder eine zusätzliche `.sources`-Datei noch ein Repository-Installationsskript unter `vendors/` erzeugt.

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
