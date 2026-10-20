import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { hydrateWorkbench } from '../../src/workbench/client'
import { renderWorkbenchApp } from '../../src/workbench/server'
import { testPayload } from './fixtures'

const semanticFingerprint = (root: Element) => ({
  headings: [...root.querySelectorAll('h1, h2, h3')].map(heading => heading.textContent?.trim()),
  controls: [...root.querySelectorAll<HTMLInputElement>('input')].map(control => ({
    name: control.name,
    value: control.value,
    checked: control.checked,
    disabled: control.disabled,
  })),
  repositories: [...root.querySelectorAll('[data-repository-id]')].map(row => row.textContent?.replace(/\s+/gu, ' ').trim()),
  files: root.querySelector('.files__code')?.textContent,
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
    const sections = [...root.querySelectorAll('section')]

    hydrateWorkbench(root, testPayload)
    await settleHydration()

    expect(document.querySelector('#workbench')).toBe(root)
    expect([...root.querySelectorAll('section')]).toEqual(sections)
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

  const change = async (element: HTMLInputElement): Promise<void> => {
    element.checked = element.type === 'radio' ? true : !element.checked
    element.dispatchEvent(new Event('change'))
    await settle()
  }

  const pick = (root: Element, name: string, value: string): HTMLInputElement => (
    root.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`)!
  )

  const shownFile = (root: Element): string => root.querySelector('.files__code')?.textContent ?? ''

  const fileNames = (root: Element): string[] => [...root.querySelectorAll<HTMLInputElement>('input[name="file"]')].map(input => input.value)

  it('updates the shown file when the release changes', async () => {
    const root = await mount()
    expect(shownFile(root)).toContain('Suites: trixie')

    await change(pick(root, 'release', 'bookworm'))

    expect(shownFile(root)).toContain('Suites: bookworm')
    expect(root.querySelector('h1')?.textContent).toBe('Let’s set up bookworm.')
  })

  it('does not submit the form and keeps the configuration', async () => {
    const root = await mount()
    const form = root.querySelector('form')!
    const submit = new Event('submit', { cancelable: true })

    form.dispatchEvent(submit)

    expect(submit.defaultPrevented).toBe(true)
  })

  it('disables suites the selected release does not provide and says why', async () => {
    const root = await mount()
    await change(pick(root, 'release', 'bookworm'))

    expect(pick(root, 'suite', 'backports').disabled).toBe(true)
    expect(pick(root, 'suite', 'security').disabled).toBe(false)
    expect(root.querySelector('.system')?.textContent).toContain(testPayload.copy.ui.controls.availability.bookworm)
  })

  it('reflects Debian options in debian.sources', async () => {
    const root = await mount()

    await change(pick(root, 'suite', 'backports'))

    expect(shownFile(root)).toContain('trixie-backports')
  })

  it('lists every generated file and keeps package installation out of the repository script', async () => {
    const root = await mount({ repositories: ['mozilla-firefox'] })

    expect(fileNames(root)).toEqual(['debian.sources', 'mozilla.sources', 'mozilla-firefox.pref', 'install-vendor-repositories.sh'])
    await change(pick(root, 'file', 'mozilla-firefox.pref'))
    expect(shownFile(root)).toContain('Pin: origin packages.mozilla.org')
    await change(pick(root, 'file', 'install-vendor-repositories.sh'))
    expect(shownFile(root)).not.toContain("apt-get install -y -- 'firefox'")
    expect(root.querySelector('.install')?.textContent).toContain("sudo apt-get install -y -- 'firefox'")
  })

  it('adds and removes software from the files', async () => {
    const root = await mount({ repositories: [] })
    expect(fileNames(root)).toEqual(['debian.sources'])

    await change(pick(root, 'repository', 'docker-engine'))
    expect(fileNames(root)).toContain('docker.sources')
    expect(root.querySelector('.software__count')?.textContent).toBe('1 selected')

    await change(pick(root, 'repository', 'docker-engine'))
    expect(fileNames(root)).toEqual(['debian.sources'])
  })

  it('names removed repositories in a localized notice', async () => {
    const root = await mount({ repositories: ['google-chrome'] })
    const notice = () => root.querySelector('.notice-region')?.textContent?.trim() ?? ''

    await change(pick(root, 'architecture', 'arm64'))
    expect(notice()).toBe('Google Chrome was removed from the selection because it is not compatible.')
    expect(pick(root, 'repository', 'google-chrome').disabled).toBe(true)

    await change(pick(root, 'architecture', 'amd64'))
    expect(notice()).toBe('')
  })

  it('clears copy feedback once the copied content changes', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    try {
      const root = await mount()
      root.querySelector<HTMLButtonElement>('.files__actions button')!.click()
      await settle()
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Types: deb'))
      expect(root.querySelector('.files')?.textContent).toContain('Copied.')

      await change(root.querySelector<HTMLInputElement>('input[name="source"]')!)

      expect(root.querySelector('.files')?.textContent).not.toContain('Copied.')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('downloads every file as one tar archive', async () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:bundle')
    const revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    Object.assign(URL, { createObjectURL, revokeObjectURL })
    try {
      const root = await mount()
      root.querySelector<HTMLButtonElement>('button.primary-button')!.click()

      expect(click).toHaveBeenCalledOnce()
      expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('debgen-trixie-amd64.tar')
      const blob = createObjectURL.mock.calls[0]![0]
      expect(blob.type).toBe('application/x-tar')
      expect(new TextDecoder().decode((await blob.arrayBuffer()).slice(0, 100))).toMatch(/^debian\.sources\0/u)
    } finally {
      click.mockRestore()
    }
  })
})
