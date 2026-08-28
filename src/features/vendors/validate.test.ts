import { describe, expect, it } from 'vitest'
import type { VendorProduct } from './model'
import { validateVendorCatalog } from './validate'

const product = (overrides: Partial<VendorProduct> = {}): VendorProduct => ({
  id: 'example',
  name: 'Example',
  category: 'development',
  filename: 'example.sources',
  documentationUrl: 'https://vendor.example/docs',
  repositoryUrl: 'https://vendor.example/debian',
  keyUrl: 'https://vendor.example/key.asc',
  keyringPath: '/etc/apt/keyrings/example.gpg',
  packages: ['example'],
  architectures: ['amd64'],
  releases: ['bookworm'],
  suite: 'bookworm',
  components: ['main'],
  verifiedAt: '2026-08-28',
  ...overrides,
})

describe('validateVendorCatalog', () => {
  it('accepts a valid minimal product', () => {
    expect(() => validateVendorCatalog([product()])).not.toThrow()
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
    expect(() => validateVendorCatalog([product({ id, filename: 'example.sources' })]))
      .toThrow(/id.*safe.*slug/i)
  })

  it('requires the source filename to be derived exactly from the product ID', () => {
    expect(() => validateVendorCatalog([product({ id: 'example-product', filename: 'example.sources' })]))
      .toThrow(/filename.*example-product\.sources/i)
  })

  it.each([
    ['duplicate IDs', [product(), product({ name: 'Other' })], /example.*duplicate id/i],
    ['duplicate keyrings', [product(), product({ id: 'other', filename: 'other.sources' })], /other.*keyring/i],
  ])('rejects %s', (_name, entries, message) => {
    expect(() => validateVendorCatalog(entries)).toThrow(message)
  })

  it('rejects non-HTTPS URLs', () => {
    expect(() => validateVendorCatalog([product({ repositoryUrl: 'http://vendor.example/debian' })]))
      .toThrow(/example.*repository.*https/i)
    expect(() => validateVendorCatalog([product({ repositoryUrl: 'https://' })]))
      .toThrow(/example.*repository.*https/i)
    expect(() => validateVendorCatalog([product({ repositoryUrl: 'https://%' })]))
      .toThrow(/example.*repository.*https/i)
  })

  it('accepts a closed architecture-specific repository URL mapping', () => {
    expect(() => validateVendorCatalog([product({
      architectures: ['amd64', 'arm64'],
      repositoryUrl: {
        amd64: 'https://vendor.example/debian/amd64',
        arm64: 'https://vendor.example/debian/arm64',
      } as VendorProduct['repositoryUrl'],
    })])).not.toThrow()
  })

  it.each([
    ['missing a supported architecture', { amd64: 'https://vendor.example/debian/amd64' }],
    ['including an unsupported architecture', { amd64: 'https://vendor.example/debian/amd64', arm64: 'https://vendor.example/debian/arm64', i386: 'https://vendor.example/debian/i386' }],
    ['using a non-HTTPS mapped URL', { amd64: 'http://vendor.example/debian/amd64', arm64: 'https://vendor.example/debian/arm64' }],
  ])('rejects a repository URL mapping %s', (_reason, repositoryUrl) => {
    expect(() => validateVendorCatalog([product({
      architectures: ['amd64', 'arm64'],
      repositoryUrl: repositoryUrl as VendorProduct['repositoryUrl'],
    })])).toThrow(/example.*repository.*architecture|example.*repository.*https/i)
  })

  it('rejects inherited repository URL mappings for required architectures', () => {
    const inheritedArm64 = { arm64: 'https://vendor.example/debian/arm64' }
    const repositoryUrl = Object.assign(Object.create(inheritedArm64), {
      amd64: 'https://vendor.example/debian/amd64',
    })

    expect(() => validateVendorCatalog([product({
      architectures: ['amd64', 'arm64'],
      repositoryUrl: repositoryUrl as VendorProduct['repositoryUrl'],
    })])).toThrow(/example.*repository.*arm64/i)
  })

  it('rejects missing metadata', () => {
    expect(() => validateVendorCatalog([product({ documentationUrl: '' })])).toThrow(/example.*documentation/i)
  })

  it('rejects an unknown Material-Design-Icon', () => {
    expect(() => validateVendorCatalog([product({ icon: 'mdi-nicht-vorhanden' as VendorProduct['icon'] })]))
      .toThrow(/example.*icon/i)
  })

  it('rejects unknown releases', () => {
    expect(() => validateVendorCatalog([product({ releases: ['jessie' as VendorProduct['releases'][number]] })]))
      .toThrow(/example.*release/i)
  })

  it('rejects unsafe keyring paths', () => {
    expect(() => validateVendorCatalog([product({ keyringPath: '/tmp/example.gpg' })]))
      .toThrow(/example.*keyring/i)
    expect(() => validateVendorCatalog([product({ keyringPath: '/etc/apt/keyrings/../trusted.gpg' })]))
      .toThrow(/example.*keyring/i)
  })

  it('rejects empty compatibility sets', () => {
    expect(() => validateVendorCatalog([product({ releases: [] })])).toThrow(/example.*release/i)
    expect(() => validateVendorCatalog([product({ architectures: [] })])).toThrow(/example.*architect/i)
  })

  it('requires a suite for every supported release in a suite mapping', () => {
    expect(() => validateVendorCatalog([product({ suite: {} })])).toThrow(/example.*suite/i)
    expect(() => validateVendorCatalog([product({ suite: { bookworm: 'bookworm', nebula: 'nebula' } as VendorProduct['suite'] })]))
      .toThrow(/example.*suite.*release|example.*unknown.*suite/i)
    expect(() => validateVendorCatalog([product({ releases: ['bookworm', 'trixie'], suite: { bookworm: 'bookworm' } })]))
      .toThrow(/example.*suite.*trixie/i)
  })

  it('requires empty components for exact-path suites', () => {
    expect(() => validateVendorCatalog([product({ suite: '/', components: [] })])).not.toThrow()
    expect(() => validateVendorCatalog([product({ suite: '/', components: ['main'] })]))
      .toThrow(/example.*exact.*component/i)
  })

  it('requires components for normal suites', () => {
    expect(() => validateVendorCatalog([product({ suite: 'stable', components: [] })]))
      .toThrow(/example.*component/i)
  })
})
