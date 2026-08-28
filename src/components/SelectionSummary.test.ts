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
    expect(wrapper.text()).toContain('Trixie')
    expect(wrapper.text()).toContain('arm64')
    expect(wrapper.text()).toContain('3 Paketquellen ausgewählt')
    expect(wrapper.text()).toContain('Je Anbieter')
    expect(wrapper.find('[data-testid="mobile-zusammenfassung"]').exists()).toBe(true)
  })
})
