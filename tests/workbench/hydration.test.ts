import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { hydrateWorkbench } from '../../src/workbench/client'
import { renderWorkbenchApp } from '../../src/workbench/server'
import { testPayload } from './fixtures'

const semanticFingerprint = (root: Element) => ({
  steps: [...root.querySelectorAll<HTMLElement>('[data-step]')].map(section => section.dataset.step),
  headings: [...root.querySelectorAll('h2')].map(heading => heading.textContent?.trim()),
  controls: [...root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')].map(control => ({
    name: control.name,
    value: control.value,
    checked: control instanceof HTMLInputElement ? control.checked : undefined,
  })),
  repositories: [...root.querySelectorAll('[data-repository-id]')].map(row => row.textContent?.replace(/\s+/gu, ' ').trim()),
  exportLabel: root.querySelector('[aria-label="Source file preview"]')?.textContent?.trim(),
})

const settleHydration = async (): Promise<void> => {
  await vi.dynamicImportSettled()
  await nextTick()
  await Promise.resolve()
}

describe('Workbench hydration boundary', () => {
  it('hydrates the non-empty SSR tree without replacing its root or step nodes', async () => {
    const { html } = await renderWorkbenchApp(testPayload)
    document.body.innerHTML = `<div id="workbench" tabindex="-1">${html}</div>`
    const root = document.querySelector('#workbench')!
    const steps = [...root.querySelectorAll('[data-step]')]

    hydrateWorkbench(root, testPayload)
    await settleHydration()

    expect(document.querySelector('#workbench')).toBe(root)
    expect([...root.querySelectorAll('[data-step]')]).toEqual(steps)
    expect(root.getAttribute('data-enhanced')).toBe('true')
  })

  it('preserves server-rendered semantics and emits no hydration mismatch diagnostics', async () => {
    const { html } = await renderWorkbenchApp(testPayload)
    document.body.innerHTML = `<div id="workbench">${html}</div>`
    const root = document.querySelector('#workbench')!
    const before = semanticFingerprint(root)
    const warnings: unknown[][] = []
    const errors: unknown[][] = []
    const warn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => warnings.push(args))
    const error = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => errors.push(args))

    try {
      expect(root.hasAttribute('data-enhanced')).toBe(false)
      hydrateWorkbench(root, testPayload)
      await settleHydration()

      expect(semanticFingerprint(root)).toEqual(before)
      expect(root.getAttribute('data-enhanced')).toBe('true')
      expect([...warnings, ...errors].filter(parts => /hydration|mismatch/iu.test(parts.join(' ')))).toEqual([])
    } finally {
      warn.mockRestore()
      error.mockRestore()
    }
  })

  it('enhances workflow links into active-step navigation after hydration', async () => {
    const { html } = await renderWorkbenchApp(testPayload)
    document.body.innerHTML = `<div id="workbench">${html}</div>`
    const root = document.querySelector('#workbench')!

    hydrateWorkbench(root, testPayload)
    await settleHydration()
    root.querySelector<HTMLAnchorElement>('a[href="#export"]')!.click()
    await vi.dynamicImportSettled()
    await nextTick()

    expect(root.querySelector('[data-step="review"]')?.getAttribute('data-active')).toBe('false')
    expect(root.querySelector('[data-step="export"]')?.getAttribute('data-active')).toBe('true')
    expect(root.querySelector('a[href="#export"]')?.getAttribute('aria-current')).toBe('step')
  })
})
