import type { SupportedLocale } from '../i18n/locales'
import type { SiteCopy } from '../site/locales'
import type { DebianRelease } from '../features/sources/model'
import type { VendorProduct } from '../features/vendors/model'
import type { WorkbenchState } from './state'

export type WorkbenchHydrationProduct = Omit<VendorProduct, 'icon'>

export interface WorkbenchHydrationManifest {
  readonly releases: readonly DebianRelease[]
  readonly products: readonly WorkbenchHydrationProduct[]
}

export const toWorkbenchHydrationProduct = (product: VendorProduct): WorkbenchHydrationProduct => {
  const hydrationProduct: { -readonly [Key in keyof VendorProduct]?: VendorProduct[Key] } = { ...product }
  delete hydrationProduct.icon
  return hydrationProduct as WorkbenchHydrationProduct
}

export interface WorkbenchHydrationPayload {
  readonly locale: SupportedLocale
  readonly path: string
  readonly basePath: string
  readonly siteOrigin: string
  readonly copy: SiteCopy
  readonly state: WorkbenchState
  readonly manifest: WorkbenchHydrationManifest
}
