import { getVendorCompatibility } from './compatibility'
import { VENDOR_PRODUCTS } from './catalog'
import type { GeneratedArtifact, RepositoryKey, RepositorySource, SystemArchitecture, VendorProduct } from './model'
import { REPOSITORY_SOURCES } from './sources'
import type { ReleaseCodename } from '../sources/model'
import { normalizeOpenPgpFingerprint, validateRepositoryCatalog } from './validate'

export interface VendorGenerationCatalog {
  readonly products: readonly VendorProduct[]
  readonly sources: readonly RepositorySource[]
}

export interface VendorGenerationConfig {
  readonly release: ReleaseCodename
  readonly architecture: SystemArchitecture
  readonly productIds: readonly string[]
  readonly catalog?: VendorGenerationCatalog
}
export interface InstallScriptOptions { readonly includePackageInstallation?: boolean }

const warningText: Readonly<Record<string, string>> = {
  'proton-vpn-supported-environment': 'Offiziell unterstützt werden nur die aktuelle stabile Debian-Version mit GNOME und kein Headless-Betrieb.',
  'tor-not-browser': 'Dieses Repository liefert Tor-Daemon und -Client, nicht den Tor Browser.',
  'docker-firewall': 'Docker kann Firewall-Regeln verändern und dadurch Firewall-Regeln umgehen.',
  'nvidia-container-toolkit-prerequisites': 'Erfordert eine unterstützte NVIDIA-GPU, einen installierten NVIDIA-Treiber und eine unterstützte Container-Laufzeit.',
  'mariadb-no-setup-script': 'Die offizielle MariaDB-Einrichtung per Setup-Skript wird nicht ausgeführt; nur das geprüfte Repository wird verwendet.',
  'clickhouse-generic-debian': 'Das ClickHouse-Repository ist distributionsunabhängig; die Kompatibilität bezieht sich auf die bereitgestellten Paketarchitekturen.',
}
const trailing = (content: string): string => content.replace(/\n+$/, '') + '\n'
const compare = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0
const quote = (value: string): string => `'${value.replace(/'/g, "'\"'\"'")}'`
const comment = (value: string): string => value.replace(/[\r\n]+/g, ' ').replace(/[\t ]+/g, ' ').trim()

const DEFAULT_CATALOG: VendorGenerationCatalog = {
  products: VENDOR_PRODUCTS,
  sources: REPOSITORY_SOURCES,
}

function generationCatalog(config: VendorGenerationConfig): VendorGenerationCatalog {
  if (!config.catalog) return DEFAULT_CATALOG
  validateRepositoryCatalog(config.catalog.sources, config.catalog.products)
  return config.catalog
}

function selectedProducts(config: VendorGenerationConfig, products: readonly VendorProduct[]): readonly VendorProduct[] {
  const byId = new Map(products.map((product) => [product.id, product]))
  const seen = new Set<string>()
  return config.productIds.map((id) => {
    if (seen.has(id)) throw new Error(`Duplicate vendor product selection: ${id}.`)
    seen.add(id)
    const product = byId.get(id)
    if (!product) throw new Error(`Unknown vendor product: ${id}.`)
    const compatibility = getVendorCompatibility(product, config.release, config.architecture)
    if (!compatibility.compatible) {
      const reason = compatibility.reason
      throw new Error(reason?.code === 'unsupported-architecture' ? `Die Architektur „${reason.architecture}“ wird nicht unterstützt.` : reason?.code === 'unsupported-release' ? `Das Release „${reason.release}“ wird nicht unterstützt.` : 'Unsupported vendor product.')
    }
    return product
  }).sort((left, right) => compare(left.id, right.id))
}

function sourceFor(product: VendorProduct, sources: readonly RepositorySource[]): RepositorySource {
  if (!product.sourceId) throw new Error(`Vendor "${product.id}" does not require a repository source.`)
  const source = sources.find((candidate) => candidate.id === product.sourceId)
  if (!source) throw new Error(`Unknown repository source: ${product.sourceId}.`)
  return source
}
function locationFor(source: RepositorySource, config: VendorGenerationConfig) {
  const location = source.locations.find((candidate) => candidate.releases.includes(config.release) && candidate.architectures.includes(config.architecture))
  if (!location) throw new Error(`Repository source "${source.id}" is not available for ${config.release}/${config.architecture}.`)
  return location
}
function keyFor(source: RepositorySource, release: ReleaseCodename): RepositoryKey {
  const key = source.keys.find((candidate) => candidate.releases.includes(release))
  if (!key) throw new Error(`Repository source "${source.id}" is missing a signing key for ${release}.`)
  return key
}
function riskNotes(product: VendorProduct, source: RepositorySource): readonly string[] | undefined {
  const notes = [...new Set([...source.warnings, ...product.warningKeys])].map((key) => warningText[key] ?? key).filter((value): value is string => value !== undefined)
  return notes.length ? notes : undefined
}
function sourceArtifact(product: VendorProduct, config: VendorGenerationConfig, sources: readonly RepositorySource[]): GeneratedArtifact {
  const source = sourceFor(product, sources); const location = locationFor(source, config); const key = keyFor(source, config.release); const notes = riskNotes(product, source)
  return {
    filename: `${product.id}.sources`, mediaType: 'text/plain', description: `Paketquelle für ${product.name}`,
    content: trailing(['Types: deb', `URIs: ${location.uri}`, `Suites: ${location.suite}`, `Architectures: ${config.architecture}`, ...(location.suite === '/' ? [] : [`Components: ${location.components.join(' ')}`]), `Signed-By: ${key.keyringPath}`].join('\n')),
    category: product.category, productId: product.id, productName: product.name, ...(notes ? { riskNotes: notes } : {}),
  }
}
function preferenceArtifacts(product: VendorProduct, sources: readonly RepositorySource[]): readonly GeneratedArtifact[] {
  const source = sourceFor(product, sources); const notes = riskNotes(product, source)
  return source.preferenceFiles.filter((file) => file.id === product.id).map((file) => ({ filename: `${file.id}.pref`, mediaType: 'text/plain', description: `Paketpriorität für ${product.name}`, content: trailing(file.content), category: product.category, productId: product.id, productName: product.name, ...(notes ? { riskNotes: notes } : {}) }))
}
export function generateVendorArtifacts(config: VendorGenerationConfig): GeneratedArtifact[] { const catalog = generationCatalog(config); return selectedProducts(config, catalog.products).flatMap((product) => [sourceArtifact(product, config, catalog.sources), ...preferenceArtifacts(product, catalog.sources)]) }
function packageCommand(products: readonly VendorProduct[]): string { const packages = products.flatMap((product) => product.packages); return packages.length ? `apt-get install -y ${packages.map(quote).join(' ')}\n` : '' }
export function generatePackageInstallCommand(config: VendorGenerationConfig): string { const catalog = generationCatalog(config); return packageCommand(selectedProducts(config, catalog.products)) }
function keyCommands(source: RepositorySource, productName: string, release: ReleaseCodename, index: number): string[] {
  const key = keyFor(source, release); const lines = [`# Signaturschlüssel für ${comment(productName)}`, `temporary_key="$temporary_directory/key-${index}"`, `curl --fail --location --proto '=https' --tlsv1.2 --output "$temporary_key" ${quote(key.url)}`]
  if (key.fingerprints.length) { const expected = key.fingerprints.map(normalizeOpenPgpFingerprint).sort(compare).join('\n'); lines.push(`expected_fingerprints=${quote(expected)}`, 'key_metadata="$(gpg --show-keys --with-colons "$temporary_key")"', 'actual_fingerprints="$(printf \'%s\\n\' "$key_metadata" | awk -F: \'$1 == "pub" { want_fingerprint = 1; next } $1 == "sub" { want_fingerprint = 0 } $1 == "fpr" && want_fingerprint { print toupper($10); want_fingerprint = 0 }\' | LC_ALL=C sort -u)"', 'if [ "$actual_fingerprints" != "$expected_fingerprints" ]; then', '  echo "Die Fingerprints der Signaturschlüssel stimmen nicht mit den erwarteten Werten überein." >&2', '  exit 1', 'fi') }
  if (key.keyringPath.endsWith('.gpg')) lines.push('if grep -q -- \'-----BEGIN PGP PUBLIC KEY BLOCK-----\' "$temporary_key"; then', `  dearmored_key="$temporary_directory/key-${index}.gpg"`, '  gpg --dearmor --yes --output "$dearmored_key" "$temporary_key"', `  install -m 0644 "$dearmored_key" ${quote(key.keyringPath)}`, 'else', `  install -m 0644 "$temporary_key" ${quote(key.keyringPath)}`, 'fi')
  else lines.push(`install -m 0644 "$temporary_key" ${quote(key.keyringPath)}`)
  return [...lines, '']
}
const safeArtifact = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:sources|pref)$/
function artifactCommands(artifacts: readonly GeneratedArtifact[]): string[] { const lines = ['install -d -m 0755 /etc/apt/sources.list.d', ...(artifacts.some((artifact) => artifact.filename.endsWith('.pref')) ? ['install -d -m 0755 /etc/apt/preferences.d'] : [])]; for (const [index, artifact] of artifacts.entries()) { if (!safeArtifact.test(artifact.filename)) throw new Error(`Artifact filename must be a safe lowercase .sources or .pref slug: ${artifact.filename}.`); const directory = artifact.filename.endsWith('.pref') ? '/etc/apt/preferences.d/' : '/etc/apt/sources.list.d/'; let marker = `DEBGEN_ARTIFACT_${index}`; let suffix = 1; const contentLines = new Set(artifact.content.split('\n')); while (contentLines.has(marker)) marker = `DEBGEN_ARTIFACT_${index}_${suffix++}`; lines.push(`cat > ${quote(directory + artifact.filename)} <<'${marker}'`, artifact.content.replace(/\n$/, ''), marker, `chmod 0644 ${quote(directory + artifact.filename)}`, '') } return lines }
export function generateInstallScript(config: VendorGenerationConfig, artifacts: readonly GeneratedArtifact[], options: InstallScriptOptions = {}): GeneratedArtifact {
  const catalog = generationCatalog(config); const products = selectedProducts(config, catalog.products); const sources = [...new Map(products.map((product) => { const source = sourceFor(product, catalog.sources); return [source.id, { source, productName: product.name }] })).values()]; const warnings = [...new Set(products.flatMap((product) => riskNotes(product, sourceFor(product, catalog.sources)) ?? []))]
  const content = trailing(['#!/usr/bin/env bash', 'set -euo pipefail', '', '# Prüfen Sie diese Befehle und Dateien vor der Ausführung.', ...warnings.map((warning) => `# WARNUNG: ${comment(warning)}`), ...(warnings.length ? [''] : []), 'apt-get install -y ca-certificates curl gpg', 'install -d -m 0755 /etc/apt/keyrings', 'umask 077', 'temporary_directory="$(mktemp -d)"', 'trap \'rm -rf "$temporary_directory"\' EXIT', '', ...sources.flatMap(({ source, productName }, index) => keyCommands(source, productName, config.release, index)), ...artifactCommands(artifacts), 'apt-get update', ...(products.length && options.includePackageInstallation !== false ? [packageCommand(products).trimEnd()] : [])].join('\n'))
  return { filename: 'install-vendor-repositories.sh', mediaType: 'text/x-shellscript', description: 'Installationsanweisungen für ausgewählte Herstellerquellen', content, ...(warnings.length ? { riskNotes: warnings } : {}) }
}
