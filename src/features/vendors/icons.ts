/** Icons verified against the bundled @mdi/font package by catalog.test.ts. */
export const VENDOR_MDI_ICONS = [
  'mdi-web',
  'mdi-message-text-outline',
  'mdi-shield-lock-outline',
  'mdi-cube-outline',
  'mdi-cloud-outline',
  'mdi-code-tags',
  'mdi-database-outline',
  'mdi-chart-line',
  'mdi-shield-check',
  'mdi-firefox',
  'mdi-google-chrome',
  'mdi-microsoft-edge',
  'mdi-compass-outline',
  'mdi-opera',
  'mdi-message-lock-outline',
  'mdi-vpn',
  'mdi-incognito',
  'mdi-docker',
  'mdi-ship-wheel',
  'mdi-google-cloud',
  'mdi-microsoft-azure',
  'mdi-github',
  'mdi-terraform',
  'mdi-elephant',
  'mdi-leaf',
  'mdi-chart-timeline-variant',
  'mdi-chip',
  'mdi-database-cog',
  'mdi-database-arrow-right-outline',
  'mdi-chart-areaspline',
  'mdi-server-security',
] as const

export type VendorMdiIcon = typeof VENDOR_MDI_ICONS[number]

export function isVendorMdiIcon(icon: string): icon is VendorMdiIcon {
  return (VENDOR_MDI_ICONS as readonly string[]).includes(icon)
}
