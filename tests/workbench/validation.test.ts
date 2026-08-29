import { describe, expect, it } from 'vitest'
import { RELEASES } from '../../src/features/sources/releases'
import { VENDOR_PRODUCTS } from '../../src/features/vendors/catalog'
import { createDefaultState } from '../../src/workbench/state'
import {
  reconcileCompatibility,
  validateStep,
  type WorkbenchManifest,
} from '../../src/workbench/validation'

const testManifest: WorkbenchManifest = {
  releases: RELEASES,
  products: VENDOR_PRODUCTS,
}

describe('Workbench validation', () => {
  it('accepts a complete Debian-only configuration at every step', () => {
    const state = createDefaultState()

    expect(validateStep('system', state, testManifest)).toEqual({ valid: true, issues: [] })
    expect(validateStep('repositories', state, testManifest)).toEqual({ valid: true, issues: [] })
    expect(validateStep('review', state, testManifest)).toEqual({ valid: true, issues: [] })
  })

  it('blocks Debian progression when main is absent or an unsupported suite is selected', () => {
    const state = {
      ...createDefaultState(),
      components: ['non-free-firmware'],
      includeBackports: true,
      release: 'bullseye' as const,
      format: 'legacy' as const,
    }

    const validation = validateStep('system', state, testManifest)

    expect(validation.valid).toBe(false)
    expect(validation.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'components', code: 'main-required' }),
      expect.objectContaining({ field: 'includeBackports', code: 'unsupported-suite' }),
    ]))
  })

  it('removes every incompatible or unknown repository while preserving compatible selections', () => {
    const result = reconcileCompatibility({
      ...createDefaultState(),
      release: 'trixie' as const,
      architecture: 'arm64' as const,
      repositories: ['docker-engine', 'mongodb-community-8-0', 'unknown-product'],
    }, testManifest)

    expect(result.state.repositories).toEqual(['docker-engine'])
    expect(result.removed).toEqual([
      expect.objectContaining({ id: 'mongodb-community-8-0', code: 'unsupported-release' }),
      expect.objectContaining({ id: 'unknown-product', code: 'unknown-repository' }),
    ])
  })
})
