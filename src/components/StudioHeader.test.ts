import { mount } from '@vue/test-utils'
import StudioHeader from './StudioHeader.vue'
import vuetify from '../plugins/vuetify'

describe('StudioHeader', () => {
  it('kennzeichnet Debian Studio und erklärt den offiziellen Vertrauensrahmen auf Deutsch', () => {
    const wrapper = mount(StudioHeader, { global: { plugins: [vuetify] } })

    expect(wrapper.get('h1').text()).toBe('Debian Studio')
    expect(wrapper.text()).toContain('Nur offizielle Paketquellen')
    expect(wrapper.get('header').attributes('role')).toBe('banner')
  })
})
