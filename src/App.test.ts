import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'

describe('App', () => {
  it('renders the application shell with safe external links', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [vuetify],
      },
    })

    await nextTick()
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    expect(wrapper.text()).toContain('DebGen')
    expect(wrapper.get('main')).toBeTruthy()

    const externalLinks = wrapper.findAll('a[target="_blank"]')
    expect(externalLinks).not.toHaveLength(0)
    externalLinks.forEach((link) => {
      expect(link.attributes('rel')).toContain('noopener')
      expect(link.attributes('rel')).toContain('noreferrer')
    })
  })
})
