import { copyFile, cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { generateApi } from './generate-api'
import type { SupportedLocale } from '../src/i18n/locales'
import { getSiteCopyForBuild, siteLocales } from '../src/site/locales'
import { renderWorkbenchPage } from '../src/site/pages/workbench'
import { renderDocument } from '../src/site/render'
import { sitePath } from '../src/site/routes'
import { renderRobots, renderSitemap } from '../src/site/seo'

export interface BuildSiteOptions {
  outputDir: string
  baseUrl: string
}

export interface BuildManifest {
  basePath: string
  locales: SupportedLocale[]
  pages: string[]
  assets: string[]
  apiRoot: string
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const languageBlockStart = '<!-- debgen-static-languages:start -->'
const languageBlockEnd = '<!-- debgen-static-languages:end -->'

const withTrailingSlash = (value: string): string => value.endsWith('/') ? value : `${value}/`

const resolveBasePath = (baseUrl: string): string => {
  const parsed = new URL(baseUrl)
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error('Static site base URL must be a credential-free HTTP(S) URL.')
  }
  if (parsed.search || parsed.hash) {
    throw new Error('Static site base URL must not contain a query or fragment.')
  }

  return withTrailingSlash(parsed.pathname)
}

const deploymentPath = (basePath: string, path: string): string => (
  `${basePath}${path.replace(/^\/+/, '')}`
)

const applyDeploymentBasePath = (html: string, basePath: string): string => {
  if (basePath === '/') return html

  return html.replace(/(\b(?:action|href|src)=")\/(?!\/)/gu, `$1${basePath}`)
}

const renderLanguageNavigation = (basePath: string): string => {
  const links = siteLocales.map(locale => (
    `<li><a href="${deploymentPath(basePath, sitePath(locale))}" hreflang="${locale}" lang="${locale}">${locale}</a></li>`
  )).join('')

  return `<nav aria-label="Language"><p>Choose a language</p><ul>${links}</ul></nav>`
}

const renderLanguageFallback = (basePath: string): string => {
  return `${languageBlockStart}<noscript data-static-languages>${renderLanguageNavigation(basePath)}</noscript>${languageBlockEnd}`
}

const addLanguageNavigation = (html: string, basePath: string): string => {
  const block = renderLanguageFallback(basePath)
  const existingBlock = new RegExp(`${languageBlockStart}[\\s\\S]*?${languageBlockEnd}`, 'u')
  if (existingBlock.test(html)) return html.replace(existingBlock, block)
  if (html.includes('</body>')) return html.replace('</body>', `${block}\n</body>`)

  return `${html}\n${block}\n`
}

const renderRootEntry = (basePath: string): string => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DebGen</title>
<link rel="stylesheet" href="${deploymentPath(basePath, 'assets/site.css')}">
</head>
<body>
<main><h1>DebGen</h1><p>Select the Workbench language.</p></main>
${renderLanguageNavigation(basePath)}
</body>
</html>`

const readExistingRootEntry = async (outputDir: string): Promise<string | null> => {
  try {
    return await readFile(join(outputDir, 'index.html'), 'utf8')
  } catch (error: unknown) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined
    if (code === 'ENOENT') return null
    throw error
  }
}

const writeVersionedApi = async (outputDir: string): Promise<void> => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'debgen-site-api-'))
  const generatedApiRoot = join(temporaryRoot, 'v1')
  const destination = join(outputDir, 'api', 'v1')

  try {
    await generateApi(generatedApiRoot)
    await rm(destination, { force: true, recursive: true })
    await mkdir(dirname(destination), { recursive: true })
    await cp(generatedApiRoot, destination, { recursive: true })
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true })
  }
}

export async function buildSite({ outputDir, baseUrl }: BuildSiteOptions): Promise<BuildManifest> {
  const resolvedOutputDir = resolve(outputDir)
  const basePath = resolveBasePath(baseUrl)
  const locales = [...siteLocales]
  const pages = locales.map(locale => `${locale}/index.html`)
  const assets = ['assets/site.css', 'favicon.ico']

  await mkdir(join(resolvedOutputDir, 'assets'), { recursive: true })
  await copyFile(
    join(projectRoot, 'src', 'site', 'styles', 'workbench.css'),
    join(resolvedOutputDir, 'assets', 'site.css'),
  )
  await copyFile(join(projectRoot, 'public', 'favicon.ico'), join(resolvedOutputDir, 'favicon.ico'))

  await Promise.all(locales.map(async (locale) => {
    const localeDirectory = join(resolvedOutputDir, locale)
    const page = renderWorkbenchPage({ locale, copy: getSiteCopyForBuild(locale) })
    const html = applyDeploymentBasePath(renderDocument(page), basePath)
    await rm(localeDirectory, { force: true, recursive: true })
    await mkdir(localeDirectory, { recursive: true })
    await writeFile(join(localeDirectory, 'index.html'), html, 'utf8')
  }))

  const existingRootEntry = await readExistingRootEntry(resolvedOutputDir)
  await writeFile(
    join(resolvedOutputDir, 'index.html'),
    existingRootEntry?.includes('id="app"')
      ? addLanguageNavigation(existingRootEntry, basePath)
      : renderRootEntry(basePath),
    'utf8',
  )
  await writeFile(
    join(resolvedOutputDir, 'sitemap.xml'),
    renderSitemap(locales.map(locale => ({ path: sitePath(locale) }))),
    'utf8',
  )
  await writeFile(join(resolvedOutputDir, 'robots.txt'), renderRobots(), 'utf8')
  await writeVersionedApi(resolvedOutputDir)

  const manifest: BuildManifest = {
    basePath,
    locales,
    pages,
    assets,
    apiRoot: 'api/v1/',
  }
  await writeFile(
    join(resolvedOutputDir, 'build-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  )

  return manifest
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const basePath = process.env.VITE_BASE_PATH ?? '/'
  buildSite({
    outputDir: resolve('dist'),
    baseUrl: new URL(basePath, 'https://debgen.org/').href,
  }).catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
}
