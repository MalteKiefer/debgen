import type { OutputMode } from '../features/vendors/model'
import { getRelease } from '../features/sources/releases'
import { createDefaultState, createStateForRelease, DEFAULT_WORKBENCH_MANIFEST, type WorkbenchManifest, type WorkbenchState, type WorkbenchStep, WORKBENCH_STEPS } from './state'
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

function scalarValue(
  url: URL,
  name: string,
  warnings: UrlStateWarning[],
  code: UrlStateWarning['code'],
): string | null {
  const values = url.searchParams.getAll(name)
  if (values.length === 0) return null
  if (new Set(values).size !== 1) {
    addWarning(warnings, code, name, values.join(','))
    return null
  }
  return values[0] as string
}

export function parseWorkbenchUrl(url: URL, manifest: WorkbenchManifest): ParsedWorkbenchState {
  const warnings: UrlStateWarning[] = []
  const releaseValue = scalarValue(url, 'release', warnings, 'invalid-release')
  const requestedRelease = safeValue(releaseValue) ? manifest.releases.find((release) => release.codename === releaseValue) : undefined
  if (releaseValue !== null && !requestedRelease) addWarning(warnings, 'invalid-release', 'release', releaseValue)
  const release = requestedRelease ?? manifest.releases[0]
  if (!release) throw new Error('Workbench manifest requires at least one Debian release.')

  let state = createStateForRelease(release)
  const architectures = new Set(manifest.products.flatMap((product) => product.supportedArchitectures))
  const architecture = scalarValue(url, 'arch', warnings, 'invalid-architecture')
  if (architecture !== null) {
    if (safeValue(architecture) && architectures.has(architecture as typeof state.architecture)) {
      state = { ...state, architecture: architecture as typeof state.architecture }
    } else {
      addWarning(warnings, 'invalid-architecture', 'arch', architecture)
    }
  }

  const format = scalarValue(url, 'format', warnings, 'invalid-format')
  if (format !== null) {
    if (safeValue(format) && release.formats.includes(format as typeof state.format)) {
      state = { ...state, format: format as typeof state.format }
    } else {
      addWarning(warnings, 'invalid-format', 'format', format)
    }
  }

  const source = scalarValue(url, 'source', warnings, 'invalid-source-option')
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
    const components = new Set<string>()
    const seen = new Set<string>()
    for (const component of requestedComponents) {
      if (!safeValue(component) || !release.components.includes(component) || seen.has(component)) {
        addWarning(warnings, 'invalid-component', 'component', component)
        continue
      }
      seen.add(component)
      components.add(component)
    }
    state = { ...state, components: release.components.filter((component) => component === 'main' || components.has(component)) }
  }

  const repositories = url.searchParams.getAll('repo')
  state = { ...state, repositories: repositories.filter((id) => {
    if (!safeValue(id) || !manifest.products.some((product) => product.id === id)) {
      addWarning(warnings, 'invalid-repository', 'repo', id)
      return false
    }
    return true
  }) }

  const mode = scalarValue(url, 'mode', warnings, 'invalid-output-mode')
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
  let safeState = state
  let release
  try {
    release = getRelease(state.release)
  } catch {
    safeState = createDefaultState()
    release = getRelease(safeState.release)
  }
  safeState = reconcileCompatibility(safeState, DEFAULT_WORKBENCH_MANIFEST).state
  const params = new URLSearchParams()
  params.set('release', safeState.release)
  params.set('arch', safeState.architecture)
  params.set('format', safeState.format)
  if (safeState.includeSource) params.set('source', '1')
  const defaults = createStateForRelease(release)
  const hasDefaultSuites = safeState.includeSecurity === defaults.includeSecurity
    && safeState.includeUpdates === defaults.includeUpdates
    && safeState.includeBackports === defaults.includeBackports
  if (!hasDefaultSuites) {
    params.append('suite', 'base')
    if (safeState.includeSecurity) params.append('suite', 'security')
    if (safeState.includeUpdates) params.append('suite', 'updates')
    if (safeState.includeBackports) params.append('suite', 'backports')
  }
  const components = [...new Set(safeState.components)].sort(compareCodePoints)
  const defaultComponents = [...defaults.components].sort(compareCodePoints)
  if (!sameValues(components, defaultComponents)) {
    for (const component of components) params.append('component', component)
  }
  for (const repository of safeState.repositories) params.append('repo', repository)
  if (safeState.outputMode !== 'perVendor') params.set('mode', safeState.outputMode)
  return params
}
