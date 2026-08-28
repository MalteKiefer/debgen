import { mount } from '@vue/test-utils'
import { h } from 'vue'
import vuetify from '../plugins/vuetify'
import SourceOutput from './SourceOutput.vue'

describe('SourceOutput', () => {
  it('shows the exact filename and generated text in a semantic preview', () => {
    const content = 'Types: deb\nSuites: trixie\n'
    const wrapper = mount(SourceOutput, {
      props: {
        filename: 'debian.sources',
        content,
      },
      global: { plugins: [vuetify] },
    })

    expect(wrapper.text()).toContain('debian.sources')
    expect(wrapper.get('[aria-label="Vorschau der erzeugten Paketquellen"]').text()).toBe(content.trim())
  })

  it('renders caller-provided actions without defining copy or download controls', () => {
    const wrapper = mount(SourceOutput, {
      props: {
        filename: 'debian.list',
        content: 'deb https://deb.debian.org/debian bullseye main\n',
      },
      slots: {
        actions: '<button type="button">Aktion des nächsten Schritts</button>',
      },
      global: { plugins: [vuetify] },
    })

    expect(wrapper.get('.source-output__actions button').text()).toBe('Aktion des nächsten Schritts')
    expect(wrapper.text()).not.toContain('Kopieren')
    expect(wrapper.text()).not.toContain('Herunterladen')
  })

  it('groups caller-provided actions in a labelled region', () => {
    const wrapper = mount(SourceOutput, {
      props: {
        filename: 'debian.sources',
        content: 'Types: deb\nSuites: trixie\n',
      },
      slots: {
        actions: '<button type="button">Kopieren</button>',
      },
      global: { plugins: [vuetify] },
    })

    const actions = wrapper.get('[aria-label="Aktionen für die erzeugte Konfiguration"]')
    expect(actions.attributes('role')).toBe('group')
    expect(actions.get('button').text()).toBe('Kopieren')
  })

  it('passes the exact content and filename to the scoped actions slot', () => {
    const content = 'Types: deb\nSuites: trixie\n'
    const wrapper = mount(SourceOutput, {
      props: {
        filename: 'debian.sources',
        content,
      },
      slots: {
        actions: (slotProps?: { content: string, filename: string }) => h(
          'button',
          { type: 'button' },
          `${slotProps?.filename}|${slotProps?.content}`,
        ),
      },
      global: { plugins: [vuetify] },
    })

    expect(wrapper.get('.source-output__actions button').text()).toBe(`debian.sources|${content.trim()}`)
  })
})
