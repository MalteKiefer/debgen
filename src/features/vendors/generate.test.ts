import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { VENDOR_PRODUCTS } from './catalog'
import { getVendorCompatibility } from './compatibility'
import {
  generateInstallScript,
  generatePackageInstallCommand,
  generateRepositoryArtifacts,
  generateVendorArtifacts,
  type VendorGenerationConfig,
} from './generate'
import type {
  RepositoryKey,
  RepositoryLocation,
  RepositorySource,
  VendorProduct,
} from './model'

function product(overrides: Partial<VendorProduct> = {}): VendorProduct {
  return {
    id: 'example-tool',
    sourceId: 'example-tool',
    name: 'Example Tool',
    category: 'development',
    icon: 'mdi-code-tags',
    packages: ['example-tool'],
    supportedArchitectures: ['amd64'],
    supportedReleases: ['bookworm'],
    supportLevel: 'explicit',
    provenance: 'manufacturer',
    securityCritical: false,
    warningKeys: [],
    ...overrides,
  }
}

function location(overrides: Partial<RepositoryLocation> = {}): RepositoryLocation {
  return {
    uri: 'https://vendor.example/debian',
    releases: ['bookworm'],
    architectures: ['amd64'],
    suite: 'bookworm',
    components: ['main'],
    supportLevel: 'explicit',
    ...overrides,
  }
}

function key(overrides: Partial<RepositoryKey> = {}): RepositoryKey {
  return {
    id: 'example-tool-signing-key',
    url: 'https://vendor.example/key.asc',
    keyringPath: '/etc/apt/keyrings/example-tool.gpg',
    format: 'ascii-armored',
    fingerprints: [],
    releases: ['bookworm'],
    ...overrides,
  }
}

function source(overrides: Partial<RepositorySource> = {}): RepositorySource {
  return {
    id: 'example-tool',
    name: 'Example Tool Repository',
    documentationUrl: 'https://vendor.example/docs',
    verifiedAt: '2026-08-29',
    locations: [location()],
    keys: [key()],
    auxiliaryTrustFiles: [],
    preferenceFiles: [],
    warnings: [],
    ...overrides,
  }
}

function catalog(
  products: readonly VendorProduct[] = [product()],
  sources: readonly RepositorySource[] = [source()],
) {
  return { products, sources }
}

function config(overrides: Partial<VendorGenerationConfig> = {}): VendorGenerationConfig {
  return {
    release: 'bookworm',
    architecture: 'amd64',
    productIds: ['example-tool'],
    catalog: catalog(),
    ...overrides,
  }
}

describe('vendor artifact generation', () => {
  it.each([
    {
      productIds: ['mullvad-vpn', 'mullvad-browser'],
      sourceFilename: 'mullvad.sources',
      packageCommand: "apt-get install -y 'mullvad-browser' 'mullvad-vpn'\n",
    },
    {
      productIds: ['hashicorp-terraform', 'hashicorp-vault', 'hashicorp-packer'],
      sourceFilename: 'hashicorp.sources',
      packageCommand: "apt-get install -y 'packer' 'terraform' 'vault'\n",
    },
    {
      productIds: ['grafana', 'grafana-alloy', 'grafana-enterprise'],
      sourceFilename: 'grafana.sources',
      packageCommand: "apt-get install -y 'alloy' 'grafana' 'grafana-enterprise'\n",
    },
    {
      productIds: ['elastic-stack-9', 'elastic-agent-9'],
      sourceFilename: 'elastic-9.sources',
      packageCommand: "apt-get install -y 'elastic-agent' 'elasticsearch' 'filebeat' 'kibana' 'logstash'\n",
    },
  ])('emits one $sourceFilename artifact and sorted packages for a shared source', ({
    productIds,
    sourceFilename,
    packageCommand,
  }) => {
    const selectedConfig: VendorGenerationConfig = {
      release: 'bookworm',
      architecture: 'amd64',
      productIds,
    }

    expect(generateRepositoryArtifacts(selectedConfig).filter(({ filename }) => filename.endsWith('.sources')))
      .toHaveLength(1)
    expect(generateRepositoryArtifacts(selectedConfig).map(({ filename }) => filename))
      .toContain(sourceFilename)
    expect(generatePackageInstallCommand(selectedConfig))
      .toBe(packageCommand)
  })

  it('uses every applicable OpenTofu key in DEB822 and installs each exactly once', () => {
    const selectedConfig: VendorGenerationConfig = {
      release: 'bookworm',
      architecture: 'amd64',
      productIds: ['opentofu'],
    }
    const artifacts = generateRepositoryArtifacts(selectedConfig)
    const script = generateInstallScript(selectedConfig, artifacts)

    expect(artifacts[0]?.content).toContain(
      'Signed-By: /etc/apt/keyrings/opentofu.gpg /etc/apt/keyrings/opentofu-repo.gpg\n',
    )
    expect(script.content.match(/https:\/\/get\.opentofu\.org\/opentofu\.gpg/g)).toHaveLength(1)
    expect(script.content.match(/https:\/\/packages\.opentofu\.org\/opentofu\/tofu\/gpgkey/g)).toHaveLength(1)
    expect(script.content.match(/install -m 0644 "\$temporary_key" '\/etc\/apt\/keyrings\/opentofu\.gpg'/g)).toHaveLength(1)
    expect(script.content.match(/install -m 0644 "\$dearmored_key" '\/etc\/apt\/keyrings\/opentofu-repo\.gpg'/g)).toHaveLength(1)
  })

  it('resolves release-scoped Tailscale keys and Microsoft repository locations', () => {
    const tailscaleBookworm: VendorGenerationConfig = {
      release: 'bookworm', architecture: 'amd64', productIds: ['tailscale'],
    }
    const tailscaleTrixie: VendorGenerationConfig = {
      release: 'trixie', architecture: 'amd64', productIds: ['tailscale'],
    }
    const microsoftBookworm: VendorGenerationConfig = {
      release: 'bookworm', architecture: 'arm64', productIds: ['dotnet-sdk-10'],
    }
    const microsoftTrixie: VendorGenerationConfig = {
      release: 'trixie', architecture: 'arm64', productIds: ['powershell-7-6'],
    }

    expect(generateRepositoryArtifacts(tailscaleBookworm)[0]?.content)
      .toContain('Signed-By: /usr/share/keyrings/tailscale-bookworm-archive-keyring.gpg\n')
    expect(generateInstallScript(tailscaleBookworm, generateRepositoryArtifacts(tailscaleBookworm)).content)
      .toContain("'https://pkgs.tailscale.com/stable/debian/bookworm.noarmor.gpg'")
    expect(generateRepositoryArtifacts(tailscaleTrixie)[0]?.content)
      .toContain('Signed-By: /usr/share/keyrings/tailscale-trixie-archive-keyring.gpg\n')
    expect(generateInstallScript(tailscaleTrixie, generateRepositoryArtifacts(tailscaleTrixie)).content)
      .toContain("'https://pkgs.tailscale.com/stable/debian/trixie.noarmor.gpg'")
    expect(generateRepositoryArtifacts(microsoftBookworm)[0]?.content)
      .toContain('URIs: https://packages.microsoft.com/debian/12/prod\nSuites: bookworm\n')
    expect(generateRepositoryArtifacts(microsoftTrixie)[0]?.content)
      .toContain('URIs: https://packages.microsoft.com/debian/13/prod\nSuites: trixie\n')
  })

  it.each([
    ['sublime-text', 'bookworm', 'sublime.sources', 'apt/stable/'],
    ['jenkins-lts', 'trixie', 'jenkins-lts.sources', 'binary/'],
  ] as const)('preserves the exact componentless path for %s', (productId, release, filename, suite) => {
    const artifacts = generateRepositoryArtifacts({ release, architecture: 'amd64', productIds: [productId] })

    expect(artifacts.map((artifact) => artifact.filename)).toContain(filename)
    expect(artifacts[0]?.content).toContain(`Suites: ${suite}\n`)
    expect(artifacts[0]?.content).not.toContain('Components:')
  })

  it('keeps all shared-source warnings while emitting one source and one preference', () => {
    const elasticArtifacts = generateRepositoryArtifacts({
      release: 'bookworm', architecture: 'amd64', productIds: ['elastic-stack-9', 'elastic-agent-9'],
    })
    const nginxArtifacts = generateRepositoryArtifacts({
      release: 'bookworm', architecture: 'amd64', productIds: ['nginx-mainline', 'nginx-stable'],
    })
    const syncthingArtifacts = generateRepositoryArtifacts({
      release: 'bookworm', architecture: 'amd64', productIds: ['syncthing-stable-v2'],
    })

    expect(elasticArtifacts).toHaveLength(1)
    expect(elasticArtifacts[0]?.riskNotes).toEqual([
      'elastic-agent-enrollment',
      'elastic-stack-resource-requirements',
    ])
    expect(nginxArtifacts.filter(({ filename }) => filename === 'nginx.pref')).toHaveLength(1)
    expect(syncthingArtifacts.filter(({ filename }) => filename === 'syncthing.pref')).toHaveLength(1)
  })

  it('emits Debian-native packages without repository, key, or trust setup', () => {
    const selectedConfig: VendorGenerationConfig = {
      release: 'bookworm', architecture: 'amd64', productIds: ['nodejs', 'libreoffice'],
    }
    const artifacts = generateRepositoryArtifacts(selectedConfig)
    const script = generateInstallScript(selectedConfig, artifacts)

    expect(artifacts).toEqual([])
    expect(generatePackageInstallCommand(selectedConfig)).toBe("apt-get install -y 'libreoffice' 'nodejs'\n")
    expect(script.content).toContain("apt-get install -y 'libreoffice' 'nodejs'")
    expect(script.content).not.toContain('curl --fail')
    expect(script.content).not.toContain('/etc/apt/keyrings')
    expect(script.content).not.toContain('temporary_directory')
  })

  it('deduplicates packages shared by separate products and repository keys shared by sources', () => {
    const alpha = product({ id: 'alpha-tool', sourceId: 'alpha-source', packages: ['shared', 'alpha'] })
    const beta = product({ id: 'beta-tool', sourceId: 'beta-source', packages: ['beta', 'shared'] })
    const sharedKey = key({ id: 'alpha-key', keyringPath: '/etc/apt/keyrings/shared.gpg' })
    const alphaSource = source({ id: 'alpha-source', keys: [sharedKey] })
    const betaSource = source({
      id: 'beta-source',
      keys: [{ ...sharedKey, id: 'beta-key' }],
    })
    const selectedConfig = config({
      productIds: ['beta-tool', 'alpha-tool'],
      catalog: catalog([beta, alpha], [betaSource, alphaSource]),
    })
    const artifacts = generateRepositoryArtifacts(selectedConfig)
    const script = generateInstallScript(selectedConfig, artifacts)

    expect(generatePackageInstallCommand(selectedConfig)).toBe("apt-get install -y 'alpha' 'beta' 'shared'\n")
    expect(script.content.match(/https:\/\/vendor\.example\/key\.asc/g)).toHaveLength(1)
    expect(script.content.match(/# Signaturschlüssel für/g)).toHaveLength(1)
  })

  it('deduplicates identical auxiliary and preference destinations and rejects conflicts', () => {
    const alpha = product({ id: 'alpha-tool', sourceId: 'alpha-source' })
    const beta = product({ id: 'beta-tool', sourceId: 'beta-source' })
    const auxiliary = {
      id: 'onepassword-policy',
      url: 'https://downloads.1password.com/linux/debian/debsig/1password.pol',
      destination: 'debsig-policy' as const,
      mediaType: 'application/xml',
    }
    const preference = { id: 'shared-priority', content: 'Package: *\nPin-Priority: 900\n' }
    const alphaSource = source({
      id: 'alpha-source',
      keys: [key({ id: 'alpha-key', keyringPath: '/etc/apt/keyrings/alpha.gpg' })],
      auxiliaryTrustFiles: [auxiliary],
      preferenceFiles: [preference],
    })
    const betaSource = source({
      id: 'beta-source',
      keys: [key({ id: 'beta-key', keyringPath: '/etc/apt/keyrings/beta.gpg' })],
      auxiliaryTrustFiles: [auxiliary],
      preferenceFiles: [preference],
    })
    const selectedConfig = config({
      productIds: ['alpha-tool', 'beta-tool'],
      catalog: catalog([alpha, beta], [alphaSource, betaSource]),
    })
    const artifacts = generateRepositoryArtifacts(selectedConfig)

    expect(artifacts.filter(({ filename }) => filename === 'shared-priority.pref')).toHaveLength(1)
    expect(generateInstallScript(selectedConfig, artifacts).content.match(/# Zusätzliche Vertrauensdatei onepassword-policy/g))
      .toHaveLength(1)

    const conflictingPreferences = catalog([alpha, beta], [
      alphaSource,
      { ...betaSource, preferenceFiles: [{ ...preference, content: 'Package: *\nPin-Priority: 100\n' }] },
    ])
    expect(() => generateRepositoryArtifacts({ ...selectedConfig, catalog: conflictingPreferences }))
      .toThrow(/conflicting preference.*shared-priority\.pref/i)

    const conflictingAuxiliary = catalog([alpha, beta], [
      alphaSource,
      {
        ...betaSource,
        auxiliaryTrustFiles: [{ ...auxiliary, url: 'https://downloads.1password.com/linux/debian/debsig/other.pol' }],
      },
    ])
    const conflictingConfig = { ...selectedConfig, catalog: conflictingAuxiliary }
    expect(() => generateInstallScript(conflictingConfig, generateRepositoryArtifacts(conflictingConfig)))
      .toThrow(/conflicting auxiliary trust file/i)
  })

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
    const selectedProduct = product({ supportedArchitectures: ['amd64', 'arm64'] })
    const selectedSource = source({
      locations: [
        location({ uri: 'https://vendor.example/debian/amd64', architectures: ['amd64'] }),
        location({ uri: 'https://vendor.example/debian/arm64', architectures: ['arm64'] }),
      ],
    })
    const artifacts = generateVendorArtifacts(config({
      architecture: 'arm64',
      catalog: catalog([selectedProduct], [selectedSource]),
    }))

    expect(artifacts[0]?.content).toContain('URIs: https://vendor.example/debian/arm64\n')
  })

  it.each(['binary/', 'apt/stable/', './', '/'])('omits Components for exact-path suite %s', (suite) => {
    const exactPathSource = source({ locations: [location({ suite, components: [] })] })
    const artifacts = generateVendorArtifacts(config({ catalog: catalog([product()], [exactPathSource]) }))

    expect(artifacts[0]?.content).toContain(`Suites: ${suite}\n`)
    expect(artifacts[0]?.content).not.toContain('Components:')
  })

  it.each([
    ['jenkins-lts', 'binary/'],
    ['sublime-text', 'apt/stable/'],
    ['typora', './'],
  ])('generates the real %s exact-path catalog source without Components', (productId, suite) => {
    const artifacts = generateVendorArtifacts({
      release: productId === 'jenkins-lts' ? 'trixie' : 'bookworm',
      architecture: 'amd64',
      productIds: [productId],
    })

    expect(artifacts[0]?.content).toContain(`Suites: ${suite}\n`)
    expect(artifacts[0]?.content).not.toContain('Components:')
  })

  it('adds preferences and a warning as distinct, reviewable artifacts', () => {
    const selectedSource = source({
      preferenceFiles: [{ id: 'vendor-priority', content: 'Package: example-tool\nPin: origin vendor.example\nPin-Priority: 1000\n' }],
      warnings: ['Hat eine wichtige Betriebswirkung.'],
    })
    const artifacts = generateVendorArtifacts(config({ catalog: catalog([product()], [selectedSource]) }))

    expect(artifacts.map((artifact) => artifact.filename)).toEqual(['example-tool.sources', 'vendor-priority.pref'])
    expect(artifacts.map((artifact) => artifact.productName)).toEqual(['Example Tool', 'Example Tool'])
    expect(artifacts[0]?.riskNotes).toEqual(['Hat eine wichtige Betriebswirkung.'])
    expect(artifacts[1]?.content).toBe('Package: example-tool\nPin: origin vendor.example\nPin-Priority: 1000\n')
  })

  it('keeps the generated source and preference bundle stable', () => {
    const selectedSource = source({
      preferenceFiles: [{ id: 'example-tool', content: 'Package: example-tool\nPin: origin vendor.example\nPin-Priority: 1000\n' }],
      warnings: ['Hat eine wichtige Betriebswirkung.'],
    })
    expect(generateVendorArtifacts(config({ catalog: catalog([product()], [selectedSource]) }))).toMatchSnapshot()
  })

  it('rejects unknown and incompatible product selections', () => {
    expect(() => generateVendorArtifacts(config({ productIds: ['missing'] }))).toThrow(/unknown.*missing/i)
    expect(() => generateVendorArtifacts(config({ architecture: 'arm64' }))).toThrow(/arm64.*nicht unterstützt/i)
  })

  it('rejects an unsafe product ID before deriving its deterministic filename', () => {
    const unsafeProduct = product({ id: '../outside' })
    expect(() => generateVendorArtifacts(config({
      productIds: ['../outside'],
      catalog: catalog([unsafeProduct], [source()]),
    }))).toThrow(/vendor.*outside.*ID.*safe/i)
  })

  it('creates a reviewable installation script with safe key download, verification, and quoting', () => {
    const selected = product({
      name: "Vendor's Tool",
      packages: ['vendor-tool', 'vendor-tools-extra'],
    })
    const selectedSource = source({
      keys: [key({
        url: "https://vendor.example/keys/vendor's.asc",
        fingerprints: ['A1B2 C3D4 E5F6 0123 4567 89AB CDEF 0123 4567 89AB'],
      })],
      warnings: ['Dienst aktiviert Netzwerkzugriff.'],
    })
    const selectedConfig = config({ catalog: catalog([selected], [selectedSource]) })
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
      packages: ["alpha's-tool"],
    })
    const selectedConfig = config({
      productIds: ['example-tool', 'alpha-tool'],
      catalog: catalog([product(), alpha]),
    })

    expect(generatePackageInstallCommand(selectedConfig)).toBe(
      "apt-get install -y 'alpha'\"'\"'s-tool' 'example-tool'\n",
    )
    expect(generatePackageInstallCommand({ ...selectedConfig, productIds: [] })).toBe('')
  })

  it('makes injected names, warnings, and heredoc markers inert', () => {
    const selectedConfig = config({
      catalog: catalog(
        [product({ name: 'Example Tool\nrm -rf /' })],
        [source({ warnings: ['Prüfen\nrm -rf /'] })],
      ),
    })
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
    const selectedSource = source({ keys: [key({ fingerprints: [
      'BBBB BBBB BBBB BBBB BBBB BBBB BBBB BBBB BBBB BBBB',
      'AAAA AAAA AAAA AAAA AAAA AAAA AAAA AAAA AAAA AAAA',
    ] })] })
    const selectedConfig = config({ catalog: catalog([product()], [selectedSource]) })
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

  it.each(['nginx-stable', 'nginx-mainline'])('verifies the complete official NGINX key bundle for %s', (productId) => {
    const selectedConfig: VendorGenerationConfig = {
      release: 'bookworm',
      architecture: 'amd64',
      productIds: [productId],
    }
    const script = generateInstallScript(selectedConfig, generateVendorArtifacts(selectedConfig))

    expect(script.content).toContain("expected_fingerprints='573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62\n8540A6F18833A80E9C1653A42FD21310B49F6B46\n9E9BE90EACBCDE69FE9B204CBCDCD8A38D88A2B3'")
  })

  it('installs the allowlisted 1Password auxiliary trust files once for a shared source', () => {
    const selectedConfig: VendorGenerationConfig = {
      release: 'bookworm',
      architecture: 'amd64',
      productIds: ['onepassword', 'onepassword-cli'],
    }
    const script = generateInstallScript(selectedConfig, generateVendorArtifacts(selectedConfig))

    expect(script.content.match(/# Zusätzliche Vertrauensdatei onepassword-policy/g)).toHaveLength(1)
    expect(script.content.match(/# Zusätzliche Vertrauensdatei onepassword-keyring/g)).toHaveLength(1)
    expect(script.content).toContain("install -d -m 0755 '/etc/debsig/policies/AC2D62742012EA22'")
    expect(script.content).toContain("install -m 0644 \"$temporary_auxiliary\" '/etc/debsig/policies/AC2D62742012EA22/1password.pol'")
    expect(script.content).toContain("install -d -m 0755 '/usr/share/debsig/keyrings/AC2D62742012EA22'")
    expect(script.content).toContain("expected_fingerprints='3FEF9748469ADBE15DA7CA80AC2D62742012EA22'")
    expect(script.content).toContain('gpg --dearmor --yes --output "$dearmored_auxiliary" "$temporary_auxiliary"')
    expect(script.content).toContain("install -m 0644 \"$dearmored_auxiliary\" '/usr/share/debsig/keyrings/AC2D62742012EA22/debsig.gpg'")
  })

  it('emits and deduplicates preferences from unique selected real catalog sources', () => {
    const nginxArtifacts = generateVendorArtifacts({
      release: 'bookworm',
      architecture: 'amd64',
      productIds: ['nginx-stable', 'nginx-mainline'],
    })
    const syncthingArtifacts = generateVendorArtifacts({
      release: 'bookworm',
      architecture: 'amd64',
      productIds: ['syncthing-stable-v2'],
    })

    expect(nginxArtifacts.filter(({ filename }) => filename === 'nginx.pref')).toHaveLength(1)
    expect(syncthingArtifacts.map(({ filename }) => filename)).toContain('syncthing.pref')
  })

  it('preserves the complete pre-migration artifact corpus across all compatible catalog combinations', () => {
    const releases = ['trixie', 'bookworm', 'bullseye', 'forky', 'sid'] as const
    const architectures = ['amd64', 'arm64', 'armhf', 'i386'] as const
    const originalProductIds = [
      'brave-browser', 'mozilla-firefox', 'google-chrome', 'microsoft-edge', 'vivaldi',
      'opera', 'signal-desktop', 'proton-vpn', 'mullvad-vpn', 'tor', 'docker-engine',
      'kubernetes-tools-v1-36', 'google-cloud-cli', 'azure-cli', 'github-cli',
      'hashicorp-terraform', 'postgresql-pgdg', 'mongodb-community-8-0', 'grafana',
      'nvidia-container-toolkit', 'mariadb-community-11-8', 'redis-open-source',
      'clickhouse', 'influxdb-3-core', 'zabbix-7-4',
    ] as const
    const entries: string[] = []

    for (const product of VENDOR_PRODUCTS.filter(({ id }) => originalProductIds.includes(id as typeof originalProductIds[number]))) {
      for (const release of releases) {
        for (const architecture of architectures) {
          if (!getVendorCompatibility(product, release, architecture).compatible) continue
          const selectedConfig = { release, architecture, productIds: [product.id] } as const
          const artifacts = generateVendorArtifacts(selectedConfig)
          entries.push([
            product.id,
            release,
            architecture,
            ...artifacts.map((artifact) => `${artifact.filename}\n${artifact.content}`),
            `install-vendor-repositories.sh\n${generateInstallScript(selectedConfig, artifacts).content}`,
          ].join('\n---\n'))
        }
      }
    }

    const payload = entries.sort().join('\n====\n')
    expect(entries).toHaveLength(170)
    expect(createHash('sha256').update(payload).digest('hex'))
      .toBe('3833ca8092b58bb3fa5cc971ab059369cb06071a56951672b41a67516a748c83')
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
    const selectedSource = source({ preferenceFiles: [{ id: 'example-tool', content: 'Package: example-tool\n' }] })
    const selectedConfig = config({ catalog: catalog([product()], [selectedSource]) })
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
    })
    const alphaProduct = product({
      id: 'a-tool',
    })

    expect(generateVendorArtifacts(config({
      productIds: ['z-tool', 'a-tool'],
      catalog: catalog([zProduct, alphaProduct]),
    })).map(({ filename }) => filename)).toEqual(['a-tool.sources', 'z-tool.sources'])
  })
})
