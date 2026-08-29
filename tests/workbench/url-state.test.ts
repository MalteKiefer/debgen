import { describe, expect, it } from 'vitest'
import { RELEASES } from '../../src/features/sources/releases'
import { VENDOR_PRODUCTS } from '../../src/features/vendors/catalog'
import { createDefaultState } from '../../src/workbench/state'
import {
  parseWorkbenchUrl,
  serializeWorkbenchUrl,
  type WorkbenchManifest,
} from '../../src/workbench/url-state'

const testManifest: WorkbenchManifest = {
  releases: RELEASES,
  products: VENDOR_PRODUCTS,
}

describe('Workbench URL state', () => {
  it('round-trips a validated configuration in stable order', () => {
    const state = {
      ...createDefaultState(),
      release: 'trixie' as const,
      architecture: 'amd64' as const,
      repositories: ['docker-engine'],
    }

    expect(serializeWorkbenchUrl(state).toString()).toBe('release=trixie&arch=amd64&format=deb822&repo=docker-engine')
  })

  it('rejects control characters and unknown repository ids', () => {
    const parsed = parseWorkbenchUrl(new URL('https://debgen.org/en/?repo=bad%0Avalue'), testManifest)

    expect(parsed.state.repositories).toEqual([])
    expect(parsed.warnings).toHaveLength(1)
    expect(parsed.warnings[0]).toMatchObject({ code: 'invalid-repository', value: 'bad\nvalue' })
  })

  it('restores only valid values and records each incompatible repository removal', () => {
    const parsed = parseWorkbenchUrl(new URL([
      'https://debgen.org/en/?release=trixie&arch=arm64&format=deb822',
      '&repo=docker-engine&repo=mongodb-community-8-0&repo=docker-engine#review',
    ].join('')), testManifest)

    expect(parsed.state).toEqual(expect.objectContaining({
      activeStep: 'review',
      release: 'trixie',
      architecture: 'arm64',
      repositories: ['docker-engine'],
    }))
    expect(parsed.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'incompatible-repository', value: 'mongodb-community-8-0' }),
    ]))
  })

  it('serializes non-default official-source choices and repositories in deterministic parameter order', () => {
    const query = serializeWorkbenchUrl({
      ...createDefaultState(),
      includeSource: true,
      includeSecurity: false,
      includeUpdates: false,
      includeBackports: false,
      components: ['main'],
      repositories: ['zabbix', 'docker-engine'],
      outputMode: 'combined',
    })

    expect(query.toString()).toBe([
      'release=trixie&arch=amd64&format=deb822&source=1',
      'suite=base&component=main&repo=docker-engine&repo=zabbix&mode=combined',
    ].join('&'))
  })
})
