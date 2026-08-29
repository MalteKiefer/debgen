import { VENDOR_PRODUCTS } from '../../src/features/vendors/catalog'
import { RELEASES } from '../../src/features/sources/releases'
import { en } from '../../src/site/locales/en'
import { toWorkbenchHydrationProduct, type WorkbenchHydrationPayload } from '../../src/workbench/types'

export const testPayload: WorkbenchHydrationPayload = {
  locale: 'en',
  path: '/en/',
  basePath: '/',
  siteOrigin: 'https://debgen.org',
  copy: en,
  state: {
    activeStep: 'review',
    release: 'trixie',
    architecture: 'amd64',
    format: 'deb822',
    includeSource: true,
    includeSecurity: true,
    includeUpdates: true,
    includeBackports: false,
    components: ['main', 'non-free-firmware'],
    repositories: ['brave-browser'],
    outputMode: 'combined',
  },
  manifest: {
    releases: RELEASES,
    products: VENDOR_PRODUCTS.map(toWorkbenchHydrationProduct),
  },
}
