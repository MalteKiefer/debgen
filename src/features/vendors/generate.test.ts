import { describe, expect, it } from 'vitest'
import { generateInstallScript, generateVendorArtifacts, type VendorGenerationConfig } from './generate'
import type { VendorProduct } from './model'

type ProductWithFingerprint = VendorProduct & { readonly fingerprint?: string }

function product(overrides: Partial<ProductWithFingerprint> = {}): ProductWithFingerprint {
  return {
    id: 'example-tool',
    name: 'Example Tool',
    category: 'development',
    filename: 'example-tool.sources',
    documentationUrl: 'https://vendor.example/docs',
    repositoryUrl: 'https://vendor.example/debian',
    keyUrl: 'https://vendor.example/key.asc',
    keyringPath: '/etc/apt/keyrings/example-tool.gpg',
    packages: ['example-tool'],
    architectures: ['amd64'],
    releases: ['bookworm'],
    suite: 'bookworm',
    components: ['main'],
    verifiedAt: '2026-08-28',
    ...overrides,
  }
}

function config(overrides: Partial<VendorGenerationConfig> = {}): VendorGenerationConfig {
  return {
    release: 'bookworm',
    architecture: 'amd64',
    productIds: ['example-tool'],
    products: [product()],
    ...overrides,
  }
}

describe('vendor artifact generation', () => {
  it('emits a complete deterministic DEB822 source with its isolated keyring', () => {
    expect(generateVendorArtifacts(config())).toEqual([
      {
        filename: 'example-tool.sources',
        mediaType: 'text/plain',
        description: 'Paketquelle für Example Tool',
        content: [
          'Types: deb',
          'URIs: https://vendor.example/debian',
          'Suites: bookworm',
          'Architectures: amd64',
          'Components: main',
          'Signed-By: /etc/apt/keyrings/example-tool.gpg',
          '',
        ].join('\n'),
        category: 'development',
        productId: 'example-tool',
      },
    ])
  })

  it('resolves architecture-specific repository URLs from own mapping properties', () => {
    const artifacts = generateVendorArtifacts(config({
      architecture: 'arm64',
      products: [product({
        architectures: ['amd64', 'arm64'],
        repositoryUrl: { amd64: 'https://vendor.example/debian/amd64', arm64: 'https://vendor.example/debian/arm64' },
      })],
    }))

    expect(artifacts[0]?.content).toContain('URIs: https://vendor.example/debian/arm64\n')
  })

  it('omits Components for an exact-path suite', () => {
    const artifacts = generateVendorArtifacts(config({ products: [product({ suite: '/', components: [] })] }))

    expect(artifacts[0]?.content).toBe([
      'Types: deb',
      'URIs: https://vendor.example/debian',
      'Suites: /',
      'Architectures: amd64',
      'Signed-By: /etc/apt/keyrings/example-tool.gpg',
      '',
    ].join('\n'))
  })

  it('adds preferences and a warning as distinct, reviewable artifacts', () => {
    const artifacts = generateVendorArtifacts(config({ products: [product({
      preferences: 'Package: example-tool\nPin: origin vendor.example\nPin-Priority: 1000\n',
      warning: 'Hat eine wichtige Betriebswirkung.',
    })] }))

    expect(artifacts.map((artifact) => artifact.filename)).toEqual(['example-tool.sources', 'example-tool.pref'])
    expect(artifacts[0]?.riskNotes).toEqual(['Hat eine wichtige Betriebswirkung.'])
    expect(artifacts[1]?.content).toBe('Package: example-tool\nPin: origin vendor.example\nPin-Priority: 1000\n')
  })

  it('keeps the generated source and preference bundle stable', () => {
    expect(generateVendorArtifacts(config({ products: [product({
      preferences: 'Package: example-tool\nPin: origin vendor.example\nPin-Priority: 1000\n',
      warning: 'Hat eine wichtige Betriebswirkung.',
    })] }))).toMatchSnapshot()
  })

  it('rejects unknown and incompatible product selections', () => {
    expect(() => generateVendorArtifacts(config({ productIds: ['missing'] }))).toThrow(/unknown.*missing/i)
    expect(() => generateVendorArtifacts(config({ architecture: 'arm64' }))).toThrow(/arm64.*nicht unterstützt/i)
  })

  it('rejects a filename that could escape the deterministic sources directory', () => {
    expect(() => generateVendorArtifacts(config({ products: [product({ filename: '../outside.sources' })] })))
      .toThrow(/example-tool.*filename.*safe/i)
  })

  it('creates a reviewable installation script with safe key download, verification, and quoting', () => {
    const selected = product({
      name: "Vendor's Tool",
      keyUrl: "https://vendor.example/keys/vendor's.asc",
      fingerprint: 'A1B2 C3D4 E5F6 0123 4567 89AB CDEF 0123 4567 89AB',
      packages: ['vendor-tool', 'vendor-tools-extra'],
      warning: 'Dienst aktiviert Netzwerkzugriff.',
    })
    const selectedConfig = config({ products: [selected] })
    const script = generateInstallScript(selectedConfig, generateVendorArtifacts(selectedConfig))

    expect(script).toMatchObject({
      filename: 'install-vendor-repositories.sh',
      mediaType: 'text/x-shellscript',
      description: 'Installationsanweisungen für ausgewählte Herstellerquellen',
      riskNotes: ['Dienst aktiviert Netzwerkzugriff.'],
    })
    expect(script.content).toContain('#!/usr/bin/env bash\nset -euo pipefail\n')
    expect(script.content).toContain("curl --fail --location --proto '=https' --tlsv1.2 --output \"$temporary_key\" 'https://vendor.example/keys/vendor'\"'\"'s.asc'")
    expect(script.content).toContain("expected_fingerprint='A1B2C3D4E5F60123456789ABCDEF0123456789AB'")
    expect(script.content).toContain('gpg --show-keys --with-colons "$temporary_key"')
    expect(script.content).toContain('if grep -q -- \'-----BEGIN PGP PUBLIC KEY BLOCK-----\' "$temporary_key"; then')
    expect(script.content).toContain("apt-get install -y 'vendor-tool' 'vendor-tools-extra'")
    expect(script.content).toContain('# WARNUNG: Dienst aktiviert Netzwerkzugriff.')
    expect(script.content).not.toMatch(/curl[^\n]*\|\s*(ba)?sh/i)
    expect(script.content).not.toContain('apt-key')
    expect(script.content.endsWith('\n')).toBe(true)
    expect(script.content).not.toMatch(/\n\n$/)
  })

  it('does not emit a package-install command for an empty selection', () => {
    const emptyConfig = config({ productIds: [] })

    expect(generateVendorArtifacts(emptyConfig)).toEqual([])
    expect(generateInstallScript(emptyConfig, []).content).not.toContain('apt-get install -y \n')
  })
})
