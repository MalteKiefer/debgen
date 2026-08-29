import type {
  RepositoryKeyFormat,
  RepositorySource,
  SystemArchitecture,
  WarningKey,
} from './model'

type SourceDefinition = {
  readonly id: string
  readonly name: string
  readonly documentationUrl: string
  readonly uri: string | Readonly<Partial<Record<SystemArchitecture, string>>>
  readonly releases: readonly ('trixie' | 'bookworm' | 'bullseye' | 'forky' | 'sid')[]
  readonly architectures: readonly SystemArchitecture[]
  readonly suite: string | Readonly<Partial<Record<'trixie' | 'bookworm' | 'bullseye' | 'forky' | 'sid', string>>>
  readonly components: readonly string[]
  readonly keyUrl: string
  readonly keyringPath: string
  readonly keyFormat: RepositoryKeyFormat
  readonly fingerprints?: readonly string[]
  readonly preferenceFiles?: readonly { readonly id: string, readonly content: string }[]
  readonly warnings?: readonly WarningKey[]
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach((child) => deepFreeze(child))
    Object.freeze(value)
  }
  return value
}

function source(definition: SourceDefinition): RepositorySource {
  const locations = typeof definition.uri === 'string' && typeof definition.suite === 'string'
    ? [{
        uri: definition.uri,
        releases: definition.releases,
        architectures: definition.architectures,
        suite: definition.suite,
        components: definition.components,
        supportLevel: 'explicit' as const,
      }]
    : definition.releases.flatMap((release) => definition.architectures.map((architecture) => ({
        uri: typeof definition.uri === 'string' ? definition.uri : definition.uri[architecture] as string,
        releases: [release],
        architectures: [architecture],
        suite: typeof definition.suite === 'string' ? definition.suite : definition.suite[release] as string,
        components: definition.components,
        supportLevel: 'explicit' as const,
      })))
  return {
    id: definition.id,
    name: definition.name,
    documentationUrl: definition.documentationUrl,
    verifiedAt: '2026-08-29',
    locations,
    keys: [{
      id: `${definition.id}-signing-key`,
      url: definition.keyUrl,
      keyringPath: definition.keyringPath,
      format: definition.keyFormat,
      fingerprints: definition.fingerprints ?? [],
      releases: definition.releases,
    }],
    auxiliaryTrustFiles: [],
    preferenceFiles: definition.preferenceFiles ?? [],
    warnings: definition.warnings ?? [],
  }
}

const sources = [
  source({ id: 'brave-browser', name: 'Brave Browser', documentationUrl: 'https://brave.com/linux/', uri: 'https://brave-browser-apt-release.s3.brave.com/', keyUrl: 'https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg', keyringPath: '/usr/share/keyrings/brave-browser-archive-keyring.gpg', keyFormat: 'binary', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'] }),
  source({ id: 'mozilla', name: 'Mozilla', documentationUrl: 'https://support.mozilla.org/en-US/kb/install-firefox-linux', uri: 'https://packages.mozilla.org/apt', keyUrl: 'https://packages.mozilla.org/apt/repo-signing-key.gpg', keyringPath: '/etc/apt/keyrings/packages.mozilla.org.asc', keyFormat: 'ascii-armored', fingerprints: ['35BAA0B33E9EB396F59CA838C0BA5CE6DC6315A3'], releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: 'mozilla', components: ['main'], preferenceFiles: [{ id: 'mozilla-firefox', content: 'Package: *\nPin: origin packages.mozilla.org\nPin-Priority: 1000\n' }] }),
  source({ id: 'google-chrome', name: 'Google Chrome', documentationUrl: 'https://support.google.com/chrome/a/answer/9025903', uri: 'https://dl.google.com/linux/chrome/deb/', keyUrl: 'https://dl.google.com/linux/linux_signing_key.pub', keyringPath: '/etc/apt/keyrings/google-chrome.asc', keyFormat: 'ascii-armored', fingerprints: ['EB4C1BFD4F042F6DDDCCEC917721F63BD38B4796'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64'], suite: 'stable', components: ['main'] }),
  source({ id: 'microsoft-edge', name: 'Microsoft Edge', documentationUrl: 'https://learn.microsoft.com/en-us/linux/packages', uri: 'https://packages.microsoft.com/repos/edge', keyUrl: 'https://packages.microsoft.com/keys/microsoft.asc', keyringPath: '/etc/apt/keyrings/microsoft-edge.gpg', keyFormat: 'ascii-armored', fingerprints: ['BC528686B50D79E339D3721CEB3E94ADBE1229CF'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64'], suite: 'stable', components: ['main'] }),
  source({ id: 'vivaldi', name: 'Vivaldi', documentationUrl: 'https://help.vivaldi.com/desktop/install-update/obtaining-official-builds/', uri: 'https://repo.vivaldi.com/stable/deb/', keyUrl: 'https://repo.vivaldi.com/stable/linux_signing_key.pub', keyringPath: '/etc/apt/keyrings/vivaldi.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'] }),
  source({ id: 'opera', name: 'Opera', documentationUrl: 'https://deb.opera.com/manual.html', uri: 'https://deb.opera.com/opera-stable/', keyUrl: 'https://deb.opera.com/archive.key', keyringPath: '/etc/apt/keyrings/opera.gpg', keyFormat: 'ascii-armored', fingerprints: ['6C86BE214648376680CA957B11EE8C00B693A745'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64'], suite: 'stable', components: ['non-free'] }),
  source({ id: 'signal', name: 'Signal', documentationUrl: 'https://signal.org/download/linux/', uri: 'https://updates.signal.org/desktop/apt/', keyUrl: 'https://updates.signal.org/desktop/apt/keys.asc', keyringPath: '/usr/share/keyrings/signal-desktop-keyring.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64'], suite: 'xenial', components: ['main'] }),
  source({ id: 'proton-vpn', name: 'Proton VPN', documentationUrl: 'https://protonvpn.com/support/linux-vpn-setup', uri: 'https://repo.protonvpn.com/debian', keyUrl: 'https://repo.protonvpn.com/debian/public_key.asc', keyringPath: '/etc/apt/keyrings/protonvpn-stable-archive-keyring.gpg', keyFormat: 'ascii-armored', releases: ['trixie'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'], warnings: ['proton-vpn-supported-environment'] }),
  source({ id: 'mullvad', name: 'Mullvad', documentationUrl: 'https://mullvad.net/en/help/install-mullvad-app-linux', uri: 'https://repository.mullvad.net/deb/stable', keyUrl: 'https://repository.mullvad.net/deb/mullvad-keyring.asc', keyringPath: '/usr/share/keyrings/mullvad-keyring.asc', keyFormat: 'ascii-armored', fingerprints: ['A1198702FC3E0A09A9AE5B75D5A1D4F266DE8DDF'], releases: ['trixie', 'bookworm', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'] }),
  source({ id: 'tor', name: 'Tor', documentationUrl: 'https://support.torproject.org/little-t-tor/getting-started/installing/', uri: 'https://deb.torproject.org/torproject.org', keyUrl: 'https://deb.torproject.org/torproject.org/A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89.asc', keyringPath: '/usr/share/keyrings/deb.torproject.org-keyring.gpg', keyFormat: 'ascii-armored', fingerprints: ['A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89'], releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['main'], warnings: ['tor-not-browser'] }),
  source({ id: 'docker', name: 'Docker', documentationUrl: 'https://docs.docker.com/engine/install/debian/', uri: 'https://download.docker.com/linux/debian', keyUrl: 'https://download.docker.com/linux/debian/gpg', keyringPath: '/etc/apt/keyrings/docker.asc', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64', 'armhf'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['stable'], warnings: ['docker-firewall'] }),
  source({ id: 'kubernetes-v1-36', name: 'Kubernetes v1.36', documentationUrl: 'https://v1-36.docs.kubernetes.io/docs/tasks/tools/install-kubectl-linux/', uri: 'https://pkgs.k8s.io/core:/stable:/v1.36/deb/', keyUrl: 'https://pkgs.k8s.io/core:/stable:/v1.36/deb/Release.key', keyringPath: '/etc/apt/keyrings/kubernetes-apt-keyring.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: '/', components: [] }),
  source({ id: 'google-cloud', name: 'Google Cloud', documentationUrl: 'https://docs.cloud.google.com/sdk/docs/install-sdk', uri: 'https://packages.cloud.google.com/apt', keyUrl: 'https://packages.cloud.google.com/apt/doc/apt-key.gpg', keyringPath: '/usr/share/keyrings/cloud.google.gpg', keyFormat: 'binary', releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: 'cloud-sdk', components: ['main'] }),
  source({ id: 'microsoft-azure-cli', name: 'Microsoft Azure CLI', documentationUrl: 'https://learn.microsoft.com/en-us/cli/azure/install-azure-cli-linux', uri: 'https://packages.microsoft.com/repos/azure-cli/', keyUrl: 'https://packages.microsoft.com/keys/microsoft.asc', keyringPath: '/etc/apt/keyrings/microsoft-azure-cli.gpg', keyFormat: 'ascii-armored', fingerprints: ['BC528686B50D79E339D3721CEB3E94ADBE1229CF'], releases: ['bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: { bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['main'] }),
  source({ id: 'github-cli', name: 'GitHub CLI', documentationUrl: 'https://github.com/cli/cli/blob/trunk/docs/install_linux.md', uri: 'https://cli.github.com/packages', keyUrl: 'https://cli.github.com/packages/githubcli-archive-keyring.gpg', keyringPath: '/usr/share/keyrings/githubcli-archive-keyring.gpg', keyFormat: 'binary', fingerprints: ['2C6106201985B60E6C7AC87323F3D4EA75716059', '7F38BBB59D064DBCB3D84D725612B36462313325'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'] }),
  source({ id: 'hashicorp', name: 'HashiCorp', documentationUrl: 'https://developer.hashicorp.com/terraform/install', uri: 'https://apt.releases.hashicorp.com', keyUrl: 'https://apt.releases.hashicorp.com/gpg', keyringPath: '/usr/share/keyrings/hashicorp-archive-keyring.gpg', keyFormat: 'ascii-armored', fingerprints: ['798AEC654E5C15428C8E42EEAA16FCBCA621E701'], releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['main'] }),
  source({ id: 'postgresql-pgdg', name: 'PostgreSQL PGDG', documentationUrl: 'https://wiki.postgresql.org/wiki/Apt', uri: 'https://apt.postgresql.org/pub/repos/apt/', keyUrl: 'https://www.postgresql.org/media/keys/ACCC4CF8.asc', keyringPath: '/usr/share/keyrings/postgresql-apt.gpg', keyFormat: 'ascii-armored', fingerprints: ['B97B0AFCAA1A47F044F244A07FCC7D46ACCC4CF8'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: { trixie: 'trixie-pgdg', bookworm: 'bookworm-pgdg', bullseye: 'bullseye-pgdg', forky: 'forky-pgdg', sid: 'sid-pgdg' }, components: ['main'] }),
  source({ id: 'mongodb-community-8-0', name: 'MongoDB Community 8.0', documentationUrl: 'https://www.mongodb.com/docs/v8.0/tutorial/install-mongodb-on-debian/', uri: 'https://repo.mongodb.org/apt/debian', keyUrl: 'https://pgp.mongodb.com/server-8.0.asc', keyringPath: '/usr/share/keyrings/mongodb-server-8.0.gpg', keyFormat: 'ascii-armored', releases: ['bookworm'], architectures: ['amd64'], suite: 'bookworm/mongodb-org/8.0', components: ['main'] }),
  source({ id: 'grafana', name: 'Grafana', documentationUrl: 'https://grafana.com/docs/grafana/latest/setup-grafana/installation/debian/', uri: 'https://apt.grafana.com', keyUrl: 'https://apt.grafana.com/gpg-full.key', keyringPath: '/etc/apt/keyrings/grafana.asc', keyFormat: 'ascii-armored', fingerprints: ['4E40DDF6D76E284A4A6780E48C8C34C524098CB6', '0E22EB88E39E12277A7760AE9E439B102CF3C0C6', 'B53AE77BADB630A683046005963FA27710458545'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'] }),
  source({ id: 'nvidia-container-toolkit', name: 'NVIDIA Container Toolkit', documentationUrl: 'https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html', uri: { amd64: 'https://nvidia.github.io/libnvidia-container/stable/deb/amd64', arm64: 'https://nvidia.github.io/libnvidia-container/stable/deb/arm64' }, keyUrl: 'https://nvidia.github.io/libnvidia-container/gpgkey', keyringPath: '/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: '/', components: [], warnings: ['nvidia-container-toolkit-prerequisites'] }),
  source({ id: 'mariadb-community-11-8', name: 'MariaDB Community 11.8', documentationUrl: 'https://mariadb.com/docs/server/server-management/install-and-upgrade-mariadb/installing-mariadb/binary-packages/gpg', uri: 'https://dlm.mariadb.com/repo/mariadb-server/11.8/repo/debian', keyUrl: 'https://mariadb.org/mariadb_release_signing_key.pgp', keyringPath: '/etc/apt/keyrings/mariadb-server-11-8.pgp', keyFormat: 'ascii-armored', fingerprints: ['177F4010FE56CA3336300305F1656F24C74CD1D8'], releases: ['trixie', 'bookworm', 'bullseye', 'sid'], architectures: ['amd64', 'arm64'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye', sid: 'sid' }, components: ['main'], warnings: ['mariadb-no-setup-script'] }),
  source({ id: 'redis-open-source', name: 'Redis Open Source', documentationUrl: 'https://redis.io/docs/latest/operate/oss_and_stack/install/install-stack/', uri: 'https://packages.redis.io/deb', keyUrl: 'https://packages.redis.io/gpg', keyringPath: '/usr/share/keyrings/redis-archive-keyring.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm'], architectures: ['amd64', 'arm64'], suite: { trixie: 'trixie', bookworm: 'bookworm' }, components: ['main'] }),
  source({ id: 'clickhouse', name: 'ClickHouse', documentationUrl: 'https://clickhouse.com/docs/en/getting-started/install/', uri: 'https://packages.clickhouse.com/deb', keyUrl: 'https://packages.clickhouse.com/rpm/lts/repodata/repomd.xml.key', keyringPath: '/usr/share/keyrings/clickhouse-keyring.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'], warnings: ['clickhouse-generic-debian'] }),
  source({ id: 'influxdb-3-core', name: 'InfluxDB 3 Core', documentationUrl: 'https://docs.influxdata.com/influxdb3/core/install/', uri: 'https://repos.influxdata.com/debian', keyUrl: 'https://repos.influxdata.com/influxdata-archive.key', keyringPath: '/usr/share/keyrings/influxdata-archive.gpg', keyFormat: 'ascii-armored', fingerprints: ['24C975CBA61A024EE1B631787C3D57159FC2F927'], releases: ['trixie', 'bookworm', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'] }),
  source({ id: 'zabbix-7-4', name: 'Zabbix 7.4', documentationUrl: 'https://www.zabbix.com/documentation/current/en/manual/installation/install_from_packages', uri: 'https://repo.zabbix.com/zabbix/7.4/stable/debian', keyUrl: 'https://repo.zabbix.com/zabbix-official-repo.key', keyringPath: '/etc/apt/keyrings/zabbix-official-repo.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['main'] }),
] as const

export const REPOSITORY_SOURCES: readonly RepositorySource[] = deepFreeze(sources)

export function getRepositorySource(id: string): RepositorySource | undefined {
  return REPOSITORY_SOURCES.find((source) => source.id === id)
}
