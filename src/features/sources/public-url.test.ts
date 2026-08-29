import { describe, expect, it, vi } from 'vitest'
import {
  buildPublicArtifactCommands,
  loadCanonicalArtifactUrls,
  resolveManifestUrl,
} from './public-url'

describe('manifest-relative public URLs', () => {
  it.each([
    [
      'https://maltekiefer.github.io/debgen/api/v1/releases.json',
      'trixie/debian.sources',
      'https://maltekiefer.github.io/debgen/api/v1/trixie/debian.sources',
    ],
    [
      'https://pages.example/forks/alice/debgen/api/v1/sources.json',
      'sources/mullvad/trixie/amd64/mullvad.sources',
      'https://pages.example/forks/alice/debgen/api/v1/sources/mullvad/trixie/amd64/mullvad.sources',
    ],
  ])('resolves %s beneath its own manifest directory', (manifestUrl, relativeUrl, expected) => {
    expect(resolveManifestUrl(relativeUrl, manifestUrl).href).toBe(expected)
  })

  it.each([
    '../secret',
    '/api/v1/trixie/debian.sources',
    'https://evil.example/file',
    'trixie/debian.sources?download=1',
    'trixie/DEBIAN.sources',
  ])('rejects unsafe manifest URL %s', (relativeUrl) => {
    expect(() => resolveManifestUrl(relativeUrl, 'https://example.invalid/fork/api/v1/releases.json'))
      .toThrow(/manifest url/i)
  })

  it('loads Debian and shared-source artifact URLs from their manifests under a fork base path', async () => {
    const fetcher = vi.fn(async (input: string | URL) => {
      const url = String(input)
      if (url.endsWith('/releases.json')) {
        return new Response(JSON.stringify([
          { codename: 'trixie', files: [{ format: 'deb822', filename: 'debian.sources', url: 'trixie/debian.sources' }] },
        ]))
      }
      return new Response(JSON.stringify([
        {
          id: 'mullvad',
          compatibility: [{
            release: 'trixie', architecture: 'amd64',
            source: { url: 'sources/mullvad/trixie/amd64/mullvad.sources' },
            preferences: [], install: { url: 'sources/mullvad/trixie/amd64/install.sh' },
          }],
        },
      ]))
    })

    await expect(loadCanonicalArtifactUrls({
      baseUrl: 'https://pages.example/forks/alice/debgen/',
      release: 'trixie',
      architecture: 'amd64',
      format: 'deb822',
      sourceIds: ['mullvad'],
      fetcher,
    })).resolves.toEqual({
      'debian.sources': 'https://pages.example/forks/alice/debgen/api/v1/trixie/debian.sources',
      'mullvad.sources': 'https://pages.example/forks/alice/debgen/api/v1/sources/mullvad/trixie/amd64/mullvad.sources',
    })
    expect(fetcher.mock.calls.map(([url]) => String(url))).toEqual([
      'https://pages.example/forks/alice/debgen/api/v1/releases.json',
      'https://pages.example/forks/alice/debgen/api/v1/sources.json',
    ])
  })
})

describe('safe public artifact commands', () => {
  it('downloads, inspects, and applies a source file without remote privileged piping', () => {
    const commands = buildPublicArtifactCommands(
      'https://pages.example/fork/api/v1/trixie/debian.sources',
      'debian.sources',
    )

    expect(commands).toEqual({
      download: "curl -fsSL 'https://pages.example/fork/api/v1/trixie/debian.sources' -o 'debian.sources'",
      inspect: "less -- 'debian.sources'",
      apply: "sudo install -m 0644 -- 'debian.sources' '/etc/apt/sources.list.d/debian.sources'",
    })
    expect(Object.values(commands).join('\n')).not.toMatch(/curl[^\n|]*\|\s*sudo/)
  })

  it('rejects unsafe destinations before producing shell commands', () => {
    expect(() => buildPublicArtifactCommands('https://example.invalid/file', '../file.sources'))
      .toThrow(/filename/i)
  })
})
