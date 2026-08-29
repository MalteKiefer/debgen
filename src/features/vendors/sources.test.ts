import { describe, expect, it } from 'vitest'
import { REPOSITORY_SOURCES, getRepositorySource } from './sources'

const expectedSourceIds = [
  'brave-browser', 'mozilla', 'google-chrome', 'microsoft-edge', 'vivaldi', 'opera',
  'signal', 'proton-vpn', 'mullvad', 'tor', 'docker', 'kubernetes-v1-36',
  'google-cloud', 'microsoft-azure-cli', 'github-cli', 'hashicorp', 'postgresql-pgdg',
  'mongodb-community-8-0', 'grafana', 'nvidia-container-toolkit', 'mariadb-community-11-8',
  'redis-open-source', 'clickhouse', 'influxdb-3-core', 'zabbix-7-4',
] as const

describe('repository source migration', () => {
  it('provides the immutable 25-source catalog required by the original products', () => {
    expect(REPOSITORY_SOURCES.map((source) => source.id)).toEqual(expectedSourceIds)
    expect(Object.isFrozen(REPOSITORY_SOURCES)).toBe(true)
    expect(REPOSITORY_SOURCES.every(Object.isFrozen)).toBe(true)
  })

  it('preserves representative legacy source definitions without product-owned repository fields', () => {
    expect(getRepositorySource('mullvad')).toMatchObject({
      id: 'mullvad',
      documentationUrl: 'https://mullvad.net/en/help/install-mullvad-app-linux',
      locations: [{
        uri: 'https://repository.mullvad.net/deb/stable',
        releases: ['trixie', 'bookworm', 'forky', 'sid'],
        architectures: ['amd64', 'arm64'],
        suite: 'stable',
        components: ['main'],
        supportLevel: 'explicit',
      }],
      keys: [{
        url: 'https://repository.mullvad.net/deb/mullvad-keyring.asc',
        keyringPath: '/usr/share/keyrings/mullvad-keyring.asc',
        format: 'ascii-armored',
        fingerprints: ['A1198702FC3E0A09A9AE5B75D5A1D4F266DE8DDF'],
        releases: ['trixie', 'bookworm', 'forky', 'sid'],
      }],
    })
    expect(getRepositorySource('kubernetes-v1-36')).toMatchObject({
      locations: [{ suite: '/', components: [] }],
    })
    expect(getRepositorySource('mozilla')).toMatchObject({
      preferenceFiles: [{
        id: 'mozilla-firefox',
        content: 'Package: *\nPin: origin packages.mozilla.org\nPin-Priority: 1000\n',
      }],
    })
  })

  it('resolves known source IDs and leaves unknown IDs unresolved', () => {
    expect(getRepositorySource('hashicorp')?.name).toBe('HashiCorp')
    expect(getRepositorySource('unknown-source')).toBeUndefined()
  })
})
