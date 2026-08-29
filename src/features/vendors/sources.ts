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
  readonly supportLevel?: RepositorySource['locations'][number]['supportLevel']
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
        supportLevel: definition.supportLevel ?? 'explicit',
      }]
    : definition.releases.flatMap((release) => definition.architectures.map((architecture) => ({
        uri: typeof definition.uri === 'string' ? definition.uri : definition.uri[architecture] as string,
        releases: [release],
        architectures: [architecture],
        suite: typeof definition.suite === 'string' ? definition.suite : definition.suite[release] as string,
        components: definition.components,
        supportLevel: definition.supportLevel ?? 'explicit',
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
  source({ id: 'clickhouse', name: 'ClickHouse', documentationUrl: 'https://clickhouse.com/docs/en/getting-started/install/', uri: 'https://packages.clickhouse.com/deb', keyUrl: 'https://packages.clickhouse.com/rpm/lts/repodata/repomd.xml.key', keyringPath: '/usr/share/keyrings/clickhouse-keyring.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'], supportLevel: 'generic-debian', warnings: ['clickhouse-generic-debian'] }),
  source({ id: 'influxdb-3-core', name: 'InfluxDB 3 Core', documentationUrl: 'https://docs.influxdata.com/influxdb3/core/install/', uri: 'https://repos.influxdata.com/debian', keyUrl: 'https://repos.influxdata.com/influxdata-archive.key', keyringPath: '/usr/share/keyrings/influxdata-archive.gpg', keyFormat: 'ascii-armored', fingerprints: ['24C975CBA61A024EE1B631787C3D57159FC2F927'], releases: ['trixie', 'bookworm', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'] }),
  source({ id: 'zabbix-7-4', name: 'Zabbix 7.4', documentationUrl: 'https://www.zabbix.com/documentation/current/en/manual/installation/install_from_packages', uri: 'https://repo.zabbix.com/zabbix/7.4/stable/debian', keyUrl: 'https://repo.zabbix.com/zabbix-official-repo.key', keyringPath: '/etc/apt/keyrings/zabbix-official-repo.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['main'] }),
  {
    id: 'onepassword',
    name: '1Password',
    documentationUrl: 'https://support.1password.com/install-linux/',
    verifiedAt: '2026-08-29',
    locations: [
      { uri: 'https://downloads.1password.com/linux/debian/amd64', releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64'], suite: 'stable', components: ['main'], supportLevel: 'explicit' },
      { uri: 'https://downloads.1password.com/linux/debian/arm64', releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['arm64'], suite: 'stable', components: ['main'], supportLevel: 'explicit' },
    ],
    keys: [{ id: 'onepassword-signing-key', url: 'https://downloads.1password.com/linux/keys/1password.asc', keyringPath: '/usr/share/keyrings/1password-archive-keyring.gpg', format: 'ascii-armored', fingerprints: ['3FEF9748469ADBE15DA7CA80AC2D62742012EA22'], releases: ['trixie', 'bookworm', 'bullseye'] }],
    auxiliaryTrustFiles: [
      { id: 'onepassword-policy', url: 'https://downloads.1password.com/linux/debian/debsig/1password.pol', destination: 'debsig-policy', mediaType: 'application/xml' },
      { id: 'onepassword-keyring', url: 'https://downloads.1password.com/linux/keys/1password.asc', destination: 'debsig-keyring', mediaType: 'application/pgp-keys', fingerprint: '3FEF9748469ADBE15DA7CA80AC2D62742012EA22' },
    ],
    preferenceFiles: [],
    warnings: [],
  },
  source({ id: 'visual-studio-code', name: 'Visual Studio Code', documentationUrl: 'https://code.visualstudio.com/docs/setup/linux', uri: 'https://packages.microsoft.com/repos/code', keyUrl: 'https://packages.microsoft.com/keys/microsoft.asc', keyringPath: '/etc/apt/keyrings/vscode.gpg', keyFormat: 'ascii-armored', fingerprints: ['BC528686B50D79E339D3721CEB3E94ADBE1229CF'], releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64', 'armhf'], suite: 'stable', components: ['main'] }),
  {
    id: 'microsoft-prod',
    name: 'Microsoft Products',
    documentationUrl: 'https://learn.microsoft.com/en-us/linux/packages',
    verifiedAt: '2026-08-29',
    locations: [
      { uri: 'https://packages.microsoft.com/debian/13/prod', releases: ['trixie'], architectures: ['amd64', 'arm64'], suite: 'trixie', components: ['main'], supportLevel: 'explicit' },
      { uri: 'https://packages.microsoft.com/debian/12/prod', releases: ['bookworm'], architectures: ['amd64', 'arm64'], suite: 'bookworm', components: ['main'], supportLevel: 'explicit' },
    ],
    keys: [{ id: 'microsoft-prod-signing-key', url: 'https://packages.microsoft.com/keys/microsoft.asc', keyringPath: '/etc/apt/keyrings/microsoft-prod.gpg', format: 'ascii-armored', fingerprints: ['BC528686B50D79E339D3721CEB3E94ADBE1229CF'], releases: ['trixie', 'bookworm'] }],
    auxiliaryTrustFiles: [],
    preferenceFiles: [],
    warnings: [],
  },
  {
    id: 'tailscale',
    name: 'Tailscale',
    documentationUrl: 'https://tailscale.com/kb/1031/install-linux',
    verifiedAt: '2026-08-29',
    locations: [
      { uri: 'https://pkgs.tailscale.com/stable/debian', releases: ['trixie'], architectures: ['amd64', 'arm64', 'armhf', 'i386'], suite: 'trixie', components: ['main'], supportLevel: 'explicit' },
      { uri: 'https://pkgs.tailscale.com/stable/debian', releases: ['bookworm'], architectures: ['amd64', 'arm64', 'armhf', 'i386'], suite: 'bookworm', components: ['main'], supportLevel: 'explicit' },
      { uri: 'https://pkgs.tailscale.com/stable/debian', releases: ['bullseye'], architectures: ['amd64', 'arm64', 'armhf', 'i386'], suite: 'bullseye', components: ['main'], supportLevel: 'explicit' },
      { uri: 'https://pkgs.tailscale.com/stable/debian', releases: ['forky'], architectures: ['amd64', 'arm64', 'armhf', 'i386'], suite: 'forky', components: ['main'], supportLevel: 'explicit' },
      { uri: 'https://pkgs.tailscale.com/stable/debian', releases: ['sid'], architectures: ['amd64', 'arm64', 'armhf', 'i386'], suite: 'sid', components: ['main'], supportLevel: 'explicit' },
    ],
    keys: [
      { id: 'tailscale-trixie-key', url: 'https://pkgs.tailscale.com/stable/debian/trixie.noarmor.gpg', keyringPath: '/usr/share/keyrings/tailscale-trixie-archive-keyring.gpg', format: 'binary', fingerprints: [], releases: ['trixie'] },
      { id: 'tailscale-bookworm-key', url: 'https://pkgs.tailscale.com/stable/debian/bookworm.noarmor.gpg', keyringPath: '/usr/share/keyrings/tailscale-bookworm-archive-keyring.gpg', format: 'binary', fingerprints: [], releases: ['bookworm'] },
      { id: 'tailscale-bullseye-key', url: 'https://pkgs.tailscale.com/stable/debian/bullseye.noarmor.gpg', keyringPath: '/usr/share/keyrings/tailscale-bullseye-archive-keyring.gpg', format: 'binary', fingerprints: [], releases: ['bullseye'] },
      { id: 'tailscale-forky-key', url: 'https://pkgs.tailscale.com/stable/debian/forky.noarmor.gpg', keyringPath: '/usr/share/keyrings/tailscale-forky-archive-keyring.gpg', format: 'binary', fingerprints: [], releases: ['forky'] },
      { id: 'tailscale-sid-key', url: 'https://pkgs.tailscale.com/stable/debian/sid.noarmor.gpg', keyringPath: '/usr/share/keyrings/tailscale-sid-archive-keyring.gpg', format: 'binary', fingerprints: [], releases: ['sid'] },
    ],
    auxiliaryTrustFiles: [],
    preferenceFiles: [],
    warnings: [],
  },
  source({ id: 'cloudflare-warp', name: 'Cloudflare WARP', documentationUrl: 'https://pkg.cloudflareclient.com/', uri: 'https://pkg.cloudflareclient.com/', keyUrl: 'https://pkg.cloudflareclient.com/pubkey.gpg', keyringPath: '/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg', keyFormat: 'binary', releases: ['trixie', 'bookworm'], architectures: ['amd64', 'arm64'], suite: { trixie: 'trixie', bookworm: 'bookworm' }, components: ['main'] }),
  source({ id: 'cloudflared', name: 'cloudflared', documentationUrl: 'https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/', uri: 'https://pkg.cloudflare.com/cloudflared', keyUrl: 'https://pkg.cloudflare.com/cloudflare-main.gpg', keyringPath: '/usr/share/keyrings/cloudflare-main.gpg', keyFormat: 'binary', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64', 'armhf'], suite: 'any', components: ['main'], supportLevel: 'generic-debian' }),
  {
    id: 'opentofu',
    name: 'OpenTofu',
    documentationUrl: 'https://opentofu.org/docs/intro/install/deb/',
    verifiedAt: '2026-08-29',
    locations: [{ uri: 'https://packages.opentofu.org/opentofu/tofu/any/', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64', 'armhf', 'i386'], suite: 'any', components: ['main'], supportLevel: 'generic-debian' }],
    keys: [
      { id: 'opentofu-release-key', url: 'https://get.opentofu.org/opentofu.gpg', keyringPath: '/etc/apt/keyrings/opentofu.gpg', format: 'binary', fingerprints: [], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'] },
      { id: 'opentofu-package-key', url: 'https://packages.opentofu.org/opentofu/tofu/gpgkey', keyringPath: '/etc/apt/keyrings/opentofu-repo.gpg', format: 'ascii-armored', fingerprints: [], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'] },
    ],
    auxiliaryTrustFiles: [],
    preferenceFiles: [],
    warnings: [],
  },
  source({ id: 'anydesk', name: 'AnyDesk', documentationUrl: 'https://deb.anydesk.com/howto.html', uri: 'https://deb.anydesk.com', keyUrl: 'https://keys.anydesk.com/repos/DEB-GPG-KEY', keyringPath: '/etc/apt/keyrings/keys.anydesk.com.asc', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: 'all', components: ['main'], supportLevel: 'generic-debian' }),
  source({ id: 'sublime', name: 'Sublime HQ', documentationUrl: 'https://www.sublimetext.com/docs/linux_repositories.html', uri: 'https://download.sublimetext.com/', keyUrl: 'https://download.sublimetext.com/sublimehq-pub.gpg', keyringPath: '/etc/apt/keyrings/sublimehq-pub.gpg', keyFormat: 'binary', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'apt/stable/', components: [], supportLevel: 'generic-debian' }),
  source({ id: 'element', name: 'Element', documentationUrl: 'https://element.io/download', uri: 'https://packages.element.io/debian/', keyUrl: 'https://packages.element.io/debian/element-io-archive-keyring.gpg', keyringPath: '/usr/share/keyrings/element-io-archive-keyring.gpg', keyFormat: 'binary', releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: 'default', components: ['main'] }),
  source({ id: 'oracle-virtualbox', name: 'Oracle VirtualBox', documentationUrl: 'https://www.virtualbox.org/wiki/Linux_Downloads', uri: 'https://download.virtualbox.org/virtualbox/debian', keyUrl: 'https://www.virtualbox.org/download/oracle_vbox_2016.asc', keyringPath: '/usr/share/keyrings/oracle-virtualbox-2016.gpg', keyFormat: 'ascii-armored', fingerprints: ['B9F8D658297AF3EFC18D5CDFA2F683C52980AECF'], releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['contrib'] }),
  source({ id: 'gitlab-ce', name: 'GitLab Community Edition', documentationUrl: 'https://docs.gitlab.com/install/package/debian/', uri: 'https://packages.gitlab.com/gitlab/gitlab-ce/debian/', keyUrl: 'https://packages.gitlab.com/gpgkey/gpg.key', keyringPath: '/etc/apt/keyrings/gitlab.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['main'] }),
  source({ id: 'gitlab-runner', name: 'GitLab Runner', documentationUrl: 'https://docs.gitlab.com/runner/install/linux-repository/', uri: 'https://packages.gitlab.com/runner/gitlab-runner/debian/', keyUrl: 'https://packages.gitlab.com/gpgkey/gpg.key', keyringPath: '/etc/apt/keyrings/gitlab-runner.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky'], architectures: ['amd64', 'arm64'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye', forky: 'forky' }, components: ['main'] }),
  source({ id: 'jenkins-lts', name: 'Jenkins LTS', documentationUrl: 'https://www.jenkins.io/doc/book/installing/linux/', uri: 'https://pkg.jenkins.io/debian-stable', keyUrl: 'https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key', keyringPath: '/usr/share/keyrings/jenkins-lts-keyring.asc', keyFormat: 'ascii-armored', releases: ['trixie'], architectures: ['amd64', 'arm64'], suite: 'binary/', components: [] }),
  source({ id: 'nginx-stable', name: 'NGINX Stable', documentationUrl: 'https://nginx.org/en/linux_packages.html', uri: 'https://nginx.org/packages/debian', keyUrl: 'https://nginx.org/keys/nginx_signing.key', keyringPath: '/usr/share/keyrings/nginx-archive-keyring.gpg', keyFormat: 'ascii-armored', fingerprints: ['573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62'], releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['nginx'], preferenceFiles: [{ id: 'nginx', content: 'Package: *\nPin: origin nginx.org\nPin: release o=nginx\nPin-Priority: 900\n' }] }),
  source({ id: 'elastic-9', name: 'Elastic 9', documentationUrl: 'https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-with-debian-package', uri: 'https://artifacts.elastic.co/packages/9.x/apt', keyUrl: 'https://artifacts.elastic.co/GPG-KEY-elasticsearch', keyringPath: '/usr/share/keyrings/elastic-archive-keyring.gpg', keyFormat: 'ascii-armored', fingerprints: ['46095ACC8548582C1A2699A9D27D666CD88E42B4'], releases: ['trixie', 'bookworm'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'] }),
  source({ id: 'syncthing', name: 'Syncthing', documentationUrl: 'https://apt.syncthing.net/', uri: 'https://apt.syncthing.net/', keyUrl: 'https://syncthing.net/release-key.gpg', keyringPath: '/etc/apt/keyrings/syncthing-archive-keyring.gpg', keyFormat: 'binary', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64', 'armhf'], suite: 'syncthing', components: ['stable-v2'], supportLevel: 'generic-debian', preferenceFiles: [{ id: 'syncthing', content: 'Package: *\nPin: origin apt.syncthing.net\nPin-Priority: 990\n' }] }),
  source({ id: 'corretto', name: 'Amazon Corretto', documentationUrl: 'https://docs.aws.amazon.com/corretto/latest/corretto-21-ug/generic-linux-install.html', uri: 'https://apt.corretto.aws', keyUrl: 'https://apt.corretto.aws/corretto.key', keyringPath: '/usr/share/keyrings/corretto-keyring.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'], supportLevel: 'generic-debian' }),
  source({ id: 'adoptium', name: 'Eclipse Adoptium', documentationUrl: 'https://adoptium.net/installation/linux/', uri: 'https://packages.adoptium.net/artifactory/deb', keyUrl: 'https://packages.adoptium.net/artifactory/api/gpg/key/public', keyringPath: '/etc/apt/keyrings/adoptium.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['main'] }),
  source({ id: 'caddy', name: 'Caddy', documentationUrl: 'https://caddyserver.com/docs/install', uri: 'https://dl.cloudsmith.io/public/caddy/stable/deb/debian', keyUrl: 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key', keyringPath: '/usr/share/keyrings/caddy-stable-archive-keyring.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64', 'armhf'], suite: 'any-version', components: ['main'], supportLevel: 'generic-debian' }),
  source({ id: 'yarn', name: 'Yarn Classic', documentationUrl: 'https://classic.yarnpkg.com/lang/en/docs/install/', uri: 'https://dl.yarnpkg.com/debian/', keyUrl: 'https://dl.yarnpkg.com/debian/pubkey.gpg', keyringPath: '/usr/share/keyrings/yarnkey.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64', 'armhf', 'i386'], suite: 'stable', components: ['main'], supportLevel: 'generic-debian' }),
  source({ id: 'mozilla-thunderbird', name: 'Mozilla Thunderbird', documentationUrl: 'https://support.mozilla.org/en-US/kb/installing-thunderbird-linux', uri: 'https://packages.mozilla.org/apt', keyUrl: 'https://packages.mozilla.org/apt/repo-signing-key.gpg', keyringPath: '/etc/apt/keyrings/packages.mozilla.org.asc', keyFormat: 'ascii-armored', fingerprints: ['35BAA0B33E9EB396F59CA838C0BA5CE6DC6315A3'], releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64'], suite: 'thunderbird-deb', components: ['main'], preferenceFiles: [{ id: 'mozilla-thunderbird', content: 'Package: *\nPin: origin packages.mozilla.org\nPin-Priority: 1000\n' }] }),
  source({ id: 'gitlab-ee', name: 'GitLab Enterprise Edition', documentationUrl: 'https://docs.gitlab.com/install/package/debian/', uri: 'https://packages.gitlab.com/gitlab/gitlab-ee/debian/', keyUrl: 'https://packages.gitlab.com/gpgkey/gpg.key', keyringPath: '/etc/apt/keyrings/gitlab.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['main'] }),
  source({ id: 'jenkins-weekly', name: 'Jenkins Weekly', documentationUrl: 'https://www.jenkins.io/doc/book/installing/linux/', uri: 'https://pkg.jenkins.io/debian', keyUrl: 'https://pkg.jenkins.io/debian/jenkins.io-2026.key', keyringPath: '/usr/share/keyrings/jenkins-weekly-keyring.asc', keyFormat: 'ascii-armored', releases: ['trixie'], architectures: ['amd64', 'arm64'], suite: 'binary/', components: [] }),
  source({ id: 'nginx-mainline', name: 'NGINX Mainline', documentationUrl: 'https://nginx.org/en/linux_packages.html', uri: 'https://nginx.org/packages/mainline/debian', keyUrl: 'https://nginx.org/keys/nginx_signing.key', keyringPath: '/usr/share/keyrings/nginx-archive-keyring.gpg', keyFormat: 'ascii-armored', fingerprints: ['573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62'], releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['nginx'], preferenceFiles: [{ id: 'nginx', content: 'Package: *\nPin: origin nginx.org\nPin: release o=nginx\nPin-Priority: 900\n' }] }),
  source({ id: 'azul-zulu', name: 'Azul Zulu', documentationUrl: 'https://docs.azul.com/core/install/debian', uri: 'https://repos.azul.com/zulu/deb', keyUrl: 'https://repos.azul.com/azul-repo.key', keyringPath: '/usr/share/keyrings/azul.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'], supportLevel: 'generic-debian' }),
  source({ id: 'bellsoft-liberica', name: 'BellSoft Liberica', documentationUrl: 'https://bell-sw.com/pages/repositories/', uri: 'https://apt.bell-sw.com/', keyUrl: 'https://download.bell-sw.com/pki/GPG-KEY-bellsoft', keyringPath: '/usr/share/keyrings/bellsoft.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'], supportLevel: 'generic-debian' }),
  source({ id: 'teamviewer', name: 'TeamViewer', documentationUrl: 'https://www.teamviewer.com/en/global/support/knowledge-base/teamviewer-classic/installation/linux/linux/', uri: 'https://linux.teamviewer.com/deb', keyUrl: 'https://linux.teamviewer.com/pubkey/currentkey.asc', keyringPath: '/usr/share/keyrings/teamviewer-keyring.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64'], suite: 'stable', components: ['main'], supportLevel: 'generic-debian' }),
  source({ id: 'steam', name: 'Steam', documentationUrl: 'https://repo.steampowered.com/steam/', uri: 'https://repo.steampowered.com/steam', keyUrl: 'https://repo.steampowered.com/steam/archive/stable/steam.gpg', keyringPath: '/usr/share/keyrings/steam.gpg', keyFormat: 'binary', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64'], suite: 'stable', components: ['steam'], supportLevel: 'generic-debian', warnings: ['steam-i386-multiarch'] }),
  source({ id: 'google-earth', name: 'Google Earth', documentationUrl: 'https://support.google.com/earth/answer/168344', uri: 'https://dl.google.com/linux/earth/deb/', keyUrl: 'https://dl.google.com/linux/linux_signing_key.pub', keyringPath: '/etc/apt/keyrings/google-earth.asc', keyFormat: 'ascii-armored', fingerprints: ['EB4C1BFD4F042F6DDDCCEC917721F63BD38B4796'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64'], suite: 'stable', components: ['main'], supportLevel: 'generic-debian' }),
  source({ id: 'typora', name: 'Typora', documentationUrl: 'https://support.typora.io/Typora-on-Linux/', uri: 'https://downloads.typora.io/linux', keyUrl: 'https://downloads.typora.io/typora.gpg', keyringPath: '/usr/share/keyrings/typora.gpg', keyFormat: 'binary', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: './', components: [], supportLevel: 'generic-debian' }),
  source({ id: 'warp', name: 'Warp Terminal', documentationUrl: 'https://docs.warp.dev/getting-started/quickstart/installation-and-setup', uri: 'https://releases.warp.dev/linux/deb', keyUrl: 'https://releases.warp.dev/linux/keys/warp.asc', keyringPath: '/etc/apt/keyrings/warpdotdev.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'], supportLevel: 'generic-debian' }),
  source({ id: 'nordvpn', name: 'NordVPN', documentationUrl: 'https://support.nordvpn.com/hc/en-us/articles/20226600447633-Installing-NordVPN-on-Linux-distributions', uri: 'https://repo.nordvpn.com/deb/nordvpn/debian', keyUrl: 'https://repo.nordvpn.com/gpg/nordvpn_public.asc', keyringPath: '/usr/share/keyrings/nordvpn-keyring.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'], supportLevel: 'generic-debian' }),
  source({ id: 'ivpn', name: 'IVPN', documentationUrl: 'https://www.ivpn.net/apps-linux/', uri: 'https://repo.ivpn.net/stable/debian', keyUrl: 'https://repo.ivpn.net/stable/debian/generic.gpg', keyringPath: '/usr/share/keyrings/ivpn-archive-keyring.gpg', keyFormat: 'binary', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: './generic', components: ['main'], supportLevel: 'generic-debian' }),
  source({ id: 'teleport-18', name: 'Teleport 18', documentationUrl: 'https://goteleport.com/docs/installation/linux/', uri: 'https://apt.releases.teleport.dev/debian', keyUrl: 'https://apt.releases.teleport.dev/gpg', keyringPath: '/usr/share/keyrings/teleport-archive-keyring.asc', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['stable/v18'] }),
  source({ id: 'wazuh', name: 'Wazuh', documentationUrl: 'https://documentation.wazuh.com/current/installation-guide/wazuh-agent/wazuh-agent-package-linux.html', uri: 'https://packages.wazuh.com/4.x/apt/', keyUrl: 'https://packages.wazuh.com/key/GPG-KEY-WAZUH', keyringPath: '/usr/share/keyrings/wazuh.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64', 'i386'], suite: 'stable', components: ['main'], supportLevel: 'generic-debian', warnings: ['wazuh-manager-enrollment'] }),
  source({ id: 'apache-couchdb', name: 'Apache CouchDB', documentationUrl: 'https://docs.couchdb.org/en/stable/install/unix.html', uri: 'https://apache.jfrog.io/artifactory/couchdb-deb/', keyUrl: 'https://couchdb.apache.org/repo/keys.asc', keyringPath: '/usr/share/keyrings/couchdb-archive-keyring.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['main'], warnings: ['couchdb-interactive-configuration'] }),
  source({ id: 'neo4j', name: 'Neo4j', documentationUrl: 'https://neo4j.com/docs/operations-manual/current/installation/linux/debian/', uri: 'https://debian.neo4j.com', keyUrl: 'https://debian.neo4j.com/neotechnology.gpg.key', keyringPath: '/usr/share/keyrings/neo4j.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['latest'] }),
  source({ id: 'icinga', name: 'Icinga', documentationUrl: 'https://icinga.com/docs/icinga-2/latest/doc/02-installation/01-Debian/', uri: 'https://packages.icinga.com/debian', keyUrl: 'https://packages.icinga.com/icinga.key', keyringPath: '/usr/share/keyrings/icinga-archive-keyring.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64', 'arm64'], suite: { trixie: 'icinga-trixie', bookworm: 'icinga-bookworm', bullseye: 'icinga-bullseye' }, components: ['main'] }),
  source({ id: 'mysql-8-4', name: 'MySQL Community 8.4 LTS', documentationUrl: 'https://dev.mysql.com/doc/mysql-apt-repo-quick-guide/en/', uri: 'https://repo.mysql.com/apt/debian/', keyUrl: 'https://repo.mysql.com/RPM-GPG-KEY-mysql-2025', keyringPath: '/usr/share/keyrings/mysql-apt-config.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye'], architectures: ['amd64'], suite: { trixie: 'trixie', bookworm: 'bookworm', bullseye: 'bullseye' }, components: ['mysql-8.4-lts'], warnings: ['mysql-interactive-configuration'] }),
  source({ id: 'opensearch-3', name: 'OpenSearch 3', documentationUrl: 'https://docs.opensearch.org/latest/install-and-configure/install-opensearch/debian/', uri: 'https://artifacts.opensearch.org/releases/bundle/opensearch/3.x/apt', keyUrl: 'https://artifacts.opensearch.org/publickeys/opensearch-release.pgp', keyringPath: '/usr/share/keyrings/opensearch-keyring.gpg', keyFormat: 'ascii-armored', fingerprints: ['C5B7498965EFD1C2924BA9D539D319879310D3FC'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'], supportLevel: 'generic-debian', warnings: ['opensearch-security-bootstrap'] }),
  source({ id: 'datadog', name: 'Datadog Agent', documentationUrl: 'https://docs.datadoghq.com/agent/supported_platforms/', uri: 'https://apt.datadoghq.com', keyUrl: 'https://keys.datadoghq.com/DATADOG_APT_KEY_CURRENT.public', keyringPath: '/usr/share/keyrings/datadog-archive-keyring.gpg', keyFormat: 'ascii-armored', fingerprints: ['D18886567EABAD8B2D2526900D826EB906462314', '5F1E256061D813B125E156E8E6266D4AC0962C7D', 'D75CEA17048B9ACBF186794B32637D44F14F620E', 'A2923DFF56EDA6E76E55E492D3A80E30382E94DE'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['7'], supportLevel: 'generic-debian', warnings: ['datadog-api-key-required'] }),
  source({ id: 'falco', name: 'Falco', documentationUrl: 'https://falco.org/docs/setup/packages/', uri: 'https://download.falco.org/packages/deb', keyUrl: 'https://falco.org/repo/falcosecurity-packages.asc', keyringPath: '/usr/share/keyrings/falco-archive-keyring.gpg', keyFormat: 'ascii-armored', fingerprints: ['478B2FBBC75F4237B731DA4365106822B35B1B1F'], releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'], supportLevel: 'generic-debian', warnings: ['falco-driver-setup'] }),
  source({ id: 'trivy', name: 'Trivy', documentationUrl: 'https://trivy.dev/latest/getting-started/installation/', uri: 'https://aquasecurity.github.io/trivy-repo/deb', keyUrl: 'https://aquasecurity.github.io/trivy-repo/deb/public.key', keyringPath: '/usr/share/keyrings/trivy.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'generic', components: ['main'], supportLevel: 'generic-debian' }),
  source({ id: 'crowdsec', name: 'CrowdSec', documentationUrl: 'https://docs.crowdsec.net/u/getting_started/installation/linux/', uri: 'https://packagecloud.io/crowdsec/crowdsec/any', keyUrl: 'https://packagecloud.io/crowdsec/crowdsec/gpgkey', keyringPath: '/etc/apt/keyrings/crowdsec.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'any', components: ['main'], supportLevel: 'generic-debian' }),
  {
    id: 'fluent-bit',
    name: 'Fluent Bit',
    documentationUrl: 'https://docs.fluentbit.io/manual/installation/downloads/linux/debian',
    verifiedAt: '2026-08-29',
    locations: [
      { uri: 'https://packages.fluentbit.io/debian/trixie', releases: ['trixie'], architectures: ['amd64', 'arm64'], suite: 'trixie', components: ['main'], supportLevel: 'explicit' },
      { uri: 'https://packages.fluentbit.io/debian/bookworm', releases: ['bookworm'], architectures: ['amd64', 'arm64'], suite: 'bookworm', components: ['main'], supportLevel: 'explicit' },
      { uri: 'https://packages.fluentbit.io/debian/bullseye', releases: ['bullseye'], architectures: ['amd64', 'arm64'], suite: 'bullseye', components: ['main'], supportLevel: 'explicit' },
    ],
    keys: [{ id: 'fluent-bit-signing-key', url: 'https://packages.fluentbit.io/fluentbit.key', keyringPath: '/usr/share/keyrings/fluentbit-keyring.gpg', format: 'ascii-armored', fingerprints: ['C3C0A28534B9293EAF51FABD9F9DDC083888C1CD'], releases: ['trixie', 'bookworm', 'bullseye'] }],
    auxiliaryTrustFiles: [],
    preferenceFiles: [],
    warnings: [],
  },
  source({ id: 'dbeaver', name: 'DBeaver Community', documentationUrl: 'https://dbeaver.io/download/', uri: 'https://dbeaver.io/debs/dbeaver-ce', keyUrl: 'https://dbeaver.io/debs/dbeaver.gpg.key', keyringPath: '/usr/share/keyrings/dbeaver.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: '/', components: [], supportLevel: 'generic-debian' }),
  source({ id: 'buildkite-agent', name: 'Buildkite Agent', documentationUrl: 'https://buildkite.com/docs/agent/v3/installation', uri: 'https://apt.buildkite.com/buildkite-agent', keyUrl: 'https://apt.buildkite.com/buildkite-agent/gpgkey', keyringPath: '/usr/share/keyrings/buildkite-agent-archive-keyring.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'stable', components: ['main'], supportLevel: 'generic-debian', warnings: ['buildkite-agent-token-required'] }),
  source({ id: 'buildkite-cli', name: 'Buildkite CLI', documentationUrl: 'https://buildkite.com/docs/platform/cli/installation', uri: 'https://packages.buildkite.com/buildkite/cli-deb/any/', keyUrl: 'https://packages.buildkite.com/buildkite/cli-deb/gpgkey', keyringPath: '/usr/share/keyrings/buildkite-cli-archive-keyring.gpg', keyFormat: 'ascii-armored', releases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], architectures: ['amd64', 'arm64'], suite: 'any', components: ['main'], supportLevel: 'generic-debian' }),
] as const

export const REPOSITORY_SOURCES: readonly RepositorySource[] = deepFreeze(sources)

export function getRepositorySource(id: string): RepositorySource | undefined {
  return REPOSITORY_SOURCES.find((source) => source.id === id)
}
