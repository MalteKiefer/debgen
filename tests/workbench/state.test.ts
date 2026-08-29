import { describe, expect, it } from 'vitest'
import {
  createDefaultState,
  reduceWorkbenchState,
} from '../../src/workbench/state'

describe('Workbench state', () => {
  it('creates an independent default state with the recommended Trixie configuration', () => {
    const first = createDefaultState()
    const second = createDefaultState()

    expect(first).toEqual({
      activeStep: 'system',
      release: 'trixie',
      architecture: 'amd64',
      format: 'deb822',
      includeSource: false,
      includeSecurity: true,
      includeUpdates: true,
      includeBackports: false,
      components: ['main', 'non-free-firmware'],
      repositories: [],
      outputMode: 'perVendor',
    })
    expect(first).not.toBe(second)
    expect(first.components).not.toBe(second.components)
  })

  it('updates system values without mutating the previous selection or downstream repositories', () => {
    const previous = {
      ...createDefaultState(),
      release: 'bookworm' as const,
      format: 'legacy' as const,
      repositories: ['docker-engine'],
    }

    const transition = reduceWorkbenchState({
      ...previous,
      includeBackports: true,
      repositories: ['docker-engine', 'proton-vpn'],
    }, {
      type: 'set-system',
      release: 'bullseye',
      architecture: 'amd64',
      format: 'legacy',
    })

    expect(transition.state).toEqual(expect.objectContaining({
      release: 'bullseye',
      architecture: 'amd64',
      format: 'legacy',
      includeBackports: false,
      components: ['main'],
      repositories: ['docker-engine'],
    }))
    expect(transition.removed).toEqual([
      expect.objectContaining({ id: 'proton-vpn', code: 'unsupported-release' }),
    ])
    expect(transition.state).not.toBe(previous)
    expect(transition.state.repositories).not.toBe(previous.repositories)
    expect(previous).toEqual(expect.objectContaining({
      release: 'bookworm',
      architecture: 'amd64',
      format: 'legacy',
      repositories: ['docker-engine'],
    }))
  })

  it('normalizes repository selections into a stable duplicate-free list', () => {
    const transition = reduceWorkbenchState(createDefaultState(), {
      type: 'set-repositories',
      repositories: ['proton-vpn', 'docker-engine', 'proton-vpn', 'unknown-product'],
    })

    expect(transition.state.repositories).toEqual(['docker-engine', 'proton-vpn'])
    expect(transition.removed).toEqual([
      expect.objectContaining({ id: 'proton-vpn', code: 'duplicate-repository' }),
      expect.objectContaining({ id: 'unknown-product', code: 'unknown-repository' }),
    ])
  })
})
