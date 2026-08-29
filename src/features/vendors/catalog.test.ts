import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { VENDOR_PRODUCTS, getVendorProduct } from './catalog'
import { REPOSITORY_SOURCES } from './sources'
import { validateRepositoryCatalog } from './validate'

const expectedProducts = [
  ['brave-browser', 'brave-browser', ['brave-browser'], ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64', 'arm64']],
  ['mozilla-firefox', 'mozilla', ['firefox'], ['trixie', 'bookworm', 'bullseye'], ['amd64', 'arm64']],
  ['google-chrome', 'google-chrome', ['google-chrome-stable'], ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64']],
  ['microsoft-edge', 'microsoft-edge', ['microsoft-edge-stable'], ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64']],
  ['vivaldi', 'vivaldi', ['vivaldi-stable'], ['trixie', 'forky', 'sid'], ['amd64', 'arm64']],
  ['opera', 'opera', ['opera-stable'], ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64']],
  ['signal-desktop', 'signal', ['signal-desktop'], ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64']],
  ['proton-vpn', 'proton-vpn', ['proton-vpn-gnome-desktop'], ['trixie'], ['amd64', 'arm64']],
  ['mullvad-vpn', 'mullvad', ['mullvad-vpn'], ['trixie', 'bookworm', 'forky', 'sid'], ['amd64', 'arm64']],
  ['tor', 'tor', ['tor'], ['trixie', 'bookworm', 'bullseye'], ['amd64', 'arm64']],
  ['docker-engine', 'docker', ['docker-ce', 'docker-ce-cli', 'containerd.io', 'docker-buildx-plugin', 'docker-compose-plugin'], ['trixie', 'bookworm', 'bullseye'], ['amd64', 'arm64', 'armhf']],
  ['kubernetes-tools-v1-36', 'kubernetes-v1-36', ['kubectl'], ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64', 'arm64']],
  ['google-cloud-cli', 'google-cloud', ['google-cloud-cli'], ['trixie', 'bookworm', 'bullseye'], ['amd64', 'arm64']],
  ['azure-cli', 'microsoft-azure-cli', ['azure-cli'], ['bookworm', 'bullseye'], ['amd64', 'arm64']],
  ['github-cli', 'github-cli', ['gh'], ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64', 'arm64']],
  ['hashicorp-terraform', 'hashicorp', ['terraform'], ['trixie', 'bookworm', 'bullseye'], ['amd64', 'arm64']],
  ['postgresql-pgdg', 'postgresql-pgdg', ['postgresql'], ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64', 'arm64']],
  ['mongodb-community-8-0', 'mongodb-community-8-0', ['mongodb-org'], ['bookworm'], ['amd64']],
  ['grafana', 'grafana', ['grafana'], ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64', 'arm64']],
  ['nvidia-container-toolkit', 'nvidia-container-toolkit', ['nvidia-container-toolkit'], ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64', 'arm64']],
  ['mariadb-community-11-8', 'mariadb-community-11-8', ['mariadb-server'], ['trixie', 'bookworm', 'bullseye', 'sid'], ['amd64', 'arm64']],
  ['redis-open-source', 'redis-open-source', ['redis'], ['trixie', 'bookworm'], ['amd64', 'arm64']],
  ['clickhouse', 'clickhouse', ['clickhouse-server', 'clickhouse-client'], ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64', 'arm64']],
  ['influxdb-3-core', 'influxdb-3-core', ['influxdb3-core'], ['trixie', 'bookworm', 'forky', 'sid'], ['amd64', 'arm64']],
  ['zabbix-7-4', 'zabbix-7-4', ['zabbix-agent2'], ['trixie', 'bookworm', 'bullseye'], ['amd64', 'arm64']],
] as const

describe('migrated vendor product catalog', () => {
  it('retains every original product ID, source relationship, package set, and compatibility matrix', () => {
    expect(VENDOR_PRODUCTS.map((product) => [
      product.id,
      product.sourceId,
      product.packages,
      product.supportedReleases,
      product.supportedArchitectures,
    ])).toEqual(expectedProducts)
  })

  it('uses the strict immutable product contract and validates against the repository catalog', () => {
    expect(() => validateRepositoryCatalog(REPOSITORY_SOURCES, VENDOR_PRODUCTS)).not.toThrow()
    expect(Object.isFrozen(VENDOR_PRODUCTS)).toBe(true)
    expect(VENDOR_PRODUCTS.every(Object.isFrozen)).toBe(true)
    for (const product of VENDOR_PRODUCTS) {
      expect(product.sourceId).toEqual(expect.any(String))
      expect(product.warningKeys).toEqual(expect.any(Array))
      expect(product.provenance).not.toBe('debian-native')
      expect(product.supportLevel).toBe('explicit')
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
