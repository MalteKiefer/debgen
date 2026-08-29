import { access, mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateSources, getOutputFilename } from '../src/features/sources/generate'
import type { ReleaseCodename, SourceFormat } from '../src/features/sources/model'
import { resolveManifestUrl } from '../src/features/sources/public-url'
import { RELEASES } from '../src/features/sources/releases'
import { VENDOR_PRODUCTS } from '../src/features/vendors/catalog'
import { getVendorCompatibility } from '../src/features/vendors/compatibility'
import { generateInstallScript, generateRepositoryArtifacts, generateVendorArtifacts } from '../src/features/vendors/generate'
import type { RepositorySource, SystemArchitecture, VendorProduct } from '../src/features/vendors/model'
import { categoryMessageKey } from '../src/features/vendors/presentation'
import { getRepositorySource, REPOSITORY_SOURCES } from '../src/features/vendors/sources'

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

interface VendorResourceCoordinates {
  release: ReleaseCodename
  architecture: SystemArchitecture
}

interface RepositoryVendorResource extends VendorResourceCoordinates {
  source: { url: string }
  install: { url: string }
}

type VendorResource = RepositoryVendorResource

interface VendorManifestEntry {
  id: string
  name: string
  category: VendorProduct['category']
  sourceId: string
  packages: string[]
  documentationUrl: string
  verifiedAt: string
  presentationKeys: {
    category: string
    provenance: string
    warnings: string[]
  }
  compatibility: VendorResource[]
}

interface SourceManifestResource extends VendorResourceCoordinates {
  productIds: string[]
  source: { url: string }
  preferences: Array<{ filename: string, url: string }>
  install: { url: string }
}

interface SourceManifestEntry {
  id: string
  name: string
  documentationUrl: string
  verifiedAt: RepositorySource['verifiedAt']
  productIds: string[]
  warnings: string[]
  locations: RepositorySource['locations']
  keys: RepositorySource['keys']
  auxiliaryTrustFiles: RepositorySource['auxiliaryTrustFiles']
  preferenceFiles: RepositorySource['preferenceFiles']
  compatibility: SourceManifestResource[]
}

interface ApiCatalog {
  debian: { url: string }
  sources: { url: string }
  vendors: { url: string }
}

const API_ARCHITECTURES: readonly SystemArchitecture[] = ['amd64', 'arm64', 'armhf', 'i386']
const API_MANIFEST_BASE = 'https://debgen.invalid/api/v1/'
const VENDOR_MANIFEST_VERIFIED_AT = '2026-08-29'

export { resolveManifestUrl }

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

function artifactRelativeUrl(product: VendorProduct, release: ReleaseCodename, architecture: SystemArchitecture, filename: string): string {
  return `vendors/${product.id}/${release}/${architecture}/${filename}`
}

function sourceRelativeDirectory(sourceId: string, release: ReleaseCodename, architecture: SystemArchitecture): string {
  return `sources/${sourceId}/${release}/${architecture}`
}

function provenanceMessageKey(provenance: VendorProduct['provenance']): string {
  return `vendor.origins.${provenance === 'community-endorsed' ? 'communityEndorsed' : provenance}`
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

async function writeSourceResources(outputRoot: string): Promise<SourceManifestEntry[]> {
  const entries: SourceManifestEntry[] = []
  const releases = [...RELEASES].map((release) => release.codename).sort(compareText)
  const architectures = [...API_ARCHITECTURES].sort(compareText)

  for (const repositorySource of [...REPOSITORY_SOURCES].sort((left, right) => compareText(left.id, right.id))) {
    const products = VENDOR_PRODUCTS
      .filter((product) => product.sourceId === repositorySource.id)
      .sort((left, right) => compareText(left.id, right.id))
    const compatibility: SourceManifestResource[] = []

    for (const release of releases) {
      for (const architecture of architectures) {
        const compatibleProducts = products.filter((product) => (
          getVendorCompatibility(product, release, architecture).compatible
        ))
        if (compatibleProducts.length === 0) continue

        const productIds = compatibleProducts.map((product) => product.id)
        const config = { release, architecture, productIds } as const
        const artifacts = generateRepositoryArtifacts(config)
        const sourceArtifact = artifacts.find((artifact) => artifact.filename === `${repositorySource.id}.sources`)
        if (!sourceArtifact) throw new Error('Canonical source artifact is missing for ' + repositorySource.id + '.')
        if (artifacts.some((artifact) => artifact.sourceId !== repositorySource.id)) {
          throw new Error('Canonical source artifacts contain an unexpected source for ' + repositorySource.id + '.')
        }

        const directory = sourceRelativeDirectory(repositorySource.id, release, architecture)
        await Promise.all(artifacts.map((artifact) => (
          writeArtifact(outputRoot, `${directory}/${artifact.filename}`, artifact.content)
        )))
        await writeArtifact(
          outputRoot,
          `${directory}/install.sh`,
          generateInstallScript(config, artifacts, { includePackageInstallation: false }).content,
        )
        compatibility.push({
          release,
          architecture,
          productIds,
          source: { url: `${directory}/${sourceArtifact.filename}` },
          preferences: artifacts
            .filter((artifact) => artifact.filename.endsWith('.pref'))
            .map((artifact) => ({ filename: artifact.filename, url: `${directory}/${artifact.filename}` })),
          install: { url: `${directory}/install.sh` },
        })
      }
    }

    entries.push({
      id: repositorySource.id,
      name: repositorySource.name,
      documentationUrl: repositorySource.documentationUrl,
      verifiedAt: repositorySource.verifiedAt,
      productIds: products.map((product) => product.id),
      warnings: [...repositorySource.warnings],
      locations: repositorySource.locations,
      keys: repositorySource.keys,
      auxiliaryTrustFiles: repositorySource.auxiliaryTrustFiles,
      preferenceFiles: repositorySource.preferenceFiles,
      compatibility,
    })
  }

  return entries
}

async function writeVendorResources(outputRoot: string): Promise<VendorManifestEntry[]> {
  const entries: VendorManifestEntry[] = []
  const releases = [...RELEASES].map((release) => release.codename).sort(compareText)

  for (const product of [...VENDOR_PRODUCTS].sort((left, right) => compareText(left.id, right.id))) {
    const repository = getRepositorySource(product.sourceId)
    if (!repository) throw new Error('Repository source is missing for ' + product.id + '.')
    const compatibility: VendorResource[] = []
    for (const release of releases) {
      for (const architecture of [...API_ARCHITECTURES].sort(compareText)) {
        if (!getVendorCompatibility(product, release, architecture).compatible) continue

        const config = { release, architecture, productIds: [product.id] } as const
        const artifacts = generateVendorArtifacts(config)
        const source = artifacts.find((artifact) => artifact.filename === `${product.id}.sources`)
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
      sourceId: product.sourceId,
      packages: [...product.packages],
      documentationUrl: repository.documentationUrl,
      verifiedAt: VENDOR_MANIFEST_VERIFIED_AT,
      presentationKeys: {
        category: categoryMessageKey(product.category),
        provenance: provenanceMessageKey(product.provenance),
        warnings: [...new Set([...repository.warnings, ...product.warningKeys])]
          .map((warning) => `warnings.${warning}`),
      },
      compatibility,
    })
  }
  return entries
}

function collectManifestUrls(value: unknown, urls: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectManifestUrls(item, urls)
    return urls
  }
  if (typeof value !== 'object' || value === null) return urls
  for (const [key, item] of Object.entries(value)) {
    if (key === 'url') {
      if (typeof item !== 'string') throw new Error('Manifest URL must be a string.')
      urls.push(item)
    } else {
      collectManifestUrls(item, urls)
    }
  }
  return urls
}

export async function assertManifestUrlsExist(
  outputRoot: string,
  manifestUrl: string,
  manifest: unknown,
): Promise<void> {
  await Promise.all(collectManifestUrls(manifest).map(async (url) => {
    if (url.startsWith('https://')) {
      const externalUrl = new URL(url)
      if (externalUrl.protocol !== 'https:' || externalUrl.username !== '' || externalUrl.password !== '') {
        throw new Error('External manifest URL must be a credential-free HTTPS URL: ' + url + '.')
      }
      return
    }
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
  const sources = await writeSourceResources(outputRoot)
  const vendors = await writeVendorResources(outputRoot)
  const catalog: ApiCatalog = {
    debian: { url: 'releases.json' },
    sources: { url: 'sources.json' },
    vendors: { url: 'vendors.json' },
  }
  await writeFile(resolve(outputRoot, 'sources.json'), withSingleTrailingNewline(JSON.stringify(sources, null, 2)), 'utf8')
  await writeFile(resolve(outputRoot, 'vendors.json'), withSingleTrailingNewline(JSON.stringify(vendors, null, 2)), 'utf8')
  await writeFile(resolve(outputRoot, 'catalog.json'), withSingleTrailingNewline(JSON.stringify(catalog, null, 2)), 'utf8')
  await Promise.all([
    assertManifestUrlsExist(outputRoot, new URL('catalog.json', API_MANIFEST_BASE).href, catalog),
    assertManifestUrlsExist(outputRoot, new URL('releases.json', API_MANIFEST_BASE).href, manifest),
    assertManifestUrlsExist(outputRoot, new URL('sources.json', API_MANIFEST_BASE).href, sources),
    assertManifestUrlsExist(outputRoot, new URL('vendors.json', API_MANIFEST_BASE).href, vendors),
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
