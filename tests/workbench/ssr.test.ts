// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { testPayload } from './fixtures'

describe('Workbench SSR boundary', () => {
  it('renders all four useful steps in workflow order before hydration', async () => {
    const { renderWorkbenchApp } = await import('../../src/workbench/server')

    const result = await renderWorkbenchApp(testPayload)
    const steps = [...result.html.matchAll(/data-step="([^"]+)"/gu)].map(match => match[1])

    expect(steps).toEqual(['system', 'repositories', 'review', 'export'])
    expect(result.html).toContain('id="system"')
    expect(result.html).toContain('id="export"')
    expect(result.html).toContain('<form')
    expect(result.html).toContain('Brave Browser')
    expect(result.html).toContain('id="export-debian-heading"')
    expect(result.html).toContain('curl -fsSLo')
    expect(result.html).not.toContain('data-enhanced')
    expect(result.html).not.toContain(' hidden')
  })

  it('serializes the complete hydration payload as inert round-trippable JSON', async () => {
    const { renderWorkbenchApp } = await import('../../src/workbench/server')
    const hostilePayload = {
      ...testPayload,
      state: {
        ...testPayload.state,
        repositories: ['repo-</script><script>alert(1)</script>'],
      },
    }

    const result = await renderWorkbenchApp(hostilePayload)

    expect(JSON.parse(result.serializedState)).toEqual(hostilePayload)
    expect(result.serializedState).not.toMatch(/<\/?script|<!--/iu)

  })

  it('imports and renders without browser globals', async () => {
    expect('window' in globalThis).toBe(false)
    expect('document' in globalThis).toBe(false)

    const { renderWorkbenchApp } = await import('../../src/workbench/server')

    await expect(renderWorkbenchApp(testPayload)).resolves.toMatchObject({
      html: expect.stringContaining('data-step="system"'),
      serializedState: expect.any(String),
    })
  })
})
