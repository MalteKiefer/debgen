// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { testPayload } from './fixtures'

describe('Workbench SSR boundary', () => {
  it('renders the complete setup page before hydration', async () => {
    const { renderWorkbenchApp } = await import('../../src/workbench/server')

    const result = await renderWorkbenchApp(testPayload)
    const headings = [...result.html.matchAll(/<h2 id="([^"]+)"/gu)].map(match => match[1])

    expect(headings).toEqual(['system-title', 'software-title', 'files-title', 'install-title'])
    expect(result.html).toContain('<form id="setup"')
    expect(result.html).toContain('Brave Browser')
    expect(result.html).toContain('value="brave-browser.sources"')
    expect(result.html).toContain('sudo bash install-vendor-repositories.sh')
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
      html: expect.stringContaining('<main class="workbench"'),
      serializedState: expect.any(String),
    })
  })
})
