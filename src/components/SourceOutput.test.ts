import { mount } from '@vue/test-utils'
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
    expect(wrapper.get('[aria-label="Generated sources preview"]').text()).toBe(content.trim())
  })

  it('renders caller-provided actions without defining copy or download controls', () => {
    const wrapper = mount(SourceOutput, {
      props: {
        filename: 'debian.list',
        content: 'deb https://deb.debian.org/debian bullseye main\n',
      },
      slots: {
        actions: '<button type="button">Next task action</button>',
      },
      global: { plugins: [vuetify] },
    })

    expect(wrapper.get('.source-output__actions button').text()).toBe('Next task action')
    expect(wrapper.text()).not.toContain('Copy')
    expect(wrapper.text()).not.toContain('Download')
  })

  it('groups caller-provided actions in a labelled region', () => {
    const wrapper = mount(SourceOutput, {
      props: {
        filename: 'debian.sources',
        content: 'Types: deb\nSuites: trixie\n',
      },
      slots: {
        actions: '<button type="button">Copy</button>',
      },
      global: { plugins: [vuetify] },
    })

    expect(wrapper.get('[aria-label="Generated configuration actions"] button').text()).toBe('Copy')
  })
})
