import { describe, expect, it } from 'vitest'
import type {
  AuxiliaryTrustFile,
  PreferenceFileDefinition,
  RepositoryKey,
  RepositoryLocation,
  RepositorySource,
  VendorProduct,
} from './model'
import { auxiliaryTrustDestinationPath, validateRepositoryCatalog } from './validate'

const location = (overrides: Partial<RepositoryLocation> = {}): RepositoryLocation => ({
  uri: 'https://vendor.example/apt',
  releases: ['bookworm'],
  architectures: ['amd64'],
  suite: 'bookworm',
  components: ['main'],
  supportLevel: 'explicit',
  ...overrides,
})

const key = (overrides: Partial<RepositoryKey> = {}): RepositoryKey => ({
  id: 'vendor-archive',
  url: 'https://vendor.example/archive-key.asc',
  keyringPath: '/etc/apt/keyrings/vendor-archive.asc',
  format: 'ascii-armored',
  fingerprints: ['A1B2C3D4E5F60123456789ABCDEF0123456789AB'],
  releases: ['bookworm'],
  ...overrides,
})

const source = (overrides: Partial<RepositorySource> = {}): RepositorySource => ({
  id: 'vendor',
  name: 'Vendor',
  documentationUrl: 'https://vendor.example/docs',
  verifiedAt: '2026-08-29',
  locations: [location()],
  keys: [key()],
  auxiliaryTrustFiles: [],
  preferenceFiles: [],
  warnings: [],
  ...overrides,
})

const product = (overrides: Partial<VendorProduct> = {}): VendorProduct => ({
  id: 'vendor-product',
  sourceId: 'vendor',
  name: 'Vendor Product',
  category: 'developer-workstation',
  icon: 'mdi-code-tags',
  packages: ['vendor-product'],
  supportedReleases: ['bookworm'],
  supportedArchitectures: ['amd64'],
  supportLevel: 'explicit',
  provenance: 'manufacturer',
  securityCritical: false,
  warningKeys: [],
  ...overrides,
})

const authoritativeSourceId: string | null = product().sourceId
void authoritativeSourceId

describe('repository source model', () => {
  it('allows products to share a source with multiple release-scoped keys', () => {
    const shared = source({
      keys: [
        key(),
        key({
          id: 'vendor-next',
          url: 'https://vendor.example/next-key.gpg',
          keyringPath: '/etc/apt/keyrings/vendor-next.gpg',
          format: 'binary',
          fingerprints: [],
          releases: ['trixie'],
        }),
      ],
      locations: [
        location({ releases: ['bookworm'] }),
        location({ uri: 'https://vendor.example/next', releases: ['trixie'], suite: 'trixie' }),
      ],
    })

    expect(() => validateRepositoryCatalog([shared], [
      product(),
      product({ id: 'vendor-tools', packages: ['vendor-tools'] }),
    ])).not.toThrow()
  })

  it.each(['/', 'apt/stable/', 'binary/'])('allows componentless exact path suite %s', (suite) => {
    expect(() => validateRepositoryCatalog([
      source({ locations: [location({ suite, components: [] })] }),
    ], [product()])).not.toThrow()
  })

  it('rejects components on an exact path suite', () => {
    expect(() => validateRepositoryCatalog([
      source({ locations: [location({ suite: 'apt/stable/', components: ['main'] })] }),
    ], [product()])).toThrow(/source.*exact-path.*components/i)
  })

  it('derives allowlisted auxiliary trust destinations without accepting arbitrary paths', () => {
    const policy: AuxiliaryTrustFile = {
      id: 'onepassword-policy',
      url: 'https://downloads.1password.com/linux/debian/debsig/1password.pol',
      destination: 'debsig-policy',
      mediaType: 'application/xml',
    }
    const keyring: AuxiliaryTrustFile = {
      id: 'onepassword-keyring',
      url: 'https://downloads.1password.com/linux/keys/1password.asc',
      destination: 'debsig-keyring',
      mediaType: 'application/pgp-keys',
      fingerprint: '3FEF9748469ADBE15DA7CA80AC2D62742012EA22',
    }

    expect(auxiliaryTrustDestinationPath(policy)).toBe('/etc/debsig/policies/AC2D62742012EA22/1password.pol')
    expect(auxiliaryTrustDestinationPath(keyring)).toBe('/usr/share/debsig/keyrings/AC2D62742012EA22/debsig.gpg')
    expect(() => auxiliaryTrustDestinationPath({ ...policy, id: '../outside' as AuxiliaryTrustFile['id'] }))
      .toThrow(/auxiliary trust file.*safe.*id/i)
    expect(() => auxiliaryTrustDestinationPath({ ...policy, id: 'other-safe-id' }))
      .toThrow(/auxiliary trust file.*closed.*destination/i)
    expect(() => auxiliaryTrustDestinationPath({ ...policy, id: 'onepassword-keyring' }))
      .toThrow(/auxiliary trust file.*closed.*destination/i)
    expect(() => auxiliaryTrustDestinationPath({ ...policy, destination: 'unknown' as AuxiliaryTrustFile['destination'] }))
      .toThrow(/auxiliary trust destination/i)
    expect(() => validateRepositoryCatalog([
      source({ auxiliaryTrustFiles: [policy, keyring] }),
    ], [product()])).not.toThrow()
    expect(() => validateRepositoryCatalog([
      source({ auxiliaryTrustFiles: [{ ...policy, destination: 'tmp-path' as AuxiliaryTrustFile['destination'] }], }),
    ], [product()])).toThrow(/source.*auxiliary.*destination/i)
  })

  it('allows deterministic preference definitions', () => {
    const preference: PreferenceFileDefinition = {
      id: 'vendor-priority',
      content: 'Package: vendor-product\nPin: origin vendor.example\nPin-Priority: 1000\n',
    }

    expect(() => validateRepositoryCatalog([
      source({ preferenceFiles: [preference] }),
    ], [product()])).not.toThrow()
  })

  it('requires each selected compatibility combination to have a source location', () => {
    expect(() => validateRepositoryCatalog([
      source({ locations: [location({ releases: ['bookworm'], architectures: ['amd64'] })] }),
    ], [product({ supportedArchitectures: ['amd64', 'arm64'] })]))
      .toThrow(/vendor-product.*missing.*bookworm\/arm64/i)
  })
})
