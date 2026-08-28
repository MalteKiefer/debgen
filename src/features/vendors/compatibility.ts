import { VENDOR_PRODUCTS } from './catalog'
import type { VendorProduct, SystemArchitecture } from './model'
import type { ReleaseCodename } from '../sources/model'

export interface VendorCompatibility {
  readonly compatible: boolean
  readonly reason?: string
}

/** Check a product against the release and architecture metadata in the catalog. */
export function getVendorCompatibility(
  product: VendorProduct,
  release: ReleaseCodename,
  architecture: SystemArchitecture,
): VendorCompatibility {
  if (!product.releases.includes(release)) {
    return {
      compatible: false,
      reason: `Das Release „${release}“ wird von ${product.name} nicht unterstützt. Unterstützte Releases: ${product.releases.join(', ')}.`,
    }
  }

  if (!product.architectures.includes(architecture)) {
    return {
      compatible: false,
      reason: `Die Architektur „${architecture}“ wird von ${product.name} nicht unterstützt. Unterstützte Architekturen: ${product.architectures.join(', ')}.`,
    }
  }

  return { compatible: true }
}

export function compatibleProducts(
  release: ReleaseCodename,
  architecture: SystemArchitecture,
): readonly VendorProduct[]
export function compatibleProducts(
  products: readonly VendorProduct[],
  release: ReleaseCodename,
  architecture: SystemArchitecture,
): readonly VendorProduct[]
export function compatibleProducts(
  productsOrRelease: readonly VendorProduct[] | ReleaseCodename,
  releaseOrArchitecture: ReleaseCodename | SystemArchitecture,
  architecture?: SystemArchitecture,
): readonly VendorProduct[] {
  const usingCatalog = typeof productsOrRelease === 'string'
  const products = usingCatalog ? VENDOR_PRODUCTS : productsOrRelease
  const release = usingCatalog ? productsOrRelease : releaseOrArchitecture as ReleaseCodename
  const selectedArchitecture = usingCatalog ? releaseOrArchitecture as SystemArchitecture : architecture as SystemArchitecture

  return products.filter((product) => getVendorCompatibility(product, release, selectedArchitecture).compatible)
}
