import { describe, expect, it } from 'vitest'
import { composeArtifacts, groupArtifacts } from './group'
import type { GeneratedArtifact } from './model'

type ArtifactWithProductName = GeneratedArtifact & { readonly productName?: string }

const debian: GeneratedArtifact = {
  filename: 'debian.sources', mediaType: 'text/plain', description: 'Debian-Basis', content: 'Types: deb\n',
}

const firefox: GeneratedArtifact = {
  filename: 'mozilla-firefox.sources', mediaType: 'text/plain', description: 'Firefox',
  content: 'Types: deb\nURIs: https://packages.mozilla.org/apt\nSuites: mozilla\nComponents: main\nSigned-By: /etc/apt/keyrings/mozilla.asc\n',
  category: 'browser', productId: 'mozilla-firefox',
}

const docker: GeneratedArtifact = {
  filename: 'docker-engine.sources', mediaType: 'text/plain', description: 'Docker',
  content: 'Types: deb\nURIs: https://download.docker.com/linux/debian\nSuites: bookworm\nComponents: stable\nSigned-By: /etc/apt/keyrings/docker.asc\n',
  category: 'containers', productId: 'docker-engine',
}

const firefoxPreferences: GeneratedArtifact = {
  filename: 'mozilla-firefox.pref', mediaType: 'text/plain', description: 'Firefox preferences', content: 'Package: *\n',
  category: 'browser', productId: 'mozilla-firefox',
}

const installScript: GeneratedArtifact = {
  filename: 'install-vendor-repositories.sh', mediaType: 'text/x-shellscript', description: 'Installation', content: '#!/usr/bin/env bash\n',
}

describe('artifact grouping', () => {
  it.each(['perVendor', 'combined', 'byCategory'] as const)(
    'deduplicates one source in %s mode without losing warnings',
    (mode) => {
      const first = {
        ...firefox,
        filename: 'mullvad-browser.sources',
        productId: 'mullvad-browser',
        productName: 'Mullvad Browser',
        sourceId: 'mullvad',
        riskNotes: ['Browser warning', 'Shared warning'],
      }
      const second = {
        ...firefox,
        filename: 'mullvad-vpn.sources',
        productId: 'mullvad-vpn',
        productName: 'Mullvad VPN',
        sourceId: 'mullvad',
        riskNotes: ['VPN warning', 'Shared warning'],
      }

      const result = groupArtifacts([second, first], mode)

      expect(result).toHaveLength(1)
      expect(result[0]?.filename).toBe(mode === 'perVendor' ? 'mullvad.sources' : mode === 'combined' ? 'vendors.sources' : 'browser.sources')
      expect(result[0]?.content).toBe(firefox.content)
      expect(result[0]?.riskNotes).toEqual(['Browser warning', 'Shared warning', 'VPN warning'])
    },
  )

  it('deduplicates identical preference files and rejects conflicting source-owned artifacts', () => {
    const sharedPreference = { ...firefoxPreferences, sourceId: 'shared-source' }

    expect(groupArtifacts([sharedPreference, { ...sharedPreference }], 'perVendor')).toEqual([sharedPreference])
    expect(() => groupArtifacts([
      sharedPreference,
      { ...sharedPreference, content: 'Package: changed\n' },
    ], 'perVendor')).toThrow(/conflicting preference.*mozilla-firefox\.pref/i)
    const conflictingSources: readonly (GeneratedArtifact & { readonly sourceId: string })[] = [
      { ...firefox, sourceId: 'shared-source' },
      { ...docker, sourceId: 'shared-source' },
    ]
    expect(() => groupArtifacts(conflictingSources, 'combined'))
      .toThrow(/conflicting source.*shared-source/i)
  })

  it('keeps per-vendor files in Debian-base, category, product, auxiliary order', () => {
    expect(groupArtifacts([installScript, firefoxPreferences, docker, debian, firefox], 'perVendor').map(({ filename }) => filename))
      .toEqual(['debian.sources', 'mozilla-firefox.sources', 'mozilla-firefox.pref', 'docker-engine.sources', 'install-vendor-repositories.sh'])
  })

  it('orders across products by category, display name, and then auxiliary kind', () => {
    const artifact = (
      filename: string,
      category: GeneratedArtifact['category'],
      productId: string,
      productName: string,
    ): ArtifactWithProductName => ({
      filename,
      mediaType: 'text/plain',
      description: filename,
      content: `${filename}\n`,
      category,
      productId,
      productName,
    })

    const result = groupArtifacts([
      installScript,
      artifact('a-zulu.pref', 'browser', 'a-zulu', 'Zulu'),
      artifact('communication-beta.pref', 'communication', 'communication-beta', 'Beta'),
      artifact('z-alpha.sources', 'browser', 'z-alpha', 'Alpha'),
      artifact('a-zulu.sources', 'browser', 'a-zulu', 'Zulu'),
      artifact('communication-beta.sources', 'communication', 'communication-beta', 'Beta'),
      artifact('z-alpha.pref', 'browser', 'z-alpha', 'Alpha'),
      debian,
    ], 'perVendor')

    expect(result.map(({ filename }) => filename)).toEqual([
      'debian.sources',
      'z-alpha.sources',
      'z-alpha.pref',
      'a-zulu.sources',
      'a-zulu.pref',
      'communication-beta.sources',
      'communication-beta.pref',
      'install-vendor-repositories.sh',
    ])
  })

  it('combines complete DEB822 source stanzas while retaining separate auxiliary files', () => {
    const result = groupArtifacts([docker, firefoxPreferences, firefox, debian], 'combined')

    expect(result.map(({ filename }) => filename)).toEqual(['debian.sources', 'vendors.sources', 'mozilla-firefox.pref'])
    expect(result[1]).toMatchObject({
      content: firefox.content + '\n' + docker.content,
    })
    expect(result[1]?.category).toBeUndefined()
    expect(result[1]?.productId).toBeUndefined()
  })

  it('combines DEB822 source stanzas by category while retaining distinct key paths', () => {
    const result = groupArtifacts([docker, firefox, debian], 'byCategory')

    expect(result.map(({ filename }) => filename)).toEqual(['debian.sources', 'browser.sources', 'containers.sources'])
    expect(result.map(({ description }) => description)).toEqual([
      'Debian-Basis',
      'Paketquellen: Browser',
      'Paketquellen: Container',
    ])
    expect(result[1]?.content).toContain('Signed-By: /etc/apt/keyrings/mozilla.asc')
    expect(result[2]?.content).toContain('Signed-By: /etc/apt/keyrings/docker.asc')
  })

  it('uses the reviewed category sequence for grouped sources', () => {
    const result = groupArtifacts([
      { ...docker, filename: 'cloud-tool.sources', category: 'cloud', productId: 'cloud-tool' },
      { ...docker, filename: 'privacy-tool.sources', category: 'privacy', productId: 'privacy-tool' },
      { ...docker, filename: 'development-tool.sources', category: 'development', productId: 'development-tool' },
      docker,
      firefox,
    ], 'byCategory')

    expect(result.map(({ filename }) => filename)).toEqual([
      'browser.sources', 'privacy.sources', 'development.sources', 'cloud.sources', 'containers.sources',
    ])
  })

  it('rejects colliding filenames and unsupported modes', () => {
    expect(() => groupArtifacts([firefox, { ...docker, filename: firefox.filename }], 'perVendor')).toThrow(/duplicate.*mozilla-firefox\.sources/i)
    expect(() => groupArtifacts([firefox], 'other' as 'perVendor')).toThrow(/unsupported.*other/i)
  })

  it('defaults an omitted mode to per-vendor output', () => {
    expect(groupArtifacts([docker, firefox]).map(({ filename }) => filename))
      .toEqual(['mozilla-firefox.sources', 'docker-engine.sources'])
  })

  it('fails closed instead of dropping a source with a missing or unknown category', () => {
    expect(() => groupArtifacts([{ ...firefox, category: undefined }], 'byCategory'))
      .toThrow(/category.*mozilla-firefox/i)
    expect(() => groupArtifacts([{ ...firefox, category: 'unknown' as typeof firefox.category }], 'byCategory'))
      .toThrow(/category.*mozilla-firefox/i)
  })

  it('merges and deduplicates risk notes deterministically for grouped sources', () => {
    const artifacts = [
      { ...docker, riskNotes: ['Docker warning', 'Shared warning'] },
      { ...firefox, riskNotes: ['Firefox warning', 'Shared warning'] },
    ]

    expect(groupArtifacts(artifacts, 'combined')[0]?.riskNotes)
      .toEqual(['Firefox warning', 'Shared warning', 'Docker warning'])
    expect(groupArtifacts(artifacts, 'byCategory').map(({ riskNotes }) => riskNotes))
      .toEqual([
        ['Firefox warning', 'Shared warning'],
        ['Docker warning', 'Shared warning'],
      ])
  })

  it('uses code-point ordering instead of locale-sensitive ordering', () => {
    const result = groupArtifacts([
      { ...firefox, filename: 'umlaut.sources', productId: 'ä-tool' },
      { ...firefox, filename: 'zeta.sources', productId: 'z-tool' },
    ], 'perVendor')

    expect(result.map(({ filename }) => filename)).toEqual(['zeta.sources', 'umlaut.sources'])
  })

  it.each(['debian.sources', 'debian.list'])(
    'rejects vendor collisions with the complete Debian artifact list for %s',
    (filename) => {
      const base = { ...debian, filename }
      const collidingVendor = { ...firefox, filename }

      expect(() => composeArtifacts(base, [collidingVendor], 'perVendor'))
        .toThrow(new RegExp(`duplicate.*${filename.replace('.', '\\.')}`, 'i'))
    },
  )

  it('keeps a legacy Debian base first while grouping only vendor sources', () => {
    const legacy = { ...debian, filename: 'debian.list' }

    expect(composeArtifacts(legacy, [docker, firefox], 'combined').map(({ filename }) => filename))
      .toEqual(['debian.list', 'vendors.sources'])
  })
})
