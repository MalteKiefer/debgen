import { describe, expect, it } from 'vitest'
import type { PluralForms } from './format'
import { formatPlural, matchesSearch } from './format'

const forms: PluralForms = {
  zero: '{count}:zero',
  one: '{count}:one',
  two: '{count}:two',
  few: '{count}:few',
  many: '{count}:many',
  other: '{count}:other',
}

describe('plural formatting', () => {
  it.each([
    ['en', 1, '1:one'],
    ['en', 2, '2:other'],
    ['de', 1, '1:one'],
    ['de', 0, '0:other'],
    ['ru', 1, '1:one'],
    ['ru', 2, '2:few'],
    ['ru', 5, '5:many'],
    ['ru', 21, '21:one'],
    ['pl', 1, '1:one'],
    ['pl', 2, '2:few'],
    ['pl', 5, '5:many'],
    ['pl', 22, '22:few'],
  ] as const)('formats %s count %s with the locale plural category', (locale, count, expected) => {
    expect(formatPlural(locale, count, forms)).toBe(expected)
  })

  it('formats every count placeholder in the selected form', () => {
    expect(formatPlural('en', 3, { ...forms, other: '{count} of {count}' })).toBe('3 of 3')
  })
})

describe('locale-aware catalog search', () => {
  it('matches decomposed accents and accent-free human input across fields', () => {
    expect(matchesSearch(
      'uberwachung grafana',
      ['Überwachung', 'Grafana Enterprise'],
      [],
      'de',
    )).toBe(true)
    expect(matchesSearch('Cafe\u0301', ['Café'], [], 'fr')).toBe(true)
  })

  it('preserves case-sensitive technical tokens while normalizing human text', () => {
    expect(matchesSearch('docker-ce', [], ['docker-ce'], 'de')).toBe(true)
    expect(matchesSearch('DOCKER-CE', [], ['docker-ce'], 'de')).toBe(false)
    expect(matchesSearch('MULLVAD', ['Mullvad Browser'], [], 'de')).toBe(true)
  })
})
