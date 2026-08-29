import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import vue from '@vitejs/plugin-vue'
import { build as viteBuild } from 'vite'
import { buildSite } from './build-site'
import { renderWorkbenchApp } from '../src/workbench/server'

const temporaryDirectories: string[] = []

const createTemporaryOutput = async (): Promise<string> => {
  const outputDir = await mkdtemp(join(tmpdir(), 'debgen-site-'))
  temporaryDirectories.push(outputDir)
  return outputDir
}

const prepareBundles = async (outputDir: string): Promise<void> => {
  await viteBuild({
    configFile: false,
    base: '/',
    plugins: [vue()],
    build: {
      outDir: outputDir,
      emptyOutDir: true,
      manifest: true,
      rollupOptions: { input: resolve('src/workbench/client.ts') },
    },
  })
  await viteBuild({
    configFile: false,
    plugins: [vue()],
    build: {
      outDir: join(outputDir, '.ssr'),
      emptyOutDir: true,
      ssr: resolve('src/workbench/server.ts'),
      rollupOptions: { output: { entryFileNames: 'server.js' } },
    },
  })
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => (
    rm(directory, { force: true, recursive: true })
  )))
})

describe('static site build', () => {
  it('publishes the Structured Workbench at the project root', async () => {
    const outputDir = await createTemporaryOutput()
    await prepareBundles(outputDir)
    await buildSite({ outputDir, baseUrl: 'https://debgen.org/', renderer: renderWorkbenchApp })
    const html = await readFile(join(outputDir, 'index.html'), 'utf8')
    expect(html).toContain('data-step="system"')
    expect(html.match(/data-step=/gu)).toHaveLength(4)
    expect(html).toContain('<div id="workbench" tabindex="-1"><div class="workbench-layout">')
    expect(html).toContain('<script id="workbench-state" type="application/json">')
    expect(html).toMatch(/<script type="module" src="\/assets\/client-[^"]+\.js" defer><\/script>/u)
    expect(html).not.toContain('data-enhanced')
    expect(html).not.toContain('<div id="app"></div>')
    expect(html).not.toContain('/src/main.ts')
    expect(html).not.toMatch(/mdi-|materialdesignicons|class="v-/iu)
    expect(html).toContain('<link rel="canonical" href="https://debgen.org/">')
    expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://debgen.org/">')
    expect(html).toContain('"url":"https://debgen.org/"')
    expect(html).toContain('<nav aria-label="Language">')
    expect(html).not.toContain('aria-current="page"')
  }, 60_000)

  it('builds useful localized HTML and preserves the versioned API', async () => {
    const outputDir = await createTemporaryOutput()
    await prepareBundles(outputDir)

    const manifest = await buildSite({ outputDir, baseUrl: 'https://debgen.org/', renderer: renderWorkbenchApp })

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
    expect(rootHtml).toContain('<script type="module"')
    await expect(access(join(outputDir, '.ssr'))).rejects.toThrow()
    expect(manifest.locales).toHaveLength(10)

    await prepareBundles(outputDir)
    await buildSite({ outputDir, baseUrl: 'https://debgen.org/', renderer: renderWorkbenchApp })
    expect(await readFile(join(outputDir, 'index.html'), 'utf8')).toBe(rootHtml)
  }, 60_000)

  it('replaces the Vite application entry with a repository-relative static Workbench', async () => {
    const outputDir = await createTemporaryOutput()
    await prepareBundles(outputDir)

    const manifest = await buildSite({
      outputDir,
      baseUrl: 'https://maltekiefer.github.io/debgen/',
      renderer: renderWorkbenchApp,
    })

    const rootHtml = await readFile(join(outputDir, 'index.html'), 'utf8')
    const englishHtml = await readFile(join(outputDir, 'en', 'index.html'), 'utf8')
    expect(rootHtml).toContain('data-step="system"')
    expect(rootHtml).not.toContain('<div id="app"></div>')
    expect(rootHtml).toMatch(/src="\/debgen\/assets\/client-[^"]+\.js"/u)
    expect(rootHtml).toContain('href="/debgen/en/"')
    expect(rootHtml).not.toBe(englishHtml)
    expect(rootHtml).toContain('<link rel="canonical" href="https://debgen.org/">')
    expect(rootHtml).toContain('<link rel="alternate" hreflang="x-default" href="https://debgen.org/">')
    expect(englishHtml).toContain('href="/debgen/assets/site.css"')
    expect(englishHtml).toContain('href="/debgen/api/v1/catalog.json"')
    expect(englishHtml).toContain('action="/debgen/en/"')
    expect(englishHtml).not.toContain('/debgen/debgen/')
    expect(englishHtml).toContain('<link rel="canonical" href="https://debgen.org/en/">')
    expect(manifest.basePath).toBe('/debgen/')

    await prepareBundles(outputDir)
    const repeatedManifest = await buildSite({
      outputDir,
      baseUrl: 'https://maltekiefer.github.io/debgen/',
      renderer: renderWorkbenchApp,
    })
    expect(await readFile(join(outputDir, 'index.html'), 'utf8')).toBe(rootHtml)
    expect(await readFile(join(outputDir, 'en', 'index.html'), 'utf8')).toBe(englishHtml)
    expect(repeatedManifest).toEqual(manifest)
  }, 60_000)
})
