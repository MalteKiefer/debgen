import type { ReleaseCodename, SourceFormat } from './model'
import type { SystemArchitecture } from '../vendors/model'

const SAFE_MANIFEST_RELATIVE_URL = /^[a-z0-9]+(?:[a-z0-9.-]*[a-z0-9])?(?:\/[a-z0-9]+(?:[a-z0-9.-]*[a-z0-9])?)*$/
const SAFE_ARTIFACT_FILENAME = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.(?:list|pref|sh|sources)$/

interface JsonResponse {
  readonly ok: boolean
  json(): Promise<unknown>
}

export type ManifestFetcher = (input: string | URL) => Promise<JsonResponse>

interface ReleaseManifestEntry {
  readonly codename: string
  readonly files: readonly {
    readonly format: string
    readonly filename: string
    readonly url: string
  }[]
}

interface SourceManifestEntry {
  readonly id: string
  readonly compatibility: readonly {
    readonly release: string
    readonly architecture: string
    readonly source: { readonly url: string }
    readonly preferences: readonly { readonly filename: string, readonly url: string }[]
  }[]
}

export interface CanonicalArtifactRequest {
  readonly baseUrl: string | URL
  readonly release: ReleaseCodename
  readonly architecture: SystemArchitecture
  readonly format: SourceFormat
  readonly sourceIds: readonly string[]
  readonly fetcher?: ManifestFetcher
}

export interface PublicArtifactCommands {
  readonly download: string
  readonly inspect: string
  readonly apply: string
}

export function resolveManifestUrl(relativeUrl: string, manifestUrl: string | URL): URL {
  if (!SAFE_MANIFEST_RELATIVE_URL.test(relativeUrl)) {
    throw new Error(`Manifest URL must be a safe lowercase ASCII relative path: ${relativeUrl}.`)
  }

  const manifest = new URL(manifestUrl)
  const manifestDirectory = new URL('.', manifest)
  const resolved = new URL(relativeUrl, manifest)
  const expectedPathname = `${manifestDirectory.pathname}${relativeUrl}`
  if (resolved.origin !== manifest.origin
    || resolved.pathname !== expectedPathname
    || resolved.search !== ''
    || resolved.hash !== '') {
    throw new Error(`Manifest URL must resolve directly beneath its manifest directory: ${relativeUrl}.`)
  }
  return resolved
}

function manifestUrl(baseUrl: string | URL, filename: 'releases.json' | 'sources.json'): URL {
  return new URL(`api/v1/${filename}`, new URL(baseUrl))
}

async function readManifest<T>(url: URL, fetcher: ManifestFetcher): Promise<readonly T[]> {
  const response = await fetcher(url)
  if (!response.ok) throw new Error(`Could not load public manifest ${url.href}.`)
  const value: unknown = await response.json()
  if (!Array.isArray(value)) throw new Error(`Public manifest ${url.href} is not an array.`)
  return value as readonly T[]
}

function addArtifactUrl(
  target: Record<string, string>,
  filename: string,
  relativeUrl: string,
  sourceManifestUrl: URL,
): void {
  if (!SAFE_ARTIFACT_FILENAME.test(filename)) {
    throw new Error(`Manifest artifact filename is unsafe: ${filename}.`)
  }
  const url = resolveManifestUrl(relativeUrl, sourceManifestUrl).href
  if (target[filename] !== undefined && target[filename] !== url) {
    throw new Error(`Manifest contains conflicting URLs for ${filename}.`)
  }
  target[filename] = url
}

export async function loadCanonicalArtifactUrls(
  request: CanonicalArtifactRequest,
): Promise<Readonly<Record<string, string>>> {
  const fetcher = request.fetcher ?? globalThis.fetch
  if (!fetcher) return {}

  const releasesUrl = manifestUrl(request.baseUrl, 'releases.json')
  const releases = await readManifest<ReleaseManifestEntry>(releasesUrl, fetcher)
  const release = releases.find((entry) => entry.codename === request.release)
  const debianFile = release?.files.find((file) => file.format === request.format)
  const result: Record<string, string> = {}
  if (debianFile) addArtifactUrl(result, debianFile.filename, debianFile.url, releasesUrl)

  const selectedSourceIds = new Set(request.sourceIds)
  if (selectedSourceIds.size === 0) return result

  const sourcesUrl = manifestUrl(request.baseUrl, 'sources.json')
  const sources = await readManifest<SourceManifestEntry>(sourcesUrl, fetcher)
  for (const source of sources) {
    if (!selectedSourceIds.has(source.id)) continue
    const compatibility = source.compatibility.find((entry) => (
      entry.release === request.release && entry.architecture === request.architecture
    ))
    if (!compatibility) continue
    const sourceFilename = compatibility.source.url.split('/').at(-1) ?? ''
    addArtifactUrl(result, sourceFilename, compatibility.source.url, sourcesUrl)
    for (const preference of compatibility.preferences) {
      addArtifactUrl(result, preference.filename, preference.url, sourcesUrl)
    }
  }
  return result
}

export function buildPublicArtifactCommands(
  publicUrl: string | URL,
  filename: string,
): PublicArtifactCommands {
  if (!SAFE_ARTIFACT_FILENAME.test(filename)) {
    throw new Error(`Public artifact filename is unsafe: ${filename}.`)
  }
  const url = new URL(publicUrl)
  if (!['http:', 'https:'].includes(url.protocol)
    || url.username !== ''
    || url.password !== ''
    || url.search !== ''
    || url.hash !== '') {
    throw new Error('Public artifact URL must be an uncredentialed HTTP(S) URL without query or fragment.')
  }

  const quotedFilename = `'${filename}'`
  const download = `curl -fsSL '${url.href}' -o ${quotedFilename}`
  if (filename.endsWith('.sh')) {
    return {
      download,
      inspect: `bash -n -- ${quotedFilename}\nless -- ${quotedFilename}`,
      apply: `sudo bash -- ${quotedFilename}`,
    }
  }

  const destination = filename.endsWith('.pref')
    ? `/etc/apt/preferences.d/${filename}`
    : `/etc/apt/sources.list.d/${filename}`
  return {
    download,
    inspect: `less -- ${quotedFilename}`,
    apply: `sudo install -m 0644 -- ${quotedFilename} '${destination}'`,
  }
}
