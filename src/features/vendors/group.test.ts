import { describe, expect, it } from 'vitest'
import { groupArtifacts } from './group'
import type { GeneratedArtifact } from './model'

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
  it('keeps per-vendor files in Debian-base, category, product, auxiliary order', () => {
    expect(groupArtifacts([installScript, firefoxPreferences, docker, debian, firefox], 'perVendor').map(({ filename }) => filename))
      .toEqual(['debian.sources', 'mozilla-firefox.sources', 'mozilla-firefox.pref', 'docker-engine.sources', 'install-vendor-repositories.sh'])
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
})
