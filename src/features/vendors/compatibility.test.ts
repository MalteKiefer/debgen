import { describe, expect, it } from 'vitest'
import { VENDOR_PRODUCTS, getVendorProduct } from './catalog'
import { compatibleProducts, getVendorCompatibility } from './compatibility'
import type { SystemArchitecture } from './model'
import type { ReleaseCodename } from '../sources/model'

function product(id: string) {
  const result = getVendorProduct(id)
  if (!result) throw new Error(`Unknown test product: ${id}`)
  return result
}

describe('vendor compatibility', () => {
  it.each([
    ['brave-browser', 'trixie', 'amd64'],
    ['mozilla-firefox', 'bullseye', 'arm64'],
    ['mullvad-vpn', 'bookworm', 'amd64'],
    ['docker-engine', 'bullseye', 'armhf'],
    ['azure-cli', 'bookworm', 'arm64'],
    ['postgresql-pgdg', 'sid', 'amd64'],
    ['mongodb-community-8-0', 'bookworm', 'amd64'],
  ] as const)('accepts %s on %s/%s', (id, release, architecture) => {
    expect(getVendorCompatibility(product(id), release, architecture)).toEqual({ compatible: true })
  })

  it('rejects an unsupported release with a German explanation', () => {
    const result = getVendorCompatibility(product('azure-cli'), 'trixie', 'amd64')

    expect(result.compatible).toBe(false)
    expect(result.reason).toMatch(/Release.*trixie.*nicht unterstützt/i)
  })

  it('rejects an unsupported architecture with a German explanation', () => {
    const result = getVendorCompatibility(product('mongodb-community-8-0'), 'bookworm', 'arm64')

    expect(result.compatible).toBe(false)
    expect(result.reason).toMatch(/Architektur.*arm64.*nicht unterstützt/i)
  })

  it('reports release incompatibility before architecture incompatibility', () => {
    const result = getVendorCompatibility(product('mongodb-community-8-0'), 'sid', 'arm64')

    expect(result.reason).toMatch(/Release/i)
  })

  it('filters the catalog to compatible products', () => {
    const result = compatibleProducts(VENDOR_PRODUCTS, 'bookworm', 'arm64')

    expect(result.map(({ id }) => id)).toEqual([
      'brave-browser', 'mozilla-firefox', 'mullvad-vpn', 'tor', 'docker-engine',
      'kubernetes-tools-v1-36', 'google-cloud-cli', 'azure-cli', 'github-cli',
      'hashicorp-terraform', 'postgresql-pgdg', 'grafana', 'nvidia-container-toolkit',
      'mariadb-community-11-8', 'redis-open-source', 'clickhouse', 'influxdb-3-core',
      'zabbix-7-4',
    ])
  })

  it('can filter the official catalog without passing it explicitly', () => {
    const result = compatibleProducts('bookworm' as ReleaseCodename, 'armhf' as SystemArchitecture)

    expect(result.map(({ id }) => id)).toEqual(['docker-engine'])
  })
})
