import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { VENDOR_PRODUCTS, getVendorProduct } from './catalog'
import type { VendorProduct } from './model'
import { REPOSITORY_SOURCES } from './sources'
import { validateRepositoryCatalog } from './validate'

const expectedProducts = [
  { id: 'brave-browser', sourceId: 'brave-browser', name: 'Brave Browser', category: 'browser', icon: 'mdi-shield-check', packages: ['brave-browser'], supportedReleases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: [] },
  { id: 'mozilla-firefox', sourceId: 'mozilla', name: 'Mozilla Firefox', category: 'browser', icon: 'mdi-firefox', packages: ['firefox'], supportedReleases: ['trixie', 'bookworm', 'bullseye'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'upstream', securityCritical: true, warningKeys: [] },
  { id: 'google-chrome', sourceId: 'google-chrome', name: 'Google Chrome', category: 'browser', icon: 'mdi-google-chrome', packages: ['google-chrome-stable'], supportedReleases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], supportedArchitectures: ['amd64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: [] },
  { id: 'microsoft-edge', sourceId: 'microsoft-edge', name: 'Microsoft Edge', category: 'browser', icon: 'mdi-microsoft-edge', packages: ['microsoft-edge-stable'], supportedReleases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], supportedArchitectures: ['amd64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: [] },
  { id: 'vivaldi', sourceId: 'vivaldi', name: 'Vivaldi', category: 'browser', icon: 'mdi-compass-outline', packages: ['vivaldi-stable'], supportedReleases: ['trixie', 'forky', 'sid'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: [] },
  { id: 'opera', sourceId: 'opera', name: 'Opera', category: 'browser', icon: 'mdi-opera', packages: ['opera-stable'], supportedReleases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], supportedArchitectures: ['amd64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: [] },
  { id: 'signal-desktop', sourceId: 'signal', name: 'Signal Desktop', category: 'communication', icon: 'mdi-message-lock-outline', packages: ['signal-desktop'], supportedReleases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], supportedArchitectures: ['amd64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: [] },
  { id: 'proton-vpn', sourceId: 'proton-vpn', name: 'Proton VPN', category: 'privacy', icon: 'mdi-shield-lock-outline', packages: ['proton-vpn-gnome-desktop'], supportedReleases: ['trixie'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: ['proton-vpn-supported-environment'] },
  { id: 'mullvad-vpn', sourceId: 'mullvad', name: 'Mullvad VPN', category: 'privacy', icon: 'mdi-vpn', packages: ['mullvad-vpn'], supportedReleases: ['trixie', 'bookworm', 'forky', 'sid'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: [] },
  { id: 'tor', sourceId: 'tor', name: 'Tor', category: 'privacy', icon: 'mdi-incognito', packages: ['tor'], supportedReleases: ['trixie', 'bookworm', 'bullseye'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'upstream', securityCritical: true, warningKeys: ['tor-not-browser'] },
  { id: 'docker-engine', sourceId: 'docker', name: 'Docker Engine', category: 'containers', icon: 'mdi-docker', packages: ['docker-ce', 'docker-ce-cli', 'containerd.io', 'docker-buildx-plugin', 'docker-compose-plugin'], supportedReleases: ['trixie', 'bookworm', 'bullseye'], supportedArchitectures: ['amd64', 'arm64', 'armhf'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: ['docker-firewall'] },
  { id: 'kubernetes-tools-v1-36', sourceId: 'kubernetes-v1-36', name: 'Kubernetes tools v1.36', category: 'containers', icon: 'mdi-ship-wheel', packages: ['kubectl'], supportedReleases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'upstream', securityCritical: true, warningKeys: [] },
  { id: 'google-cloud-cli', sourceId: 'google-cloud', name: 'Google Cloud CLI', category: 'cloud', icon: 'mdi-google-cloud', packages: ['google-cloud-cli'], supportedReleases: ['trixie', 'bookworm', 'bullseye'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: [] },
  { id: 'azure-cli', sourceId: 'microsoft-azure-cli', name: 'Microsoft Azure CLI', category: 'cloud', icon: 'mdi-microsoft-azure', packages: ['azure-cli'], supportedReleases: ['bookworm', 'bullseye'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: [] },
  { id: 'github-cli', sourceId: 'github-cli', name: 'GitHub CLI', category: 'development', icon: 'mdi-github', packages: ['gh'], supportedReleases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: [] },
  { id: 'hashicorp-terraform', sourceId: 'hashicorp', name: 'HashiCorp Terraform', category: 'development', icon: 'mdi-terraform', packages: ['terraform'], supportedReleases: ['trixie', 'bookworm', 'bullseye'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: [] },
  { id: 'postgresql-pgdg', sourceId: 'postgresql-pgdg', name: 'PostgreSQL PGDG', category: 'database', icon: 'mdi-elephant', packages: ['postgresql'], supportedReleases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'upstream', securityCritical: true, warningKeys: [] },
  { id: 'mongodb-community-8-0', sourceId: 'mongodb-community-8-0', name: 'MongoDB Community 8.0', category: 'database', icon: 'mdi-leaf', packages: ['mongodb-org'], supportedReleases: ['bookworm'], supportedArchitectures: ['amd64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: [] },
  { id: 'grafana', sourceId: 'grafana', name: 'Grafana', category: 'monitoring', icon: 'mdi-chart-timeline-variant', packages: ['grafana'], supportedReleases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: [] },
  { id: 'nvidia-container-toolkit', sourceId: 'nvidia-container-toolkit', name: 'NVIDIA Container Toolkit', category: 'containers', icon: 'mdi-chip', packages: ['nvidia-container-toolkit'], supportedReleases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: ['nvidia-container-toolkit-prerequisites'] },
  { id: 'mariadb-community-11-8', sourceId: 'mariadb-community-11-8', name: 'MariaDB Community 11.8', category: 'database', icon: 'mdi-database-cog', packages: ['mariadb-server'], supportedReleases: ['trixie', 'bookworm', 'bullseye', 'sid'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: ['mariadb-no-setup-script'] },
  { id: 'redis-open-source', sourceId: 'redis-open-source', name: 'Redis Open Source', category: 'database', icon: 'mdi-database-outline', packages: ['redis'], supportedReleases: ['trixie', 'bookworm'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: [] },
  { id: 'clickhouse', sourceId: 'clickhouse', name: 'ClickHouse', category: 'database', icon: 'mdi-database-arrow-right-outline', packages: ['clickhouse-server', 'clickhouse-client'], supportedReleases: ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'generic-debian', provenance: 'manufacturer', securityCritical: true, warningKeys: ['clickhouse-generic-debian'] },
  { id: 'influxdb-3-core', sourceId: 'influxdb-3-core', name: 'InfluxDB 3 Core', category: 'monitoring', icon: 'mdi-chart-areaspline', packages: ['influxdb3-core'], supportedReleases: ['trixie', 'bookworm', 'forky', 'sid'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: [] },
  { id: 'zabbix-7-4', sourceId: 'zabbix-7-4', name: 'Zabbix 7.4', category: 'monitoring', icon: 'mdi-server-security', packages: ['zabbix-agent2'], supportedReleases: ['trixie', 'bookworm', 'bullseye'], supportedArchitectures: ['amd64', 'arm64'], supportLevel: 'explicit', provenance: 'manufacturer', securityCritical: true, warningKeys: [] },
] as const satisfies readonly VendorProduct[]

describe('migrated vendor product catalog', () => {
  it('retains the exact authoritative metadata for every original product', () => {
    expect(VENDOR_PRODUCTS).toEqual(expectedProducts)
  })

  it('uses the strict immutable product contract and validates against the repository catalog', () => {
    expect(() => validateRepositoryCatalog(REPOSITORY_SOURCES, VENDOR_PRODUCTS)).not.toThrow()
    expect(Object.isFrozen(VENDOR_PRODUCTS)).toBe(true)
    expect(VENDOR_PRODUCTS.every(Object.isFrozen)).toBe(true)
    for (const product of VENDOR_PRODUCTS) {
      expect(product.sourceId).toEqual(expect.any(String))
      expect(product.warningKeys).toEqual(expect.any(Array))
      expect(product.provenance).not.toBe('debian-native')
      const source = REPOSITORY_SOURCES.find((candidate) => candidate.id === product.sourceId)
      expect(source?.locations.map((location) => location.supportLevel)).toContain(product.supportLevel)
    }
  })

  it('uses product icons included in the bundled Material-Design font', () => {
    const require = createRequire(import.meta.url)
    const mdiCss = readFileSync(require.resolve('@mdi/font/css/materialdesignicons.css'), 'utf8')

    for (const product of VENDOR_PRODUCTS) expect(mdiCss).toContain(`.${product.icon}::before`)
  })

  it('looks up known products and leaves unknown IDs unresolved', () => {
    expect(getVendorProduct('docker-engine')?.name).toBe('Docker Engine')
    expect(getVendorProduct('unknown-product')).toBeUndefined()
  })
})
