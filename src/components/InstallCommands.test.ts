import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, vi } from 'vitest'
import type { GeneratedArtifact } from '../features/vendors/model'
import vuetify from '../plugins/vuetify'
import InstallCommands from './InstallCommands.vue'

const { copyTextMock, downloadTextMock } = vi.hoisted(() => ({
  copyTextMock: vi.fn<(text: string) => Promise<void>>(),
  downloadTextMock: vi.fn(),
}))

vi.mock('../features/sources/download', () => ({ copyText: copyTextMock, downloadText: downloadTextMock }))

const setupArtifact: GeneratedArtifact = {
  filename: 'install-vendor-repositories.sh',
  mediaType: 'text/x-shellscript',
  description: 'Repository-Einrichtung',
  content: '#!/usr/bin/env bash\nset -euo pipefail\napt-get update\n',
}

describe('InstallCommands', () => {
  beforeEach(() => {
    copyTextMock.mockReset().mockResolvedValue(undefined)
    downloadTextMock.mockReset()
  })

  it('zeigt Repository-Einrichtung und Paketinstallation als getrennte prüfbare Befehle', async () => {
    const wrapper = mount(InstallCommands, {
      props: {
        setupArtifact,
        packageCommand: "apt-get install -y 'brave-browser' 'gh'\n",
      },
      global: { plugins: [vuetify] },
    })

    expect(wrapper.get('[aria-label="Repository-Einrichtung"]').text()).toContain('set -euo pipefail')
    expect(wrapper.get('[aria-label="Paketinstallation"]').text()).toContain("'brave-browser' 'gh'")
    expect(wrapper.get('[aria-label="Repository-Einrichtung"]').text()).toContain('install-vendor-repositories.sh')
    expect(wrapper.get('[aria-label="Repository-Einrichtung"]').text()).toContain('text/x-shellscript')
    expect(wrapper.text()).toContain('Prüfe Dateien und Befehle vor der Ausführung')
    expect(wrapper.findAll('pre').every((preview) => preview.attributes('tabindex') === '0')).toBe(true)
    expect(wrapper.get('pre[aria-label="Inhalt von install-vendor-repositories.sh"]').attributes('tabindex')).toBe('0')
    expect(wrapper.get('pre[aria-label="Befehl zur Paketinstallation"]').attributes('tabindex')).toBe('0')

    await wrapper.get('button[aria-label="Repository-Einrichtung kopieren"]').trigger('click')
    await flushPromises()
    expect(copyTextMock).toHaveBeenLastCalledWith('#!/usr/bin/env bash\nset -euo pipefail\napt-get update\n')

    await wrapper.get('button[aria-label="Paketinstallation kopieren"]').trigger('click')
    await flushPromises()
    expect(copyTextMock).toHaveBeenLastCalledWith("apt-get install -y 'brave-browser' 'gh'\n")
    expect(wrapper.get('[role="status"]').text()).toContain('Paketinstallation wurde kopiert')
  })

  it('macht alle Kopieraktionen zu mindestens 44 Pixel großen Touchzielen', () => {
    const wrapper = mount(InstallCommands, {
      props: { setupArtifact, packageCommand: "apt-get install -y 'gh'\n" },
      global: { plugins: [vuetify] },
    })

    expect(wrapper.findAll('button').every((button) => button.classes().includes('studio-touch-target'))).toBe(true)
  })

  it('lädt das vollständige Setup-Artefakt mit Dateiname und MIME-Typ herunter', async () => {
    const wrapper = mount(InstallCommands, {
      props: { setupArtifact, packageCommand: "apt-get install -y 'gh'\n" },
      global: { plugins: [vuetify] },
    })

    await wrapper.get('button[aria-label="install-vendor-repositories.sh herunterladen"]').trigger('click')

    expect(downloadTextMock).toHaveBeenCalledWith(
      setupArtifact.filename,
      setupArtifact.content,
      undefined,
      setupArtifact.mediaType,
    )
    expect(wrapper.get('[role="status"]').text()).toContain('install-vendor-repositories.sh wurde heruntergeladen')
  })

  it('löscht vorhandenes Kopierfeedback bei geänderten Befehlsinhalten', async () => {
    const wrapper = mount(InstallCommands, {
      props: { setupArtifact, packageCommand: "apt-get install -y 'gh'\n" },
      global: { plugins: [vuetify] },
    })

    await wrapper.get('button[aria-label="Repository-Einrichtung kopieren"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="status"]').exists()).toBe(true)

    await wrapper.setProps({ setupArtifact: { ...setupArtifact, content: 'set -euo pipefail\n# neu\n' } })
    expect(wrapper.find('[role="status"]').exists()).toBe(false)

    await wrapper.get('button[aria-label="Paketinstallation kopieren"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="status"]').exists()).toBe(true)

    await wrapper.setProps({ packageCommand: "apt-get install -y 'brave-browser'\n" })
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it.each(['setupArtifact', 'packageCommand'] as const)(
    'verwirft verspätetes Kopierfeedback nach einer Änderung von %s',
    async (changedProp) => {
      let resolveCopy: (() => void) | undefined
      copyTextMock.mockImplementation(() => new Promise<void>((resolve) => { resolveCopy = resolve }))
      const wrapper = mount(InstallCommands, {
        props: { setupArtifact, packageCommand: "apt-get install -y 'gh'\n" },
        global: { plugins: [vuetify] },
      })

      const action = changedProp === 'setupArtifact'
        ? 'Repository-Einrichtung kopieren'
        : 'Paketinstallation kopieren'
      await wrapper.get(`button[aria-label="${action}"]`).trigger('click')
      if (changedProp === 'setupArtifact') {
        await wrapper.setProps({ setupArtifact: { ...setupArtifact, content: 'set -euo pipefail\n# geändert\n' } })
      } else {
        await wrapper.setProps({ packageCommand: "apt-get install -y 'brave-browser'\n" })
      }

      resolveCopy?.()
      await flushPromises()

      expect(wrapper.find('.install-commands__feedback [role="status"]').exists()).toBe(false)
      expect(wrapper.find('.install-commands__feedback [role="alert"]').exists()).toBe(false)
    },
  )
})
