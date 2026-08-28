import { mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateSources, getOutputFilename } from '../src/features/sources/generate'
import type { SourceFormat } from '../src/features/sources/model'
import { RELEASES } from '../src/features/sources/releases'

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

export async function generateApi(outputRoot: string): Promise<void> {
  await rm(outputRoot, { force: true, recursive: true })
  await mkdir(outputRoot, { recursive: true })

  const manifest: ManifestRelease[] = []
  for (const release of [...RELEASES].sort((left, right) => compareText(left.codename, right.codename))) {
    const files: ManifestFile[] = []
    const releaseDirectory = resolve(outputRoot, release.codename)
    await mkdir(releaseDirectory, { recursive: true })

    for (const format of [...release.formats].sort(compareText)) {
      const filename = getOutputFilename(format)
      const relativeUrl = `api/v1/${release.codename}/${filename}`
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
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateApi(resolve('public/api/v1')).catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
}
