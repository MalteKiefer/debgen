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

function mountSummary(currentStep: 1 | 2 | 3 = 1, productCount = 3) {
  return mount(SelectionSummary, {
    attachTo: document.body,
    props: {
      release: 'trixie',
      architecture: 'arm64',
      productCount,
      sourceCount: 2,
      packageCount: 4,
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
    expect(mobileSummary.text()).toContain('3 Produkte')
    expect(mobileSummary.text()).toContain('2 Paketquellen ausgewählt')
    expect(mobileSummary.text()).toContain('4 Pakete')
    expect(mobileSummary.text()).toContain('Je Quelle')
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

  it('offers the Debian-only output path in the mobile system action bar', async () => {
    setMobileViewport(true)
    const wrapper = mountSummary(1)
    const skip = wrapper.get('[data-testid="mobile-skip-software"]')

    expect(skip.text()).toContain('Software überspringen')
    expect(skip.classes()).toContain('studio-touch-target')
    await skip.trigger('click')
    expect(wrapper.emitted('skipSoftware')).toEqual([[]])
  })

  it('offers to add software from mobile output when the selection is empty', () => {
    setMobileViewport(true)
    const wrapper = mountSummary(3, 0)
    const action = wrapper.get('[data-testid="mobile-schrittaktion"]')

    expect(action.text()).toContain('Software hinzufügen')
    expect(action.attributes('aria-label')).toBe('Software hinzufügen')
  })
})
