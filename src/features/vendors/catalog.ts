import type { VendorProduct } from './model'
import { validateVendorCatalog } from './validate'

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach((child) => deepFreeze(child))
    Object.freeze(value)
  }
  return value
}

const catalog: VendorProduct[] = [
  {
    id: 'brave-browser', name: 'Brave Browser', category: 'browser', filename: 'brave-browser.sources',
    documentationUrl: 'https://brave.com/linux/', repositoryUrl: 'https://brave-browser-apt-release.s3.brave.com/', keyUrl: 'https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg', keyringPath: '/usr/share/keyrings/brave-browser-archive-keyring.gpg', packages: ['brave-browser'], architectures: ['amd64', 'arm64'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], suite: 'stable', components: ['main'], verifiedAt: '2026-08-28',
  },
  {
    id: 'mozilla-firefox', name: 'Mozilla Firefox', category: 'browser', filename: 'mozilla-firefox.sources',
    documentationUrl: 'https://support.mozilla.org/en-US/kb/install-firefox-linux', repositoryUrl: 'https://packages.mozilla.org/apt', keyUrl: 'https://packages.mozilla.org/apt/repo-signing-key.gpg', keyringPath: '/etc/apt/keyrings/packages.mozilla.org.asc', packages: ['firefox'], architectures: ['amd64', 'arm64'], releases: ['trixie', 'bookworm', 'bullseye'], suite: 'mozilla', components: ['main'], verifiedAt: '2026-08-28', preferences: 'Package: *\nPin: origin packages.mozilla.org\nPin-Priority: 1000\n',
  },
  {
    id: 'google-chrome', name: 'Google Chrome', category: 'browser', filename: 'google-chrome.sources',
    documentationUrl: 'https://support.google.com/chrome/a/answer/9025903', repositoryUrl: 'https://dl.google.com/linux/chrome/deb/', keyUrl: 'https://dl.google.com/linux/linux_signing_key.pub', keyringPath: '/etc/apt/keyrings/google-chrome.asc', packages: ['google-chrome-stable'], architectures: ['amd64'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], suite: 'stable', components: ['main'], verifiedAt: '2026-08-28',
  },
  {
    id: 'microsoft-edge', name: 'Microsoft Edge', category: 'browser', filename: 'microsoft-edge.sources',
    documentationUrl: 'https://learn.microsoft.com/en-us/linux/packages', repositoryUrl: 'https://packages.microsoft.com/repos/edge', keyUrl: 'https://packages.microsoft.com/keys/microsoft.asc', keyringPath: '/etc/apt/keyrings/microsoft-edge.gpg', packages: ['microsoft-edge-stable'], architectures: ['amd64'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], suite: 'stable', components: ['main'], verifiedAt: '2026-08-28',
  },
  {
    id: 'vivaldi', name: 'Vivaldi', category: 'browser', filename: 'vivaldi.sources',
    documentationUrl: 'https://help.vivaldi.com/desktop/install-update/install-vivaldi-on-linux/', repositoryUrl: 'https://repo.vivaldi.com/stable/deb/', keyUrl: 'https://repo.vivaldi.com/archive/linux_signing_key.pub', keyringPath: '/etc/apt/keyrings/vivaldi.gpg', packages: ['vivaldi-stable'], architectures: ['amd64', 'arm64'], releases: ['trixie', 'forky', 'sid'], suite: 'stable', components: ['main'], verifiedAt: '2026-08-28',
  },
  {
    id: 'opera', name: 'Opera', category: 'browser', filename: 'opera.sources',
    documentationUrl: 'https://www.opera.com/download', repositoryUrl: 'https://deb.opera.com/opera-stable/', keyUrl: 'https://deb.opera.com/archive.key', keyringPath: '/etc/apt/keyrings/opera.gpg', packages: ['opera-stable'], architectures: ['amd64'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], suite: 'stable', components: ['non-free'], verifiedAt: '2026-08-28',
  },
  {
    id: 'signal-desktop', name: 'Signal Desktop', category: 'communication', filename: 'signal-desktop.sources',
    documentationUrl: 'https://signal.org/download/linux/', repositoryUrl: 'https://updates.signal.org/desktop/apt/', keyUrl: 'https://updates.signal.org/desktop/apt/keys.asc', keyringPath: '/usr/share/keyrings/signal-desktop-keyring.gpg', packages: ['signal-desktop'], architectures: ['amd64'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], suite: 'xenial', components: ['main'], verifiedAt: '2026-08-28',
  },
  {
    id: 'proton-vpn', name: 'Proton VPN', category: 'privacy', filename: 'proton-vpn.sources',
    documentationUrl: 'https://protonvpn.com/support/linux-vpn-setup', repositoryUrl: 'https://repo.protonvpn.com/debian', keyUrl: 'https://repo.protonvpn.com/debian/public_key.asc', keyringPath: '/etc/apt/keyrings/protonvpn-stable-archive-keyring.gpg', packages: ['proton-vpn-gnome-desktop'], architectures: ['amd64', 'arm64'], releases: ['trixie'], suite: 'stable', components: ['main'], verifiedAt: '2026-08-28', warning: 'Offiziell unterstützt werden nur die aktuelle stabile Debian-Version mit GNOME und kein Headless-Betrieb.',
  },
  {
    id: 'mullvad-vpn', name: 'Mullvad VPN', category: 'privacy', filename: 'mullvad-vpn.sources',
    documentationUrl: 'https://mullvad.net/en/help/install-mullvad-app-linux', repositoryUrl: 'https://repository.mullvad.net/deb/stable', keyUrl: 'https://repository.mullvad.net/deb/mullvad-keyring.asc', keyringPath: '/usr/share/keyrings/mullvad-keyring.asc', packages: ['mullvad-vpn'], architectures: ['amd64', 'arm64'], releases: ['trixie', 'bookworm', 'forky', 'sid'], suite: 'stable', components: ['main'], verifiedAt: '2026-08-28',
  },
  {
    id: 'tor', name: 'Tor', category: 'privacy', filename: 'tor.sources',
    documentationUrl: 'https://support.torproject.org/apt/tor-deb-repo/', repositoryUrl: 'https://deb.torproject.org/torproject.org', keyUrl: 'https://deb.torproject.org/torproject.org/keys/archive-keyring.gpg', keyringPath: '/usr/share/keyrings/deb.torproject.org-keyring.gpg', packages: ['tor'], architectures: ['amd64', 'arm64'], releases: ['trixie', 'bookworm', 'bullseye'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['main'], verifiedAt: '2026-08-28', warning: 'Dieses Repository liefert Tor-Daemon und -Client, nicht den Tor Browser.',
  },
  {
    id: 'docker-engine', name: 'Docker Engine', category: 'containers', filename: 'docker-engine.sources',
    documentationUrl: 'https://docs.docker.com/engine/install/debian/', repositoryUrl: 'https://download.docker.com/linux/debian', keyUrl: 'https://download.docker.com/linux/debian/gpg', keyringPath: '/etc/apt/keyrings/docker.asc', packages: ['docker-ce', 'docker-ce-cli', 'containerd.io', 'docker-buildx-plugin', 'docker-compose-plugin'], architectures: ['amd64', 'arm64', 'armhf'], releases: ['trixie', 'bookworm', 'bullseye'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['stable'], verifiedAt: '2026-08-28', warning: 'Docker kann Firewall-Regeln verändern und dadurch Firewall-Regeln umgehen.',
  },
  {
    id: 'kubernetes-tools-v1-36', name: 'Kubernetes tools v1.36', category: 'containers', filename: 'kubernetes-tools-v1-36.sources',
    documentationUrl: 'https://v1-36.docs.kubernetes.io/docs/tasks/tools/install-kubectl-linux/', repositoryUrl: 'https://pkgs.k8s.io/core:/stable:/v1.36/deb/', keyUrl: 'https://pkgs.k8s.io/core:/stable:/v1.36/deb/Release.key', keyringPath: '/etc/apt/keyrings/kubernetes-apt-keyring.gpg', packages: ['kubectl'], architectures: ['amd64', 'arm64'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], suite: '/', components: [], verifiedAt: '2026-08-28',
  },
  {
    id: 'google-cloud-cli', name: 'Google Cloud CLI', category: 'cloud', filename: 'google-cloud-cli.sources',
    documentationUrl: 'https://docs.cloud.google.com/sdk/docs/install-sdk', repositoryUrl: 'https://packages.cloud.google.com/apt', keyUrl: 'https://packages.cloud.google.com/apt/doc/apt-key.gpg', keyringPath: '/usr/share/keyrings/cloud.google.gpg', packages: ['google-cloud-cli'], architectures: ['amd64', 'arm64'], releases: ['trixie', 'bookworm', 'bullseye'], suite: 'cloud-sdk', components: ['main'], verifiedAt: '2026-08-28',
  },
  {
    id: 'azure-cli', name: 'Microsoft Azure CLI', category: 'cloud', filename: 'azure-cli.sources',
    documentationUrl: 'https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-linux', repositoryUrl: 'https://packages.microsoft.com/repos/azure-cli/', keyUrl: 'https://packages.microsoft.com/keys/microsoft.asc', keyringPath: '/etc/apt/keyrings/microsoft-azure-cli.gpg', packages: ['azure-cli'], architectures: ['amd64', 'arm64'], releases: ['bookworm', 'bullseye'], suite: { bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['main'], verifiedAt: '2026-08-28',
  },
  {
    id: 'github-cli', name: 'GitHub CLI', category: 'development', filename: 'github-cli.sources',
    documentationUrl: 'https://cli.github.com/manual/installation', repositoryUrl: 'https://cli.github.com/packages', keyUrl: 'https://cli.github.com/packages/githubcli-archive-keyring.gpg', keyringPath: '/usr/share/keyrings/githubcli-archive-keyring.gpg', packages: ['gh'], architectures: ['amd64', 'arm64'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], suite: 'stable', components: ['main'], verifiedAt: '2026-08-28',
  },
  {
    id: 'hashicorp-terraform', name: 'HashiCorp Terraform', category: 'development', filename: 'hashicorp-terraform.sources',
    documentationUrl: 'https://developer.hashicorp.com/terraform/install', repositoryUrl: 'https://apt.releases.hashicorp.com', keyUrl: 'https://apt.releases.hashicorp.com/gpg', keyringPath: '/usr/share/keyrings/hashicorp-archive-keyring.gpg', packages: ['terraform'], architectures: ['amd64', 'arm64'], releases: ['trixie', 'bookworm', 'bullseye'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['main'], verifiedAt: '2026-08-28',
  },
  {
    id: 'postgresql-pgdg', name: 'PostgreSQL PGDG', category: 'database', filename: 'postgresql-pgdg.sources',
    documentationUrl: 'https://wiki.postgresql.org/wiki/Apt', repositoryUrl: 'https://apt.postgresql.org/pub/repos/apt/', keyUrl: 'https://www.postgresql.org/media/keys/ACCC4CF8.asc', keyringPath: '/usr/share/keyrings/postgresql-apt.gpg', packages: ['postgresql'], architectures: ['amd64', 'arm64'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], suite: { trixie: 'trixie-pgdg', bookworm: 'bookworm-pgdg', bullseye: 'bullseye-pgdg', forky: 'forky-pgdg', sid: 'sid-pgdg' }, components: ['main'], verifiedAt: '2026-08-28',
  },
  {
    id: 'mongodb-community-8-0', name: 'MongoDB Community 8.0', category: 'database', filename: 'mongodb-community-8-0.sources',
    documentationUrl: 'https://www.mongodb.com/docs/v8.0/tutorial/install-mongodb-on-debian/', repositoryUrl: 'https://repo.mongodb.org/apt/debian', keyUrl: 'https://pgp.mongodb.com/server-8.0.asc', keyringPath: '/usr/share/keyrings/mongodb-server-8.0.gpg', packages: ['mongodb-org'], architectures: ['amd64'], releases: ['bookworm'], suite: 'bookworm/mongodb-org/8.0', components: ['main'], verifiedAt: '2026-08-28',
  },
  {
    id: 'grafana', name: 'Grafana', category: 'monitoring', filename: 'grafana.sources',
    documentationUrl: 'https://grafana.com/docs/grafana/latest/setup-grafana/installation/debian/', repositoryUrl: 'https://apt.grafana.com', keyUrl: 'https://apt.grafana.com/gpg-full.key', keyringPath: '/etc/apt/keyrings/grafana.asc', packages: ['grafana'], architectures: ['amd64', 'arm64'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], suite: 'stable', components: ['main'], verifiedAt: '2026-08-28',
  },
  {
    id: 'nvidia-container-toolkit', name: 'NVIDIA Container Toolkit', category: 'containers', filename: 'nvidia-container-toolkit.sources',
    documentationUrl: 'https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html', repositoryUrl: { amd64: 'https://nvidia.github.io/libnvidia-container/stable/deb/amd64', arm64: 'https://nvidia.github.io/libnvidia-container/stable/deb/arm64' }, keyUrl: 'https://nvidia.github.io/libnvidia-container/gpgkey', keyringPath: '/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg', packages: ['nvidia-container-toolkit'], architectures: ['amd64', 'arm64'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], suite: '/', components: [], verifiedAt: '2026-08-28', warning: 'Erfordert eine unterstützte NVIDIA-GPU, einen installierten NVIDIA-Treiber und eine unterstützte Container-Laufzeit.',
  },
  {
    id: 'mariadb-community-11-8', name: 'MariaDB Community 11.8', category: 'database', filename: 'mariadb-community-11-8.sources',
    documentationUrl: 'https://mariadb.com/docs/server/deploy/deployment-methods/installation-guides/debian-ubuntu-repository-configuration', repositoryUrl: 'https://dlm.mariadb.com/repo/mariadb-server/11.8/repo/debian', keyUrl: 'https://mariadb.org/mariadb_release_signing_key.pgp', keyringPath: '/etc/apt/keyrings/mariadb-server-11-8.pgp', packages: ['mariadb-server'], architectures: ['amd64', 'arm64'], releases: ['trixie', 'bookworm', 'bullseye', 'sid'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye', sid: 'sid' }, components: ['main'], verifiedAt: '2026-08-28', warning: 'Die offizielle MariaDB-Einrichtung per Setup-Skript wird nicht ausgeführt; nur das geprüfte Repository wird verwendet.',
  },
  {
    id: 'redis-open-source', name: 'Redis Open Source', category: 'database', filename: 'redis-open-source.sources',
    documentationUrl: 'https://redis.io/docs/latest/operate/oss_and_stack/install/install-stack/', repositoryUrl: 'https://packages.redis.io/deb', keyUrl: 'https://packages.redis.io/gpg', keyringPath: '/usr/share/keyrings/redis-archive-keyring.gpg', packages: ['redis'], architectures: ['amd64', 'arm64'], releases: ['trixie', 'bookworm'], suite: { trixie: 'trixie', bookworm: 'bookworm' }, components: ['main'], verifiedAt: '2026-08-28',
  },
  {
    id: 'clickhouse', name: 'ClickHouse', category: 'database', filename: 'clickhouse.sources',
    documentationUrl: 'https://clickhouse.com/docs/en/getting-started/install/', repositoryUrl: 'https://packages.clickhouse.com/deb', keyUrl: 'https://packages.clickhouse.com/rpm/lts/repodata/repomd.xml.key', keyringPath: '/usr/share/keyrings/clickhouse-keyring.gpg', packages: ['clickhouse-server', 'clickhouse-client'], architectures: ['amd64', 'arm64'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], suite: 'stable', components: ['main'], verifiedAt: '2026-08-28', warning: 'Das ClickHouse-Repository ist distributionsunabhängig; die Kompatibilität bezieht sich auf die bereitgestellten Paketarchitekturen.',
  },
  {
    id: 'influxdb-3-core', name: 'InfluxDB 3 Core', category: 'monitoring', filename: 'influxdb-3-core.sources',
    documentationUrl: 'https://docs.influxdata.com/influxdb3/core/install/', repositoryUrl: 'https://repos.influxdata.com/debian', keyUrl: 'https://repos.influxdata.com/influxdata-archive.key', keyringPath: '/usr/share/keyrings/influxdata-archive.gpg', packages: ['influxdb3-core'], architectures: ['amd64', 'arm64'], releases: ['trixie', 'bookworm', 'forky', 'sid'], suite: 'stable', components: ['main'], verifiedAt: '2026-08-28',
  },
  {
    id: 'zabbix-7-4', name: 'Zabbix 7.4', category: 'monitoring', filename: 'zabbix-7-4.sources',
    documentationUrl: 'https://www.zabbix.com/documentation/current/en/manual/installation/install_from_packages/debian_ubuntu', repositoryUrl: 'https://repo.zabbix.com/zabbix/7.4/stable/debian', keyUrl: 'https://repo.zabbix.com/zabbix-official-repo.key', keyringPath: '/etc/apt/keyrings/zabbix-official-repo.gpg', packages: ['zabbix-agent2'], architectures: ['amd64', 'arm64'], releases: ['trixie', 'bookworm', 'bullseye'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['main'], verifiedAt: '2026-08-28',
  },
]

validateVendorCatalog(catalog)

export const VENDOR_PRODUCTS: readonly VendorProduct[] = deepFreeze(catalog)

export function getVendorProduct(id: string): VendorProduct | undefined {
  return VENDOR_PRODUCTS.find((product) => product.id === id)
}
