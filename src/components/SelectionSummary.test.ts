import { mount } from '@vue/test-utils'
import { afterEach, vi } from 'vitest'
import SelectionSummary from './SelectionSummary.vue'
import vuetify from '../plugins/vuetify'

function setMobileViewport(matches: boolean): void {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: query === '(max-width: 700px)' && matches,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }))
}

function mountSummary() {
  return mount(SelectionSummary, {
    props: {
      release: 'trixie',
      architecture: 'arm64',
      repositoryCount: 3,
      outputMode: 'perVendor',
    },
    global: { plugins: [vuetify] },
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SelectionSummary', () => {
  it('rendert auf dem Desktop ausschließlich die vollständige Desktop-Zusammenfassung', () => {
    setMobileViewport(false)
    const wrapper = mountSummary()

    expect(wrapper.find('[data-testid="desktop-zusammenfassung"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="mobile-zusammenfassung"]').exists()).toBe(false)
  })

  it('rendert auf kleinen Ansichten ausschließlich die vollständige mobile Zusammenfassung', () => {
    setMobileViewport(true)
    const wrapper = mountSummary()

    expect(wrapper.get('[data-testid="auswahl-zusammenfassung"]').attributes('aria-label'))
      .toBe('Aktuelle Auswahl')
    expect(wrapper.find('[data-testid="desktop-zusammenfassung"]').exists()).toBe(false)
    const mobileSummary = wrapper.get('[data-testid="mobile-zusammenfassung"]')

    expect(mobileSummary.text()).toContain('Trixie')
    expect(mobileSummary.text()).toContain('arm64')
    expect(mobileSummary.text()).toContain('3 Paketquellen ausgewählt')
    expect(mobileSummary.text()).toContain('Je Anbieter')
  })
})
