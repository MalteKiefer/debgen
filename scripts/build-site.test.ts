import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { buildSite } from './build-site'

const temporaryDirectories: string[] = []

const createTemporaryOutput = async (): Promise<string> => {
  const outputDir = await mkdtemp(join(tmpdir(), 'debgen-site-'))
  temporaryDirectories.push(outputDir)
  return outputDir
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => (
    rm(directory, { force: true, recursive: true })
  )))
})

describe('static site build', () => {
  it('builds useful localized HTML and preserves the versioned API', async () => {
    const outputDir = await createTemporaryOutput()

    const manifest = await buildSite({ outputDir, baseUrl: 'https://debgen.org/' })

    expect(await readFile(join(outputDir, 'en', 'index.html'), 'utf8')).toContain('<h1>')
    expect(await readFile(join(outputDir, 'de', 'index.html'), 'utf8')).toContain('System')
    expect(JSON.parse(await readFile(join(outputDir, 'api', 'v1', 'releases.json'), 'utf8'))).not.toHaveLength(0)
    expect(await readFile(join(outputDir, 'sitemap.xml'), 'utf8')).toContain('<loc>https://debgen.org/en/</loc>')
    expect(await readFile(join(outputDir, 'robots.txt'), 'utf8')).toBe(
      'User-agent: *\nAllow: /\nSitemap: https://debgen.org/sitemap.xml\n',
    )
    const rootHtml = await readFile(join(outputDir, 'index.html'), 'utf8')
    expect(rootHtml).toContain('<nav aria-label="Language">')
    expect(rootHtml).not.toContain('<noscript data-static-languages>')
    expect(manifest.locales).toHaveLength(10)

    await buildSite({ outputDir, baseUrl: 'https://debgen.org/' })
    expect(await readFile(join(outputDir, 'index.html'), 'utf8')).toBe(rootHtml)
  }, 60_000)

  it('keeps the Vite application entry while making repository-relative static links', async () => {
    const outputDir = await createTemporaryOutput()
    await mkdir(join(outputDir, 'assets'), { recursive: true })
    await writeFile(
      join(outputDir, 'index.html'),
      '<!doctype html><html><body><div id="app"></div><script type="module" src="/debgen/assets/app.js"></script></body></html>',
      'utf8',
    )
    await writeFile(join(outputDir, 'assets', 'app.js'), 'globalThis.__debgen = true\n', 'utf8')

    const manifest = await buildSite({
      outputDir,
      baseUrl: 'https://maltekiefer.github.io/debgen/',
    })

    const rootHtml = await readFile(join(outputDir, 'index.html'), 'utf8')
    const englishHtml = await readFile(join(outputDir, 'en', 'index.html'), 'utf8')
    expect(rootHtml).toContain('<div id="app"></div>')
    expect(rootHtml).toContain('href="/debgen/en/"')
    expect(await readFile(join(outputDir, 'assets', 'app.js'), 'utf8')).toContain('__debgen')
    expect(englishHtml).toContain('href="/debgen/assets/site.css"')
    expect(englishHtml).toContain('href="/debgen/api/v1/catalog.json"')
    expect(englishHtml).toContain('<link rel="canonical" href="https://debgen.org/en/">')
    expect(manifest.basePath).toBe('/debgen/')

    const repeatedManifest = await buildSite({
      outputDir,
      baseUrl: 'https://maltekiefer.github.io/debgen/',
    })
    expect(await readFile(join(outputDir, 'index.html'), 'utf8')).toBe(rootHtml)
    expect(await readFile(join(outputDir, 'en', 'index.html'), 'utf8')).toBe(englishHtml)
    expect(repeatedManifest).toEqual(manifest)
  }, 60_000)
})
