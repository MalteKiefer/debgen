import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, vi } from 'vitest'
import SourceGenerator from './SourceGenerator.vue'
import vuetify from '../plugins/vuetify'

const { copyTextMock, downloadTextMock } = vi.hoisted(() => ({
  copyTextMock: vi.fn<(text: string) => Promise<void>>(),
  downloadTextMock: vi.fn<(filename: string, text: string) => void>(),
}))

vi.mock('../features/sources/download', () => ({
  copyText: copyTextMock,
  downloadText: downloadTextMock,
}))

async function settle(): Promise<void> {
  await nextTick()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  await nextTick()
}

function mountGenerator(): VueWrapper {
  return mount(SourceGenerator, {
    attachTo: document.body,
    global: {
      plugins: [vuetify],
    },
  })
}

function control(wrapper: VueWrapper, label: string): ReturnType<VueWrapper['get']> {
  return wrapper.get(`[aria-label="${label}"]`)
}

async function choose(wrapper: VueWrapper, label: string, option: string): Promise<void> {
  await openSelect(wrapper, label)

  const choice = Array.from(document.body.querySelectorAll<HTMLElement>('[role="option"]'))
    .find((candidate) => candidate.textContent?.includes(option))
  expect(choice, `option ${option}`).toBeTruthy()
  choice?.click()
  await settle()
}

async function openSelect(wrapper: VueWrapper, label: string): Promise<void> {
  const input = control(wrapper, label)
  await input.trigger('mousedown')
  await input.trigger('click')
  await settle()
}

async function clickButton(wrapper: VueWrapper, name: string): Promise<void> {
  const button = wrapper.findAll('button').find((candidate) => candidate.text().includes(name))
  expect(button, `button ${name}`).toBeTruthy()
  await button?.trigger('click')
  await settle()
}

describe('SourceGenerator', () => {
  beforeEach(() => {
    copyTextMock.mockReset().mockResolvedValue(undefined)
    downloadTextMock.mockReset()
  })

  it('defaults to Trixie and DEB822 and generates a current sources stanza', async () => {
    const wrapper = mountGenerator()
    await settle()

    expect(control(wrapper, 'Debian-Version').attributes('value')).toBe('Trixie')
    expect(control(wrapper, 'Ausgabeformat').attributes('value')).toBe('DEB822 (.sources)')

    await clickButton(wrapper, 'Paketquellen erzeugen')

    expect(wrapper.get('[aria-label="Vorschau der erzeugten Paketquellen"]').text()).toContain('Types: deb')
    expect(wrapper.get('[aria-label="Vorschau der erzeugten Paketquellen"]').text()).toContain('Suites: trixie trixie-updates')
    expect(wrapper.text()).toContain('debian.sources')
  })

  it('normalizes Bullseye options before generation and offers the legacy format', async () => {
    const wrapper = mountGenerator()
    await settle()

    await control(wrapper, 'Backports').setValue(true)
    await choose(wrapper, 'Debian-Version', 'Bullseye')

    expect(control(wrapper, 'Non-free firmware').attributes()).toHaveProperty('disabled')
    expect(control(wrapper, 'Backports').attributes()).toHaveProperty('disabled')
    expect((control(wrapper, 'Non-free firmware').element as HTMLInputElement).checked).toBe(false)
    expect((control(wrapper, 'Backports').element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.text()).toContain('Bullseye bietet weder non-free-firmware noch Backports')

    await openSelect(wrapper, 'Ausgabeformat')
    const formatOptions = Array.from(document.body.querySelectorAll<HTMLElement>('[role="option"]'))
      .map((option) => option.textContent ?? '')
    expect(formatOptions.some((option) => option.includes('Klassische sources.list') && option.includes('veraltet'))).toBe(true)
  })

  it('disables ended Bookworm backports and explains the support date', async () => {
    const wrapper = mountGenerator()
    await settle()

    await control(wrapper, 'Backports').setValue(true)
    await choose(wrapper, 'Debian-Version', 'Bookworm')

    expect(control(wrapper, 'Backports').attributes()).toHaveProperty('disabled')
    expect((control(wrapper, 'Backports').element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.text()).toContain('Backports-Unterstützung endete am 09.08.2026')
  })

  it('disables unsupported suites for Sid and explains the base-only configuration', async () => {
    const wrapper = mountGenerator()
    await settle()

    await choose(wrapper, 'Debian-Version', 'Sid')

    for (const label of ['Security', 'Updates', 'Backports']) {
      expect(control(wrapper, label).attributes()).toHaveProperty('disabled')
      expect((control(wrapper, label).element as HTMLInputElement).checked).toBe(false)
    }
    expect(wrapper.text()).toContain('Sid enthält nur die Basisquelle')

    await clickButton(wrapper, 'Paketquellen erzeugen')
    const preview = wrapper.get('[aria-label="Vorschau der erzeugten Paketquellen"]').text()
    expect(preview).toContain('Suites: sid')
    expect(preview).not.toContain('sid-security')
    expect(preview).not.toContain('sid-updates')
    expect(preview).not.toContain('sid-backports')
  })

  it('does not offer the unsupported legacy format for Trixie', async () => {
    const wrapper = mountGenerator()
    await settle()

    await openSelect(wrapper, 'Ausgabeformat')

    const formatOptions = Array.from(document.body.querySelectorAll<HTMLElement>('[role="option"]'))
      .map((option) => option.textContent ?? '')
    expect(formatOptions.some((option) => option.includes('DEB822'))).toBe(true)
    expect(formatOptions.some((option) => option.includes('Klassische sources.list'))).toBe(false)
  })

  it('includes source package indexes when selected', async () => {
    const wrapper = mountGenerator()
    await settle()

    await control(wrapper, 'Quellpakete').setValue(true)
    await clickButton(wrapper, 'Paketquellen erzeugen')

    expect(wrapper.get('[aria-label="Vorschau der erzeugten Paketquellen"]').text()).toContain('Types: deb deb-src')
  })

  it('labels every input and connects unavailable controls to a status explanation', async () => {
    const wrapper = mountGenerator()
    await settle()

    for (const label of [
      'Debian-Version',
      'Architektur',
      'Ausgabeformat',
      'Quellpakete',
      'Contrib',
      'Non-free',
      'Non-free firmware',
      'Security',
      'Updates',
      'Backports',
    ]) {
      expect(wrapper.find(`[aria-label="${label}"]`).exists()).toBe(true)
    }

    await choose(wrapper, 'Debian-Version', 'Bullseye')
    const explanationId = control(wrapper, 'Non-free firmware').attributes('aria-describedby')
    expect(explanationId).toBeTruthy()
    expect(wrapper.get(`#${explanationId}`).attributes('role')).toBe('status')
  })

  it('renders disabled copy and download actions before generating valid output', async () => {
    const wrapper = mountGenerator()
    await settle()

    const copy = wrapper.findAll('button').find((button) => button.text().includes('Kopieren'))
    const download = wrapper.findAll('button').find((button) => button.text().includes('Herunterladen'))

    expect(copy, 'Copy button').toBeTruthy()
    expect(download, 'Download button').toBeTruthy()
    expect(copy?.attributes()).toHaveProperty('disabled')
    expect(download?.attributes()).toHaveProperty('disabled')
    expect(wrapper.get('[aria-label="Aktionen für die erzeugte Konfiguration"]').attributes('role')).toBe('group')

    await clickButton(wrapper, 'Paketquellen erzeugen')

    const enabledCopy = wrapper.findAll('button').find((button) => button.text().includes('Kopieren'))
    const enabledDownload = wrapper.findAll('button').find((button) => button.text().includes('Herunterladen'))
    expect(enabledCopy?.attributes()).not.toHaveProperty('disabled')
    expect(enabledDownload?.attributes()).not.toHaveProperty('disabled')
  })

  it('reports copied only after the generated text is copied', async () => {
    let resolveCopy: (() => void) | undefined
    copyTextMock.mockImplementation(() => new Promise<void>((resolve) => { resolveCopy = resolve }))
    const wrapper = mountGenerator()
    await settle()

    await clickButton(wrapper, 'Paketquellen erzeugen')
    const expectedContent = wrapper.get('[aria-label="Vorschau der erzeugten Paketquellen"]').element.textContent

    await clickButton(wrapper, 'Kopieren')

    expect(copyTextMock).toHaveBeenCalledWith(expectedContent)
    expect(wrapper.text()).not.toContain('Die erzeugte Konfiguration wurde kopiert.')

    resolveCopy?.()
    await flushPromises()
    await settle()

    expect(wrapper.findAll('[role="status"]')
      .some((status) => status.text() === 'Die erzeugte Konfiguration wurde kopiert.')).toBe(true)
  })

  it('shows an actionable alert when copying is rejected', async () => {
    copyTextMock.mockRejectedValue(new Error('Clipboard permission denied'))
    const wrapper = mountGenerator()
    await settle()

    await clickButton(wrapper, 'Paketquellen erzeugen')
    await clickButton(wrapper, 'Kopieren')
    await flushPromises()
    await settle()

    const alerts = wrapper.findAll('[role="alert"]').map((alert) => alert.text()).join(' ')
    expect(alerts).toContain('Kopieren fehlgeschlagen')
    expect(alerts).toContain('kopiere sie manuell')
  })

  it('downloads the generated output slot content using the format-specific filename', async () => {
    const wrapper = mountGenerator()
    await settle()

    await clickButton(wrapper, 'Paketquellen erzeugen')
    const deb822Content = wrapper.get('[aria-label="Vorschau der erzeugten Paketquellen"]').element.textContent
    await clickButton(wrapper, 'Herunterladen')

    expect(downloadTextMock).toHaveBeenLastCalledWith('debian.sources', deb822Content)

    await choose(wrapper, 'Debian-Version', 'Bullseye')
    await choose(wrapper, 'Ausgabeformat', 'Klassische sources.list')
    await clickButton(wrapper, 'Paketquellen erzeugen')
    const legacyContent = wrapper.get('[aria-label="Vorschau der erzeugten Paketquellen"]').element.textContent
    await clickButton(wrapper, 'Herunterladen')

    expect(downloadTextMock).toHaveBeenLastCalledWith('debian.list', legacyContent)
  })

  it('shows an actionable alert when downloading fails', async () => {
    downloadTextMock.mockImplementation(() => { throw new Error('Browser download blocked') })
    const wrapper = mountGenerator()
    await settle()

    await clickButton(wrapper, 'Paketquellen erzeugen')
    await clickButton(wrapper, 'Herunterladen')

    const alerts = wrapper.findAll('[role="alert"]').map((alert) => alert.text()).join(' ')
    expect(alerts).toContain('Herunterladen fehlgeschlagen')
    expect(alerts).toContain('speichere sie manuell')
  })

  it('clears action feedback when generation options change', async () => {
    const wrapper = mountGenerator()
    await settle()

    await clickButton(wrapper, 'Paketquellen erzeugen')
    await clickButton(wrapper, 'Kopieren')
    await flushPromises()
    await settle()
    expect(wrapper.findAll('[role="status"]')
      .some((status) => status.text() === 'Die erzeugte Konfiguration wurde kopiert.')).toBe(true)

    await control(wrapper, 'Quellpakete').setValue(true)

    expect(wrapper.find('.source-generator__feedback [role="status"]').exists()).toBe(false)
    expect(wrapper.find('.source-generator__feedback [role="alert"]').exists()).toBe(false)
  })

  it('does not restore copy feedback after the options change during a pending copy', async () => {
    let resolveCopy: (() => void) | undefined
    copyTextMock.mockImplementation(() => new Promise<void>((resolve) => { resolveCopy = resolve }))
    const wrapper = mountGenerator()
    await settle()

    await clickButton(wrapper, 'Paketquellen erzeugen')
    await clickButton(wrapper, 'Kopieren')
    await control(wrapper, 'Quellpakete').setValue(true)

    resolveCopy?.()
    await flushPromises()
    await settle()

    expect(wrapper.find('.source-generator__feedback [role="status"]').exists()).toBe(false)
    expect(wrapper.find('.source-generator__feedback [role="alert"]').exists()).toBe(false)
  })

  it('clears copy feedback when the sources are generated again', async () => {
    const wrapper = mountGenerator()
    await settle()

    await clickButton(wrapper, 'Paketquellen erzeugen')
    await clickButton(wrapper, 'Kopieren')
    await flushPromises()
    await settle()
    expect(wrapper.find('.source-generator__feedback [role="status"]').exists()).toBe(true)

    await clickButton(wrapper, 'Paketquellen erzeugen')

    expect(wrapper.find('.source-generator__feedback [role="status"]').exists()).toBe(false)
    expect(wrapper.find('.source-generator__feedback [role="alert"]').exists()).toBe(false)
  })

  it('does not restore copy feedback after regeneration during a pending copy', async () => {
    let resolveCopy: (() => void) | undefined
    copyTextMock.mockImplementation(() => new Promise<void>((resolve) => { resolveCopy = resolve }))
    const wrapper = mountGenerator()
    await settle()

    await clickButton(wrapper, 'Paketquellen erzeugen')
    await clickButton(wrapper, 'Kopieren')
    await clickButton(wrapper, 'Paketquellen erzeugen')

    resolveCopy?.()
    await flushPromises()
    await settle()

    expect(wrapper.find('.source-generator__feedback [role="status"]').exists()).toBe(false)
    expect(wrapper.find('.source-generator__feedback [role="alert"]').exists()).toBe(false)
  })
})
