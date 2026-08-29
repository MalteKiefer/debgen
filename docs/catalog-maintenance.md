# Catalog maintenance

The catalog is a checked, static snapshot. Its verification date is `2026-08-29`. Do not treat a successful download as evidence that a product is still admissible. Before changing it, repeat the audit below and run the catalog validation and the complete check suite.

## Data model

`VendorProduct` is the selectable thing. It owns its stable `id`, display name, category, packages, release and architecture matrix, support level, provenance, security classification, and warning keys. Its non-null `sourceId` points to a `RepositorySource`.

`RepositorySource` is the trust and transport definition. It owns the official documentation URL, `verifiedAt`, one or more release and architecture scoped locations, keys, auxiliary trust files, preference files, and source-wide warnings. A location can use a normal suite and components or an exact path suite such as `/` or `apt/stable/`; exact-path suites have no components.

Products and sources intentionally have different cardinality. Selecting Mullvad VPN and Mullvad Browser, Terraform and Vault, or Grafana and Alloy must generate one source definition and install each shared key, auxiliary file, and preference file once. Package selections are deduplicated and sorted.

The validator rejects unknown or unselected sources, duplicate IDs and package names, incomplete source release and architecture coverage, unsafe URLs and paths, conflicting keyring definitions, arbitrary auxiliary destinations, incomplete key coverage, and an unsafe provenance combination.

## Admission and security policy

Use a manufacturer-operated or upstream-project-operated HTTPS repository by default. `community-endorsed` is permitted only if the manufacturer or upstream explicitly recommends that exact repository, the product is not security critical, and the product is labelled `community-endorsed`. Security-critical products never use community infrastructure.

Do not add PPAs, unendorsed mirrors, standalone DEB downloads, Snap, Flatpak, AppImage, HTTP repositories, opaque remote setup scripts, `apt-key`, or unsigned repositories. Yarn is specifically Yarn Classic 1.x; current Yarn is distributed through Corepack rather than a new APT source. NodeSource remains excluded.

`explicit` means an official statement and repository availability cover the selected Debian release and architecture. `generic-debian` means a technically available Debian-generic repository without an explicit release statement. `repository-only` is reserved for a repository availability assertion with no stronger vendor-release support claim. Do not upgrade a support level based only on a successful installation.

## Keys, trust files, preferences, and rotation

Every source uses HTTPS, DEB822, a separate keyring under `/etc/apt/keyrings` or `/usr/share/keyrings`, and `Signed-By`. A `RepositoryKey` has an ID, release scope, URL, format, deterministic keyring path, and the complete manufacturer-published primary fingerprint set when available. A fingerprint extracted only from a downloaded key is audit evidence, not a published pin.

When a vendor rotates a key, re-audit its official documentation and metadata first. Add the old and new primary fingerprints together only for the documented overlap, retain the same keyring path only when its definition is compatible, test every supported release, then remove the old key only after the vendor's published retirement date. Never replace a pin merely because a download has changed.

Auxiliary trust files use a closed destination kind, never an arbitrary filesystem path. The current 1Password source is the required example: `onepassword-policy` installs at `/etc/debsig/policies/AC2D62742012EA22/1password.pol`, and `onepassword-keyring` installs at `/usr/share/debsig/keyrings/AC2D62742012EA22/debsig.gpg`. Preserve its expected media type and any published fingerprint. Preference files are source-owned definitions; keep their content deterministic and install each only once, including for shared NGINX, Mozilla, and Syncthing sources.

## Repeatable vendor audit

1. Read the official installation documentation and confirm operator provenance.
2. Inspect the official `Release` or `InRelease`, package index, suite, components, and published architectures for every claimed combination.
3. Download only for inspection, identify the signing primary fingerprint set, and record only manufacturer-published full pins as pins.
4. Confirm key URL, format, release scope, deterministic keyring path, location URI, exact-path rules, packages, and operational warnings.
5. Classify support conservatively as `explicit`, `generic-debian`, or `repository-only`; mark the security classification deliberately.
6. Verify whether the product shares a source before creating a new one. Add source-wide data once and product-specific packages or warnings to the product.
7. Run focused catalog, compatibility, source, generator, and API tests, then `npm run check`.

## Current 103-product matrix

Columns are product ID, source, package set, supported releases, architectures, support level, provenance, and security-critical status. This is the authoritative maintenance snapshot; changes belong in `src/features/vendors/catalog.ts` and `src/features/vendors/sources.ts` together.

The latest additions are OpenVPN Community in `vpn-secure-networking` with explicit upstream support, LibreWolf in `web-browsers` with generic-Debian upstream support, and Lutris in `games` with explicit community-endorsed support. Lutris is non-security-critical; the other two are security-critical.

| ID | Source | Packages | Releases | Architectures | Support | Provenance | Critical |
| --- | --- | --- | --- | --- | --- | --- | --- |
| brave-browser | brave-browser | brave-browser | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | explicit | manufacturer | yes |
| mozilla-firefox | mozilla | firefox | trixie, bookworm, bullseye | amd64, arm64 | explicit | upstream | yes |
| google-chrome | google-chrome | google-chrome-stable | trixie, bookworm, bullseye, forky, sid | amd64 | explicit | manufacturer | yes |
| microsoft-edge | microsoft-edge | microsoft-edge-stable | trixie, bookworm, bullseye, forky, sid | amd64 | explicit | manufacturer | yes |
| vivaldi | vivaldi | vivaldi-stable | trixie, forky, sid | amd64, arm64 | explicit | manufacturer | yes |
| opera | opera | opera-stable | trixie, bookworm, bullseye, forky, sid | amd64 | explicit | manufacturer | yes |
| signal-desktop | signal | signal-desktop | trixie, bookworm, bullseye, forky, sid | amd64 | explicit | manufacturer | yes |
| proton-vpn | proton-vpn | proton-vpn-gnome-desktop | trixie | amd64, arm64 | explicit | manufacturer | yes |
| mullvad-vpn | mullvad | mullvad-vpn | trixie, bookworm, forky, sid | amd64, arm64 | explicit | manufacturer | yes |
| tor | tor | tor | trixie, bookworm, bullseye | amd64, arm64 | explicit | upstream | yes |
| docker-engine | docker | docker-ce, docker-ce-cli, containerd.io, docker-buildx-plugin, docker-compose-plugin | trixie, bookworm, bullseye | amd64, arm64, armhf | explicit | manufacturer | yes |
| kubernetes-tools-v1-36 | kubernetes-v1-36 | kubectl | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | explicit | upstream | yes |
| google-cloud-cli | google-cloud | google-cloud-cli | trixie, bookworm, bullseye | amd64, arm64 | explicit | manufacturer | yes |
| azure-cli | microsoft-azure-cli | azure-cli | bookworm, bullseye | amd64, arm64 | explicit | manufacturer | yes |
| github-cli | github-cli | gh | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | explicit | manufacturer | yes |
| hashicorp-terraform | hashicorp | terraform | trixie, bookworm, bullseye | amd64, arm64 | explicit | manufacturer | yes |
| postgresql-pgdg | postgresql-pgdg | postgresql | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | explicit | upstream | yes |
| mongodb-community-8-0 | mongodb-community-8-0 | mongodb-org | bookworm | amd64 | explicit | manufacturer | yes |
| grafana | grafana | grafana | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | explicit | manufacturer | yes |
| nvidia-container-toolkit | nvidia-container-toolkit | nvidia-container-toolkit | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | explicit | manufacturer | yes |
| mariadb-community-11-8 | mariadb-community-11-8 | mariadb-server | trixie, bookworm, bullseye, sid | amd64, arm64 | explicit | manufacturer | yes |
| redis-open-source | redis-open-source | redis | trixie, bookworm | amd64, arm64 | explicit | manufacturer | yes |
| clickhouse | clickhouse | clickhouse-server, clickhouse-client | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | yes |
| influxdb-3-core | influxdb-3-core | influxdb3-core | trixie, bookworm, forky, sid | amd64, arm64 | explicit | manufacturer | yes |
| zabbix-7-4 | zabbix-7-4 | zabbix-agent2 | trixie, bookworm, bullseye | amd64, arm64 | explicit | manufacturer | yes |
| mullvad-browser | mullvad | mullvad-browser | trixie, bookworm | amd64 | explicit | manufacturer | yes |
| onepassword | onepassword | 1password | trixie, bookworm, bullseye | amd64 | explicit | manufacturer | yes |
| visual-studio-code | visual-studio-code | code | trixie, bookworm, bullseye | amd64, arm64, armhf | explicit | manufacturer | yes |
| powershell-7-6 | microsoft-prod | powershell | trixie | amd64, arm64 | explicit | manufacturer | yes |
| dotnet-sdk-10 | microsoft-prod | dotnet-sdk-10.0 | trixie, bookworm | amd64, arm64 | explicit | manufacturer | yes |
| tailscale | tailscale | tailscale | trixie, bookworm, bullseye, forky, sid | amd64, arm64, armhf, i386 | explicit | manufacturer | yes |
| cloudflare-warp | cloudflare-warp | cloudflare-warp | trixie, bookworm | amd64, arm64 | explicit | manufacturer | yes |
| cloudflared | cloudflared | cloudflared | trixie, bookworm, bullseye, forky, sid | amd64, arm64, armhf | generic-debian | manufacturer | yes |
| opentofu | opentofu | tofu | trixie, bookworm, bullseye, forky, sid | amd64, arm64, armhf, i386 | generic-debian | upstream | yes |
| anydesk | anydesk | anydesk | trixie, bookworm, bullseye | amd64, arm64 | generic-debian | manufacturer | yes |
| sublime-text | sublime | sublime-text | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | no |
| element-desktop | element | element-desktop | trixie, bookworm, bullseye | amd64, arm64 | explicit | manufacturer | yes |
| oracle-virtualbox-7-2 | oracle-virtualbox | virtualbox-7.2 | trixie, bookworm, bullseye | amd64 | explicit | manufacturer | yes |
| gitlab-ce | gitlab-ce | gitlab-ce | trixie, bookworm, bullseye | amd64, arm64 | explicit | manufacturer | yes |
| gitlab-runner | gitlab-runner | gitlab-runner | trixie, bookworm, bullseye, forky | amd64, arm64 | explicit | manufacturer | yes |
| jenkins-lts | jenkins-lts | jenkins | trixie | amd64, arm64 | explicit | upstream | yes |
| nginx-stable | nginx-stable | nginx | trixie, bookworm, bullseye | amd64, arm64 | explicit | manufacturer | yes |
| hashicorp-vault | hashicorp | vault | trixie, bookworm, bullseye | amd64, arm64 | explicit | manufacturer | yes |
| hashicorp-packer | hashicorp | packer | trixie, bookworm, bullseye | amd64, arm64 | explicit | manufacturer | yes |
| elastic-stack-9 | elastic-9 | elasticsearch, kibana, logstash, filebeat | trixie, bookworm | amd64, arm64 | explicit | manufacturer | yes |
| syncthing-stable-v2 | syncthing | syncthing | trixie, bookworm, bullseye, forky, sid | amd64, arm64, armhf | generic-debian | upstream | yes |
| amazon-corretto-21 | corretto | java-21-amazon-corretto-jdk | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | yes |
| eclipse-temurin-25 | adoptium | temurin-25-jdk | trixie, bookworm, bullseye | amd64, arm64 | explicit | upstream | yes |
| grafana-alloy | grafana | alloy | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | explicit | manufacturer | yes |
| caddy | caddy | caddy | trixie, bookworm, bullseye, forky, sid | amd64, arm64, armhf | generic-debian | upstream | yes |
| zerotier-one | zerotier-one | zerotier-one | trixie, bookworm, bullseye | amd64, arm64, armhf, i386 | explicit | manufacturer | yes |
| yarn-classic-1 | yarn | yarn | trixie, bookworm, bullseye, forky, sid | amd64, arm64, armhf, i386 | generic-debian | upstream | yes |
| netbird | netbird | netbird | bookworm | amd64, arm64, armhf | explicit | manufacturer | yes |
| mozilla-thunderbird | mozilla-thunderbird | thunderbird | trixie, bookworm, bullseye | amd64 | explicit | upstream | yes |
| firefox-developer-edition | mozilla | firefox-devedition | trixie, bookworm, bullseye | amd64, arm64 | explicit | upstream | yes |
| onepassword-cli | onepassword | 1password-cli | trixie, bookworm, bullseye | amd64, arm64 | explicit | manufacturer | yes |
| gitlab-ee | gitlab-ee | gitlab-ee | trixie, bookworm, bullseye | amd64, arm64 | explicit | manufacturer | yes |
| jenkins-weekly | jenkins-weekly | jenkins | trixie | amd64, arm64 | explicit | upstream | yes |
| nginx-mainline | nginx-mainline | nginx | trixie, bookworm, bullseye | amd64, arm64 | explicit | manufacturer | yes |
| grafana-enterprise | grafana | grafana-enterprise | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | explicit | manufacturer | yes |
| hashicorp-consul | hashicorp | consul | trixie, bookworm, bullseye | amd64, arm64 | explicit | manufacturer | yes |
| hashicorp-nomad | hashicorp | nomad | trixie, bookworm, bullseye | amd64, arm64 | explicit | manufacturer | yes |
| hashicorp-boundary | hashicorp | boundary | trixie, bookworm, bullseye | amd64, arm64 | explicit | manufacturer | yes |
| elastic-agent-9 | elastic-9 | elastic-agent | trixie, bookworm | amd64, arm64 | explicit | manufacturer | yes |
| kubernetes-node-tools-v1-36 | kubernetes-v1-36 | kubelet, kubeadm | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | explicit | upstream | yes |
| microsoft-openjdk-21 | microsoft-prod | msopenjdk-21 | bookworm | amd64, arm64 | explicit | manufacturer | yes |
| microsoft-openjdk-25 | microsoft-prod | msopenjdk-25 | bookworm | amd64, arm64 | explicit | manufacturer | yes |
| eclipse-temurin-8 | adoptium | temurin-8-jdk | trixie, bookworm, bullseye | amd64, arm64 | explicit | upstream | yes |
| eclipse-temurin-11 | adoptium | temurin-11-jdk | trixie, bookworm, bullseye | amd64, arm64 | explicit | upstream | yes |
| eclipse-temurin-17 | adoptium | temurin-17-jdk | trixie, bookworm, bullseye | amd64, arm64 | explicit | upstream | yes |
| eclipse-temurin-21 | adoptium | temurin-21-jdk | trixie, bookworm, bullseye | amd64, arm64 | explicit | upstream | yes |
| amazon-corretto-8 | corretto | java-1.8.0-amazon-corretto-jdk | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | yes |
| amazon-corretto-11 | corretto | java-11-amazon-corretto-jdk | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | yes |
| amazon-corretto-17 | corretto | java-17-amazon-corretto-jdk | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | yes |
| amazon-corretto-25 | corretto | java-25-amazon-corretto-jdk | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | yes |
| azul-zulu-jdk-21 | azul-zulu | zulu21-jdk | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | yes |
| bellsoft-liberica-jdk-21 | bellsoft-liberica | bellsoft-java21 | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | yes |
| teamviewer | teamviewer | teamviewer | trixie, bookworm, bullseye, forky, sid | amd64 | generic-debian | manufacturer | yes |
| steam-launcher | steam | steam-launcher | trixie, bookworm, bullseye, forky, sid | amd64 | generic-debian | manufacturer | no |
| google-earth-pro | google-earth | google-earth-pro-stable | trixie, bookworm, bullseye, forky, sid | amd64 | generic-debian | manufacturer | no |
| sublime-merge | sublime | sublime-merge | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | no |
| typora | typora | typora | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | no |
| warp-terminal | warp | warp-terminal | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | no |
| nordvpn | nordvpn | nordvpn | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | yes |
| ivpn | ivpn | ivpn | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | yes |
| teleport-community-18 | teleport-18 | teleport | trixie, bookworm, bullseye | amd64, arm64 | explicit | upstream | yes |
| wazuh-agent | wazuh | wazuh-agent | trixie, bookworm, bullseye, forky, sid | amd64, arm64, i386 | generic-debian | manufacturer | yes |
| apache-couchdb-3-5 | apache-couchdb | couchdb | trixie, bookworm, bullseye | amd64, arm64 | explicit | upstream | yes |
| neo4j-community | neo4j | neo4j | trixie, bookworm, bullseye | amd64, arm64 | explicit | manufacturer | yes |
| icinga2 | icinga | icinga2 | trixie, bookworm, bullseye | amd64, arm64 | explicit | upstream | yes |
| mysql-community-server-8-4-lts | mysql-8-4 | mysql-server | trixie, bookworm, bullseye | amd64 | explicit | manufacturer | yes |
| opensearch-3 | opensearch-3 | opensearch | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | upstream | yes |
| datadog-agent-7 | datadog | datadog-agent | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | yes |
| falco | falco | falco | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | upstream | yes |
| trivy | trivy | trivy | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | upstream | yes |
| crowdsec-security-engine | crowdsec | crowdsec | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | yes |
| fluent-bit | fluent-bit | fluent-bit | trixie, bookworm, bullseye | amd64, arm64 | explicit | upstream | yes |
| dbeaver-community | dbeaver | dbeaver-ce | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | upstream | no |
| buildkite-agent | buildkite-agent | buildkite-agent | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | yes |
| buildkite-cli | buildkite-cli | bk | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | manufacturer | yes |
| openvpn-community | openvpn-community | openvpn | trixie, bookworm, bullseye | amd64, arm64 | explicit | upstream | yes |
| librewolf | librewolf | librewolf | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | upstream | yes |
| lutris | lutris | lutris | trixie | amd64 | explicit | community-endorsed | no |

## Explicit exclusions

Do not add Tor Browser, Docker Desktop, Discord, Zoom, Slack, JetBrains Toolbox, Postman, Bitwarden Desktop, GitKraken, RustDesk, OBS Studio, Dropbox, or Spotify. Also exclude RabbitMQ, Percona, Puppet Core, Netdata, New Relic, TimescaleDB, CockroachDB, Kopia, OpenVPN Access Server, and Helm. Their delivery, transport, key, community provenance, support policy, or version coupling does not meet this release policy. Helm is particularly excluded because its documented APT infrastructure is community operated while its use is security critical.
