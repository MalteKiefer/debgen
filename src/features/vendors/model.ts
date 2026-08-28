import type { ReleaseCodename } from '../sources/model'

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

export interface VendorProduct {
  readonly id: string
  readonly name: string
  readonly category: VendorCategory
  /** Optional product pictogram for the selection UI; category icons remain the fallback. */
  readonly icon?: string
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
  /** Vendor-published OpenPGP fingerprint, normalized during installation. */
  readonly fingerprint?: string
  readonly warning?: string
  readonly preferences?: string
}

export interface GeneratedArtifact {
  readonly filename: string
  readonly mediaType: string
  readonly description: string
  readonly content: string
  readonly category?: VendorCategory
  readonly productId?: string
  readonly riskNotes?: readonly string[]
}
