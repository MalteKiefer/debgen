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
  it('publishes the Structured Workbench at the project root', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'debgen-root-'))
    temporaryDirectories.push(outputDir)
    await buildSite({ outputDir, baseUrl: 'https://debgen.org/' })
    const html = await readFile(join(outputDir, 'index.html'), 'utf8')
    expect(html).toContain('data-step="system"')
    expect(html).not.toContain('<div id="app"></div>')
    expect(html).not.toContain('/src/main.ts')
    expect(html).toContain('<link rel="canonical" href="https://debgen.org/">')
    expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://debgen.org/">')
    expect(html).toContain('"url":"https://debgen.org/"')
    expect(html).toContain('<nav aria-label="Language">')
    expect(html).not.toContain('aria-current="page"')
  }, 60_000)

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
    expect(rootHtml).toContain('data-step="system"')
    expect(rootHtml).not.toContain('<div id="app"></div>')
    expect(rootHtml).not.toContain('<script type="module"')
    expect(manifest.locales).toHaveLength(10)

    await buildSite({ outputDir, baseUrl: 'https://debgen.org/' })
    expect(await readFile(join(outputDir, 'index.html'), 'utf8')).toBe(rootHtml)
  }, 60_000)

  it('replaces the Vite application entry with a repository-relative static Workbench', async () => {
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
    expect(rootHtml).toContain('data-step="system"')
    expect(rootHtml).not.toContain('<div id="app"></div>')
    expect(rootHtml).not.toContain('<script type="module"')
    expect(rootHtml).toContain('href="/debgen/en/"')
    expect(rootHtml).not.toBe(englishHtml)
    expect(rootHtml).toContain('<link rel="canonical" href="https://debgen.org/">')
    expect(rootHtml).toContain('<link rel="alternate" hreflang="x-default" href="https://debgen.org/">')
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
