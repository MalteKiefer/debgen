import { access, mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateSources, getOutputFilename } from '../src/features/sources/generate'
import type { ReleaseCodename, SourceFormat } from '../src/features/sources/model'
import { RELEASES } from '../src/features/sources/releases'
import { VENDOR_PRODUCTS } from '../src/features/vendors/catalog'
import { getVendorCompatibility } from '../src/features/vendors/compatibility'
import { generateInstallScript, generateVendorArtifacts } from '../src/features/vendors/generate'
import type { LegacyVendorProduct, SystemArchitecture } from '../src/features/vendors/model'
import { validateVendorCatalog } from '../src/features/vendors/validate'

interface ManifestFile {
  format: SourceFormat
  filename: ReturnType<typeof getOutputFilename>
  url: string
}

interface ManifestRelease {
  codename: string
  status: string
  formats: SourceFormat[]
  files: ManifestFile[]
}

interface VendorResource {
  release: ReleaseCodename
  architecture: SystemArchitecture
  source: { url: string }
  install: { url: string }
}

interface VendorManifestEntry {
  id: string
  name: string
  category: LegacyVendorProduct['category']
  documentationUrl: string
  verifiedAt: string
  compatibility: VendorResource[]
}

interface ApiCatalog {
  debian: { url: string }
  vendors: { url: string }
}

const API_ARCHITECTURES: readonly SystemArchitecture[] = ['amd64', 'arm64', 'armhf', 'i386']
const API_MANIFEST_BASE = 'https://debgen.invalid/api/v1/'
const SAFE_MANIFEST_RELATIVE_URL = /^[a-z0-9]+(?:[a-z0-9.-]*[a-z0-9])?(?:\/[a-z0-9]+(?:[a-z0-9.-]*[a-z0-9])?)*$/

function withSingleTrailingNewline(content: string): string {
  return `${content.replace(/\n+$/, '')}\n`
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, 'en')
}

function canonicalSource(release: typeof RELEASES[number], format: SourceFormat): string {
  return generateSources({
    release: release.codename,
    format,
    includeSource: false,
    includeSecurity: release.capabilities.security,
    includeUpdates: release.capabilities.updates,
    includeBackports: false,
    components: release.recommendedComponents,
  })
}

function artifactRelativeUrl(product: LegacyVendorProduct, release: ReleaseCodename, architecture: SystemArchitecture, filename: string): string {
  return `vendors/${product.id}/${release}/${architecture}/${filename}`
}

export function resolveManifestUrl(relativeUrl: string, manifestUrl: string): URL {
  if (!SAFE_MANIFEST_RELATIVE_URL.test(relativeUrl)) {
    throw new Error('Manifest URL must be a safe lowercase ASCII relative path: ' + relativeUrl + '.')
  }
  const base = new URL(manifestUrl)
  const manifestDirectory = new URL('.', base)
  const resolved = new URL(relativeUrl, base)
  const expectedPathname = manifestDirectory.pathname + relativeUrl
  if (resolved.origin !== base.origin
    || resolved.pathname !== expectedPathname
    || resolved.search !== ''
    || resolved.hash !== '') {
    throw new Error('Manifest URL must resolve directly beneath its manifest directory: ' + relativeUrl + '.')
  }
  return resolved
}

async function writeArtifact(outputRoot: string, relativeUrl: string, content: string): Promise<void> {
  const destination = resolve(outputRoot, relativeUrl)
  const pathWithinApiRoot = relative(outputRoot, destination)
  if (isAbsolute(pathWithinApiRoot) || pathWithinApiRoot.startsWith('..')) {
    throw new Error('Generated API path escapes the output root: ' + relativeUrl + '.')
  }
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, withSingleTrailingNewline(content), 'utf8')
}

async function writeVendorResources(outputRoot: string): Promise<VendorManifestEntry[]> {
  validateVendorCatalog(VENDOR_PRODUCTS)
  const entries: VendorManifestEntry[] = []
  const releases = [...RELEASES].map((release) => release.codename).sort(compareText)

  for (const product of [...VENDOR_PRODUCTS].sort((left, right) => compareText(left.id, right.id))) {
    const compatibility: VendorResource[] = []
    for (const release of releases) {
      for (const architecture of [...API_ARCHITECTURES].sort(compareText)) {
        if (!getVendorCompatibility(product, release, architecture).compatible) continue

        const config = { release, architecture, productIds: [product.id] } as const
        const artifacts = generateVendorArtifacts(config)
        const source = artifacts.find((artifact) => artifact.filename === product.filename)
        if (!source) throw new Error('Vendor source artifact is missing for ' + product.id + '.')

        const sourceUrl = artifactRelativeUrl(product, release, architecture, source.filename)
        const installUrl = artifactRelativeUrl(product, release, architecture, 'install.sh')
        await writeArtifact(outputRoot, sourceUrl, source.content)
        await writeArtifact(outputRoot, installUrl, generateInstallScript(config, artifacts).content)
        compatibility.push({
          release,
          architecture,
          source: { url: sourceUrl },
          install: { url: installUrl },
        })
      }
    }
    entries.push({
      id: product.id,
      name: product.name,
      category: product.category,
      documentationUrl: product.documentationUrl,
      verifiedAt: product.verifiedAt,
      compatibility,
    })
  }
  return entries
}

async function assertManifestUrlsExist(outputRoot: string, manifestUrl: string, urls: readonly string[]): Promise<void> {
  await Promise.all(urls.map(async (url) => {
    resolveManifestUrl(url, manifestUrl)
    await access(resolve(outputRoot, url))
  }))
}

async function writeApi(outputRoot: string): Promise<void> {
  await mkdir(outputRoot, { recursive: true })

  const manifest: ManifestRelease[] = []
  for (const release of [...RELEASES].sort((left, right) => compareText(left.codename, right.codename))) {
    const files: ManifestFile[] = []
    const releaseDirectory = resolve(outputRoot, release.codename)
    await mkdir(releaseDirectory, { recursive: true })

    for (const format of [...release.formats].sort(compareText)) {
      const filename = getOutputFilename(format)
      const relativeUrl = `${release.codename}/${filename}`
      await writeFile(resolve(releaseDirectory, filename), withSingleTrailingNewline(canonicalSource(release, format)), 'utf8')
      files.push({ format, filename, url: relativeUrl })
    }

    manifest.push({
      codename: release.codename,
      status: release.status,
      formats: [...release.formats].sort(compareText),
      files,
    })
  }

  await writeFile(resolve(outputRoot, 'releases.json'), withSingleTrailingNewline(JSON.stringify(manifest, null, 2)), 'utf8')
  const vendors = await writeVendorResources(outputRoot)
  const catalog: ApiCatalog = {
    debian: { url: 'releases.json' },
    vendors: { url: 'vendors.json' },
  }
  await writeFile(resolve(outputRoot, 'vendors.json'), withSingleTrailingNewline(JSON.stringify(vendors, null, 2)), 'utf8')
  await writeFile(resolve(outputRoot, 'catalog.json'), withSingleTrailingNewline(JSON.stringify(catalog, null, 2)), 'utf8')
  await assertManifestUrlsExist(outputRoot, new URL('catalog.json', API_MANIFEST_BASE).href, [
    catalog.debian.url,
    catalog.vendors.url,
  ])
  await assertManifestUrlsExist(outputRoot, new URL('releases.json', API_MANIFEST_BASE).href, [
    ...manifest.flatMap((release) => release.files.map((file) => file.url)),
  ])
  await assertManifestUrlsExist(outputRoot, new URL('vendors.json', API_MANIFEST_BASE).href, [
    ...vendors.flatMap((vendor) => vendor.compatibility.flatMap((resource) => [resource.source.url, resource.install.url])),
  ])
}

export async function generateApi(outputRoot: string): Promise<void> {
  const resolvedOutputRoot = resolve(outputRoot)
  const outputParent = dirname(resolvedOutputRoot)
  const outputName = basename(resolvedOutputRoot)
  await mkdir(outputParent, { recursive: true })
  const stagingRoot = await mkdtemp(join(outputParent, `.${outputName}.staging-`))
  const backupRoot = join(outputParent, `.${outputName}.backup-${process.pid}`)
  let movedExistingOutput = false

  try {
    await writeApi(stagingRoot)
    await rm(backupRoot, { force: true, recursive: true })
    try {
      await rename(resolvedOutputRoot, backupRoot)
      movedExistingOutput = true
    } catch (error: unknown) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined
      if (code !== 'ENOENT') throw error
    }
    try {
      await rename(stagingRoot, resolvedOutputRoot)
    } catch (error) {
      if (movedExistingOutput) await rename(backupRoot, resolvedOutputRoot)
      throw error
    }
    if (movedExistingOutput) await rm(backupRoot, { force: true, recursive: true })
  } catch (error) {
    await rm(stagingRoot, { force: true, recursive: true })
    throw error
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateApi(resolve('public/api/v1')).catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
}
