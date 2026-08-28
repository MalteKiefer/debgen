import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, vi } from 'vitest'
import type { GeneratedArtifact } from '../features/vendors/model'
import vuetify from '../plugins/vuetify'
import GeneratedFileTabs from './GeneratedFileTabs.vue'

const { copyTextMock, downloadTextMock } = vi.hoisted(() => ({
  copyTextMock: vi.fn<(text: string) => Promise<void>>(),
  downloadTextMock: vi.fn<(filename: string, text: string) => void>(),
}))

vi.mock('../features/sources/download', () => ({
  copyText: copyTextMock,
  downloadText: downloadTextMock,
}))

const artifacts: readonly GeneratedArtifact[] = [
  {
    filename: 'debian.sources',
    mediaType: 'text/plain',
    description: 'Debian-Paketquellen',
    content: 'Types: deb\nSuites: trixie\n',
  },
  {
    filename: 'brave-browser.sources',
    mediaType: 'text/plain',
    description: 'Paketquelle für Brave Browser',
    content: 'Types: deb\nURIs: https://brave.example/\n',
    category: 'browser',
    productId: 'brave-browser',
  },
]

function mountTabs() {
  return mount(GeneratedFileTabs, {
    props: { artifacts },
    attachTo: document.body,
    global: { plugins: [vuetify] },
  })
}

describe('GeneratedFileTabs', () => {
  beforeEach(() => {
    copyTextMock.mockReset().mockResolvedValue(undefined)
    downloadTextMock.mockReset()
  })

  it('wechselt die Vorschau über eine tastaturbedienbare Dateinavigation', async () => {
    const wrapper = mountTabs()

    expect(wrapper.get('[role="tablist"]').attributes('aria-label')).toBe('Erzeugte Dateien')
    expect(wrapper.get('[role="tabpanel"]:not([hidden])').text()).toContain('Suites: trixie')

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(2)
    expect(tabs.every((tab) => tab.classes().includes('studio-touch-target'))).toBe(true)

    await tabs[1]?.trigger('click')

    expect(wrapper.get('[role="tabpanel"]:not([hidden])').text()).toContain('https://brave.example/')
    expect(wrapper.text()).toContain('Paketquelle für Brave Browser')
  })

  it('verknüpft jeden Dateireiter dauerhaft mit seinem vorhandenen Tabpanel', () => {
    const wrapper = mountTabs()

    for (const tab of wrapper.findAll('[role="tab"]')) {
      const panelId = tab.attributes('aria-controls')
      expect(panelId).toBeTruthy()
      const panel = wrapper.get(`#${panelId}`)
      expect(panel.attributes('role')).toBe('tabpanel')
      expect(panel.attributes('aria-labelledby')).toBe(tab.attributes('id'))
    }
  })

  it('benennt jede scrollbare Dateivorschau und nimmt sie in die Fokusreihenfolge auf', () => {
    const wrapper = mountTabs()

    for (const artifact of artifacts) {
      const preview = wrapper.get(`pre[aria-label="Inhalt von ${artifact.filename}"]`)
      expect(preview.attributes('tabindex')).toBe('0')
    }
  })

  it('bewegt Auswahl und echten Fokus mit Pfeil-, Home- und End-Tasten', async () => {
    const wrapper = mountTabs()
    const tabs = wrapper.findAll<HTMLButtonElement>('[role="tab"]')

    tabs[0]?.element.focus()
    await tabs[0]?.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(tabs[1]?.element)
    expect(tabs[1]?.attributes('aria-selected')).toBe('true')

    await tabs[1]?.trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(tabs[0]?.element)

    await tabs[0]?.trigger('keydown', { key: 'End' })
    expect(document.activeElement).toBe(tabs[1]?.element)

    await tabs[1]?.trigger('keydown', { key: 'Home' })
    expect(document.activeElement).toBe(tabs[0]?.element)

    await tabs[0]?.trigger('keydown', { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(tabs[1]?.element)
  })

  it('kopiert und lädt immer die aktuell ausgewählte Datei einzeln herunter', async () => {
    const wrapper = mountTabs()
    await wrapper.findAll('[role="tab"]')[1]?.trigger('click')

    await wrapper.get('button[aria-label="brave-browser.sources kopieren"]').trigger('click')
    await flushPromises()
    expect(copyTextMock).toHaveBeenCalledWith('Types: deb\nURIs: https://brave.example/\n')
    expect(wrapper.get('[role="status"]').text()).toContain('brave-browser.sources wurde kopiert')

    await wrapper.get('button[aria-label="brave-browser.sources herunterladen"]').trigger('click')
    expect(downloadTextMock).toHaveBeenCalledWith(
      'brave-browser.sources',
      'Types: deb\nURIs: https://brave.example/\n',
    )
  })

  it('behält bei einem Kopierfehler die Vorschau und bietet manuelles Kopieren an', async () => {
    copyTextMock.mockRejectedValue(new Error('Clipboard gesperrt'))
    const wrapper = mountTabs()

    await wrapper.get('button[aria-label="debian.sources kopieren"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="tabpanel"]:not([hidden])').text()).toContain('Suites: trixie')
    expect(wrapper.get('[role="alert"]').text()).toContain('Bitte kopiere den Inhalt manuell')
  })
})
