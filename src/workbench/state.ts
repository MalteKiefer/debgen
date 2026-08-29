import type { DebianRelease, ReleaseCodename, SourceFormat } from '../features/sources/model'
import { getRelease } from '../features/sources/releases'
import type { OutputMode, SystemArchitecture, VendorProduct } from '../features/vendors/model'

export const WORKBENCH_STEPS = ['system', 'debian', 'repositories', 'review', 'export'] as const

export type WorkbenchStep = typeof WORKBENCH_STEPS[number]

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

export function createStateForRelease(release: DebianRelease): WorkbenchState {
  return {
    activeStep: 'system',
    release: release.codename,
    architecture: 'amd64',
    format: release.formats[0] as SourceFormat,
    includeSource: false,
    includeSecurity: release.capabilities.security,
    includeUpdates: release.capabilities.updates,
    includeBackports: release.capabilities.backports,
    components: [...release.recommendedComponents],
    repositories: [],
    outputMode: 'perVendor',
  }
}

export function createDefaultState(): WorkbenchState {
  return createStateForRelease(getRelease())
}

export function reduceWorkbenchState(state: WorkbenchState, action: WorkbenchAction): WorkbenchState {
  switch (action.type) {
    case 'set-active-step':
      return { ...state, activeStep: action.activeStep, components: [...state.components], repositories: [...state.repositories] }
    case 'set-system':
      return {
        ...state,
        release: action.release,
        architecture: action.architecture,
        format: action.format,
        components: [...state.components],
        repositories: [...state.repositories],
      }
    case 'set-official-sources':
      return {
        ...state,
        includeSource: action.includeSource,
        includeSecurity: action.includeSecurity,
        includeUpdates: action.includeUpdates,
        includeBackports: action.includeBackports,
        components: uniqueSorted(action.components),
        repositories: [...state.repositories],
      }
    case 'set-repositories':
      return { ...state, components: [...state.components], repositories: uniqueSorted(action.repositories) }
    case 'set-output-mode':
      return { ...state, components: [...state.components], repositories: [...state.repositories], outputMode: action.outputMode }
  }
}
