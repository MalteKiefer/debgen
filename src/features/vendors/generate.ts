import { getVendorCompatibility } from './compatibility'
import { VENDOR_PRODUCTS } from './catalog'
import type {
  GeneratedArtifact,
  SystemArchitecture,
  VendorProduct,
  VendorRepositoryUrl,
} from './model'
import type { ReleaseCodename } from '../sources/model'
import { validateVendorCatalog } from './validate'

export interface VendorGenerationConfig {
  readonly release: ReleaseCodename
  readonly architecture: SystemArchitecture
  readonly productIds: readonly string[]
  /** Allows static API generation to pass its already validated product set. */
  readonly products?: readonly VendorProduct[]
}

export interface InstallScriptOptions {
  readonly includePackageInstallation?: boolean
}

function withOneTrailingNewline(content: string): string {
  return content.replace(/\n+$/, '') + '\n'
}

function ownRepositoryUrl(repositoryUrl: VendorRepositoryUrl, architecture: SystemArchitecture): string {
  if (typeof repositoryUrl === 'string') return repositoryUrl
  if (!Object.hasOwn(repositoryUrl, architecture)) {
    throw new Error('Repository URL is missing architecture ' + architecture + '.')
  }
  const url = repositoryUrl[architecture]
  if (!url) throw new Error('Repository URL is missing architecture ' + architecture + '.')
  return url
}

function suiteFor(product: VendorProduct, release: ReleaseCodename): string {
  if (typeof product.suite === 'string') return product.suite
  const suite = product.suite[release]
  if (!suite) throw new Error('Vendor "' + product.id + '" is missing a suite for release ' + release + '.')
  return suite
}

function compareCodePoints(left: string, right: string): number {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

function selectedProducts(config: VendorGenerationConfig): readonly VendorProduct[] {
  const products = config.products ?? VENDOR_PRODUCTS
  validateVendorCatalog(products)
  const byId = new Map(products.map((product) => [product.id, product]))
  const selectedIds = new Set<string>()
  const selected = config.productIds.map((id) => {
    if (selectedIds.has(id)) throw new Error('Duplicate vendor product selection: ' + id + '.')
    selectedIds.add(id)
    const product = byId.get(id)
    if (!product) throw new Error('Unknown vendor product: ' + id + '.')
    const compatibility = getVendorCompatibility(product, config.release, config.architecture)
    if (!compatibility.compatible) throw new Error(compatibility.reason)
    return product
  })
  return [...selected].sort((left, right) => compareCodePoints(left.id, right.id))
}

function sourceArtifact(product: VendorProduct, config: VendorGenerationConfig): GeneratedArtifact {
  const suite = suiteFor(product, config.release)
  const fields = [
    'Types: deb',
    'URIs: ' + ownRepositoryUrl(product.repositoryUrl, config.architecture),
    'Suites: ' + suite,
    'Architectures: ' + config.architecture,
    ...(suite === '/' ? [] : ['Components: ' + product.components.join(' ')]),
    'Signed-By: ' + product.keyringPath,
  ]
  return {
    filename: product.filename,
    mediaType: 'text/plain',
    description: 'Paketquelle für ' + product.name,
    content: withOneTrailingNewline(fields.join('\n')),
    category: product.category,
    productId: product.id,
    ...(product.warning ? { riskNotes: [product.warning] } : {}),
  }
}

function preferenceArtifact(product: VendorProduct): GeneratedArtifact | undefined {
  if (!product.preferences) return undefined
  return {
    filename: product.id + '.pref',
    mediaType: 'text/plain',
    description: 'Paketpriorität für ' + product.name,
    content: withOneTrailingNewline(product.preferences),
    category: product.category,
    productId: product.id,
    ...(product.warning ? { riskNotes: [product.warning] } : {}),
  }
}

export function generateVendorArtifacts(config: VendorGenerationConfig): GeneratedArtifact[] {
  return selectedProducts(config).flatMap((product) => {
    const preference = preferenceArtifact(product)
    return preference ? [sourceArtifact(product, config), preference] : [sourceArtifact(product, config)]
  })
}

function shellQuote(value: string): string {
  return '\'' + value.replace(/'/g, "'\"'\"'") + '\''
}

function packageInstallCommand(products: readonly VendorProduct[]): string {
  const packages = products.flatMap((product) => product.packages)
  return packages.length > 0 ? 'apt-get install -y ' + packages.map(shellQuote).join(' ') + '\n' : ''
}

export function generatePackageInstallCommand(config: VendorGenerationConfig): string {
  return packageInstallCommand(selectedProducts(config))
}

function shellComment(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').replace(/[\t ]+/g, ' ').trim()
}

function normalizedFingerprint(fingerprint: string): string {
  return fingerprint.replace(/\s/g, '').toUpperCase()
}

function keyInstallCommands(product: VendorProduct, index: number): string[] {
  const lines = [
    '# ' + shellComment(product.name) + ' signing key',
    'temporary_key="$temporary_directory/key-' + index + '"',
    'curl --fail --location --proto \'=https\' --tlsv1.2 --output "$temporary_key" ' + shellQuote(product.keyUrl),
  ]
  if (product.fingerprint) {
    lines.push(
      'expected_fingerprint=' + shellQuote(normalizedFingerprint(product.fingerprint)),
      'key_metadata="$(gpg --show-keys --with-colons "$temporary_key")"',
      'primary_key_count="$(printf \'%s\\n\' "$key_metadata" | awk -F: \'$1 == "pub" { count++ } END { print count + 0 }\')"',
      'if [ "$primary_key_count" -ne 1 ]; then',
      '  echo "Expected exactly one primary signing key." >&2',
      '  exit 1',
      'fi',
      'actual_fingerprint="$(printf \'%s\\n\' "$key_metadata" | awk -F: \'$1 == "pub" { want_fingerprint = 1; next } $1 == "sub" { want_fingerprint = 0 } $1 == "fpr" && want_fingerprint { print $10; exit }\')"',
      'if [ "$actual_fingerprint" != "$expected_fingerprint" ]; then',
      '  echo "Signing-key fingerprint verification failed." >&2',
      '  exit 1',
      'fi',
    )
  }
  if (product.keyringPath.endsWith('.gpg')) {
    lines.push(
      'if grep -q -- \'-----BEGIN PGP PUBLIC KEY BLOCK-----\' "$temporary_key"; then',
      '  dearmored_key="$temporary_directory/key-' + index + '.gpg"',
      '  gpg --dearmor --yes --output "$dearmored_key" "$temporary_key"',
      '  install -m 0644 "$dearmored_key" ' + shellQuote(product.keyringPath),
      'else',
      '  install -m 0644 "$temporary_key" ' + shellQuote(product.keyringPath),
      'fi',
    )
  } else {
    lines.push('install -m 0644 "$temporary_key" ' + shellQuote(product.keyringPath))
  }
  lines.push('')
  return lines
}

const SAFE_ARTIFACT_FILENAME = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:sources|pref)$/

function artifactDestination(artifact: GeneratedArtifact): string {
  if (!SAFE_ARTIFACT_FILENAME.test(artifact.filename)) {
    throw new Error('Artifact filename must be a safe lowercase .sources or .pref slug: ' + artifact.filename + '.')
  }
  const directory = artifact.filename.endsWith('.pref') ? '/etc/apt/preferences.d/' : '/etc/apt/sources.list.d/'
  return directory + artifact.filename
}

function heredocMarker(content: string, index: number): string {
  const lines = new Set(content.split('\n'))
  const base = 'DEBGEN_ARTIFACT_' + index
  let marker = base
  let suffix = 1
  while (lines.has(marker)) {
    marker = base + '_' + suffix
    suffix += 1
  }
  return marker
}

function artifactInstallCommands(artifacts: readonly GeneratedArtifact[]): string[] {
  const destinations = artifacts.map((artifact) => artifactDestination(artifact))
  const lines = [
    ...(destinations.some((destination) => destination.startsWith('/etc/apt/sources.list.d/'))
      ? ['install -d -m 0755 /etc/apt/sources.list.d']
      : []),
    ...(destinations.some((destination) => destination.startsWith('/etc/apt/preferences.d/'))
      ? ['install -d -m 0755 /etc/apt/preferences.d']
      : []),
  ]
  for (const [index, artifact] of artifacts.entries()) {
    const marker = heredocMarker(artifact.content, index)
    const destination = destinations[index] as string
    lines.push(
      'cat > ' + shellQuote(destination) + ' <<\'' + marker + '\'',
      artifact.content.replace(/\n$/, ''),
      marker,
      'chmod 0644 ' + shellQuote(destination),
      '',
    )
  }
  return lines
}

export function generateInstallScript(
  config: VendorGenerationConfig,
  artifacts: readonly GeneratedArtifact[],
  options: InstallScriptOptions = {},
): GeneratedArtifact {
  const products = selectedProducts(config)
  const warnings = products.flatMap((product) => product.warning ? [product.warning] : [])
  const lines = [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    '',
    '# Prüfen Sie diese Befehle und Dateien vor der Ausführung.',
    ...warnings.map((warning) => '# WARNUNG: ' + shellComment(warning)),
    ...(warnings.length > 0 ? [''] : []),
    'apt-get install -y ca-certificates curl gpg',
    'install -d -m 0755 /etc/apt/keyrings',
    'umask 077',
    'temporary_directory="$(mktemp -d)"',
    'trap \'rm -rf "$temporary_directory"\' EXIT',
    '',
    ...products.flatMap((product, index) => keyInstallCommands(product, index)),
    ...artifactInstallCommands(artifacts),
    'apt-get update',
    ...(products.length > 0 && options.includePackageInstallation !== false
      ? [packageInstallCommand(products).trimEnd()]
      : []),
  ]
  return {
    filename: 'install-vendor-repositories.sh',
    mediaType: 'text/x-shellscript',
    description: 'Installationsanweisungen für ausgewählte Herstellerquellen',
    content: withOneTrailingNewline(lines.join('\n')),
    ...(warnings.length > 0 ? { riskNotes: warnings } : {}),
  }
}
