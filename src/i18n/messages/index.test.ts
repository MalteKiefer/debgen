import { describe, expect, it } from 'vitest'
import { messages } from './index'

function leafKeys(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return [prefix]
  if (!value || typeof value !== 'object') return []

  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return leafKeys(child, path)
  })
}

function leafStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (!value || typeof value !== 'object') return []
  return Object.values(value).flatMap(leafStrings)
}

const canonicalMessageKeys = leafKeys(messages.en).sort()

describe('locale message bundles', () => {
  it.each(Object.entries(messages))('%s has the complete exact application message schema', (_locale, bundle) => {
    expect(canonicalMessageKeys).toHaveLength(225)
    expect(canonicalMessageKeys).toEqual(expect.arrayContaining([
      'compatibility.unsupportedRelease',
      'controls.availability.bookworm',
      'vendor.filters.compatibilityLabel',
      'vendorCard.reportIssueAria',
      'warnings.docker-firewall',
      'workspace.ariaLabel',
    ]))
    expect(leafKeys(bundle).sort()).toEqual(canonicalMessageKeys)
  })

  it.each(Object.entries(messages))('%s contains no Unicode en dash or em dash', (_locale, bundle) => {
    expect(leafStrings(bundle).filter((message) => /[\u2013\u2014]/u.test(message))).toEqual([])
  })
})
