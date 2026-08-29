import type { DebianRelease, ReleaseCodename, SourceFormat } from '../features/sources/model'
import { getRelease, RELEASES } from '../features/sources/releases'
import { VENDOR_PRODUCTS } from '../features/vendors/catalog'
import type { OutputMode, SystemArchitecture, VendorProduct } from '../features/vendors/model'
import type { WorkbenchStep } from './steps'
import { reconcileCompatibility, type ReconcileResult } from './validation'

export { WORKBENCH_STEPS, type WorkbenchStep } from './steps'

export interface WorkbenchState {
  readonly activeStep: WorkbenchStep
  readonly release: ReleaseCodename
  readonly architecture: SystemArchitecture
  readonly format: SourceFormat
  readonly includeSource: boolean
  readonly includeSecurity: boolean
  readonly includeUpdates: boolean
  readonly includeBackports: boolean
  readonly components: readonly string[]
  readonly repositories: readonly string[]
  readonly outputMode: OutputMode
}

export interface WorkbenchManifest {
  readonly releases: readonly DebianRelease[]
  readonly products: readonly VendorProduct[]
}

export const DEFAULT_WORKBENCH_MANIFEST: WorkbenchManifest = {
  releases: RELEASES,
  products: VENDOR_PRODUCTS,
}

export type WorkbenchAction =
  | {
      readonly type: 'set-active-step'
      readonly activeStep: WorkbenchStep
    }
  | {
      readonly type: 'set-system'
      readonly release: ReleaseCodename
      readonly architecture: SystemArchitecture
      readonly format: SourceFormat
    }
  | {
      readonly type: 'set-official-sources'
      readonly includeSource: boolean
      readonly includeSecurity: boolean
      readonly includeUpdates: boolean
      readonly includeBackports: boolean
      readonly components: readonly string[]
    }
  | {
      readonly type: 'set-repositories'
      readonly repositories: readonly string[]
    }
  | {
      readonly type: 'set-output-mode'
      readonly outputMode: OutputMode
    }

const compareCodePoints = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0

const uniqueSorted = (values: readonly string[]): string[] => [...new Set(values)].sort(compareCodePoints)

const OUTPUT_MODES: readonly OutputMode[] = ['perVendor', 'combined', 'byCategory']

export function createStateForRelease(release: DebianRelease): WorkbenchState {
  return {
    activeStep: 'system',
    release: release.codename,
    architecture: 'amd64',
    format: release.formats[0] as SourceFormat,
    includeSource: false,
    includeSecurity: release.capabilities.security,
    includeUpdates: release.capabilities.updates,
    includeBackports: false,
    components: [...release.recommendedComponents],
    repositories: [],
    outputMode: 'perVendor',
  }
}

export function createDefaultState(): WorkbenchState {
  return createStateForRelease(getRelease())
}

function normalizeForRelease(state: WorkbenchState, release: DebianRelease): WorkbenchState {
  const requestedComponents = new Set(state.components)
  return {
    ...state,
    release: release.codename,
    format: release.formats.includes(state.format) ? state.format : release.formats[0] as SourceFormat,
    includeSecurity: state.includeSecurity && release.capabilities.security,
    includeUpdates: state.includeUpdates && release.capabilities.updates,
    includeBackports: state.includeBackports && release.capabilities.backports,
    components: release.components.filter((component) => component === 'main' || requestedComponents.has(component)),
    repositories: [...state.repositories],
    outputMode: OUTPUT_MODES.includes(state.outputMode) ? state.outputMode : 'perVendor',
  }
}

const reconcile = (state: WorkbenchState): ReconcileResult => reconcileCompatibility(state, DEFAULT_WORKBENCH_MANIFEST)

export function reduceWorkbenchState(state: WorkbenchState, action: WorkbenchAction): ReconcileResult {
  switch (action.type) {
    case 'set-active-step':
      return reconcile(normalizeForRelease({
        ...state,
        activeStep: action.activeStep,
        components: [...state.components],
        repositories: [...state.repositories],
      }, getRelease(state.release)))
    case 'set-system': {
      const release = getRelease(action.release)
      return reconcile(normalizeForRelease({
        ...state,
        release: release.codename,
        architecture: action.architecture,
        format: action.format,
        components: [...state.components],
        repositories: [...state.repositories],
      }, release))
    }
    case 'set-official-sources':
      return reconcile(normalizeForRelease({
        ...state,
        includeSource: action.includeSource,
        includeSecurity: action.includeSecurity,
        includeUpdates: action.includeUpdates,
        includeBackports: action.includeBackports,
        components: uniqueSorted(action.components),
        repositories: [...state.repositories],
      }, getRelease(state.release)))
    case 'set-repositories':
      return reconcile(normalizeForRelease({
        ...state,
        components: [...state.components],
        repositories: [...action.repositories],
      }, getRelease(state.release)))
    case 'set-output-mode':
      return reconcile(normalizeForRelease({
        ...state,
        components: [...state.components],
        repositories: [...state.repositories],
        outputMode: action.outputMode,
      }, getRelease(state.release)))
  }
}
