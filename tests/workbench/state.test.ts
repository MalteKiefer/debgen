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
      includeBackports: true,
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

    const next = reduceWorkbenchState(previous, {
      type: 'set-system',
      release: 'trixie',
      architecture: 'arm64',
      format: 'deb822',
    })

    expect(next).toEqual(expect.objectContaining({
      release: 'trixie',
      architecture: 'arm64',
      format: 'deb822',
      repositories: ['docker-engine'],
    }))
    expect(next).not.toBe(previous)
    expect(next.repositories).not.toBe(previous.repositories)
    expect(previous).toEqual(expect.objectContaining({
      release: 'bookworm',
      architecture: 'amd64',
      format: 'legacy',
      repositories: ['docker-engine'],
    }))
  })

  it('normalizes repository selections into a stable duplicate-free list', () => {
    const next = reduceWorkbenchState(createDefaultState(), {
      type: 'set-repositories',
      repositories: ['zabbix', 'docker-engine', 'zabbix'],
    })

    expect(next.repositories).toEqual(['docker-engine', 'zabbix'])
  })
})
