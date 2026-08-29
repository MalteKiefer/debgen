import type {
  AuxiliaryTrustFile,
  RepositoryKey,
  RepositoryLocation,
  RepositorySource,
  LegacyVendorProduct,
  VendorProduct,
} from './model'
import { isVendorMdiIcon } from './icons'

const RELEASES = new Set(['trixie', 'bookworm', 'bullseye', 'forky', 'sid'])
const ARCHITECTURES = new Set(['amd64', 'arm64', 'armhf', 'i386'])
const CATEGORIES = new Set(['browser', 'communication', 'privacy', 'containers', 'cloud', 'development', 'database', 'monitoring'])
const SAFE_VENDOR_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const FULL_OPENPGP_FINGERPRINT = /^(?:[A-F0-9]{40}|[A-F0-9]{64})$/
const SAFE_KEYRING_PATH = /^\/(?:etc\/apt\/keyrings|usr\/share\/keyrings)\/[A-Za-z0-9][A-Za-z0-9._+-]*\.(?:asc|gpg|pgp)$/

const hasRawControlCharacter = (value: string): boolean =>
  [...value].some((character) => {
    const code = character.charCodeAt(0)
    return code <= 0x1f || code === 0x7f
  })

export function normalizeOpenPgpFingerprint(fingerprint: string): string {
  return fingerprint.replace(/[\t\n\r ]/g, '').toUpperCase()
}

const requireText = (product: LegacyVendorProduct, field: string, value: unknown): void => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Vendor "${product.id}" is missing ${field} metadata.`)
  }
}

const requireHttps = (product: LegacyVendorProduct, field: string, value: unknown): void => {
  requireText(product, field, value)
  if (hasRawControlCharacter(value as string)) {
    throw new Error(`Vendor "${product.id}" ${field} must be a valid HTTPS URL.`)
  }
  let url: URL
  try {
    url = new URL(value as string)
  } catch {
    throw new Error(`Vendor "${product.id}" ${field} must be a valid HTTPS URL.`)
  }
  if (url.protocol !== 'https:' || !url.hostname) {
    throw new Error(`Vendor "${product.id}" ${field} must use HTTPS.`)
  }
}

const validateRepositoryUrl = (product: LegacyVendorProduct): void => {
  if (typeof product.repositoryUrl === 'string') {
    requireHttps(product, 'repository URL', product.repositoryUrl)
    return
  }

  if (!product.repositoryUrl || typeof product.repositoryUrl !== 'object' || Array.isArray(product.repositoryUrl)) {
    throw new Error(`Vendor "${product.id}" repository URL must be an HTTPS URL or architecture mapping.`)
  }

  const mappedArchitectures = Object.keys(product.repositoryUrl)
  if (mappedArchitectures.length === 0) {
    throw new Error(`Vendor "${product.id}" repository URL mapping must define every supported architecture.`)
  }
  for (const [architecture, url] of Object.entries(product.repositoryUrl)) {
    if (!ARCHITECTURES.has(architecture) || !product.architectures.includes(architecture as LegacyVendorProduct['architectures'][number])) {
      throw new Error(`Vendor "${product.id}" repository URL mapping has an unsupported architecture: ${architecture}.`)
    }
    requireHttps(product, `repository URL for ${architecture}`, url)
  }
  for (const architecture of product.architectures) {
    if (!Object.hasOwn(product.repositoryUrl, architecture)) {
      throw new Error(`Vendor "${product.id}" repository URL mapping is missing architecture ${architecture}.`)
    }
  }
}

export function validateVendorCatalog(products: readonly LegacyVendorProduct[]): void {
  if (!Array.isArray(products)) throw new Error('Vendor catalog must be an array.')

  const ids = new Set<string>()
  const filenames = new Set<string>()
  const keyrings = new Set<string>()

  for (const product of products) {
    const id = typeof product?.id === 'string' ? product.id : '<unknown>'
    requireText(product, 'id', product?.id)
    if (!SAFE_VENDOR_ID.test(product.id)) {
      throw new Error(`Vendor "${id}" ID must be a safe lowercase ASCII slug.`)
    }
    requireText(product, 'name', product?.name)
    requireText(product, 'filename', product?.filename)
    if (product.filename !== `${product.id}.sources`) {
      throw new Error(`Vendor "${id}" filename must be exactly ${product.id}.sources.`)
    }
    requireText(product, 'category', product?.category)
    if (!CATEGORIES.has(product.category)) throw new Error(`Vendor "${id}" has an unknown category.`)
    if (product.icon !== undefined && !isVendorMdiIcon(product.icon)) {
      throw new Error(`Vendor "${id}" has an unknown Material Design icon.`)
    }

    if (ids.has(product.id)) throw new Error(`Vendor "${id}" has a duplicate ID.`)
    ids.add(product.id)
    if (filenames.has(product.filename)) throw new Error(`Vendor "${id}" has a duplicate filename.`)
    filenames.add(product.filename)
    if (keyrings.has(product.keyringPath)) throw new Error(`Vendor "${id}" has a duplicate keyring path.`)
    keyrings.add(product.keyringPath)

    requireHttps(product, 'documentation URL', product.documentationUrl)
    requireHttps(product, 'key URL', product.keyUrl)
    requireText(product, 'keyring path', product.keyringPath)
    const hasPathTraversal = /(^|\/)\.\.?($|\/)/.test(product.keyringPath) || product.keyringPath.includes('//')
    if (hasPathTraversal || !SAFE_KEYRING_PATH.test(product.keyringPath)) {
      throw new Error(`Vendor "${id}" keyring path is unsafe; use /etc/apt/keyrings or /usr/share/keyrings.`)
    }
    requireText(product, 'verification date', product.verifiedAt)
    if (product.fingerprints !== undefined) {
      if (!Array.isArray(product.fingerprints) || product.fingerprints.length === 0) {
        throw new Error(`Vendor "${id}" fingerprints must define a non-empty allowlist.`)
      }
      const normalizedFingerprints = new Set<string>()
      for (const fingerprint of product.fingerprints) {
        const normalized = typeof fingerprint === 'string'
          ? normalizeOpenPgpFingerprint(fingerprint)
          : ''
        if (!FULL_OPENPGP_FINGERPRINT.test(normalized)) {
          throw new Error(`Vendor "${id}" fingerprint must contain exactly 40 or 64 hexadecimal characters.`)
        }
        if (normalizedFingerprints.has(normalized)) {
          throw new Error(`Vendor "${id}" fingerprints must be unique after normalization.`)
        }
        normalizedFingerprints.add(normalized)
      }
    }

    if (!Array.isArray(product.packages) || product.packages.length === 0 || product.packages.some((value: unknown) => typeof value !== 'string' || value.trim() === '')) {
      throw new Error(`Vendor "${id}" must define at least one package.`)
    }
    if (!Array.isArray(product.architectures) || product.architectures.length === 0) {
      throw new Error(`Vendor "${id}" must define at least one architecture.`)
    }
    for (const architecture of product.architectures) {
      if (!ARCHITECTURES.has(architecture)) throw new Error(`Vendor "${id}" has an unknown architecture: ${String(architecture)}.`)
    }
    validateRepositoryUrl(product)
    if (!Array.isArray(product.releases) || product.releases.length === 0) {
      throw new Error(`Vendor "${id}" must define at least one release.`)
    }
    for (const release of product.releases) {
      if (!RELEASES.has(release)) throw new Error(`Vendor "${id}" has an unknown release: ${String(release)}.`)
    }
    const suites = typeof product.suite === 'string' ? [product.suite] : []
    if (typeof product.suite === 'string') requireText(product, 'suite', product.suite)
    else {
      if (!product.suite || typeof product.suite !== 'object' || Object.keys(product.suite).length === 0) {
        throw new Error(`Vendor "${id}" must define a suite.`)
      }
      for (const [release, suite] of Object.entries(product.suite)) {
        if (!RELEASES.has(release) || typeof suite !== 'string' || suite.trim() === '') {
          throw new Error(`Vendor "${id}" has an unknown or empty suite release: ${release}.`)
        }
      }
      for (const release of product.releases) {
        if (!(release in product.suite)) throw new Error(`Vendor "${id}" is missing a suite for release ${release}.`)
      }
      suites.push(...Object.values(product.suite))
    }

    const usesExactPathSuite = suites.includes('/')
    if (usesExactPathSuite && suites.some((suite) => suite !== '/')) {
      throw new Error(`Vendor "${id}" cannot mix exact-path and component suites.`)
    }
    if (!Array.isArray(product.components)) {
      throw new Error(`Vendor "${id}" must define components.`)
    }
    if (usesExactPathSuite) {
      if (product.components.length !== 0) {
        throw new Error(`Vendor "${id}" exact-path suites must not define components.`)
      }
    } else if (product.components.length === 0 || product.components.some((value: unknown) => typeof value !== 'string' || value.trim() === '')) {
      throw new Error(`Vendor "${id}" must define at least one component.`)
    }
  }
}

const SUPPORT_LEVELS = new Set(['explicit', 'generic-debian', 'repository-only'])
const PROVENANCE = new Set(['manufacturer', 'upstream', 'community-endorsed', 'debian-native'])
const KEY_FORMATS = new Set(['ascii-armored', 'binary'])
const AUXILIARY_DESTINATIONS = new Set(['debsig-policy', 'debsig-keyring'])

const repositoryError = (sourceId: string, message: string): Error =>
  new Error(`Repository source "${sourceId}" ${message}.`)

const productError = (productId: string, message: string): Error =>
  new Error(`Vendor "${productId}" ${message}.`)

const valueId = (value: unknown): string =>
  typeof value === 'object' && value !== null && typeof (value as { id?: unknown }).id === 'string'
    ? (value as { id: string }).id
    : '<unknown>'

const requireRepositoryText = (sourceId: string, field: string, value: unknown): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw repositoryError(sourceId, `is missing ${field} metadata`)
  }
  return value
}

const requireProductText = (productId: string, field: string, value: unknown): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw productError(productId, `is missing ${field} metadata`)
  }
  return value
}

const requireRepositoryHttps = (sourceId: string, field: string, value: unknown): void => {
  const urlValue = requireRepositoryText(sourceId, field, value)
  if (hasRawControlCharacter(urlValue)) {
    throw repositoryError(sourceId, `${field} must be a valid HTTPS URL`)
  }
  try {
    const url = new URL(urlValue)
    if (url.protocol !== 'https:' || !url.hostname) throw new Error('not HTTPS')
  } catch {
    throw repositoryError(sourceId, `${field} must be a valid HTTPS URL`)
  }
}

const requireClosedValues = (
  sourceId: string,
  field: string,
  values: unknown,
  allowed: ReadonlySet<string>,
): readonly string[] => {
  if (!Array.isArray(values) || values.length === 0) {
    throw repositoryError(sourceId, `must define at least one ${field}`)
  }
  const seen = new Set<string>()
  for (const value of values) {
    if (typeof value !== 'string' || !allowed.has(value)) {
      throw repositoryError(sourceId, `has an unknown ${field}: ${String(value)}`)
    }
    if (seen.has(value)) throw repositoryError(sourceId, `has a duplicate ${field}: ${value}`)
    seen.add(value)
  }
  return values
}

const requireSafePath = (sourceId: string, field: string, value: unknown): void => {
  const path = requireRepositoryText(sourceId, field, value)
  const hasPathTraversal = /(^|\/)\.\.?($|\/)/.test(path) || path.includes('\\') || path.includes('//')
  if (hasPathTraversal || !SAFE_KEYRING_PATH.test(path)) {
    throw repositoryError(sourceId, `${field} is unsafe; use /etc/apt/keyrings or /usr/share/keyrings`)
  }
}

const requireFingerprints = (sourceId: string, field: string, fingerprints: unknown, allowEmpty: boolean): void => {
  if (!Array.isArray(fingerprints) || (!allowEmpty && fingerprints.length === 0)) {
    throw repositoryError(sourceId, `${field} must define ${allowEmpty ? 'an array' : 'a non-empty allowlist'}`)
  }
  const normalizedFingerprints = new Set<string>()
  for (const fingerprint of fingerprints) {
    const normalized = typeof fingerprint === 'string' ? normalizeOpenPgpFingerprint(fingerprint) : ''
    if (!FULL_OPENPGP_FINGERPRINT.test(normalized)) {
      throw repositoryError(sourceId, `${field} must contain exactly 40 or 64 hexadecimal characters`)
    }
    if (normalizedFingerprints.has(normalized)) {
      throw repositoryError(sourceId, `${field} must be unique after normalization`)
    }
    normalizedFingerprints.add(normalized)
  }
}

const isExactPathSuite = (suite: string): boolean => suite === '/' || suite.endsWith('/')

const validateLocation = (sourceId: string, location: RepositoryLocation): void => {
  if (!location || typeof location !== 'object') throw repositoryError(sourceId, 'has an invalid location')
  requireRepositoryHttps(sourceId, 'location URL', location.uri)
  requireClosedValues(sourceId, 'location release', location.releases, RELEASES)
  requireClosedValues(sourceId, 'location architecture', location.architectures, ARCHITECTURES)
  const suite = requireRepositoryText(sourceId, 'location suite', location.suite)
  if (!Array.isArray(location.components)) throw repositoryError(sourceId, 'location components must be an array')
  if (isExactPathSuite(suite)) {
    if (location.components.length !== 0) {
      throw repositoryError(sourceId, 'exact-path locations must not define components')
    }
  } else if (location.components.length === 0 || location.components.some((component) => typeof component !== 'string' || component.trim() === '')) {
    throw repositoryError(sourceId, 'normal locations must define at least one component')
  }
  if (typeof location.supportLevel !== 'string' || !SUPPORT_LEVELS.has(location.supportLevel)) {
    throw repositoryError(sourceId, 'has an unknown location support level')
  }
}

const validateKey = (sourceId: string, key: RepositoryKey): void => {
  requireRepositoryText(sourceId, 'key ID', key?.id)
  if (!SAFE_VENDOR_ID.test(key.id)) throw repositoryError(sourceId, 'key ID must be a safe lowercase ASCII slug')
  requireRepositoryHttps(sourceId, 'key URL', key.url)
  requireSafePath(sourceId, 'keyring path', key.keyringPath)
  if (typeof key.format !== 'string' || !KEY_FORMATS.has(key.format)) {
    throw repositoryError(sourceId, 'has an unknown key format')
  }
  requireFingerprints(sourceId, 'key fingerprints', key.fingerprints, true)
  requireClosedValues(sourceId, 'key release', key.releases, RELEASES)
}

export function auxiliaryTrustDestinationPath(file: AuxiliaryTrustFile): string {
  if (!SAFE_VENDOR_ID.test(file.id)) {
    throw new Error(`Auxiliary trust file "${file.id}" must use a safe lowercase ASCII ID.`)
  }
  switch (file.destination) {
    case 'debsig-policy': return `/etc/debsig/policies/${file.id}.pol`
    case 'debsig-keyring': return `/usr/share/debsig/keyrings/${file.id}.gpg`
    default: throw new Error(`Unknown auxiliary trust destination: ${String(file.destination)}.`)
  }
}

const validateAuxiliaryTrustFile = (sourceId: string, file: AuxiliaryTrustFile): void => {
  requireRepositoryText(sourceId, 'auxiliary trust file ID', file?.id)
  if (!SAFE_VENDOR_ID.test(file.id)) throw repositoryError(sourceId, 'auxiliary trust file ID must be a safe lowercase ASCII slug')
  requireRepositoryHttps(sourceId, 'auxiliary trust file URL', file.url)
  if (typeof file.destination !== 'string' || !AUXILIARY_DESTINATIONS.has(file.destination)) {
    throw repositoryError(sourceId, 'has an unknown auxiliary trust destination')
  }
  auxiliaryTrustDestinationPath(file)
  requireRepositoryText(sourceId, 'auxiliary trust file media type', file.mediaType)
  if (file.fingerprint !== undefined) requireFingerprints(sourceId, 'auxiliary trust file fingerprint', [file.fingerprint], false)
}

const validateSource = (source: RepositorySource, keyrings: Map<string, string>): void => {
  const sourceId = valueId(source)
  requireRepositoryText(sourceId, 'id', source?.id)
  if (!SAFE_VENDOR_ID.test(source.id)) throw repositoryError(sourceId, 'ID must be a safe lowercase ASCII slug')
  requireRepositoryText(sourceId, 'name', source.name)
  requireRepositoryHttps(sourceId, 'documentation URL', source.documentationUrl)
  if (source.verifiedAt !== '2026-08-29') throw repositoryError(sourceId, 'must use verification date 2026-08-29')
  if (!Array.isArray(source.locations) || source.locations.length === 0) throw repositoryError(sourceId, 'must define at least one location')
  source.locations.forEach((location) => validateLocation(sourceId, location))
  if (!Array.isArray(source.keys) || source.keys.length === 0) throw repositoryError(sourceId, 'must define at least one key')
  const keyIds = new Set<string>()
  for (const key of source.keys) {
    validateKey(sourceId, key)
    if (keyIds.has(key.id)) throw repositoryError(sourceId, `has a duplicate key ID: ${key.id}`)
    keyIds.add(key.id)
    const definition = JSON.stringify({ url: key.url, format: key.format, fingerprints: key.fingerprints, releases: key.releases })
    const existing = keyrings.get(key.keyringPath)
    if (existing !== undefined && existing !== definition) throw repositoryError(sourceId, 'has a conflicting keyring definition')
    keyrings.set(key.keyringPath, definition)
  }
  const locationReleases = new Set(source.locations.flatMap((location) => location.releases))
  for (const release of locationReleases) {
    if (!source.keys.some((key) => key.releases.includes(release))) {
      throw repositoryError(sourceId, `is missing a key for release ${release}`)
    }
  }
  if (!Array.isArray(source.auxiliaryTrustFiles)) throw repositoryError(sourceId, 'auxiliary trust files must be an array')
  const auxiliaryIds = new Set<string>()
  for (const file of source.auxiliaryTrustFiles) {
    validateAuxiliaryTrustFile(sourceId, file)
    if (auxiliaryIds.has(file.id)) throw repositoryError(sourceId, `has a duplicate auxiliary trust file ID: ${file.id}`)
    auxiliaryIds.add(file.id)
  }
  if (!Array.isArray(source.preferenceFiles)) throw repositoryError(sourceId, 'preference files must be an array')
  const preferenceIds = new Set<string>()
  for (const file of source.preferenceFiles) {
    requireRepositoryText(sourceId, 'preference file ID', file?.id)
    if (!SAFE_VENDOR_ID.test(file.id)) throw repositoryError(sourceId, 'preference file ID must be a safe lowercase ASCII slug')
    requireRepositoryText(sourceId, 'preference file content', file.content)
    if (preferenceIds.has(file.id)) throw repositoryError(sourceId, `has a duplicate preference file ID: ${file.id}`)
    preferenceIds.add(file.id)
  }
  if (!Array.isArray(source.warnings) || source.warnings.some((warning) => typeof warning !== 'string' || warning.trim() === '')) {
    throw repositoryError(sourceId, 'warnings must be an array of non-empty keys')
  }
}

const validateProduct = (product: VendorProduct, sourceIds: ReadonlySet<string>, sources: ReadonlyMap<string, RepositorySource>): void => {
  const productId = valueId(product)
  requireProductText(productId, 'id', product?.id)
  if (!SAFE_VENDOR_ID.test(product.id)) throw productError(productId, 'ID must be a safe lowercase ASCII slug')
  requireProductText(productId, 'name', product.name)
  if (typeof product.category !== 'string' || !CATEGORIES.has(product.category)) throw productError(productId, 'has an unknown category')
  if (typeof product.icon !== 'string' || !isVendorMdiIcon(product.icon)) throw productError(productId, 'has an unknown Material Design icon')
  if (!Array.isArray(product.packages) || product.packages.length === 0 || product.packages.some((packageName) => typeof packageName !== 'string' || packageName.trim() === '')) {
    throw productError(productId, 'must define at least one package')
  }
  if (new Set(product.packages).size !== product.packages.length) throw productError(productId, 'has a duplicate package')
  const releases = requireClosedValuesForProduct(productId, 'release', product.supportedReleases, RELEASES)
  const architectures = requireClosedValuesForProduct(productId, 'architecture', product.supportedArchitectures, ARCHITECTURES)
  if (typeof product.supportLevel !== 'string' || !SUPPORT_LEVELS.has(product.supportLevel)) throw productError(productId, 'has an unknown support level')
  if (typeof product.provenance !== 'string' || !PROVENANCE.has(product.provenance)) throw productError(productId, 'has an unknown provenance')
  if (typeof product.securityCritical !== 'boolean') throw productError(productId, 'must declare whether it is security critical')
  if (!Array.isArray(product.warningKeys) || product.warningKeys.some((warning) => typeof warning !== 'string' || warning.trim() === '')) {
    throw productError(productId, 'warning keys must be an array of non-empty keys')
  }
  if (product.sourceId === null) {
    if (product.provenance !== 'debian-native') throw productError(productId, 'may use a null source ID only when provenance is debian-native')
  } else {
    const sourceId = requireProductText(productId, 'source ID', product.sourceId)
    if (product.provenance === 'debian-native') throw productError(productId, 'debian-native products must use a null source ID')
    if (!sourceIds.has(sourceId)) throw productError(productId, `references unknown source "${sourceId}"`)
    const source = sources.get(sourceId)
    if (!source) throw productError(productId, `references unknown source "${sourceId}"`)
    for (const release of releases) {
      for (const architecture of architectures) {
        if (!source.locations.some((location) => location.releases.includes(release as never) && location.architectures.includes(architecture as never))) {
          throw productError(productId, `source "${source.id}" is missing a location for ${release}/${architecture}`)
        }
      }
    }
  }
  if (product.provenance === 'community-endorsed' && product.securityCritical) {
    throw productError(productId, 'community-endorsed products cannot be security critical')
  }
}

const requireClosedValuesForProduct = (
  productId: string,
  field: string,
  values: unknown,
  allowed: ReadonlySet<string>,
): readonly string[] => {
  if (!Array.isArray(values) || values.length === 0) throw productError(productId, `must define at least one ${field}`)
  const seen = new Set<string>()
  for (const value of values) {
    if (typeof value !== 'string' || !allowed.has(value)) throw productError(productId, `has an unknown ${field}: ${String(value)}`)
    if (seen.has(value)) throw productError(productId, `has a duplicate ${field}: ${value}`)
    seen.add(value)
  }
  return values
}

export function validateRepositoryCatalog(sources: readonly RepositorySource[], products: readonly VendorProduct[]): void {
  if (!Array.isArray(sources)) throw new Error('Repository catalog sources must be an array.')
  if (!Array.isArray(products)) throw new Error('Repository catalog products must be an array.')
  const sourceIds = new Set<string>()
  const sourceById = new Map<string, RepositorySource>()
  const keyrings = new Map<string, string>()
  for (const source of sources) {
    const sourceId = valueId(source)
    if (sourceIds.has(sourceId)) throw repositoryError(sourceId, 'has a duplicate ID')
    validateSource(source, keyrings)
    sourceIds.add(source.id)
    sourceById.set(source.id, source)
  }
  const productIds = new Set<string>()
  const productsBySource = new Set<string>()
  for (const product of products) {
    const productId = valueId(product)
    if (productIds.has(productId)) throw productError(productId, 'has a duplicate ID')
    validateProduct(product, sourceIds, sourceById)
    productIds.add(product.id)
    if (product.sourceId !== null && typeof product.sourceId === 'string') productsBySource.add(product.sourceId)
  }
  for (const sourceId of sourceIds) {
    if (!productsBySource.has(sourceId)) throw repositoryError(sourceId, 'does not have a selectable product')
  }
}
