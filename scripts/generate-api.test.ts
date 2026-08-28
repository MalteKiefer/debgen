import { access, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { generateApi } from './generate-api'

const outputRoots: string[] = []

afterEach(async () => {
  await Promise.all(outputRoots.splice(0).map((outputRoot) => rm(outputRoot, { force: true, recursive: true })))
})

const trixieSources = `Types: deb
URIs: https://deb.debian.org/debian
Suites: trixie trixie-updates
Components: main non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp

Types: deb
URIs: https://security.debian.org/debian-security
Suites: trixie-security
Components: main non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp
`

const bookwormSources = `Types: deb
URIs: https://deb.debian.org/debian
Suites: bookworm bookworm-updates
Components: main non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

Types: deb
URIs: https://security.debian.org/debian-security
Suites: bookworm-security
Components: main non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg
`

const bullseyeSources = `Types: deb
URIs: https://deb.debian.org/debian
Suites: bullseye bullseye-updates
Components: main
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

Types: deb
URIs: https://security.debian.org/debian-security
Suites: bullseye-security
Components: main
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg
`

const forkySources = `Types: deb
URIs: https://deb.debian.org/debian
Suites: forky
Components: main non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp
`

const sidSources = `Types: deb
URIs: https://deb.debian.org/debian
Suites: sid
Components: main non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp
`

const bookwormList = `deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://deb.debian.org/debian bookworm main non-free-firmware
deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://security.debian.org/debian-security bookworm-security main non-free-firmware
deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://deb.debian.org/debian bookworm-updates main non-free-firmware
`

const bullseyeList = `deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://deb.debian.org/debian bullseye main
deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://security.debian.org/debian-security bullseye-security main
deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] https://deb.debian.org/debian bullseye-updates main
`

const expectedFiles = {
  'bookworm/debian.list': bookwormList,
  'bookworm/debian.sources': bookwormSources,
  'bullseye/debian.list': bullseyeList,
  'bullseye/debian.sources': bullseyeSources,
  'forky/debian.sources': forkySources,
  'sid/debian.sources': sidSources,
  'trixie/debian.sources': trixieSources,
} as const

const expectedProfileFiles = {
  bookworm: ['debian.list', 'debian.sources'],
  bullseye: ['debian.list', 'debian.sources'],
  forky: ['debian.sources'],
  sid: ['debian.sources'],
  trixie: ['debian.sources'],
} as const

describe('versioned static API generation', () => {
  it('writes the exact canonical profiles and manifest', async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), 'debgen-api-'))
    outputRoots.push(outputRoot)

    await generateApi(outputRoot)

    const generatedProfileFiles = Object.fromEntries(await Promise.all(Object.keys(expectedProfileFiles).map(async (codename) => [
      codename,
      (await readdir(join(outputRoot, codename))).sort(),
    ])))
    const manifestText = await readFile(join(outputRoot, 'releases.json'), 'utf8')
    const manifest = JSON.parse(manifestText) as Array<{
      codename: string
      status: string
      formats: string[]
      files: Array<{ format: string, filename: string, url: string }>
    }>
    const fileMap = Object.fromEntries(await Promise.all(Object.keys(expectedFiles).map(async (relativePath) => [
      relativePath,
      await readFile(join(outputRoot, relativePath), 'utf8'),
    ])))

    expect((await readdir(outputRoot)).sort()).toEqual([
      'bookworm',
      'bullseye',
      'catalog.json',
      'forky',
      'releases.json',
      'sid',
      'trixie',
      'vendors',
      'vendors.json',
    ])
    expect(generatedProfileFiles).toEqual(expectedProfileFiles)
    expect(manifestText).toMatch(/[^\n]\n$/)
    expect(manifest).toEqual([
      {
        codename: 'bookworm',
        status: 'oldstable / LTS',
        formats: ['deb822', 'legacy'],
        files: [
          { format: 'deb822', filename: 'debian.sources', url: 'bookworm/debian.sources' },
          { format: 'legacy', filename: 'debian.list', url: 'bookworm/debian.list' },
        ],
      },
      {
        codename: 'bullseye',
        status: 'oldoldstable / LTS',
        formats: ['deb822', 'legacy'],
        files: [
          { format: 'deb822', filename: 'debian.sources', url: 'bullseye/debian.sources' },
          { format: 'legacy', filename: 'debian.list', url: 'bullseye/debian.list' },
        ],
      },
      {
        codename: 'forky',
        status: 'testing',
        formats: ['deb822'],
        files: [
          { format: 'deb822', filename: 'debian.sources', url: 'forky/debian.sources' },
        ],
      },
      {
        codename: 'sid',
        status: 'unstable',
        formats: ['deb822'],
        files: [
          { format: 'deb822', filename: 'debian.sources', url: 'sid/debian.sources' },
        ],
      },
      {
        codename: 'trixie',
        status: 'stable',
        formats: ['deb822'],
        files: [
          { format: 'deb822', filename: 'debian.sources', url: 'trixie/debian.sources' },
        ],
      },
    ])
    const manifestUrl = 'https://maltekiefer.github.io/debgen/api/v1/releases.json'
    expect(manifest.flatMap((release) => release.files.map((file) => new URL(file.url, manifestUrl).href))).toEqual([
      'https://maltekiefer.github.io/debgen/api/v1/bookworm/debian.sources',
      'https://maltekiefer.github.io/debgen/api/v1/bookworm/debian.list',
      'https://maltekiefer.github.io/debgen/api/v1/bullseye/debian.sources',
      'https://maltekiefer.github.io/debgen/api/v1/bullseye/debian.list',
      'https://maltekiefer.github.io/debgen/api/v1/forky/debian.sources',
      'https://maltekiefer.github.io/debgen/api/v1/sid/debian.sources',
      'https://maltekiefer.github.io/debgen/api/v1/trixie/debian.sources',
    ])
    expect(fileMap).toEqual(expectedFiles)
    const bullseyeProfiles = Object.entries(fileMap)
      .filter(([relativePath]) => relativePath.startsWith('bullseye/'))
      .map(([, content]) => content)
      .join('\n')
    expect(bullseyeProfiles).not.toContain('non-free-firmware')
    expect(bullseyeProfiles).not.toContain('bullseye-backports')
    expect(Object.values(fileMap).join('\n')).not.toMatch(/-backports/)
    expect({ manifest, fileMap }).toMatchSnapshot()
  })

  it('publishes deterministic compatible vendor resources with resolvable manifest URLs', async () => {
    const firstOutputRoot = await mkdtemp(join(tmpdir(), 'debgen-api-'))
    const secondOutputRoot = await mkdtemp(join(tmpdir(), 'debgen-api-'))
    outputRoots.push(firstOutputRoot, secondOutputRoot)

    await generateApi(firstOutputRoot)
    await generateApi(secondOutputRoot)

    const [catalogText, releasesText, vendorsText] = await Promise.all([
      readFile(join(firstOutputRoot, 'catalog.json'), 'utf8'),
      readFile(join(firstOutputRoot, 'releases.json'), 'utf8'),
      readFile(join(firstOutputRoot, 'vendors.json'), 'utf8'),
    ])
    const catalog = JSON.parse(catalogText) as {
      debian: { url: string }
      vendors: { url: string }
    }
    const releases = JSON.parse(releasesText) as Array<{ files: Array<{ url: string }> }>
    const vendors = JSON.parse(vendorsText) as Array<{
      id: string
      documentationUrl: string
      verifiedAt: string
      compatibility: Array<{
        release: string
        architecture: string
        source: { url: string }
        install: { url: string }
      }>
    }>
    const manifestUrls = [
      catalog.debian.url,
      catalog.vendors.url,
      ...releases.flatMap((release) => release.files.map((file) => file.url)),
      ...vendors.flatMap((vendor) => vendor.compatibility.flatMap((combination) => [
        combination.source.url,
        combination.install.url,
      ])),
    ]

    expect(catalog).toEqual({
      debian: { url: 'releases.json' },
      vendors: { url: 'vendors.json' },
    })
    expect(vendors.map((vendor) => vendor.id)).toEqual([...vendors.map((vendor) => vendor.id)].sort())
    expect(vendors.find((vendor) => vendor.id === 'brave-browser')).toMatchObject({
      documentationUrl: 'https://brave.com/linux/',
      verifiedAt: '2026-08-28',
      compatibility: expect.arrayContaining([
        {
          release: 'trixie',
          architecture: 'amd64',
          source: { url: 'vendors/brave-browser/trixie/amd64/brave-browser.sources' },
          install: { url: 'vendors/brave-browser/trixie/amd64/install.sh' },
        },
      ]),
    })
    expect(vendors.find((vendor) => vendor.id === 'mozilla-firefox')).toMatchObject({
      compatibility: expect.arrayContaining([
        {
          release: 'bookworm',
          architecture: 'arm64',
          source: { url: 'vendors/mozilla-firefox/bookworm/arm64/mozilla-firefox.sources' },
          install: { url: 'vendors/mozilla-firefox/bookworm/arm64/install.sh' },
        },
      ]),
    })
    expect(vendors.find((vendor) => vendor.id === 'mullvad-vpn')).toMatchObject({
      compatibility: expect.arrayContaining([
        {
          release: 'sid',
          architecture: 'amd64',
          source: { url: 'vendors/mullvad-vpn/sid/amd64/mullvad-vpn.sources' },
          install: { url: 'vendors/mullvad-vpn/sid/amd64/install.sh' },
        },
      ]),
    })
    expect(vendors.find((vendor) => vendor.id === 'mozilla-firefox')?.compatibility)
      .not.toContainEqual(expect.objectContaining({ release: 'sid' }))
    expect(vendors.find((vendor) => vendor.id === 'mullvad-vpn')?.compatibility)
      .not.toContainEqual(expect.objectContaining({ release: 'bullseye' }))
    await expect(access(join(firstOutputRoot, 'vendors', 'mozilla-firefox', 'sid', 'amd64', 'mozilla-firefox.sources'))).rejects.toThrow()
    await expect(access(join(firstOutputRoot, 'vendors', 'mullvad-vpn', 'bullseye', 'amd64', 'mullvad-vpn.sources'))).rejects.toThrow()
    await Promise.all(manifestUrls.map((relativeUrl) => access(join(firstOutputRoot, relativeUrl))))
    await expect(readFile(join(firstOutputRoot, 'vendors', 'brave-browser', 'trixie', 'amd64', 'brave-browser.sources'), 'utf8')).resolves.toBe(`Types: deb
URIs: https://brave-browser-apt-release.s3.brave.com/
Suites: stable
Architectures: amd64
Components: main
Signed-By: /usr/share/keyrings/brave-browser-archive-keyring.gpg
`)
    await expect(readFile(join(firstOutputRoot, 'vendors', 'mozilla-firefox', 'bookworm', 'arm64', 'mozilla-firefox.sources'), 'utf8')).resolves.toBe(`Types: deb
URIs: https://packages.mozilla.org/apt
Suites: mozilla
Architectures: arm64
Components: main
Signed-By: /etc/apt/keyrings/packages.mozilla.org.asc
`)
    await expect(readFile(join(firstOutputRoot, 'vendors', 'mullvad-vpn', 'sid', 'amd64', 'mullvad-vpn.sources'), 'utf8')).resolves.toBe(`Types: deb
URIs: https://repository.mullvad.net/deb/stable
Suites: stable
Architectures: amd64
Components: main
Signed-By: /usr/share/keyrings/mullvad-keyring.asc
`)
    expect({
      catalog,
      representativeVendorEndpoints: vendors
        .filter((vendor) => ['brave-browser', 'mozilla-firefox', 'mullvad-vpn'].includes(vendor.id))
        .map((vendor) => ({ id: vendor.id, compatibility: vendor.compatibility })),
    }).toMatchSnapshot()
    await expect(readFile(join(secondOutputRoot, 'catalog.json'), 'utf8')).resolves.toBe(catalogText)
    await expect(readFile(join(secondOutputRoot, 'vendors.json'), 'utf8')).resolves.toBe(vendorsText)
  })
})
