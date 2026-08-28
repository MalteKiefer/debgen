export type ReleaseCodename = 'trixie' | 'bookworm' | 'bullseye' | 'forky' | 'sid'

export type SourceFormat = 'deb822' | 'legacy'

export interface SourceOptions {
  release: ReleaseCodename
  format: SourceFormat
  includeSource: boolean
  includeSecurity: boolean
  includeUpdates: boolean
  includeBackports: boolean
  components: readonly string[]
}

export interface ReleaseCapabilities {
  security: boolean
  updates: boolean
  backports: boolean
}

export interface ReleaseSuites {
  base: string
  security?: string
  updates?: string
  backports?: string
}

export interface DebianRelease {
  codename: ReleaseCodename
  status: string
  formats: SourceFormat[]
  components: string[]
  recommendedComponents: string[]
  keyring: string
  baseUri: string
  securityUri: string
  suites: ReleaseSuites
  capabilities: ReleaseCapabilities
}
