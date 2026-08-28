import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, vi } from 'vitest'
import vuetify from '../plugins/vuetify'
import InstallCommands from './InstallCommands.vue'

const { copyTextMock } = vi.hoisted(() => ({
  copyTextMock: vi.fn<(text: string) => Promise<void>>(),
}))

vi.mock('../features/sources/download', () => ({ copyText: copyTextMock }))

describe('InstallCommands', () => {
  beforeEach(() => {
    copyTextMock.mockReset().mockResolvedValue(undefined)
  })

  it('zeigt Repository-Einrichtung und Paketinstallation als getrennte prüfbare Befehle', async () => {
    const wrapper = mount(InstallCommands, {
      props: {
        setupScript: '#!/usr/bin/env bash\nset -euo pipefail\napt-get update\n',
        packageCommand: "apt-get install -y 'brave-browser' 'gh'\n",
      },
      global: { plugins: [vuetify] },
    })

    expect(wrapper.get('[aria-label="Repository-Einrichtung"]').text()).toContain('set -euo pipefail')
    expect(wrapper.get('[aria-label="Paketinstallation"]').text()).toContain("'brave-browser' 'gh'")
    expect(wrapper.text()).toContain('Prüfe Dateien und Befehle vor der Ausführung')
    expect(wrapper.findAll('pre').every((preview) => preview.attributes('tabindex') === '0')).toBe(true)

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
      props: { setupScript: 'set -euo pipefail\n', packageCommand: "apt-get install -y 'gh'\n" },
      global: { plugins: [vuetify] },
    })

    expect(wrapper.findAll('button').every((button) => button.classes().includes('studio-touch-target'))).toBe(true)
  })
})
