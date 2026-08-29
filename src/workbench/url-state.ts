import type { OutputMode } from '../features/vendors/model'
import { getRelease } from '../features/sources/releases'
import { createStateForRelease, type WorkbenchManifest, type WorkbenchState, type WorkbenchStep, WORKBENCH_STEPS } from './state'
import { reconcileCompatibility } from './validation'

export type { WorkbenchManifest } from './state'

export interface UrlStateWarning {
  readonly code: 'invalid-step' | 'invalid-release' | 'invalid-architecture' | 'invalid-format' | 'invalid-source-option' | 'invalid-suite' | 'invalid-component' | 'invalid-repository' | 'incompatible-repository' | 'invalid-output-mode'
  readonly field: string
  readonly value: string
}

export interface ParsedWorkbenchState {
  readonly state: WorkbenchState
  readonly warnings: readonly UrlStateWarning[]
}

const OUTPUT_MODES: readonly OutputMode[] = ['perVendor', 'combined', 'byCategory']
const SUITES = ['base', 'security', 'updates', 'backports'] as const

const hasControlCharacter = (value: string): boolean => [...value].some((character) => {
  const code = character.charCodeAt(0)
  return code <= 0x1f || code === 0x7f
})

const compareCodePoints = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0

const sameValues = (left: readonly string[], right: readonly string[]): boolean => left.length === right.length
  && left.every((value, index) => value === right[index])

const isWorkbenchStep = (value: string): value is WorkbenchStep => (WORKBENCH_STEPS as readonly string[]).includes(value)

const addWarning = (warnings: UrlStateWarning[], code: UrlStateWarning['code'], field: string, value: string): void => {
  warnings.push({ code, field, value })
}

const safeValue = (value: string | null): value is string => value !== null && !hasControlCharacter(value)

export function parseWorkbenchUrl(url: URL, manifest: WorkbenchManifest): ParsedWorkbenchState {
  const warnings: UrlStateWarning[] = []
  const releaseValue = url.searchParams.get('release')
  const requestedRelease = safeValue(releaseValue) ? manifest.releases.find((release) => release.codename === releaseValue) : undefined
  if (releaseValue !== null && !requestedRelease) addWarning(warnings, 'invalid-release', 'release', releaseValue)
  const release = requestedRelease ?? manifest.releases[0]
  if (!release) throw new Error('Workbench manifest requires at least one Debian release.')

  let state = createStateForRelease(release)
  const architectures = new Set(manifest.products.flatMap((product) => product.supportedArchitectures))
  const architecture = url.searchParams.get('arch')
  if (architecture !== null) {
    if (safeValue(architecture) && architectures.has(architecture as typeof state.architecture)) {
      state = { ...state, architecture: architecture as typeof state.architecture }
    } else {
      addWarning(warnings, 'invalid-architecture', 'arch', architecture)
    }
  }

  const format = url.searchParams.get('format')
  if (format !== null) {
    if (safeValue(format) && release.formats.includes(format as typeof state.format)) {
      state = { ...state, format: format as typeof state.format }
    } else {
      addWarning(warnings, 'invalid-format', 'format', format)
    }
  }

  const source = url.searchParams.get('source')
  if (source !== null) {
    if (source === '1') state = { ...state, includeSource: true }
    else if (source === '0') state = { ...state, includeSource: false }
    else addWarning(warnings, 'invalid-source-option', 'source', source)
  }

  const requestedSuites = url.searchParams.getAll('suite')
  if (requestedSuites.length > 0) {
    let includeSecurity = false
    let includeUpdates = false
    let includeBackports = false
    for (const suite of requestedSuites) {
      if (!safeValue(suite) || !SUITES.includes(suite as typeof SUITES[number])) {
        addWarning(warnings, 'invalid-suite', 'suite', suite)
        continue
      }
      if (suite === 'security' && release.capabilities.security) includeSecurity = true
      else if (suite === 'updates' && release.capabilities.updates) includeUpdates = true
      else if (suite === 'backports' && release.capabilities.backports) includeBackports = true
      else if (suite !== 'base') addWarning(warnings, 'invalid-suite', 'suite', suite)
    }
    state = { ...state, includeSecurity, includeUpdates, includeBackports }
  }

  const requestedComponents = url.searchParams.getAll('component')
  if (requestedComponents.length > 0) {
    const components: string[] = []
    const seen = new Set<string>()
    for (const component of requestedComponents) {
      if (!safeValue(component) || !release.components.includes(component) || seen.has(component)) {
        addWarning(warnings, 'invalid-component', 'component', component)
        continue
      }
      seen.add(component)
      components.push(component)
    }
    state = { ...state, components }
  }

  const repositories = url.searchParams.getAll('repo')
  state = { ...state, repositories: repositories.filter((id) => {
    if (!safeValue(id) || !manifest.products.some((product) => product.id === id)) {
      addWarning(warnings, 'invalid-repository', 'repo', id)
      return false
    }
    return true
  }) }

  const mode = url.searchParams.get('mode')
  if (mode !== null) {
    if (safeValue(mode) && OUTPUT_MODES.includes(mode as OutputMode)) state = { ...state, outputMode: mode as OutputMode }
    else addWarning(warnings, 'invalid-output-mode', 'mode', mode)
  }

  const hash = url.hash.slice(1)
  if (hash) {
    if (safeValue(hash) && isWorkbenchStep(hash)) state = { ...state, activeStep: hash }
    else addWarning(warnings, 'invalid-step', 'hash', hash)
  }

  const reconciled = reconcileCompatibility(state, manifest)
  for (const removal of reconciled.removed) {
    if (removal.code === 'duplicate-repository') {
      addWarning(warnings, 'invalid-repository', 'repo', removal.id)
    } else if (removal.code !== 'unknown-repository') {
      addWarning(warnings, 'incompatible-repository', 'repo', removal.id)
    }
  }
  return { state: reconciled.state, warnings }
}

export function serializeWorkbenchUrl(state: WorkbenchState): URLSearchParams {
  const params = new URLSearchParams()
  params.set('release', state.release)
  params.set('arch', state.architecture)
  params.set('format', state.format)
  if (state.includeSource) params.set('source', '1')
  const release = getRelease(state.release)
  const hasDefaultSuites = state.includeSecurity === release.capabilities.security
    && state.includeUpdates === release.capabilities.updates
    && state.includeBackports === release.capabilities.backports
  if (!hasDefaultSuites) {
    params.append('suite', 'base')
    if (state.includeSecurity) params.append('suite', 'security')
    if (state.includeUpdates) params.append('suite', 'updates')
    if (state.includeBackports) params.append('suite', 'backports')
  }
  const components = [...new Set(state.components)].sort(compareCodePoints)
  const defaultComponents = [...release.recommendedComponents].sort(compareCodePoints)
  if (!sameValues(components, defaultComponents)) {
    for (const component of components) params.append('component', component)
  }
  for (const repository of [...new Set(state.repositories)].sort(compareCodePoints)) params.append('repo', repository)
  if (state.outputMode !== 'perVendor') params.set('mode', state.outputMode)
  return params
}
