import { mount } from '@vue/test-utils'
import StudioProgress from './StudioProgress.vue'
import vuetify from '../plugins/vuetify'

describe('StudioProgress', () => {
  it('bietet die drei Studio-Schritte als deutsche, tastaturbedienbare Navigation an', async () => {
    const wrapper = mount(StudioProgress, {
      props: { modelValue: 1 },
      global: { plugins: [vuetify] },
    })

    expect(wrapper.get('nav').attributes('aria-label')).toBe('Studio-Schritte')
    expect(wrapper.text()).toContain('Debian-System')
    expect(wrapper.text()).toContain('Offizielle Software')
    expect(wrapper.text()).toContain('Prüfen und exportieren')

    await wrapper.get('[aria-label="Schritt 2: Offizielle Software"]').trigger('keydown.enter')

    expect(wrapper.emitted('update:modelValue')).toEqual([[2]])
  })
})
