import { mount } from '@vue/test-utils'
import { setLocale } from '../i18n'
import StudioHeader from './StudioHeader.vue'
import vuetify from '../plugins/vuetify'

describe('StudioHeader', () => {
  it('kennzeichnet Debian Workbench und erklärt den offiziellen Vertrauensrahmen auf Deutsch', () => {
    const wrapper = mount(StudioHeader, { global: { plugins: [vuetify] } })

    expect(wrapper.get('h1').text()).toBe('Debian Workbench')
    expect(wrapper.text()).toContain('Nur offizielle Paketquellen')
    expect(wrapper.get('header').attributes('role')).toBe('banner')
    expect(wrapper.get('select').attributes('aria-label')).toBe('Sprache auswählen')
  })

  it('shows Liberapay and GitHub as safe icon-only links with names and tooltips', () => {
    setLocale('en', { document, storage: null })
    const wrapper = mount(StudioHeader, { global: { plugins: [vuetify] } })

    const links = wrapper.findAll('a[target="_blank"]')
    expect(links).toHaveLength(2)
    expect(links.map((link) => link.attributes('aria-label'))).toEqual([
      'Support the project on Liberapay',
      'Open the project on GitHub',
    ])
    links.forEach((link) => {
      expect(link.text()).toBe('')
      expect(link.attributes('title')).toBe(link.attributes('aria-label'))
      expect(link.attributes('rel')).toContain('noopener')
      expect(link.attributes('rel')).toContain('noreferrer')
      expect(link.classes()).toContain('studio-touch-target')
      expect(link.classes()).toContain('studio-icon-link')
    })
    expect(wrapper.text()).not.toContain('Liberapay')
    expect(wrapper.text()).not.toContain('GitHub')
  })
})
