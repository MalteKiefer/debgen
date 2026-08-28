import { describe, expect, it } from 'vitest'
import {
  generateInstallScript,
  generatePackageInstallCommand,
  generateVendorArtifacts,
  type VendorGenerationConfig,
} from './generate'
import type { VendorProduct } from './model'

type ProductWithFingerprint = VendorProduct & { readonly fingerprints?: readonly string[] }

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
        productName: 'Example Tool',
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
    expect(artifacts.map((artifact) => artifact.productName)).toEqual(['Example Tool', 'Example Tool'])
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
      .toThrow(/example-tool.*filename.*exact/i)
  })

  it('creates a reviewable installation script with safe key download, verification, and quoting', () => {
    const selected = product({
      name: "Vendor's Tool",
      keyUrl: "https://vendor.example/keys/vendor's.asc",
      fingerprints: ['A1B2 C3D4 E5F6 0123 4567 89AB CDEF 0123 4567 89AB'],
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
    expect(script.content).toContain("expected_fingerprints='A1B2C3D4E5F60123456789ABCDEF0123456789AB'")
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

  it('generates the package command in deterministic product order with shell quoting', () => {
    const alpha = product({
      id: 'alpha-tool',
      filename: 'alpha-tool.sources',
      keyringPath: '/etc/apt/keyrings/alpha-tool.gpg',
      packages: ["alpha's-tool"],
    })
    const selectedConfig = config({
      productIds: ['example-tool', 'alpha-tool'],
      products: [product(), alpha],
    })

    expect(generatePackageInstallCommand(selectedConfig)).toBe(
      "apt-get install -y 'alpha'\"'\"'s-tool' 'example-tool'\n",
    )
    expect(generatePackageInstallCommand({ ...selectedConfig, productIds: [] })).toBe('')
  })

  it('makes injected names, warnings, and heredoc markers inert', () => {
    const selectedConfig = config({ products: [product({
      name: 'Example Tool\nrm -rf /',
      warning: 'Prüfen\nrm -rf /',
    })] })
    const artifacts = [{
      filename: 'example-tool.sources',
      mediaType: 'text/plain',
      description: 'Quelle',
      content: 'DEBGEN_ARTIFACT_0\nrm -rf /\n',
    }]
    const script = generateInstallScript(selectedConfig, artifacts)

    expect(script.content).toContain('# Signaturschlüssel für Example Tool rm -rf /')
    expect(script.content).toContain('# WARNUNG: Prüfen rm -rf /')
    expect(script.content).not.toContain('\nrm -rf /\n#')
    expect(script.content).toContain("<<'DEBGEN_ARTIFACT_0_1'\nDEBGEN_ARTIFACT_0\nrm -rf /\nDEBGEN_ARTIFACT_0_1")
  })

  it('compares the complete normalized set of primary signing-key fingerprints', () => {
    const selectedConfig = config({ products: [product({ fingerprints: [
      'BBBB BBBB BBBB BBBB BBBB BBBB BBBB BBBB BBBB BBBB',
      'AAAA AAAA AAAA AAAA AAAA AAAA AAAA AAAA AAAA AAAA',
    ] })] })
    const script = generateInstallScript(selectedConfig, generateVendorArtifacts(selectedConfig))

    expect(script.content).toContain("expected_fingerprints='AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\nBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'")
    expect(script.content).toContain('actual_fingerprints="$(printf')
    expect(script.content).toContain('LC_ALL=C sort -u')
    expect(script.content).toContain('if [ "$actual_fingerprints" != "$expected_fingerprints" ]; then')
    expect(script.content).toContain('Die Fingerprints der Signaturschlüssel stimmen nicht mit den erwarteten Werten überein.')
    expect(script.content).not.toContain('Expected exactly one primary signing key.')
    expect(script.content).not.toContain('Signing-key fingerprint verification failed.')
  })

  it('embeds the officially published fingerprint allowlists for real catalog products', () => {
    const selectedConfig: VendorGenerationConfig = {
      release: 'bookworm',
      architecture: 'amd64',
      productIds: ['hashicorp-terraform', 'mariadb-community-11-8', 'grafana', 'influxdb-3-core'],
    }
    const script = generateInstallScript(selectedConfig, generateVendorArtifacts(selectedConfig))

    for (const fingerprint of [
      '798AEC654E5C15428C8E42EEAA16FCBCA621E701',
      '177F4010FE56CA3336300305F1656F24C74CD1D8',
      '4E40DDF6D76E284A4A6780E48C8C34C524098CB6',
      '0E22EB88E39E12277A7760AE9E439B102CF3C0C6',
      'B53AE77BADB630A683046005963FA27710458545',
      '24C975CBA61A024EE1B631787C3D57159FC2F927',
    ]) {
      expect(script.content).toContain(fingerprint)
    }
  })

  it.each([
    '../escape.sources',
    '/absolute.sources',
    'nested/escape.sources',
    'example-tool.list',
  ])('rejects an unsafe artifact filename before shell generation: %s', (filename) => {
    expect(() => generateInstallScript(config(), [{
      filename,
      mediaType: 'text/plain',
      description: 'Unsafe',
      content: 'Types: deb\n',
    }])).toThrow(/artifact.*filename.*safe/i)
  })

  it('writes preferences to apt preferences.d, not the sources directory', () => {
    const selectedConfig = config({ products: [product({ preferences: 'Package: example-tool\n' })] })
    const script = generateInstallScript(selectedConfig, generateVendorArtifacts(selectedConfig))

    expect(script.content).toContain("cat > '/etc/apt/preferences.d/example-tool.pref'")
    expect(script.content).not.toContain("cat > '/etc/apt/sources.list.d/example-tool.pref'")
  })

  it('uses one restrictive temporary directory and a cleanup trap', () => {
    const script = generateInstallScript(config(), generateVendorArtifacts(config()))

    expect(script.content).toContain('temporary_directory="$(mktemp -d)"')
    expect(script.content).toContain('trap \'rm -rf "$temporary_directory"\' EXIT')
    expect(script.content).not.toContain('temporary_key="$(mktemp)"')
  })

  it('updates apt package indexes exactly once after installing repository files', () => {
    const script = generateInstallScript(config(), generateVendorArtifacts(config()))

    expect(script.content.match(/^apt-get update$/gm)).toHaveLength(1)
    expect(script.content.indexOf('apt-get update')).toBeGreaterThan(
      script.content.indexOf("cat > '/etc/apt/sources.list.d/example-tool.sources'"),
    )
  })

  it('rejects duplicate product selections before emitting artifacts', () => {
    expect(() => generateVendorArtifacts(config({ productIds: ['example-tool', 'example-tool'] })))
      .toThrow(/duplicate.*example-tool/i)
  })

  it('orders safe selected product IDs deterministically', () => {
    const zProduct = product({
      id: 'z-tool',
      filename: 'z-tool.sources',
      keyringPath: '/etc/apt/keyrings/z-tool.gpg',
    })
    const alphaProduct = product({
      id: 'a-tool',
      filename: 'a-tool.sources',
      keyringPath: '/etc/apt/keyrings/a-tool.gpg',
    })

    expect(generateVendorArtifacts(config({
      productIds: ['z-tool', 'a-tool'],
      products: [zProduct, alphaProduct],
    })).map(({ filename }) => filename)).toEqual(['a-tool.sources', 'z-tool.sources'])
  })
})
