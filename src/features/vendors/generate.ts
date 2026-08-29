import { getVendorCompatibility } from './compatibility'
import { VENDOR_PRODUCTS } from './catalog'
import type { GeneratedArtifact, RepositoryKey, RepositorySource, SystemArchitecture, VendorProduct } from './model'
import { REPOSITORY_SOURCES } from './sources'
import type { ReleaseCodename } from '../sources/model'
import { auxiliaryTrustDestinationPath, normalizeOpenPgpFingerprint, validateRepositoryCatalog } from './validate'

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

export interface GeneratedRepositoryArtifact extends GeneratedArtifact {
  readonly sourceId: string
}

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
const categoryOrder: readonly VendorProduct['category'][] = [
  'web-browsers',
  'messaging-email',
  'vpn-secure-networking',
  'remote-desktop',
  'containers-kubernetes',
  'cloud-edge',
  'infrastructure-automation',
  'data-platforms',
  'observability-logging',
  'security-secrets',
  'developer-workstation',
  'runtimes-sdks',
  'development-platforms-cicd',
  'web-servers',
  'file-synchronization',
  'virtualization',
  'games',
  'desktop-productivity',
]

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
function keysFor(source: RepositorySource, release: ReleaseCodename): readonly RepositoryKey[] {
  const keys = source.keys.filter((candidate) => candidate.releases.includes(release))
  if (keys.length === 0) throw new Error(`Repository source "${source.id}" is missing a signing key for ${release}.`)
  return keys
}
function riskNotesFor(products: readonly VendorProduct[], source?: RepositorySource): readonly string[] | undefined {
  const notes = [...new Set([
    ...(source?.warnings ?? []),
    ...products.flatMap((product) => product.warningKeys),
  ])].map((key) => warningText[key] ?? key)
  return notes.length ? notes : undefined
}
function riskNotes(product: VendorProduct, source: RepositorySource): readonly string[] | undefined {
  return riskNotesFor([product], source)
}
function sourceContent(source: RepositorySource, config: VendorGenerationConfig): string {
  const location = locationFor(source, config)
  const keyringPaths = keysFor(source, config.release).map((key) => key.keyringPath)
  return trailing([
    'Types: deb',
    `URIs: ${location.uri}`,
    `Suites: ${location.suite}`,
    `Architectures: ${config.architecture}`,
    ...(location.suite.endsWith('/') ? [] : [`Components: ${location.components.join(' ')}`]),
    `Signed-By: ${keyringPaths.join(' ')}`,
  ].join('\n'))
}
function sourceArtifact(product: VendorProduct, config: VendorGenerationConfig, sources: readonly RepositorySource[]): GeneratedArtifact {
  const source = sourceFor(product, sources); const notes = riskNotes(product, source)
  return {
    filename: `${product.id}.sources`, mediaType: 'text/plain', description: `Paketquelle für ${product.name}`,
    content: sourceContent(source, config),
    category: product.category, productId: product.id, productName: product.name, ...(notes ? { riskNotes: notes } : {}),
  }
}
function preferenceArtifacts(product: VendorProduct, source: RepositorySource): readonly GeneratedArtifact[] {
  const notes = riskNotes(product, source)
  return source.preferenceFiles.map((file) => ({ filename: `${file.id}.pref`, mediaType: 'text/plain', description: `Paketpriorität für ${product.name}`, content: trailing(file.content), category: product.category, productId: product.id, productName: product.name, ...(notes ? { riskNotes: notes } : {}) }))
}
export function generateVendorArtifacts(config: VendorGenerationConfig): GeneratedArtifact[] {
  const catalog = generationCatalog(config)
  const products = selectedProducts(config, catalog.products)
  const seenSources = new Set<string>()
  const preferenceContents = new Map<string, string>()
  const artifacts: GeneratedArtifact[] = []
  for (const product of products) {
    if (product.sourceId === null) continue
    const source = sourceFor(product, catalog.sources)
    artifacts.push(sourceArtifact(product, config, catalog.sources))
    if (seenSources.has(source.id)) continue
    seenSources.add(source.id)
    for (const artifact of preferenceArtifacts(product, source)) {
      const existing = preferenceContents.get(artifact.filename)
      if (existing !== undefined && existing !== artifact.content) throw new Error(`Conflicting preference file definition: ${artifact.filename}.`)
      if (existing === undefined) {
        preferenceContents.set(artifact.filename, artifact.content)
        artifacts.push(artifact)
      }
    }
  }
  return artifacts
}

interface RepositorySelection {
  readonly source: RepositorySource
  readonly products: readonly VendorProduct[]
  readonly representative: VendorProduct
}

function repositorySelections(
  products: readonly VendorProduct[],
  sources: readonly RepositorySource[],
): readonly RepositorySelection[] {
  const productsBySource = new Map<string, VendorProduct[]>()
  for (const product of products) {
    if (product.sourceId === null) continue
    const selected = productsBySource.get(product.sourceId) ?? []
    selected.push(product)
    productsBySource.set(product.sourceId, selected)
  }
  return [...productsBySource.entries()].map(([sourceId, selected]) => {
    const source = sources.find((candidate) => candidate.id === sourceId)
    if (!source) throw new Error(`Unknown repository source: ${sourceId}.`)
    const ordered = [...selected].sort((left, right) => {
      const category = categoryOrder.indexOf(left.category) - categoryOrder.indexOf(right.category)
      return category || compare(left.name, right.name) || compare(left.id, right.id)
    })
    return { source, products: selected, representative: ordered[0] as VendorProduct }
  }).sort((left, right) => {
    const category = categoryOrder.indexOf(left.representative.category) - categoryOrder.indexOf(right.representative.category)
    return category || compare(left.representative.name, right.representative.name) || compare(left.source.id, right.source.id)
  })
}

function mergeNotes(
  left: readonly string[] | undefined,
  right: readonly string[] | undefined,
): readonly string[] | undefined {
  const notes = [...new Set([...(left ?? []), ...(right ?? [])])]
  return notes.length ? notes : undefined
}

export function generateRepositoryArtifacts(config: VendorGenerationConfig): GeneratedRepositoryArtifact[] {
  const catalog = generationCatalog(config)
  const products = selectedProducts(config, catalog.products)
  const selections = repositorySelections(products, catalog.sources)
  const sources = selections.map(({ source, products: sourceProducts, representative }) => {
    const notes = riskNotesFor(sourceProducts, source)
    return {
      filename: `${source.id}.sources`,
      mediaType: 'text/plain',
      description: `Paketquelle für ${source.name}`,
      content: sourceContent(source, config),
      category: representative.category,
      productId: representative.id,
      productName: representative.name,
      sourceId: source.id,
      ...(notes ? { riskNotes: notes } : {}),
    } satisfies GeneratedRepositoryArtifact
  })
  const preferences = new Map<string, GeneratedRepositoryArtifact>()
  for (const { source, products: sourceProducts, representative } of selections) {
    const notes = riskNotesFor(sourceProducts, source)
    for (const file of source.preferenceFiles) {
      const filename = `${file.id}.pref`
      const existing = preferences.get(filename)
      const content = trailing(file.content)
      if (existing !== undefined && existing.content !== content) {
        throw new Error(`Conflicting preference file definition: ${filename}.`)
      }
      if (existing !== undefined) {
        const riskNotes = mergeNotes(existing.riskNotes, notes)
        preferences.set(filename, { ...existing, ...(riskNotes ? { riskNotes } : {}) })
        continue
      }
      preferences.set(filename, {
        filename,
        mediaType: 'text/plain',
        description: `Paketpriorität für ${source.name}`,
        content,
        category: representative.category,
        productId: representative.id,
        productName: representative.name,
        sourceId: source.id,
        ...(notes ? { riskNotes: notes } : {}),
      })
    }
  }
  return [...sources, ...preferences.values()]
}

function packageCommand(products: readonly VendorProduct[]): string {
  const packages = [...new Set(products.flatMap((product) => product.packages))].sort(compare)
  return packages.length ? `apt-get install -y ${packages.map(quote).join(' ')}\n` : ''
}
function legacyPackageCommand(products: readonly VendorProduct[]): string {
  const packages = products.flatMap((product) => product.packages)
  return packages.length ? `apt-get install -y ${packages.map(quote).join(' ')}\n` : ''
}
export function generatePackageInstallCommand(config: VendorGenerationConfig): string { const catalog = generationCatalog(config); return packageCommand(selectedProducts(config, catalog.products)) }
function keyCommands(key: RepositoryKey, productName: string, index: number): string[] {
  const lines = [`# Signaturschlüssel für ${comment(productName)}`, `temporary_key="$temporary_directory/key-${index}"`, `curl --fail --location --proto '=https' --tlsv1.2 --output "$temporary_key" ${quote(key.url)}`]
  if (key.fingerprints.length) { const expected = key.fingerprints.map(normalizeOpenPgpFingerprint).sort(compare).join('\n'); lines.push(`expected_fingerprints=${quote(expected)}`, 'key_metadata="$(gpg --show-keys --with-colons "$temporary_key")"', 'actual_fingerprints="$(printf \'%s\\n\' "$key_metadata" | awk -F: \'$1 == "pub" { want_fingerprint = 1; next } $1 == "sub" { want_fingerprint = 0 } $1 == "fpr" && want_fingerprint { print toupper($10); want_fingerprint = 0 }\' | LC_ALL=C sort -u)"', 'if [ "$actual_fingerprints" != "$expected_fingerprints" ]; then', '  echo "Die Fingerprints der Signaturschlüssel stimmen nicht mit den erwarteten Werten überein." >&2', '  exit 1', 'fi') }
  if (key.keyringPath.endsWith('.gpg')) lines.push('if grep -q -- \'-----BEGIN PGP PUBLIC KEY BLOCK-----\' "$temporary_key"; then', `  dearmored_key="$temporary_directory/key-${index}.gpg"`, '  gpg --dearmor --yes --output "$dearmored_key" "$temporary_key"', `  install -m 0644 "$dearmored_key" ${quote(key.keyringPath)}`, 'else', `  install -m 0644 "$temporary_key" ${quote(key.keyringPath)}`, 'fi')
  else lines.push(`install -m 0644 "$temporary_key" ${quote(key.keyringPath)}`)
  return [...lines, '']
}

interface SelectedKey {
  readonly key: RepositoryKey
  readonly productName: string
}

function selectedKeys(selections: readonly RepositorySelection[], release: ReleaseCodename): readonly SelectedKey[] {
  const keysByDestination = new Map<string, { readonly definition: string, readonly selected: SelectedKey }>()
  for (const { source, representative } of selections) {
    for (const key of keysFor(source, release)) {
      const definition = JSON.stringify({
        url: key.url,
        format: key.format,
        fingerprints: key.fingerprints.map(normalizeOpenPgpFingerprint).sort(compare),
      })
      const existing = keysByDestination.get(key.keyringPath)
      if (existing !== undefined && existing.definition !== definition) {
        throw new Error(`Conflicting signing key definition: ${key.keyringPath}.`)
      }
      if (existing === undefined) {
        keysByDestination.set(key.keyringPath, {
          definition,
          selected: { key, productName: representative.name },
        })
      }
    }
  }
  return [...keysByDestination.values()].map(({ selected }) => selected)
}
function auxiliaryTrustCommands(sources: readonly RepositorySource[]): string[] {
  const lines: string[] = []
  const installedDestinations = new Map<string, string>()
  for (const [sourceIndex, source] of sources.entries()) {
    for (const [fileIndex, file] of source.auxiliaryTrustFiles.entries()) {
      const destination = auxiliaryTrustDestinationPath(file)
      const definition = JSON.stringify({ url: file.url, mediaType: file.mediaType, fingerprint: file.fingerprint })
      const existing = installedDestinations.get(destination)
      if (existing !== undefined && existing !== definition) throw new Error(`Conflicting auxiliary trust file definition: ${destination}.`)
      if (existing !== undefined) continue
      installedDestinations.set(destination, definition)
      const directory = destination.slice(0, destination.lastIndexOf('/'))
      const temporaryPath = `$temporary_directory/auxiliary-${sourceIndex}-${fileIndex}`
      lines.push(
        `# Zusätzliche Vertrauensdatei ${comment(file.id)}`,
        `install -d -m 0755 ${quote(directory)}`,
        `temporary_auxiliary="${temporaryPath}"`,
        `curl --fail --location --proto '=https' --tlsv1.2 --output "$temporary_auxiliary" ${quote(file.url)}`,
      )
      if (file.fingerprint !== undefined) {
        lines.push(
          `expected_fingerprints=${quote(normalizeOpenPgpFingerprint(file.fingerprint))}`,
          'auxiliary_key_metadata="$(gpg --show-keys --with-colons "$temporary_auxiliary")"',
          'actual_fingerprints="$(printf \'%s\\n\' "$auxiliary_key_metadata" | awk -F: \'$1 == "pub" { want_fingerprint = 1; next } $1 == "sub" { want_fingerprint = 0 } $1 == "fpr" && want_fingerprint { print toupper($10); want_fingerprint = 0 }\' | LC_ALL=C sort -u)"',
          'if [ "$actual_fingerprints" != "$expected_fingerprints" ]; then',
          '  echo "Der Fingerprint der zusätzlichen Vertrauensdatei stimmt nicht mit dem erwarteten Wert überein." >&2',
          '  exit 1',
          'fi',
          `dearmored_auxiliary="${temporaryPath}.gpg"`,
          'gpg --dearmor --yes --output "$dearmored_auxiliary" "$temporary_auxiliary"',
          `install -m 0644 "$dearmored_auxiliary" ${quote(destination)}`,
        )
      } else {
        lines.push(`install -m 0644 "$temporary_auxiliary" ${quote(destination)}`)
      }
      lines.push('')
    }
  }
  return lines
}
const safeArtifact = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:sources|pref)$/
function artifactCommands(artifacts: readonly GeneratedArtifact[]): string[] { const lines = ['install -d -m 0755 /etc/apt/sources.list.d', ...(artifacts.some((artifact) => artifact.filename.endsWith('.pref')) ? ['install -d -m 0755 /etc/apt/preferences.d'] : [])]; for (const [index, artifact] of artifacts.entries()) { if (!safeArtifact.test(artifact.filename)) throw new Error(`Artifact filename must be a safe lowercase .sources or .pref slug: ${artifact.filename}.`); const directory = artifact.filename.endsWith('.pref') ? '/etc/apt/preferences.d/' : '/etc/apt/sources.list.d/'; let marker = `DEBGEN_ARTIFACT_${index}`; let suffix = 1; const contentLines = new Set(artifact.content.split('\n')); while (contentLines.has(marker)) marker = `DEBGEN_ARTIFACT_${index}_${suffix++}`; lines.push(`cat > ${quote(directory + artifact.filename)} <<'${marker}'`, artifact.content.replace(/\n$/, ''), marker, `chmod 0644 ${quote(directory + artifact.filename)}`, '') } return lines }
export function generateInstallScript(config: VendorGenerationConfig, artifacts: readonly GeneratedArtifact[], options: InstallScriptOptions = {}): GeneratedArtifact {
  const catalog = generationCatalog(config)
  const products = selectedProducts(config, catalog.products)
  const selections = repositorySelections(products, catalog.sources)
  const warnings = [...new Set(products.flatMap((product) => {
    const source = product.sourceId === null ? undefined : sourceFor(product, catalog.sources)
    return riskNotesFor([product], source) ?? []
  }))]
  const hasRepositorySetup = selections.length > 0 || artifacts.length > 0
  const legacyProduct = products.length === 1 ? products[0] : undefined
  const usesLegacyAliasArtifact = legacyProduct !== undefined
    && legacyProduct.sourceId !== null
    && artifacts.some((artifact) => artifact.filename === `${legacyProduct.id}.sources`
      && (artifact as GeneratedRepositoryArtifact).sourceId === undefined)
  const installPackages = usesLegacyAliasArtifact ? legacyPackageCommand(products) : packageCommand(products)
  const repositorySetup = hasRepositorySetup
    ? [
        'apt-get install -y ca-certificates curl gpg',
        'install -d -m 0755 /etc/apt/keyrings',
        'umask 077',
        'temporary_directory="$(mktemp -d)"',
        'trap \'rm -rf "$temporary_directory"\' EXIT',
        '',
        ...selectedKeys(selections, config.release)
          .flatMap(({ key, productName }, index) => keyCommands(key, productName, index)),
        ...auxiliaryTrustCommands(selections.map(({ source }) => source)),
        ...artifactCommands(artifacts),
      ]
    : []
  const content = trailing([
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    '',
    '# Prüfen Sie diese Befehle und Dateien vor der Ausführung.',
    ...warnings.map((warning) => `# WARNUNG: ${comment(warning)}`),
    ...(warnings.length ? [''] : []),
    ...repositorySetup,
    'apt-get update',
    ...(products.length && options.includePackageInstallation !== false ? [installPackages.trimEnd()] : []),
  ].join('\n'))
  return { filename: 'install-vendor-repositories.sh', mediaType: 'text/x-shellscript', description: 'Installationsanweisungen für ausgewählte Herstellerquellen', content, ...(warnings.length ? { riskNotes: warnings } : {}) }
}
