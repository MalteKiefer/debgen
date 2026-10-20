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
  exportLabel: root.querySelector('#export-debian-heading')?.textContent?.trim(),
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

describe('Workbench export stays consistent with state', () => {
  const settle = async (): Promise<void> => {
    for (let index = 0; index < 5; index += 1) {
      await vi.dynamicImportSettled()
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }

  const mount = async (state: Partial<typeof testPayload.state> = {}): Promise<Element> => {
    const payload = { ...testPayload, state: { ...testPayload.state, includeSource: false, ...state } }
    const { html } = await renderWorkbenchApp(payload)
    document.body.innerHTML = `<div id="workbench">${html}</div>`
    const root = document.querySelector('#workbench')!
    hydrateWorkbench(root, payload)
    await settle()
    return root
  }

  const change = async (element: HTMLInputElement | HTMLSelectElement, value?: string): Promise<void> => {
    if (value !== undefined) element.value = value
    else if (element instanceof HTMLInputElement) element.checked = !element.checked
    element.dispatchEvent(new Event('change'))
    await settle()
  }

  it('re-highlights code blocks when their content changes', async () => {
    const root = await mount()
    const curl = () => root.querySelector('pre[aria-label="Debian curl command"]')?.textContent ?? ''
    expect(root.querySelector('pre[aria-label="Debian curl command"] code.hljs')).not.toBeNull()

    await change(root.querySelector<HTMLSelectElement>('#release')!, 'bookworm')

    expect(curl()).toContain('/bookworm/debian.sources')
  })

  it('does not submit the form and keeps the configuration', async () => {
    const root = await mount()
    const form = root.querySelector('form')!
    const submit = new Event('submit', { cancelable: true })

    form.dispatchEvent(submit)

    expect(submit.defaultPrevented).toBe(true)
  })

  it('disables suites the selected release does not provide', async () => {
    const root = await mount()
    await change(root.querySelector<HTMLSelectElement>('#release')!, 'bookworm')

    expect(root.querySelector<HTMLInputElement>('input[name="suite"][value="backports"]')!.disabled).toBe(true)
    expect(root.querySelector<HTMLInputElement>('input[name="suite"][value="security"]')!.disabled).toBe(false)
  })

  it('offers the published Debian file only when it matches the shown configuration', async () => {
    const root = await mount()
    expect(root.querySelector('pre[aria-label="Debian curl command"]')).not.toBeNull()

    await change(root.querySelector<HTMLInputElement>('input[name="suite"][value="backports"]')!)

    expect(root.querySelector('pre[aria-label="debian.sources content"]')?.textContent).toContain('trixie-backports')
    expect(root.querySelector('pre[aria-label="Debian curl command"]')).toBeNull()
  })

  it('shows preference files and keeps package installation out of the repository script', async () => {
    const root = await mount({ repositories: ['mozilla-firefox'] })
    const text = root.querySelector('[data-step="export"]')?.textContent ?? ''

    expect(text).toContain('mozilla-firefox.pref')
    expect(text).toContain('Pin: origin packages.mozilla.org')
    expect(root.querySelector('pre[aria-label="Install script content"]')?.textContent).not.toContain("apt-get install -y -- 'firefox'")
    expect(root.querySelector('pre[aria-label="Package installation command"]')?.textContent).toContain("'firefox'")
  })
})
