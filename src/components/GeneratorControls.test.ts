import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import type { ReleaseCodename, SourceFormat } from '../features/sources/model'
import vuetify from '../plugins/vuetify'
import GeneratorControls from './GeneratorControls.vue'

function props(release: ReleaseCodename = 'trixie', format: SourceFormat = 'deb822') {
  return {
    release,
    architecture: 'amd64' as const,
    format,
    includeSource: false,
    includeContrib: false,
    includeNonFree: false,
    includeFirmware: release !== 'bullseye',
    includeSecurity: release !== 'sid',
    includeUpdates: release !== 'sid',
    includeBackports: false,
  }
}

describe('GeneratorControls', () => {
  it('stellt Bullseyes Einschränkungen als zugänglichen Steuerungszustand dar', async () => {
    const wrapper = mount(GeneratorControls, {
      props: props('bullseye'),
      global: { plugins: [vuetify] },
    })
    await nextTick()

    const firmware = wrapper.get('[aria-label="Non-free firmware"]')
    const backports = wrapper.get('[aria-label="Backports"]')
    expect(firmware.attributes()).toHaveProperty('disabled')
    expect(backports.attributes()).toHaveProperty('disabled')
    expect(firmware.attributes('aria-describedby')).toBe('release-capability-status')
    expect(wrapper.get('#release-capability-status').text()).toContain('bietet weder non-free-firmware noch Backports')
  })

  it('kennzeichnet Bookworm-Backports als nicht verfügbar und das klassische Format als veraltet', async () => {
    const wrapper = mount(GeneratorControls, {
      props: props('bookworm', 'legacy'),
      global: { plugins: [vuetify] },
    })
    await nextTick()

    const backports = wrapper.get('[aria-label="Backports"]')
    expect(backports.attributes()).toHaveProperty('disabled')
    expect(backports.attributes('aria-describedby')).toBe('release-capability-status')
    expect(wrapper.get('[aria-label="Ausgabeformat"]').attributes('value')).toContain('veraltet')
    expect(wrapper.get('#release-capability-status').text()).toContain('endete am 09.08.2026')
    expect(wrapper.get('#release-capability-status').text()).toContain('veraltete klassische sources.list-Format')
  })

  it('gibt eine Quellpaket-Auswahl über den beschrifteten Schalter aus', async () => {
    const wrapper = mount(GeneratorControls, {
      props: props(),
      global: { plugins: [vuetify] },
    })

    await wrapper.get('[aria-label="Quellpakete"]').setValue(true)

    expect(wrapper.emitted('update:includeSource')).toEqual([[true]])
  })

  it('bietet die Architekturauswahl als benanntes Kombinationsfeld an', () => {
    const wrapper = mount(GeneratorControls, {
      props: { ...props(), architecture: 'amd64' },
      global: { plugins: [vuetify] },
    })

    expect(wrapper.get('[aria-label="Architektur"]').attributes('role')).toBe('combobox')
    expect(wrapper.get('[aria-label="Architektur"]').attributes('value')).toContain('amd64')
  })

  it('übersetzt den Veröffentlichungsstatus für die Studio-Oberfläche', () => {
    const wrapper = mount(GeneratorControls, {
      props: props(),
      global: { plugins: [vuetify] },
    })

    expect(wrapper.text()).toContain('stabil')
    expect(wrapper.text()).not.toContain('stable')
  })
})
