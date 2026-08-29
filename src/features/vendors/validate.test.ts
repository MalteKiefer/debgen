import { describe, expect, it } from 'vitest'
import type { RepositorySource, VendorProduct } from './model'
import { validateRepositoryCatalog } from './validate'

const product = (overrides: Partial<VendorProduct> = {}): VendorProduct => ({
  id: 'example',
  sourceId: 'example-source',
  name: 'Example',
  category: 'developer-workstation',
  icon: 'mdi-code-tags',
  packages: ['example'],
  supportedArchitectures: ['amd64'],
  supportedReleases: ['bookworm'],
  supportLevel: 'explicit',
  provenance: 'manufacturer',
  securityCritical: false,
  warningKeys: [],
  ...overrides,
})

const source = (overrides: Partial<RepositorySource> = {}): RepositorySource => ({
  id: 'example-source',
  name: 'Example source',
  documentationUrl: 'https://vendor.example/docs',
  verifiedAt: '2026-08-29',
  locations: [{
    uri: 'https://vendor.example/debian',
    releases: ['bookworm'],
    architectures: ['amd64'],
    suite: 'bookworm',
    components: ['main'],
    supportLevel: 'explicit',
  }],
  keys: [{
    id: 'example-key',
    url: 'https://vendor.example/key.asc',
    keyringPath: '/etc/apt/keyrings/example.asc',
    format: 'ascii-armored',
    fingerprints: ['A1B2C3D4E5F60123456789ABCDEF0123456789AB'],
    releases: ['bookworm'],
  }],
  auxiliaryTrustFiles: [],
  preferenceFiles: [],
  warnings: [],
  ...overrides,
})

describe('validateRepositoryCatalog', () => {
  it('accepts a valid minimal product', () => {
    expect(() => validateRepositoryCatalog([source()], [product()])).not.toThrow()
  })

  it.each([
    ['uppercase letters', 'Example'],
    ['a fragment marker', 'example#fragment'],
    ['a query marker', 'example?query'],
    ['percent encoding', 'example%2fescape'],
    ['a backslash', 'example\\escape'],
    ['a path separator', 'example/escape'],
    ['a leading separator', '/example'],
  ])('rejects an ID containing %s', (_reason, id) => {
    expect(() => validateRepositoryCatalog([source()], [product({ id })]))
      .toThrow(/id.*safe.*slug/i)
  })

  it.each([
    ['duplicate product IDs', [product(), product({ name: 'Other' })], /example.*duplicate id/i],
    ['duplicate source IDs', [source(), source({ name: 'Other source' })], /source.*duplicate id/i],
  ])('rejects %s', (_name, entries, message) => {
    const isSource = entries[0] && 'locations' in entries[0]
    expect(() => validateRepositoryCatalog(isSource ? entries as RepositorySource[] : [source()], isSource ? [product()] : entries as VendorProduct[])).toThrow(message)
  })

  it('rejects non-HTTPS URLs', () => {
    expect(() => validateRepositoryCatalog([source({ locations: [{ ...source().locations[0], uri: 'http://vendor.example/debian' }] })], [product()]))
      .toThrow(/source.*location.*https/i)
    expect(() => validateRepositoryCatalog([source({ keys: [{ ...source().keys[0], url: 'https://' }] })], [product()]))
      .toThrow(/source.*key.*https/i)
  })

  it.each([
    ['a line feed in a location URL', { locations: [{ ...source().locations[0], uri: 'https://vendor.example/debian\ntrusted' }] }],
    ['a carriage return in a key URL', { keys: [{ ...source().keys[0], url: 'https://vendor.example/key.asc\rtrusted' }] }],
  ])('rejects %s before URL normalization', (_description, overrides) => {
    expect(() => validateRepositoryCatalog([source(overrides)], [product()]))
      .toThrow(/source.*https/i)
  })

  it('rejects missing metadata', () => {
    expect(() => validateRepositoryCatalog([source({ documentationUrl: '' })], [product()])).toThrow(/source.*documentation/i)
  })

  it('rejects an unknown Material-Design-Icon', () => {
    expect(() => validateRepositoryCatalog([source()], [product({ icon: 'mdi-nicht-vorhanden' as VendorProduct['icon'] })]))
      .toThrow(/example.*icon/i)
  })

  it('rejects unknown releases', () => {
    expect(() => validateRepositoryCatalog([source()], [product({ supportedReleases: ['jessie'] as never })]))
      .toThrow(/example.*release/i)
  })

  it('rejects unsafe keyring paths', () => {
    expect(() => validateRepositoryCatalog([source({ keys: [{ ...source().keys[0], keyringPath: '/tmp/example.gpg' }] })], [product()]))
      .toThrow(/source.*keyring/i)
    expect(() => validateRepositoryCatalog([source({ keys: [{ ...source().keys[0], keyringPath: '/etc/apt/keyrings/example;touch.gpg' }] })], [product()]))
      .toThrow(/source.*keyring/i)
    expect(() => validateRepositoryCatalog([source({ keys: [{ ...source().keys[0], keyringPath: '/etc/apt/keyrings/example$(touch).gpg' }] })], [product()]))
      .toThrow(/source.*keyring/i)
    expect(() => validateRepositoryCatalog([source({ keys: [{ ...source().keys[0], keyringPath: '/etc/apt/keyrings/example\ntrusted.gpg' }] })], [product()]))
      .toThrow(/source.*keyring/i)
    expect(() => validateRepositoryCatalog([source({ keys: [{ ...source().keys[0], keyringPath: '/etc/apt/keyrings/../trusted.gpg' }] })], [product()]))
      .toThrow(/source.*keyring/i)
  })

  it('rejects empty compatibility sets', () => {
    expect(() => validateRepositoryCatalog([source()], [product({ supportedReleases: [] })])).toThrow(/example.*release/i)
    expect(() => validateRepositoryCatalog([source()], [product({ supportedArchitectures: [] })])).toThrow(/example.*architect/i)
  })

  it('rejects an unknown source reference and a source without a product', () => {
    expect(() => validateRepositoryCatalog([source()], [product({ sourceId: 'unknown-source' })]))
      .toThrow(/unknown.*source/i)
    expect(() => validateRepositoryCatalog([source()], []))
      .toThrow(/source.*product/i)
  })

  it('rejects conflicting key definitions and duplicate packages', () => {
    expect(() => validateRepositoryCatalog([source({ keys: [
      source().keys[0],
      { ...source().keys[0], id: 'other-key', url: 'https://vendor.example/other-key.asc' },
    ] })], [product()])).toThrow(/source.*conflicting.*keyring/i)
    expect(() => validateRepositoryCatalog([source()], [product({ packages: ['example', 'example'] })]))
      .toThrow(/example.*duplicate.*package/i)
  })

  it.each([
    ['a leading short option', '-o'],
    ['a leading long option', '--reinstall'],
    ['a shell delimiter', 'example;touch'],
    ['a command substitution', 'example$(id)'],
    ['a shell quote', "example's"],
    ['a line feed', 'example\nInjected: yes'],
    ['a carriage return', 'example\rInjected: yes'],
  ])('rejects a Debian package name containing %s', (_description, packageName) => {
    expect(() => validateRepositoryCatalog([source()], [product({ packages: [packageName] })]))
      .toThrow(/example.*package.*safe/i)
  })

  it('accepts the closed Debian package-name grammar', () => {
    expect(() => validateRepositoryCatalog([source()], [product({
      packages: ['libc6', 'g++', 'python3.13', 'linux-image-amd64'],
    })])).not.toThrow()
  })

  it.each([
    ['field injection', 'bookworm\nComponents: main'],
    ['a carriage return', 'bookworm\rSigned-By: /tmp/attacker.gpg'],
    ['whitespace', 'bookworm main'],
    ['a shell delimiter', 'bookworm;touch'],
    ['path traversal', '../bookworm'],
    ['an empty path segment', 'bookworm//updates'],
  ])('rejects an unsafe repository suite containing %s', (_description, suite) => {
    const location = { ...source().locations[0], suite }

    expect(() => validateRepositoryCatalog([source({ locations: [location] })], [product()]))
      .toThrow(/source.*suite.*safe/i)
  })

  it.each([
    ['field injection', 'main\nSigned-By: /tmp/attacker.gpg'],
    ['a carriage return', 'main\rEnabled: no'],
    ['whitespace', 'main contrib'],
    ['a shell delimiter', 'main;touch'],
    ['path traversal', '../main'],
    ['an empty path segment', 'stable//v18'],
  ])('rejects an unsafe repository component containing %s', (_description, component) => {
    const location = { ...source().locations[0], components: [component] }

    expect(() => validateRepositoryCatalog([source({ locations: [location] })], [product()]))
      .toThrow(/source.*component.*safe/i)
  })

  it.each([
    '../',
    'apt//stable/',
    'apt/stable;touch/',
    'apt/stable\nTrusted: yes/',
  ])('rejects an unsafe exact-path repository suite: %s', (suite) => {
    const location = { ...source().locations[0], suite, components: [] }

    expect(() => validateRepositoryCatalog([source({ locations: [location] })], [product()]))
      .toThrow(/source.*suite.*safe/i)
  })

  it.each(['/', './', 'apt/stable/', 'binary/'])('accepts the safe exact-path suite %s', (suite) => {
    const location = { ...source().locations[0], suite, components: [] }

    expect(() => validateRepositoryCatalog([source({ locations: [location] })], [product()]))
      .not.toThrow()
  })

  it.each([
    ['bookworm', 'main'],
    ['./generic', 'main'],
    ['bookworm/mongodb-org/8.0', 'stable/v18'],
  ])('accepts safe suite %s and component %s tokens', (suite, component) => {
    const location = { ...source().locations[0], suite, components: [component] }

    expect(() => validateRepositoryCatalog([source({ locations: [location] })], [product()]))
      .not.toThrow()
  })

  it.each([
    ['a short fingerprint', ['A1B2C3D4']],
    ['a non-hexadecimal fingerprint', ['G'.repeat(40)]],
    ['duplicate normalized fingerprints', [
      'A1B2 C3D4 E5F6 0123 4567 89AB CDEF 0123 4567 89AB',
      'a1b2c3d4e5f60123456789abcdef0123456789ab',
    ]],
  ])('rejects %s in a repository key allowlist', (_description, fingerprints) => {
    expect(() => validateRepositoryCatalog([source({ keys: [{ ...source().keys[0], fingerprints }] })], [product()]))
      .toThrow(/source.*key fingerprint/i)
  })

  it.each([
    ['a spaced lowercase 40-character fingerprint', 'a1b2 c3d4 e5f6 0123 4567 89ab cdef 0123 4567 89ab'],
    ['a 64-character OpenPGP v5 fingerprint', '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'],
  ])('accepts %s in a repository key allowlist', (_description, fingerprint) => {
    expect(() => validateRepositoryCatalog([source({ keys: [{ ...source().keys[0], fingerprints: [fingerprint] }] })], [product()]))
      .not.toThrow()
  })

  it('rejects null source IDs, retired Debian-native provenance, and community security products', () => {
    expect(() => validateRepositoryCatalog([], [product({ sourceId: null as unknown as VendorProduct['sourceId'] })]))
      .toThrow(/example.*source id/i)
    expect(() => validateRepositoryCatalog([source()], [product({ provenance: 'debian-native' as VendorProduct['provenance'] })]))
      .toThrow(/example.*provenance/i)
    expect(() => validateRepositoryCatalog([source()], [product({ provenance: 'community-endorsed', securityCritical: true })]))
      .toThrow(/example.*community.*security/i)
  })

  it('accepts only the closed researched category taxonomy', () => {
    expect(() => validateRepositoryCatalog([source()], [product({ category: 'web-servers' })])).not.toThrow()
    expect(() => validateRepositoryCatalog([source()], [product({ category: 'development' as VendorProduct['category'] })]))
      .toThrow(/example.*category/i)
  })
})
