import { VENDOR_PRODUCTS } from './catalog'
import type { SystemArchitecture, VendorProduct } from './model'
import type { ReleaseCodename } from '../sources/model'

export type CompatibilityReason =
  | {
      readonly code: 'unsupported-release'
      readonly productId: string
      readonly release: ReleaseCodename
      readonly supportedReleases: readonly ReleaseCodename[]
    }
  | {
      readonly code: 'unsupported-architecture'
      readonly productId: string
      readonly architecture: SystemArchitecture
      readonly supportedArchitectures: readonly SystemArchitecture[]
    }

export type CompatibilityResult =
  | { readonly compatible: true }
  | { readonly compatible: false, readonly reason: CompatibilityReason }

export function getVendorCompatibility(
  product: VendorProduct,
  release: ReleaseCodename,
  architecture: SystemArchitecture,
): CompatibilityResult {
  if (!product.supportedReleases.includes(release)) {
    return {
      compatible: false,
      reason: {
        code: 'unsupported-release',
        productId: product.id,
        release,
        supportedReleases: product.supportedReleases,
      },
    }
  }
  if (!product.supportedArchitectures.includes(architecture)) {
    return {
      compatible: false,
      reason: {
        code: 'unsupported-architecture',
        productId: product.id,
        architecture,
        supportedArchitectures: product.supportedArchitectures,
      },
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
