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
  readonly sourceId: string | null
  readonly name: string
  readonly category: VendorCategory
  readonly icon: VendorMdiIcon
  readonly packages: readonly string[]
  readonly supportedReleases: readonly ReleaseCodename[]
  readonly supportedArchitectures: readonly SystemArchitecture[]
  readonly supportLevel: RepositorySupportLevel
  readonly provenance: RepositoryProvenance
  readonly securityCritical: boolean
  readonly warningKeys: readonly WarningKey[]
  /** Retained for the byte-compatible legacy vendor manifest. */
  readonly verifiedAt?: string
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
