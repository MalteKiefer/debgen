import { mount } from '@vue/test-utils'
import { afterEach } from 'vitest'
import {
  initializeLocale,
  locale,
  setLocale,
} from '../i18n'
import { LOCALE_STORAGE_KEY } from '../i18n/locales'
import vuetify from '../plugins/vuetify'
import LanguageSelect from './LanguageSelect.vue'

const nativeLanguageNames = [
  'English',
  'Deutsch',
  'Español',
  'Français',
  'Italiano',
  'Русский',
  'Português',
  'Polski',
  '简体中文',
  '日本語',
]

function mountSelect() {
  return mount(LanguageSelect, {
    attachTo: document.body,
    global: { plugins: [vuetify] },
  })
}

afterEach(() => {
  localStorage.clear()
  setLocale('de', { document, storage: null })
})

describe('LanguageSelect', () => {
  it('offers exactly ten languages under their native names', () => {
    setLocale('en', { document, storage: null })
    const wrapper = mountSelect()

    expect(wrapper.get('select').attributes('aria-label')).toBe('Select language')
    expect(wrapper.findAll('option').map((option) => option.text())).toEqual(nativeLanguageNames)
    expect(wrapper.get('select').classes()).toContain('studio-touch-target')
  })

  it('persists changes and synchronizes Vue I18n, Vuetify, and html[lang]', async () => {
    const wrapper = mountSelect()

    await wrapper.get('select').setValue('ja')

    expect(locale.value).toBe('ja')
    expect(document.documentElement.lang).toBe('ja')
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ja')
    expect(wrapper.get('select').attributes('aria-label')).toBe('言語を選択')
  })

  it('renders the English fallback when browser and stored locales are unsupported', () => {
    initializeLocale({ document, languages: ['nl-NL'], storage: localStorage })

    const wrapper = mountSelect()

    expect(locale.value).toBe('en')
    expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('en')
    expect(wrapper.get('select').attributes('aria-label')).toBe('Select language')
  })
})
