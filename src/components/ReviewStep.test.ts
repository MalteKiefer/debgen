import { mount } from '@vue/test-utils'
import type { GeneratedArtifact, OutputMode } from '../features/vendors/model'
import vuetify from '../plugins/vuetify'
import ReviewStep from './ReviewStep.vue'

const debianArtifact: GeneratedArtifact = {
  filename: 'debian.sources',
  mediaType: 'text/plain',
  description: 'Debian-Paketquellen',
  content: 'Types: deb\nSuites: trixie\n',
}

function mountReview(options: Partial<{
  selectedIds: string[]
  outputMode: OutputMode
}> = {}) {
  return mount(ReviewStep, {
    props: {
      release: 'trixie',
      architecture: 'amd64',
      selectedIds: options.selectedIds ?? ['brave-browser', 'github-cli'],
      outputMode: options.outputMode ?? 'perVendor',
      debianArtifact,
    },
    global: { plugins: [vuetify] },
  })
}

describe('ReviewStep', () => {
  it('zeigt standardmäßig einzelne Herstellerdateien und die vollständige Auswahlzusammenfassung', () => {
    const wrapper = mountReview()

    expect(wrapper.get('input[value="perVendor"]').element).toHaveProperty('checked', true)
    expect(wrapper.get('[aria-label="Ausgewählte Software"]').text()).toContain('Brave Browser')
    expect(wrapper.get('[aria-label="Ausgewählte Software"]').text()).toContain('GitHub CLI')
    expect(wrapper.text()).toContain('debian.sources')
    expect(wrapper.text()).toContain('brave-browser.sources')
    expect(wrapper.text()).toContain('github-cli.sources')
  })

  it.each([
    ['combined', 'vendors.sources', 'brave-browser.sources'],
    ['byCategory', 'browser.sources', 'brave-browser.sources'],
  ] as const)('gruppiert die Vorschau im Modus %s', async (mode, visibleFile, hiddenFile) => {
    const wrapper = mountReview()

    await wrapper.get(`input[value="${mode}"]`).setValue(true)

    expect(wrapper.emitted('update:outputMode')).toContainEqual([mode])
    await wrapper.setProps({ outputMode: mode })
    expect(wrapper.text()).toContain(visibleFile)
    expect(wrapper.text()).not.toContain(hiddenFile)
    expect(wrapper.text()).toContain('debian.sources')
  })

  it('erzeugt bei leerer Herstellerwahl ausschließlich die Debian-Datei', () => {
    const wrapper = mountReview({ selectedIds: [] })

    expect(wrapper.get('[role="status"]').text()).toContain('Keine zusätzlichen Paketquellen ausgewählt')
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('debian.sources')
    expect(wrapper.find('[aria-label="Installationsbefehle"]').exists()).toBe(false)
  })

  it('zeigt produktbezogene Warnungen vor Export und Installation', () => {
    const wrapper = mountReview({ selectedIds: ['docker-engine'] })

    const warning = wrapper.get('[aria-label="Wichtige Hinweise"]')
    expect(warning.attributes('role')).toBe('alert')
    expect(warning.text()).toContain('Docker Engine')
    expect(warning.text()).toContain('Firewall-Regeln')
  })

  it('zeigt Paketinstallation separat von der Repository-Einrichtung', () => {
    const wrapper = mountReview({ selectedIds: ['brave-browser', 'github-cli'] })

    const setup = wrapper.get('[aria-label="Repository-Einrichtung"]').text()
    const packages = wrapper.get('[aria-label="Paketinstallation"]').text()

    expect(setup).toContain('curl --fail')
    expect(setup).not.toContain("apt-get install -y 'brave-browser' 'gh'")
    expect(packages).toContain("'brave-browser' 'gh'")
  })
})
