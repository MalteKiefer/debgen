import { getVendorCompatibility } from '../features/vendors/compatibility'
import type { CompatibilityReason } from '../features/vendors/compatibility'
import type { OutputMode, SystemArchitecture } from '../features/vendors/model'
import type { WorkbenchManifest, WorkbenchState, WorkbenchStep } from './state'

export type { WorkbenchManifest } from './state'

export interface StepValidationIssue {
  readonly field: keyof WorkbenchState | 'repositories'
  readonly code: string
  readonly value?: string
}

export interface StepValidation {
  readonly valid: boolean
  readonly issues: readonly StepValidationIssue[]
}

export type ReconciliationRemoval =
  | {
      readonly id: string
      readonly code: 'unknown-repository' | 'duplicate-repository'
    }
  | ({ readonly id: string } & CompatibilityReason)

export interface ReconcileResult {
  readonly state: WorkbenchState
  readonly removed: readonly ReconciliationRemoval[]
}

const OUTPUT_MODES: readonly OutputMode[] = ['perVendor', 'combined', 'byCategory']

const compareCodePoints = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0

const knownArchitectures = (manifest: WorkbenchManifest): ReadonlySet<SystemArchitecture> => new Set(
  manifest.products.flatMap((product) => product.supportedArchitectures),
)

const releaseFor = (manifest: WorkbenchManifest, codename: string) => manifest.releases.find((release) => release.codename === codename)

function validateSystem(state: WorkbenchState, manifest: WorkbenchManifest): StepValidationIssue[] {
  const issues: StepValidationIssue[] = []
  const release = releaseFor(manifest, state.release)
  if (!release) {
    issues.push({ field: 'release', code: 'unknown-release', value: state.release })
  }
  if (!knownArchitectures(manifest).has(state.architecture)) {
    issues.push({ field: 'architecture', code: 'unknown-architecture', value: state.architecture })
  }
  if (release && !release.formats.includes(state.format)) {
    issues.push({ field: 'format', code: 'unsupported-format', value: state.format })
  }
  return issues
}

function validateDebian(state: WorkbenchState, manifest: WorkbenchManifest): StepValidationIssue[] {
  const issues = validateSystem(state, manifest)
  const release = releaseFor(manifest, state.release)
  if (!state.components.includes('main')) {
    issues.push({ field: 'components', code: 'main-required' })
  }
  if (release && state.components.some((component) => !release.components.includes(component))) {
    issues.push({ field: 'components', code: 'unsupported-component' })
  }
  if (release && state.includeSecurity && !release.capabilities.security) {
    issues.push({ field: 'includeSecurity', code: 'unsupported-suite' })
  }
  if (release && state.includeUpdates && !release.capabilities.updates) {
    issues.push({ field: 'includeUpdates', code: 'unsupported-suite' })
  }
  if (release && state.includeBackports && !release.capabilities.backports) {
    issues.push({ field: 'includeBackports', code: 'unsupported-suite' })
  }
  return issues
}

function validateRepositories(state: WorkbenchState, manifest: WorkbenchManifest): StepValidationIssue[] {
  const issues = validateDebian(state, manifest)
  const products = new Map(manifest.products.map((product) => [product.id, product]))
  for (const id of state.repositories) {
    const product = products.get(id)
    if (!product) {
      issues.push({ field: 'repositories', code: 'unknown-repository', value: id })
      continue
    }
    const compatibility = getVendorCompatibility(product, state.release, state.architecture)
    if (!compatibility.compatible) {
      issues.push({ field: 'repositories', code: compatibility.reason.code, value: id })
    }
  }
  if (!OUTPUT_MODES.includes(state.outputMode)) {
    issues.push({ field: 'outputMode', code: 'unsupported-output-mode', value: state.outputMode })
  }
  return issues
}

export function validateStep(step: WorkbenchStep, state: WorkbenchState, manifest: WorkbenchManifest): StepValidation {
  const issues = step === 'system'
    ? validateSystem(state, manifest)
    : step === 'debian'
      ? validateDebian(state, manifest)
      : validateRepositories(state, manifest)
  return { valid: issues.length === 0, issues }
}

export function reconcileCompatibility(state: WorkbenchState, manifest: WorkbenchManifest): ReconcileResult {
  const products = new Map(manifest.products.map((product) => [product.id, product]))
  const repositories: string[] = []
  const removed: ReconciliationRemoval[] = []
  const seen = new Set<string>()

  for (const id of state.repositories) {
    if (seen.has(id)) {
      removed.push({ id, code: 'duplicate-repository' })
      continue
    }
    seen.add(id)
    const product = products.get(id)
    if (!product) {
      removed.push({ id, code: 'unknown-repository' })
      continue
    }
    const compatibility = getVendorCompatibility(product, state.release, state.architecture)
    if (!compatibility.compatible) {
      removed.push({ id, ...compatibility.reason })
      continue
    }
    repositories.push(id)
  }

  return {
    state: { ...state, components: [...state.components], repositories: repositories.sort(compareCodePoints) },
    removed,
  }
}
