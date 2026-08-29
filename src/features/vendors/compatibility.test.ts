import { describe, expect, it } from 'vitest'
import { VENDOR_PRODUCTS, getVendorProduct } from './catalog'
import { compatibleProducts, getVendorCompatibility } from './compatibility'
import type { SystemArchitecture } from './model'
import type { ReleaseCodename } from '../sources/model'

const allReleases: readonly ReleaseCodename[] = ['trixie', 'bookworm', 'bullseye', 'forky', 'sid']
const allArchitectures: readonly SystemArchitecture[] = ['amd64', 'arm64', 'armhf', 'i386']
const boundaryProductIds = [
  'brave-browser', 'mozilla-firefox', 'mullvad-vpn', 'docker-engine',
  'azure-cli', 'postgresql-pgdg', 'mongodb-community-8-0',
] as const

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

  it.each(boundaryProductIds.flatMap((id) => {
    const entry = product(id)
    return allReleases
      .filter((release) => !entry.supportedReleases.includes(release))
      .map((release) => [id, release] as const)
  }))('rejects every unsupported release for %s: %s', (id, release) => {
    const result = getVendorCompatibility(product(id), release, 'amd64')

    expect(result).toEqual({
      compatible: false,
      reason: {
        code: 'unsupported-release',
        productId: id,
        release,
        supportedReleases: product(id).supportedReleases,
      },
    })
  })

  it.each(boundaryProductIds.flatMap((id) => {
    const entry = product(id)
    return allArchitectures
      .filter((architecture) => !entry.supportedArchitectures.includes(architecture))
      .map((architecture) => [id, architecture] as const)
  }))('rejects every unsupported architecture for %s: %s', (id, architecture) => {
    const release = product(id).supportedReleases[0]
    const result = getVendorCompatibility(product(id), release, architecture)

    expect(result).toEqual({
      compatible: false,
      reason: {
        code: 'unsupported-architecture',
        productId: id,
        architecture,
        supportedArchitectures: product(id).supportedArchitectures,
      },
    })
  })

  it('returns a language-neutral reason for an unsupported release', () => {
    const result = getVendorCompatibility(product('azure-cli'), 'trixie', 'amd64')

    expect(result).toEqual({
      compatible: false,
      reason: {
        code: 'unsupported-release',
        productId: 'azure-cli',
        release: 'trixie',
        supportedReleases: ['bookworm', 'bullseye'],
      },
    })
  })

  it('returns a language-neutral reason for an unsupported architecture', () => {
    const result = getVendorCompatibility(product('mongodb-community-8-0'), 'bookworm', 'arm64')

    expect(result).toEqual({
      compatible: false,
      reason: {
        code: 'unsupported-architecture',
        productId: 'mongodb-community-8-0',
        architecture: 'arm64',
        supportedArchitectures: ['amd64'],
      },
    })
  })

  it('reports release incompatibility before architecture incompatibility', () => {
    const result = getVendorCompatibility(product('mongodb-community-8-0'), 'sid', 'arm64')

    expect(result.reason).toMatchObject({ code: 'unsupported-release', release: 'sid' })
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
