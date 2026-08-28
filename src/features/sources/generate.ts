import type { DebianRelease, SourceFormat, SourceOptions } from './model'
import { getRelease } from './releases'

const componentOrder = ['main', 'contrib', 'non-free', 'non-free-firmware']

interface ValidatedSourceOptions {
  release: DebianRelease
  format: SourceFormat
  includeSource: boolean
  includeSecurity: boolean
  includeUpdates: boolean
  includeBackports: boolean
  components: string[]
}

function describeUnsupported(release: DebianRelease, capability: 'security' | 'updates' | 'backports'): string {
  return `Release "${release.codename}" does not support ${capability} suites.`
}

function validateOptions(options: SourceOptions): ValidatedSourceOptions {
  const release = getRelease(options.release)
  if (options.format !== 'deb822' && options.format !== 'legacy') {
    throw new Error(`Unsupported source format: ${String(options.format)}.`)
  }
  if (!release.formats.includes(options.format)) {
    throw new Error(`Format "${options.format}" is not supported for release "${release.codename}".`)
  }
  if (!Array.isArray(options.components)) {
    throw new Error('Components must be an array.')
  }
  for (const component of options.components) {
    if (!release.components.includes(component)) {
      throw new Error(`Component "${component}" is not supported by release "${release.codename}".`)
    }
  }
  if (options.includeSecurity && !release.capabilities.security) {
    throw new Error(describeUnsupported(release, 'security'))
  }
  if (options.includeUpdates && !release.capabilities.updates) {
    throw new Error(describeUnsupported(release, 'updates'))
  }
  if (options.includeBackports && !release.capabilities.backports) {
    throw new Error(describeUnsupported(release, 'backports'))
  }

  return {
    release,
    format: options.format,
    includeSource: options.includeSource,
    includeSecurity: options.includeSecurity,
    includeUpdates: options.includeUpdates,
    includeBackports: options.includeBackports,
    components: componentOrder.filter((component) => component === 'main' || options.components.includes(component)),
  }
}

function types(includeSource: boolean): string {
  return includeSource ? 'deb deb-src' : 'deb'
}

function deb822Stanza(
  includeSource: boolean,
  uri: string,
  suites: string[],
  components: string[],
  keyring: string,
): string {
  return [
    `Types: ${types(includeSource)}`,
    `URIs: ${uri}`,
    `Suites: ${suites.join(' ')}`,
    `Components: ${components.join(' ')}`,
    `Signed-By: ${keyring}`,
  ].join('\n')
}

export function generateDeb822(options: SourceOptions): string {
  if (options.format !== 'deb822') {
    throw new Error('generateDeb822 requires the deb822 format.')
  }
  const validated = validateOptions(options)
  const { release } = validated
  const baseSuites = [release.suites.base]
  if (validated.includeUpdates) {
    baseSuites.push(release.suites.updates as string)
  }
  if (validated.includeBackports) {
    baseSuites.push(release.suites.backports as string)
  }

  const stanzas = [deb822Stanza(
    validated.includeSource,
    release.baseUri,
    baseSuites,
    validated.components,
    release.keyring,
  )]
  if (validated.includeSecurity) {
    stanzas.push(deb822Stanza(
      validated.includeSource,
      release.securityUri,
      [release.suites.security as string],
      validated.components,
      release.keyring,
    ))
  }
  return `${stanzas.join('\n\n')}\n`
}

function legacyLines(
  includeSource: boolean,
  uri: string,
  suite: string,
  components: string[],
  keyring: string,
): string[] {
  const prefix = `[signed-by=${keyring}] ${uri} ${suite} ${components.join(' ')}`
  return [
    `deb ${prefix}`,
    ...(includeSource ? [`deb-src ${prefix}`] : []),
  ]
}

export function generateLegacyList(options: SourceOptions): string {
  if (options.format !== 'legacy') {
    throw new Error('generateLegacyList requires the legacy format.')
  }
  const validated = validateOptions(options)
  const { release } = validated
  const lines = legacyLines(validated.includeSource, release.baseUri, release.suites.base, validated.components, release.keyring)
  if (validated.includeSecurity) {
    lines.push(...legacyLines(validated.includeSource, release.securityUri, release.suites.security as string, validated.components, release.keyring))
  }
  if (validated.includeUpdates) {
    lines.push(...legacyLines(validated.includeSource, release.baseUri, release.suites.updates as string, validated.components, release.keyring))
  }
  if (validated.includeBackports) {
    lines.push(...legacyLines(validated.includeSource, release.baseUri, release.suites.backports as string, validated.components, release.keyring))
  }
  return `${lines.join('\n')}\n`
}

export function generateSources(options: SourceOptions): string {
  if (options.format === 'deb822') {
    return generateDeb822(options)
  }
  if (options.format === 'legacy') {
    return generateLegacyList(options)
  }
  throw new Error(`Unsupported source format: ${String(options.format)}.`)
}

export function getOutputFilename(format: SourceFormat): 'debian.sources' | 'debian.list' {
  if (format === 'deb822') {
    return 'debian.sources'
  }
  if (format === 'legacy') {
    return 'debian.list'
  }
  throw new Error(`Unsupported source format: ${String(format)}.`)
}
