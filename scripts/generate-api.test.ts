import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
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
      'forky',
      'releases.json',
      'sid',
      'trixie',
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
})
