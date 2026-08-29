import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { VENDOR_PRODUCTS } from './catalog'
import { getVendorCompatibility } from './compatibility'
import { generateInstallScript, generatePackageInstallCommand, generateVendorArtifacts } from './generate'

describe('migrated vendor artifact generation', () => {
  it('preserves a legacy product source artifact byte for byte', () => {
    expect(generateVendorArtifacts({ release: 'bookworm', architecture: 'arm64', productIds: ['mozilla-firefox'] })).toMatchObject([{
      filename: 'mozilla-firefox.sources',
      content: 'Types: deb\nURIs: https://packages.mozilla.org/apt\nSuites: mozilla\nArchitectures: arm64\nComponents: main\nSigned-By: /etc/apt/keyrings/packages.mozilla.org.asc\n',
    }, {
      filename: 'mozilla-firefox.pref',
      content: 'Package: *\nPin: origin packages.mozilla.org\nPin-Priority: 1000\n',
    }])
  })

  it('preserves the complete pre-migration artifact corpus', () => {
    const releases = ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'] as const
    const architectures = ['amd64', 'arm64', 'armhf', 'i386'] as const
    const entries: string[] = []
    for (const product of VENDOR_PRODUCTS) for (const release of releases) for (const architecture of architectures) {
      if (!getVendorCompatibility(product, release, architecture).compatible) continue
      const config = { release, architecture, productIds: [product.id] } as const
      const artifacts = generateVendorArtifacts(config)
      entries.push([product.id, release, architecture, ...artifacts.map((artifact) => `${artifact.filename}\n${artifact.content}`), `install-vendor-repositories.sh\n${generateInstallScript(config, artifacts).content}`].join('\n---\n'))
    }
    const payload = entries.sort().join('\n====\n')
    expect(entries).toHaveLength(170)
    expect(createHash('sha256').update(payload).digest('hex')).toBe('3833ca8092b58bb3fa5cc971ab059369cb06071a56951672b41a67516a748c83')
  })

  it('uses product packages in deterministic order', () => {
    expect(generatePackageInstallCommand({ release: 'bookworm', architecture: 'amd64', productIds: ['hashicorp-terraform', 'github-cli'] }))
      .toBe("apt-get install -y 'gh' 'terraform'\n")
  })
})
