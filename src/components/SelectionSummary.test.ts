import { mount } from '@vue/test-utils'
import { afterEach, vi } from 'vitest'
import SelectionSummary from './SelectionSummary.vue'
import vuetify from '../plugins/vuetify'
import '../styles/main.scss'

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

function mountSummary(currentStep: 1 | 2 | 3 = 1) {
  return mount(SelectionSummary, {
    attachTo: document.body,
    props: {
      release: 'trixie',
      architecture: 'arm64',
      repositoryCount: 3,
      outputMode: 'perVendor',
      currentStep,
    },
    global: { plugins: [vuetify] },
  })
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.style.paddingBottom = ''
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

  it('fixiert die mobile Aktionsleiste am Viewport und reserviert Platz gegen Überlagerungen', () => {
    setMobileViewport(true)
    const wrapper = mountSummary()
    const mobileSummary = wrapper.get('[data-testid="mobile-zusammenfassung"]')

    expect(getComputedStyle(mobileSummary.element).position).toBe('fixed')
    expect(getComputedStyle(mobileSummary.element).bottom).toBe('0px')
    expect(getComputedStyle(document.body).paddingBottom).not.toBe('0px')
  })

  it.each([
    [1, 'Weiter zur Software', 2],
    [2, 'Auswahl prüfen', 3],
    [3, 'Auswahl bearbeiten', 2],
  ] as const)('bietet in Schritt %i eine nützliche aktuelle Aktion an', async (step, label, targetStep) => {
    setMobileViewport(true)
    const wrapper = mountSummary(step)
    const action = wrapper.get('[data-testid="mobile-schrittaktion"]')

    expect(action.text()).toContain(label)
    await action.trigger('click')
    expect(wrapper.emitted('navigate')).toEqual([[targetStep]])
  })
})
