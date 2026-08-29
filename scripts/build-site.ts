import { copyFile, cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { generateApi } from './generate-api'
import { VENDOR_PRODUCTS } from '../src/features/vendors/catalog'
import { RELEASES } from '../src/features/sources/releases'
import type { SupportedLocale } from '../src/i18n/locales'
import { getSiteCopyForBuild, siteLocales } from '../src/site/locales'
import { renderWorkbenchPage } from '../src/site/pages/workbench'
import { renderDocument } from '../src/site/render'
import { sitePath } from '../src/site/routes'
import { renderRobots, renderSitemap } from '../src/site/seo'
import { createDefaultState } from '../src/workbench/state'
import { toWorkbenchHydrationProduct, type WorkbenchHydrationPayload } from '../src/workbench/types'

export interface BuildSiteOptions {
  outputDir: string
  baseUrl: string
  renderer?: WorkbenchRenderer
}

export interface BuildManifest {
  basePath: string
  locales: SupportedLocale[]
  pages: string[]
  assets: string[]
  apiRoot: string
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const clientManifestPath = join('.vite', 'manifest.json')
const serverEntryPath = join('.ssr', 'server.js')

interface ViteManifestEntry {
  readonly file: string
  readonly css?: readonly string[]
  readonly assets?: readonly string[]
}

type ViteManifest = Record<string, ViteManifestEntry>

interface WorkbenchServerModule {
  readonly renderWorkbenchApp: WorkbenchRenderer
}

export type WorkbenchRenderer = (payload: WorkbenchHydrationPayload) => Promise<{
  readonly html: string
  readonly serializedState: string
}>

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

const applyDeploymentBasePath = (html: string, basePath: string): string => {
  if (basePath === '/') return html

  const baseWithoutSlash = basePath.slice(1)
  return html.replace(/(\b(?:action|href|src)=")\/(?!\/)([^"]*)/gu, (match, prefix: string, path: string) => (
    path.startsWith(baseWithoutSlash) ? match : `${prefix}${basePath}${path}`
  ))
}

const deploymentPath = (path: string, basePath: string): string => basePath === '/'
  ? path
  : `${basePath}${path.replace(/^\//u, '')}`

const readWorkbenchBuild = async (outputDir: string, renderer?: WorkbenchRenderer): Promise<{
  clientScript: string
  assets: string[]
  renderWorkbenchApp: WorkbenchServerModule['renderWorkbenchApp']
}> => {
  const manifestFile = join(outputDir, clientManifestPath)
  let manifest: ViteManifest
  try {
    manifest = JSON.parse(await readFile(manifestFile, 'utf8')) as ViteManifest
  } catch (error) {
    throw new Error(`Workbench client manifest is missing or invalid at ${manifestFile}. Build the client before the static site.`, { cause: error })
  }

  const entry = manifest['src/workbench/client.ts']
  if (!entry?.file) {
    throw new Error('Workbench client manifest entry "src/workbench/client.ts" is missing. Build the Workbench client before the static site.')
  }

  let renderWorkbenchApp = renderer
  if (!renderWorkbenchApp) {
    const serverFile = join(outputDir, serverEntryPath)
    let serverModule: WorkbenchServerModule
    try {
      serverModule = await import(pathToFileURL(serverFile).href) as WorkbenchServerModule
    } catch (error) {
      throw new Error(`Workbench SSR entry is missing or invalid at ${serverFile}. Build the SSR bundle before the static site.`, { cause: error })
    }
    if (typeof serverModule.renderWorkbenchApp !== 'function') {
      throw new Error(`Workbench SSR entry at ${serverFile} does not export renderWorkbenchApp.`)
    }
    renderWorkbenchApp = serverModule.renderWorkbenchApp
  }

  const assets = [...new Set(Object.values(manifest).flatMap(item => [
    item.file,
    ...(item.css ?? []),
    ...(item.assets ?? []),
  ]))].sort()

  return {
    clientScript: `/${entry.file}`,
    assets,
    renderWorkbenchApp,
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

export async function buildSite({ outputDir, baseUrl, renderer }: BuildSiteOptions): Promise<BuildManifest> {
  const resolvedOutputDir = await realpath(resolve(outputDir))
  const basePath = resolveBasePath(baseUrl)
  const siteOrigin = new URL(baseUrl).origin
  const locales = [...siteLocales]
  const pages = locales.map(locale => `${locale}/index.html`)
  const workbenchBuild = await readWorkbenchBuild(resolvedOutputDir, renderer)
  const assets = ['assets/site.css', 'favicon.ico', 'favicon.svg', 'apple-touch-icon.png', ...workbenchBuild.assets]

  await mkdir(join(resolvedOutputDir, 'assets'), { recursive: true })
  await copyFile(
    join(projectRoot, 'src', 'site', 'styles', 'workbench.css'),
    join(resolvedOutputDir, 'assets', 'site.css'),
  )
  await copyFile(join(projectRoot, 'public', 'favicon.ico'), join(resolvedOutputDir, 'favicon.ico'))
  await copyFile(join(projectRoot, 'public', 'favicon.svg'), join(resolvedOutputDir, 'favicon.svg'))
  await copyFile(join(projectRoot, 'public', 'apple-touch-icon.png'), join(resolvedOutputDir, 'apple-touch-icon.png'))

  const renderPage = async (locale: SupportedLocale, root = false): Promise<string> => {
    const path = root ? '/' : sitePath(locale)
    const payload: WorkbenchHydrationPayload = {
      locale,
      path: deploymentPath(path, basePath),
      basePath,
      siteOrigin,
      copy: getSiteCopyForBuild(locale),
      state: createDefaultState(),
      manifest: {
        releases: RELEASES,
        products: VENDOR_PRODUCTS.map(toWorkbenchHydrationProduct),
      },
    }
    const rendered = await workbenchBuild.renderWorkbenchApp(payload)
    return applyDeploymentBasePath(renderDocument(renderWorkbenchPage({
      locale,
      copy: payload.copy,
      workbenchHtml: rendered.html,
      serializedState: rendered.serializedState,
      clientScript: workbenchBuild.clientScript,
      activeStep: payload.state.activeStep,
      root,
    })), basePath)
  }

  try {
    await Promise.all(locales.map(async (locale) => {
      const localeDirectory = join(resolvedOutputDir, locale)
      const html = await renderPage(locale)
      await rm(localeDirectory, { force: true, recursive: true })
      await mkdir(localeDirectory, { recursive: true })
      await writeFile(join(localeDirectory, 'index.html'), html, 'utf8')
    }))

    await writeFile(join(resolvedOutputDir, 'index.html'), await renderPage('en', true), 'utf8')
    await writeFile(
      join(resolvedOutputDir, 'sitemap.xml'),
      renderSitemap(locales.map(locale => ({ path: sitePath(locale) }))),
      'utf8',
    )
    await writeFile(join(resolvedOutputDir, 'robots.txt'), renderRobots(), 'utf8')
    await writeVersionedApi(resolvedOutputDir)
  } finally {
    await rm(join(resolvedOutputDir, '.ssr'), { force: true, recursive: true })
  }

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
