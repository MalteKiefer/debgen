import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import type { ReleaseCodename, SourceFormat } from '../features/sources/model'
import vuetify from '../plugins/vuetify'
import GeneratorControls from './GeneratorControls.vue'

function props(release: ReleaseCodename = 'trixie', format: SourceFormat = 'deb822') {
  return {
    release,
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
  it('presents Bullseye capability limits as accessible control state', async () => {
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
    expect(wrapper.get('#release-capability-status').text()).toContain('does not provide non-free-firmware or backports')
  })

  it('marks Bookworm backports unavailable and its legacy format deprecated', async () => {
    const wrapper = mount(GeneratorControls, {
      props: props('bookworm', 'legacy'),
      global: { plugins: [vuetify] },
    })
    await nextTick()

    const backports = wrapper.get('[aria-label="Backports"]')
    expect(backports.attributes()).toHaveProperty('disabled')
    expect(backports.attributes('aria-describedby')).toBe('release-capability-status')
    expect(wrapper.get('[aria-label="Output format"]').attributes('value')).toContain('deprecated')
    expect(wrapper.get('#release-capability-status').text()).toContain('Backports support ended on 2026-08-09')
    expect(wrapper.get('#release-capability-status').text()).toContain('deprecated legacy sources.list format')
  })

  it('emits a source-package selection from the labeled switch', async () => {
    const wrapper = mount(GeneratorControls, {
      props: props(),
      global: { plugins: [vuetify] },
    })

    await wrapper.get('[aria-label="Source packages"]').setValue(true)

    expect(wrapper.emitted('update:includeSource')).toEqual([[true]])
  })
})
