import type { DebianRelease, SourceOptions } from './model'
import { RELEASES, getRelease, validateReleaseCatalog } from './releases'
import {
  generateDeb822,
  generateLegacyList,
  generateSources,
  getOutputFilename,
} from './generate'

const trixieDeb822 = `Types: deb
URIs: https://deb.debian.org/debian
Suites: trixie trixie-updates
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp

Types: deb
URIs: https://security.debian.org/debian-security
Suites: trixie-security
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp
`

const bookwormBackportsDeb822 = `Types: deb
URIs: https://deb.debian.org/debian
Suites: bookworm bookworm-backports
Components: main non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp
`

const forkyDeb822 = `Types: deb
URIs: https://deb.debian.org/debian
Suites: forky
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp
`

const sidDeb822 = `Types: deb
URIs: https://deb.debian.org/debian
Suites: sid
Components: main
Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp
`

const bookwormLegacy = `deb [signed-by=/usr/share/keyrings/debian-archive-keyring.pgp] https://deb.debian.org/debian bookworm main contrib non-free non-free-firmware
deb-src [signed-by=/usr/share/keyrings/debian-archive-keyring.pgp] https://deb.debian.org/debian bookworm main contrib non-free non-free-firmware
deb [signed-by=/usr/share/keyrings/debian-archive-keyring.pgp] https://security.debian.org/debian-security bookworm-security main contrib non-free non-free-firmware
deb-src [signed-by=/usr/share/keyrings/debian-archive-keyring.pgp] https://security.debian.org/debian-security bookworm-security main contrib non-free non-free-firmware
deb [signed-by=/usr/share/keyrings/debian-archive-keyring.pgp] https://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware
deb-src [signed-by=/usr/share/keyrings/debian-archive-keyring.pgp] https://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware
`

const bullseyeLegacy = `deb [signed-by=/usr/share/keyrings/debian-archive-keyring.pgp] https://deb.debian.org/debian bullseye main contrib non-free
deb [signed-by=/usr/share/keyrings/debian-archive-keyring.pgp] https://security.debian.org/debian-security bullseye-security main contrib non-free
deb [signed-by=/usr/share/keyrings/debian-archive-keyring.pgp] https://deb.debian.org/debian bullseye-updates main contrib non-free
`

function options(overrides: Partial<SourceOptions> = {}): SourceOptions {
  return {
    release: 'trixie',
    format: 'deb822',
    includeSource: false,
    includeSecurity: false,
    includeUpdates: false,
    includeBackports: false,
    components: ['main'],
    ...overrides,
  }
}

function catalogWith(mutator: (catalog: DebianRelease[]) => void): DebianRelease[] {
  const catalog = structuredClone(RELEASES) as DebianRelease[]
  mutator(catalog)
  return catalog
}

describe('Debian release catalog', () => {
  it('provides Trixie as the default release with immutable current releases', () => {
    expect(RELEASES.map((release) => release.codename)).toEqual([
      'trixie',
      'bookworm',
      'bullseye',
      'forky',
      'sid',
    ])
    expect(getRelease('trixie').codename).toBe('trixie')
    expect(getRelease(undefined).codename).toBe('trixie')
    expect(Object.isFrozen(RELEASES)).toBe(true)
  })

  it.each([
    ['duplicate codenames', catalogWith((catalog) => { catalog[1].codename = 'trixie' as DebianRelease['codename'] }), /duplicate codename/i],
    ['malformed HTTPS repository URIs', catalogWith((catalog) => { catalog[0].baseUri = 'deb.debian.org/debian' }), /HTTPS/i],
    ['invalid suite names', catalogWith((catalog) => { catalog[0].suites.base = 'Trixie' }), /suite/i],
    ['missing keyrings', catalogWith((catalog) => { catalog[0].keyring = '' }), /keyring/i],
    ['recommended unavailable components', catalogWith((catalog) => { catalog[0].recommendedComponents = ['main', 'example'] as DebianRelease['recommendedComponents'] }), /recommended component/i],
    ['security suite without its capability', catalogWith((catalog) => { catalog[0].capabilities.security = false }), /security capability/i],
    ['backports capability without a suite', catalogWith((catalog) => { catalog[0].suites.backports = undefined }), /backports capability/i],
  ])('rejects catalog entries with %s', (_reason, catalog, message) => {
    expect(() => validateReleaseCatalog(catalog)).toThrow(message)
  })
})

describe('DEB822 generation', () => {
  it('generates Trixie base, updates, and security stanzas with ordered components', () => {
    expect(generateDeb822(options({
      includeSecurity: true,
      includeUpdates: true,
      components: ['non-free-firmware', 'non-free', 'contrib'],
    }))).toBe(trixieDeb822)
  })

  it('generates Bookworm backports when selected', () => {
    expect(generateDeb822(options({
      release: 'bookworm',
      includeBackports: true,
      components: ['non-free-firmware'],
    }))).toBe(bookwormBackportsDeb822)
  })

  it('emits deb and deb-src when source indexes are selected', () => {
    expect(generateDeb822(options({ includeSource: true }))).toBe(`Types: deb deb-src
URIs: https://deb.debian.org/debian
Suites: trixie
Components: main
Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp
`)
  })

  it.each([
    ['forky', forkyDeb822],
    ['sid', sidDeb822],
  ] as const)('generates %s base-only output for valid options', (release, expected) => {
    expect(generateDeb822(options({ release, components: release === 'forky' ? ['contrib', 'non-free', 'non-free-firmware'] : [] }))).toBe(expected)
  })
})

describe('strict source option validation', () => {
  it.each([
    ['Bullseye firmware', options({ release: 'bullseye', components: ['non-free-firmware'] }), /non-free-firmware/i],
    ['Bullseye backports', options({ release: 'bullseye', includeBackports: true }), /backports/i],
    ['Forky security', options({ release: 'forky', includeSecurity: true }), /security/i],
    ['Forky updates', options({ release: 'forky', includeUpdates: true }), /updates/i],
    ['Forky backports', options({ release: 'forky', includeBackports: true }), /backports/i],
    ['Sid security', options({ release: 'sid', includeSecurity: true }), /security/i],
    ['Sid updates', options({ release: 'sid', includeUpdates: true }), /updates/i],
    ['Sid backports', options({ release: 'sid', includeBackports: true }), /backports/i],
    ['empty release', options({ release: '' as SourceOptions['release'] }), /release/i],
    ['unknown release', options({ release: 'potato' as SourceOptions['release'] }), /unknown release/i],
    ['unknown component', options({ components: ['example'] }), /component/i],
  ])('rejects %s', (_reason, input, message) => {
    expect(() => generateSources(input)).toThrow(message)
  })

  it('rejects formats unsupported by a release', () => {
    expect(() => generateSources(options({ format: 'legacy' }))).toThrow(/legacy.*trixie/i)
    expect(() => generateSources(options({ release: 'forky', format: 'legacy' }))).toThrow(/legacy.*forky/i)
    expect(() => generateSources(options({ release: 'sid', format: 'legacy' }))).toThrow(/legacy.*sid/i)
  })
})

describe('legacy list generation', () => {
  it('generates Bookworm lines with source packages and HTTPS keyring isolation', () => {
    expect(generateLegacyList(options({
      release: 'bookworm',
      format: 'legacy',
      includeSource: true,
      includeSecurity: true,
      includeUpdates: true,
      components: ['contrib', 'non-free', 'non-free-firmware'],
    }))).toBe(bookwormLegacy)
  })

  it('generates Bullseye legacy lines without unsupported components or backports', () => {
    expect(generateLegacyList(options({
      release: 'bullseye',
      format: 'legacy',
      includeSecurity: true,
      includeUpdates: true,
      components: ['contrib', 'non-free'],
    }))).toBe(bullseyeLegacy)
  })
})

describe('format selection', () => {
  it('dispatches to the selected format and reports the corresponding filename', () => {
    expect(generateSources(options())).toBe(`Types: deb
URIs: https://deb.debian.org/debian
Suites: trixie
Components: main
Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp
`)
    expect(getOutputFilename('deb822')).toBe('debian.sources')
    expect(getOutputFilename('legacy')).toBe('debian.list')
  })
})
