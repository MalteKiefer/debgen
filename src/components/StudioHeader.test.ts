import { mount } from '@vue/test-utils'
import { resolve } from 'node:path'
import { compile } from 'sass'
import { afterAll, beforeAll } from 'vitest'
import { setLocale } from '../i18n'
import StudioHeader from './StudioHeader.vue'
import vuetify from '../plugins/vuetify'

const stylesheet = document.createElement('style')

beforeAll(() => {
  const stylesheetPath = resolve(process.cwd(), 'src/styles/main.scss')
  stylesheet.textContent = compile(stylesheetPath).css
  document.head.append(stylesheet)
})

afterAll(() => {
  stylesheet.remove()
})

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

  it('wraps every visible 44px control instead of hiding project links at narrow widths', () => {
    const previousWidth = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 })

    const wrapper = mount(StudioHeader, { global: { plugins: [vuetify] } })
    const header = wrapper.get('header')
    const controls = wrapper.get('nav')
    const interactiveControls = [wrapper.get('select'), ...wrapper.findAll('a')]

    expect(getComputedStyle(header.element).flexWrap).toBe('wrap')
    expect(getComputedStyle(controls.element).flexWrap).toBe('wrap')
    expect(wrapper.findAll('a')).toHaveLength(2)
    interactiveControls.forEach((control) => {
      const style = getComputedStyle(control.element)
      expect(style.display).not.toBe('none')
      expect(Number.parseFloat(style.minBlockSize)).toBeGreaterThanOrEqual(44)
    })

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: previousWidth })
  })
})
