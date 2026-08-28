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

    expect(control(wrapper, 'Debian release').attributes('value')).toBe('Trixie')
    expect(control(wrapper, 'Output format').attributes('value')).toBe('DEB822 (.sources)')

    await clickButton(wrapper, 'Generate sources')

    expect(wrapper.get('[aria-label="Generated sources preview"]').text()).toContain('Types: deb')
    expect(wrapper.get('[aria-label="Generated sources preview"]').text()).toContain('Suites: trixie trixie-updates')
    expect(wrapper.text()).toContain('debian.sources')
  })

  it('normalizes Bullseye options before generation and offers the legacy format', async () => {
    const wrapper = mountGenerator()
    await settle()

    await control(wrapper, 'Backports').setValue(true)
    await choose(wrapper, 'Debian release', 'Bullseye')

    expect(control(wrapper, 'Non-free firmware').attributes()).toHaveProperty('disabled')
    expect(control(wrapper, 'Backports').attributes()).toHaveProperty('disabled')
    expect((control(wrapper, 'Non-free firmware').element as HTMLInputElement).checked).toBe(false)
    expect((control(wrapper, 'Backports').element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.text()).toContain('Bullseye does not provide non-free-firmware or backports')

    await openSelect(wrapper, 'Output format')
    const formatOptions = Array.from(document.body.querySelectorAll<HTMLElement>('[role="option"]'))
      .map((option) => option.textContent ?? '')
    expect(formatOptions.some((option) => option.includes('Legacy sources.list'))).toBe(true)
  })

  it('disables unsupported suites for Sid and explains the base-only configuration', async () => {
    const wrapper = mountGenerator()
    await settle()

    await choose(wrapper, 'Debian release', 'Sid')

    for (const label of ['Security', 'Updates', 'Backports']) {
      expect(control(wrapper, label).attributes()).toHaveProperty('disabled')
      expect((control(wrapper, label).element as HTMLInputElement).checked).toBe(false)
    }
    expect(wrapper.text()).toContain('Sid is base-only')

    await clickButton(wrapper, 'Generate sources')
    const preview = wrapper.get('[aria-label="Generated sources preview"]').text()
    expect(preview).toContain('Suites: sid')
    expect(preview).not.toContain('sid-security')
    expect(preview).not.toContain('sid-updates')
    expect(preview).not.toContain('sid-backports')
  })

  it('does not offer the unsupported legacy format for Trixie', async () => {
    const wrapper = mountGenerator()
    await settle()

    await openSelect(wrapper, 'Output format')

    const formatOptions = Array.from(document.body.querySelectorAll<HTMLElement>('[role="option"]'))
      .map((option) => option.textContent ?? '')
    expect(formatOptions.some((option) => option.includes('DEB822'))).toBe(true)
    expect(formatOptions.some((option) => option.includes('Legacy sources.list'))).toBe(false)
  })

  it('includes source package indexes when selected', async () => {
    const wrapper = mountGenerator()
    await settle()

    await control(wrapper, 'Source packages').setValue(true)
    await clickButton(wrapper, 'Generate sources')

    expect(wrapper.get('[aria-label="Generated sources preview"]').text()).toContain('Types: deb deb-src')
  })

  it('labels every input and connects unavailable controls to a status explanation', async () => {
    const wrapper = mountGenerator()
    await settle()

    for (const label of [
      'Debian release',
      'Output format',
      'Source packages',
      'Contrib',
      'Non-free',
      'Non-free firmware',
      'Security',
      'Updates',
      'Backports',
    ]) {
      expect(wrapper.find(`[aria-label="${label}"]`).exists()).toBe(true)
    }

    await choose(wrapper, 'Debian release', 'Bullseye')
    const explanationId = control(wrapper, 'Non-free firmware').attributes('aria-describedby')
    expect(explanationId).toBeTruthy()
    expect(wrapper.get(`#${explanationId}`).attributes('role')).toBe('status')
  })

  it('renders disabled copy and download actions before generating valid output', async () => {
    const wrapper = mountGenerator()
    await settle()

    const copy = wrapper.findAll('button').find((button) => button.text().includes('Copy'))
    const download = wrapper.findAll('button').find((button) => button.text().includes('Download'))

    expect(copy, 'Copy button').toBeTruthy()
    expect(download, 'Download button').toBeTruthy()
    expect(copy?.attributes()).toHaveProperty('disabled')
    expect(download?.attributes()).toHaveProperty('disabled')

    await clickButton(wrapper, 'Generate sources')

    const enabledCopy = wrapper.findAll('button').find((button) => button.text().includes('Copy'))
    const enabledDownload = wrapper.findAll('button').find((button) => button.text().includes('Download'))
    expect(enabledCopy?.attributes()).not.toHaveProperty('disabled')
    expect(enabledDownload?.attributes()).not.toHaveProperty('disabled')
  })

  it('reports copied only after the generated text is copied', async () => {
    let resolveCopy: (() => void) | undefined
    copyTextMock.mockImplementation(() => new Promise<void>((resolve) => { resolveCopy = resolve }))
    const wrapper = mountGenerator()
    await settle()

    await clickButton(wrapper, 'Generate sources')
    const expectedContent = wrapper.get('[aria-label="Generated sources preview"]').element.textContent

    await clickButton(wrapper, 'Copy')

    expect(copyTextMock).toHaveBeenCalledWith(expectedContent)
    expect(wrapper.text()).not.toContain('Copied generated configuration.')

    resolveCopy?.()
    await flushPromises()
    await settle()

    expect(wrapper.findAll('[role="status"]')
      .some((status) => status.text() === 'Copied generated configuration.')).toBe(true)
  })

  it('shows an actionable alert when copying is rejected', async () => {
    copyTextMock.mockRejectedValue(new Error('Clipboard permission denied'))
    const wrapper = mountGenerator()
    await settle()

    await clickButton(wrapper, 'Generate sources')
    await clickButton(wrapper, 'Copy')
    await flushPromises()
    await settle()

    const alerts = wrapper.findAll('[role="alert"]').map((alert) => alert.text()).join(' ')
    expect(alerts).toContain('Copy failed')
    expect(alerts).toContain('copy the configuration manually')
  })

  it('downloads the generated output slot content using the format-specific filename', async () => {
    const wrapper = mountGenerator()
    await settle()

    await clickButton(wrapper, 'Generate sources')
    const deb822Content = wrapper.get('[aria-label="Generated sources preview"]').element.textContent
    await clickButton(wrapper, 'Download')

    expect(downloadTextMock).toHaveBeenLastCalledWith('debian.sources', deb822Content)

    await choose(wrapper, 'Debian release', 'Bullseye')
    await choose(wrapper, 'Output format', 'Legacy sources.list')
    await clickButton(wrapper, 'Generate sources')
    const legacyContent = wrapper.get('[aria-label="Generated sources preview"]').element.textContent
    await clickButton(wrapper, 'Download')

    expect(downloadTextMock).toHaveBeenLastCalledWith('debian.list', legacyContent)
  })

  it('shows an actionable alert when downloading fails', async () => {
    downloadTextMock.mockImplementation(() => { throw new Error('Browser download blocked') })
    const wrapper = mountGenerator()
    await settle()

    await clickButton(wrapper, 'Generate sources')
    await clickButton(wrapper, 'Download')

    const alerts = wrapper.findAll('[role="alert"]').map((alert) => alert.text()).join(' ')
    expect(alerts).toContain('Download failed')
    expect(alerts).toContain('save the configuration manually')
  })

  it('clears action feedback when generation options change', async () => {
    const wrapper = mountGenerator()
    await settle()

    await clickButton(wrapper, 'Generate sources')
    await clickButton(wrapper, 'Copy')
    await flushPromises()
    await settle()
    expect(wrapper.findAll('[role="status"]')
      .some((status) => status.text() === 'Copied generated configuration.')).toBe(true)

    await control(wrapper, 'Source packages').setValue(true)

    expect(wrapper.find('.source-generator__feedback [role="status"]').exists()).toBe(false)
    expect(wrapper.find('.source-generator__feedback [role="alert"]').exists()).toBe(false)
  })

  it('does not restore copy feedback after the options change during a pending copy', async () => {
    let resolveCopy: (() => void) | undefined
    copyTextMock.mockImplementation(() => new Promise<void>((resolve) => { resolveCopy = resolve }))
    const wrapper = mountGenerator()
    await settle()

    await clickButton(wrapper, 'Generate sources')
    await clickButton(wrapper, 'Copy')
    await control(wrapper, 'Source packages').setValue(true)

    resolveCopy?.()
    await flushPromises()
    await settle()

    expect(wrapper.find('.source-generator__feedback [role="status"]').exists()).toBe(false)
    expect(wrapper.find('.source-generator__feedback [role="alert"]').exists()).toBe(false)
  })
})
