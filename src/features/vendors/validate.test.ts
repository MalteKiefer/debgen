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
    ['duplicate IDs', [product(), product({ name: 'Other', filename: 'other.sources' })], /example.*duplicate id/i],
    ['duplicate filenames', [product(), product({ id: 'other' })], /other.*filename/i],
    ['duplicate keyrings', [product(), product({ id: 'other', filename: 'other.sources' })], /other.*keyring/i],
  ])('rejects %s', (_name, entries, message) => {
    expect(() => validateVendorCatalog(entries)).toThrow(message)
  })

  it('rejects non-HTTPS URLs', () => {
    expect(() => validateVendorCatalog([product({ repositoryUrl: 'http://vendor.example/debian' })]))
      .toThrow(/example.*repository.*https/i)
  })

  it('rejects missing metadata', () => {
    expect(() => validateVendorCatalog([product({ documentationUrl: '' })])).toThrow(/example.*documentation/i)
  })

  it('rejects unknown releases', () => {
    expect(() => validateVendorCatalog([product({ releases: ['jessie' as VendorProduct['releases'][number]] })]))
      .toThrow(/example.*release/i)
  })

  it('rejects unsafe keyring paths', () => {
    expect(() => validateVendorCatalog([product({ keyringPath: '/tmp/example.gpg' })]))
      .toThrow(/example.*keyring/i)
  })

  it('rejects empty compatibility sets', () => {
    expect(() => validateVendorCatalog([product({ releases: [] })])).toThrow(/example.*release/i)
    expect(() => validateVendorCatalog([product({ architectures: [] })])).toThrow(/example.*architect/i)
  })
})
