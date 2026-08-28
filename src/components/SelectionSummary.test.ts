import { mount } from '@vue/test-utils'
import SelectionSummary from './SelectionSummary.vue'
import vuetify from '../plugins/vuetify'

describe('SelectionSummary', () => {
  it('fasst Release, Architektur, Repository-Anzahl und Ausgabemodus für Desktop und Mobil zusammen', () => {
    const wrapper = mount(SelectionSummary, {
      props: {
        release: 'trixie',
        architecture: 'arm64',
        repositoryCount: 3,
        outputMode: 'perVendor',
      },
      global: { plugins: [vuetify] },
    })

    expect(wrapper.get('[data-testid="auswahl-zusammenfassung"]').attributes('aria-label'))
      .toBe('Aktuelle Auswahl')
    const desktopSummary = wrapper.get('[data-testid="desktop-zusammenfassung"]')
    const mobileSummary = wrapper.get('[data-testid="mobile-zusammenfassung"]')

    for (const summary of [desktopSummary, mobileSummary]) {
      expect(summary.text()).toContain('Trixie')
      expect(summary.text()).toContain('arm64')
      expect(summary.text()).toContain('3 Paketquellen ausgewählt')
      expect(summary.text()).toContain('Je Anbieter')
    }
  })
})
