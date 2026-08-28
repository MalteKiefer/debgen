import type { VendorProduct } from './model'
import { isVendorMdiIcon } from './icons'

const RELEASES = new Set(['trixie', 'bookworm', 'bullseye', 'forky', 'sid'])
const ARCHITECTURES = new Set(['amd64', 'arm64', 'armhf', 'i386'])
const CATEGORIES = new Set(['browser', 'communication', 'privacy', 'containers', 'cloud', 'development', 'database', 'monitoring'])
const SAFE_VENDOR_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const requireText = (product: VendorProduct, field: string, value: unknown): void => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Vendor "${product.id}" is missing ${field} metadata.`)
  }
}

const requireHttps = (product: VendorProduct, field: string, value: unknown): void => {
  requireText(product, field, value)
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

const validateRepositoryUrl = (product: VendorProduct): void => {
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
    if (!ARCHITECTURES.has(architecture) || !product.architectures.includes(architecture as VendorProduct['architectures'][number])) {
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

export function validateVendorCatalog(products: readonly VendorProduct[]): void {
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
    if (hasPathTraversal
      || (!product.keyringPath.startsWith('/etc/apt/keyrings/') && !product.keyringPath.startsWith('/usr/share/keyrings/'))) {
      throw new Error(`Vendor "${id}" keyring path is unsafe; use /etc/apt/keyrings or /usr/share/keyrings.`)
    }
    requireText(product, 'verification date', product.verifiedAt)
    if (product.fingerprint !== undefined && !/^[A-Fa-f0-9\s]+$/.test(product.fingerprint)) {
      throw new Error('Vendor "' + id + '" fingerprint must contain hexadecimal characters only.')
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
