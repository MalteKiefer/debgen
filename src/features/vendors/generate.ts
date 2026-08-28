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

function selectedProducts(config: VendorGenerationConfig): readonly VendorProduct[] {
  const products = config.products ?? VENDOR_PRODUCTS
  validateVendorCatalog(products)
  const byId = new Map(products.map((product) => [product.id, product]))
  const selected = config.productIds.map((id) => {
    const product = byId.get(id)
    if (!product) throw new Error('Unknown vendor product: ' + id + '.')
    const compatibility = getVendorCompatibility(product, config.release, config.architecture)
    if (!compatibility.compatible) throw new Error(compatibility.reason)
    return product
  })
  return [...selected].sort((left, right) => left.id.localeCompare(right.id))
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

function normalizedFingerprint(fingerprint: string): string {
  return fingerprint.replace(/\s/g, '').toUpperCase()
}

function keyInstallCommands(product: VendorProduct): string[] {
  const lines = [
    '# ' + product.name + ' signing key',
    'temporary_key="$(mktemp)"',
    'curl --fail --location --proto \'=https\' --tlsv1.2 --output "$temporary_key" ' + shellQuote(product.keyUrl),
  ]
  if (product.fingerprint) {
    lines.push(
      'expected_fingerprint=' + shellQuote(normalizedFingerprint(product.fingerprint)),
      'actual_fingerprint="$(gpg --show-keys --with-colons "$temporary_key" | awk -F: \'$1 == "fpr" { print $10; exit }\')"',
      'if [ "$actual_fingerprint" != "$expected_fingerprint" ]; then',
      '  echo "Signing-key fingerprint verification failed." >&2',
      '  rm -f "$temporary_key"',
      '  exit 1',
      'fi',
    )
  }
  if (product.keyringPath.endsWith('.gpg')) {
    lines.push(
      'if grep -q -- \'-----BEGIN PGP PUBLIC KEY BLOCK-----\' "$temporary_key"; then',
      '  gpg --dearmor --yes --output ' + shellQuote(product.keyringPath + '.tmp') + ' "$temporary_key"',
      '  install -m 0644 ' + shellQuote(product.keyringPath + '.tmp') + ' ' + shellQuote(product.keyringPath),
      '  rm -f ' + shellQuote(product.keyringPath + '.tmp'),
      'else',
      '  install -m 0644 "$temporary_key" ' + shellQuote(product.keyringPath),
      'fi',
    )
  } else {
    lines.push('install -m 0644 "$temporary_key" ' + shellQuote(product.keyringPath))
  }
  lines.push('rm -f "$temporary_key"', '')
  return lines
}

function artifactInstallCommands(artifacts: readonly GeneratedArtifact[]): string[] {
  const lines = ['install -d -m 0755 /etc/apt/sources.list.d']
  for (const [index, artifact] of artifacts.entries()) {
    const marker = 'DEBGEN_ARTIFACT_' + index
    lines.push(
      'cat > ' + shellQuote('/etc/apt/sources.list.d/' + artifact.filename) + ' <<\'' + marker + '\'',
      artifact.content.replace(/\n$/, ''),
      marker,
      'chmod 0644 ' + shellQuote('/etc/apt/sources.list.d/' + artifact.filename),
      '',
    )
  }
  return lines
}

export function generateInstallScript(
  config: VendorGenerationConfig,
  artifacts: readonly GeneratedArtifact[],
): GeneratedArtifact {
  const products = selectedProducts(config)
  const warnings = products.flatMap((product) => product.warning ? [product.warning] : [])
  const lines = [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    '',
    '# Prüfen Sie diese Befehle und Dateien vor der Ausführung.',
    ...warnings.map((warning) => '# WARNUNG: ' + warning),
    ...(warnings.length > 0 ? [''] : []),
    'apt-get update',
    'apt-get install -y ca-certificates curl gpg',
    'install -d -m 0755 /etc/apt/keyrings',
    '',
    ...products.flatMap(keyInstallCommands),
    ...artifactInstallCommands(artifacts),
    'apt-get update',
    ...(products.length > 0
      ? ['apt-get install -y ' + products.flatMap((product) => product.packages).map(shellQuote).join(' ')]
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
