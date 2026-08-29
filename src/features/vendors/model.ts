import type { ReleaseCodename } from '../sources/model'
import type { VendorMdiIcon } from './icons'

export type VendorCategory =
  | 'browser'
  | 'communication'
  | 'privacy'
  | 'containers'
  | 'cloud'
  | 'development'
  | 'database'
  | 'monitoring'

export type SystemArchitecture = 'amd64' | 'arm64' | 'armhf' | 'i386'

export type VendorRepositoryUrl = string | Readonly<Partial<Record<SystemArchitecture, string>>>

export type OutputMode = 'perVendor' | 'combined' | 'byCategory'

export type RepositorySupportLevel = 'explicit' | 'generic-debian' | 'repository-only'

export type RepositoryProvenance = 'manufacturer' | 'upstream' | 'community-endorsed' | 'debian-native'

export type RepositoryKeyFormat = 'ascii-armored' | 'binary'

export type AuxiliaryTrustDestination = 'debsig-policy' | 'debsig-keyring'

/** A stable domain key resolved by the presentation layer. */
export type WarningKey = string

export interface RepositoryLocation {
  readonly uri: string
  readonly releases: readonly ReleaseCodename[]
  readonly architectures: readonly SystemArchitecture[]
  readonly suite: string
  readonly components: readonly string[]
  readonly supportLevel: RepositorySupportLevel
}

export interface RepositoryKey {
  readonly id: string
  readonly url: string
  readonly keyringPath: string
  readonly format: RepositoryKeyFormat
  /** Complete allowlist of manufacturer-published primary OpenPGP fingerprints. */
  readonly fingerprints: readonly string[]
  readonly releases: readonly ReleaseCodename[]
}

export interface AuxiliaryTrustFile {
  readonly id: string
  readonly url: string
  readonly destination: AuxiliaryTrustDestination
  readonly mediaType: string
  readonly fingerprint?: string
}

export interface PreferenceFileDefinition {
  readonly id: string
  readonly content: string
}

export interface RepositorySource {
  readonly id: string
  readonly name: string
  readonly documentationUrl: string
  readonly verifiedAt: '2026-08-29'
  readonly locations: readonly RepositoryLocation[]
  readonly keys: readonly RepositoryKey[]
  readonly auxiliaryTrustFiles: readonly AuxiliaryTrustFile[]
  readonly preferenceFiles: readonly PreferenceFileDefinition[]
  readonly warnings: readonly WarningKey[]
}

export interface VendorProduct {
  readonly id: string
  /**
   * Transitional optional properties keep the pre-source catalog type-safe until
   * its dedicated migration. validateRepositoryCatalog requires every field.
   */
  readonly sourceId?: string | null
  readonly name: string
  readonly category: VendorCategory
  /** Optional product pictogram for the selection UI; category icons remain the fallback. */
  readonly icon?: VendorMdiIcon
  readonly filename: string
  readonly documentationUrl: string
  readonly repositoryUrl: VendorRepositoryUrl
  readonly keyUrl: string
  readonly keyringPath: string
  readonly packages: readonly string[]
  readonly architectures: readonly SystemArchitecture[]
  readonly releases: readonly ReleaseCodename[]
  readonly suite: string | Readonly<Partial<Record<ReleaseCodename, string>>>
  readonly components: readonly string[]
  readonly verifiedAt: string
  /** Complete allowlist of vendor-published primary OpenPGP fingerprints. */
  readonly fingerprints?: readonly string[]
  readonly warning?: string
  readonly preferences?: string
  readonly supportedReleases?: readonly ReleaseCodename[]
  readonly supportedArchitectures?: readonly SystemArchitecture[]
  readonly supportLevel?: RepositorySupportLevel
  readonly provenance?: RepositoryProvenance
  readonly securityCritical?: boolean
  readonly warningKeys?: readonly WarningKey[]
}

export interface GeneratedArtifact {
  readonly filename: string
  readonly mediaType: string
  readonly description: string
  readonly content: string
  readonly category?: VendorCategory
  readonly productId?: string
  readonly productName?: string
  readonly riskNotes?: readonly string[]
}
