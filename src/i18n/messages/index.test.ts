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

const EXPECTED_MESSAGE_KEYS = [
  'counts.files.few',
  'counts.files.many',
  'counts.files.one',
  'counts.files.other',
  'counts.files.two',
  'counts.files.zero',
  'counts.products.few',
  'counts.products.many',
  'counts.products.one',
  'counts.products.other',
  'counts.products.two',
  'counts.products.zero',
  'counts.sources.few',
  'counts.sources.many',
  'counts.sources.one',
  'counts.sources.other',
  'counts.sources.two',
  'counts.sources.zero',
  'locale.label',
  'locale.names.de',
  'locale.names.en',
  'locale.names.es',
  'locale.names.fr',
  'locale.names.it',
  'locale.names.ja',
  'locale.names.pl',
  'locale.names.pt',
  'locale.names.ru',
  'locale.names.zh-CN',
  'meta.title',
] as const

describe('locale message bundles', () => {
  it.each(Object.entries(messages))('%s has the complete exact application message schema', (_locale, bundle) => {
    expect(leafKeys(bundle).sort()).toEqual(EXPECTED_MESSAGE_KEYS)
  })

  it.each(Object.entries(messages))('%s contains no Unicode en dash or em dash', (_locale, bundle) => {
    expect(leafStrings(bundle).filter((message) => /[\u2013\u2014]/u.test(message))).toEqual([])
  })
})
