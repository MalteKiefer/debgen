import { describe, expect, it } from 'vitest'
import { VENDOR_PRODUCTS, getVendorProduct } from './catalog'
import { validateVendorCatalog } from './validate'

const expectedProducts = [
  ['brave-browser', ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64', 'arm64']],
  ['mozilla-firefox', ['trixie', 'bookworm', 'bullseye'], ['amd64', 'arm64']],
  ['google-chrome', ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64']],
  ['microsoft-edge', ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64']],
  ['vivaldi', ['trixie', 'forky', 'sid'], ['amd64', 'arm64']],
  ['opera', ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64']],
  ['signal-desktop', ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64']],
  ['proton-vpn', ['trixie'], ['amd64', 'arm64']],
  ['mullvad-vpn', ['trixie', 'bookworm', 'forky', 'sid'], ['amd64', 'arm64']],
  ['tor', ['trixie', 'bookworm', 'bullseye'], ['amd64', 'arm64']],
  ['docker-engine', ['trixie', 'bookworm', 'bullseye'], ['amd64', 'arm64', 'armhf']],
  ['kubernetes-tools-v1-36', ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64', 'arm64']],
  ['google-cloud-cli', ['trixie', 'bookworm', 'bullseye'], ['amd64', 'arm64']],
  ['azure-cli', ['bookworm', 'bullseye'], ['amd64', 'arm64']],
  ['github-cli', ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64', 'arm64']],
  ['hashicorp-terraform', ['trixie', 'bookworm', 'bullseye'], ['amd64', 'arm64']],
  ['postgresql-pgdg', ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64', 'arm64']],
  ['mongodb-community-8-0', ['bookworm'], ['amd64']],
  ['grafana', ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64', 'arm64']],
  ['nvidia-container-toolkit', ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64', 'arm64']],
  ['mariadb-community-11-8', ['trixie', 'bookworm', 'bullseye', 'sid'], ['amd64', 'arm64']],
  ['redis-open-source', ['trixie', 'bookworm'], ['amd64', 'arm64']],
  ['clickhouse', ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'], ['amd64', 'arm64']],
  ['influxdb-3-core', ['trixie', 'bookworm', 'forky', 'sid'], ['amd64', 'arm64']],
  ['zabbix-7-4', ['trixie', 'bookworm', 'bullseye'], ['amd64', 'arm64']],
] as const

describe('official vendor catalog', () => {
  it('contains exactly the 25 approved products with explicit compatibility', () => {
    expect(VENDOR_PRODUCTS).toHaveLength(25)
    expect(VENDOR_PRODUCTS.map((product) => product.id)).toEqual(expectedProducts.map(([id]) => id))

    for (const [id, releases, architectures] of expectedProducts) {
      expect(getVendorProduct(id)).toMatchObject({
        id,
        releases,
        architectures,
        verifiedAt: '2026-08-28',
      })
    }
  })

  it('uses complete official metadata and validates every entry', () => {
    expect(() => validateVendorCatalog(VENDOR_PRODUCTS)).not.toThrow()
    expect(Object.isFrozen(VENDOR_PRODUCTS)).toBe(true)

    for (const product of VENDOR_PRODUCTS) {
      expect(product.documentationUrl).toMatch(/^https:\/\//)
      expect(product.repositoryUrl).toMatch(/^https:\/\//)
      expect(product.keyUrl).toMatch(/^https:\/\//)
      expect(product.packages.length).toBeGreaterThan(0)
      expect(product.releases.length).toBeGreaterThan(0)
      expect(product.architectures.length).toBeGreaterThan(0)
    }
  })

  it('looks up known products and leaves unknown IDs unresolved', () => {
    expect(getVendorProduct('docker-engine')?.name).toBe('Docker Engine')
    expect(getVendorProduct('unknown-product')).toBeUndefined()
  })
})
