import { mount } from '@vue/test-utils'
import type { ReleaseCodename, SourceFormat } from '../features/sources/model'
import type { SystemArchitecture } from '../features/vendors/model'
import SystemStep from './SystemStep.vue'
import vuetify from '../plugins/vuetify'

function props() {
  return {
    release: 'trixie' as ReleaseCodename,
    architecture: 'amd64' as SystemArchitecture,
    format: 'deb822' as SourceFormat,
    includeSource: false,
    includeContrib: false,
    includeNonFree: false,
    includeFirmware: true,
    includeSecurity: true,
    includeUpdates: true,
    includeBackports: false,
  }
}

describe('SystemStep', () => {
  it('zeigt Systemstatus und eine zugängliche Architekturauswahl', () => {
    const wrapper = mount(SystemStep, {
      props: props(),
      global: { plugins: [vuetify] },
    })

    expect(wrapper.get('h2').text()).toBe('Debian-System')
    expect(wrapper.get('[aria-label="Architektur"]').attributes('role')).toBe('combobox')
    expect(wrapper.text()).toContain('Trixie')
    expect(wrapper.text()).toContain('amd64')
  })
})
