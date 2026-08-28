import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'

describe('App', () => {
  it('rendert die Debian-Studio-Hülle mit sicheren externen Links', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [vuetify],
      },
    })

    await nextTick()
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    expect(wrapper.text()).toContain('DebGen')
    expect(wrapper.findAll('header')).toHaveLength(1)
    expect(wrapper.findAll('main')).toHaveLength(1)
    expect(wrapper.get('main').text()).toContain('Debian-System')

    const externalLinks = wrapper.findAll('a[target="_blank"]')
    expect(externalLinks).not.toHaveLength(0)
    externalLinks.forEach((link) => {
      expect(link.attributes('rel')).toContain('noopener')
      expect(link.attributes('rel')).toContain('noreferrer')
    })
  })
})
