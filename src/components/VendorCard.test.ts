import { mount } from '@vue/test-utils'
import VendorCard from './VendorCard.vue'
import { getVendorProduct } from '../features/vendors/catalog'
import vuetify from '../plugins/vuetify'

const brave = getVendorProduct('brave-browser')!
const chrome = getVendorProduct('google-chrome')!

function mountCard(options: Partial<{
  product: typeof brave
  release: 'trixie' | 'bookworm'
  architecture: 'amd64' | 'arm64'
  selected: boolean
}> = {}) {
  return mount(VendorCard, {
    props: {
      product: options.product ?? brave,
      release: options.release ?? 'trixie',
      architecture: options.architecture ?? 'amd64',
      selected: options.selected ?? false,
    },
    global: { plugins: [vuetify] },
  })
}

describe('VendorCard', () => {
  it('zeigt kataloggesteuert Kategorie-Icon, offizielle Kennzeichnung und Architektur an', () => {
    const wrapper = mountCard()

    expect(wrapper.get('h3').text()).toBe('Brave Browser')
    expect(wrapper.get('[data-testid="kategorie-icon"]').classes()).toContain('mdi-shield-check')
    expect(wrapper.text()).toContain('Offizielle Quelle')
    expect(wrapper.text()).toContain('amd64')
    expect(wrapper.text()).toContain('arm64')
    const documentation = wrapper.get('a')
    expect(documentation.attributes('href')).toBe('https://brave.com/linux/')
    expect(documentation.attributes('aria-label'))
      .toBe('Brave Browser: offizielle Anleitung (öffnet in neuem Tab)')
  })

  it('verwendet bei fehlendem Produkt-Icon das Kategorie-Icon als Rückfall', () => {
    const wrapper = mountCard({ product: { ...brave, icon: undefined } as never })

    expect(wrapper.get('[data-testid="kategorie-icon"]').classes()).toContain('mdi-web')
  })

  it('meldet kompatible Auswahl über ein beschriftetes Kontrollfeld', async () => {
    const wrapper = mountCard()
    const control = wrapper.get('input[type="checkbox"]')

    expect(control.attributes('aria-label')).toBe('Brave Browser auswählen')
    expect(control.attributes('disabled')).toBeUndefined()

    await control.setValue(true)

    expect(wrapper.emitted('update:selected')).toEqual([[true]])
  })

  it('deaktiviert inkompatible Produkte mit dem Grund aus der Kompatibilitätsprüfung', () => {
    const wrapper = mountCard({ product: chrome, architecture: 'arm64' })
    const control = wrapper.get('input[type="checkbox"]')

    expect(control.attributes('disabled')).toBeDefined()
    expect(control.attributes('aria-describedby')).toBe('google-chrome-kompatibilitaet')
    expect(wrapper.get('#google-chrome-kompatibilitaet').text())
      .toContain('Die Architektur „arm64“ wird von Google Chrome nicht unterstützt.')
  })

  it('öffnet einen sicher vorausgefüllten Defektbericht mit Produkt-, Quelle- und Systemmetadaten', () => {
    const wrapper = mountCard()
    const report = wrapper.get('[data-testid="report-issue"]')
    const url = new URL(report.attributes('href') ?? '')

    expect(url.origin + url.pathname).toBe('https://github.com/maltekiefer/debgen/issues/new')
    expect(url.searchParams.get('title')).toContain('Brave Browser')
    expect(url.searchParams.get('body')).toContain('Product ID: brave-browser')
    expect(url.searchParams.get('body')).toContain('Source ID: brave-browser')
    expect(url.searchParams.get('body')).toContain('Release: trixie')
    expect(url.searchParams.get('body')).toContain('Architecture: amd64')
    expect(report.attributes('target')).toBe('_blank')
    expect(report.attributes('rel')).toContain('noopener')
    expect(report.attributes('aria-label')).toContain('Brave Browser')
  })
})
