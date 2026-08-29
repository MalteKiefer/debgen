import { mount } from '@vue/test-utils'
import VendorStep from './VendorStep.vue'
import vuetify from '../plugins/vuetify'

function mountStep(options: Partial<{
  release: 'trixie' | 'bookworm'
  architecture: 'amd64' | 'arm64'
  selectedIds: string[]
}> = {}) {
  return mount(VendorStep, {
    props: {
      release: options.release ?? 'trixie',
      architecture: options.architecture ?? 'amd64',
      selectedIds: options.selectedIds ?? [],
    },
    global: { plugins: [vuetify] },
  })
}

describe('VendorStep', () => {
  it('zeigt alle Katalogprodukte und die Anzahl der ausgewählten Paketquellen', () => {
    const wrapper = mountStep({ selectedIds: ['brave-browser', 'github-cli'] })

    expect(wrapper.findAll('[data-testid="produktkarte"]')).toHaveLength(100)
    expect(wrapper.get('[role="status"]').text()).toContain('2 Paketquellen ausgewählt')
  })

  it('normalisiert beim ersten Rendern inkompatible und unbekannte Auswahl-IDs', () => {
    const wrapper = mountStep({
      architecture: 'arm64',
      selectedIds: ['brave-browser', 'google-chrome', 'unbekanntes-produkt'],
    })

    expect(wrapper.emitted('update:selectedIds')).toEqual([[['brave-browser']]])
    expect(wrapper.get('[role="status"]').text()).toContain('Google Chrome')
    expect(wrapper.get('[role="status"]').text()).toContain('unbekannte Auswahl')
  })

  it('normalisiert nachträgliche Auswahl-Updates einmalig ohne Emit-Schleife', async () => {
    const wrapper = mountStep({ architecture: 'arm64' })

    await wrapper.setProps({ selectedIds: ['brave-browser', 'google-chrome', 'unbekanntes-produkt'] })

    expect(wrapper.emitted('update:selectedIds')).toEqual([[['brave-browser']]])

    await wrapper.setProps({ selectedIds: ['brave-browser'] })

    expect(wrapper.emitted('update:selectedIds')).toEqual([[['brave-browser']]])
  })

  it('behält die Bereinigungserklärung, wenn ein Parent die normalisierte Auswahl zurückspiegelt', async () => {
    const wrapper = mountStep({ selectedIds: ['brave-browser', 'google-chrome'] })

    await wrapper.setProps({ architecture: 'arm64' })
    await wrapper.setProps({ selectedIds: ['brave-browser'] })

    expect(wrapper.emitted('update:selectedIds')).toEqual([[['brave-browser']]])
    expect(wrapper.get('[role="status"]').text()).toContain('Architektur arm64')
    expect(wrapper.get('[role="status"]').text()).toContain('Google Chrome')
  })

  it('löscht eine alte Bereinigungserklärung bei einer neuen kompatiblen externen Auswahl', async () => {
    const wrapper = mountStep({ selectedIds: ['brave-browser', 'google-chrome'] })

    await wrapper.setProps({ architecture: 'arm64' })
    await wrapper.setProps({ selectedIds: ['brave-browser'] })
    await wrapper.setProps({ selectedIds: ['brave-browser', 'github-cli'] })

    expect(wrapper.emitted('update:selectedIds')).toEqual([[['brave-browser']]])
    expect(wrapper.get('[role="status"]').text()).toContain('2 Paketquellen ausgewählt')
    expect(wrapper.get('[role="status"]').text()).not.toContain('Google Chrome')
  })

  it('filtert Produkte nach Suchbegriff ohne die Auswahl zu verändern', async () => {
    const wrapper = mountStep({ selectedIds: ['brave-browser'] })

    await wrapper.get('input[type="search"]').setValue('Docker')

    expect(wrapper.findAll('[data-testid="produktkarte"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('Docker Engine')
    expect(wrapper.emitted('update:selectedIds')).toBeUndefined()
  })

  it('sortiert die sichtbare Produktliste alphabetisch', () => {
    const wrapper = mountStep()
    const names = wrapper.findAll('[data-testid="produktkarte"] h3').map((heading) => heading.text())

    expect(names).toEqual([...names].sort((left, right) => left.localeCompare(right, 'de')))
  })

  it('durchsucht lokalisierte Kategorien und unveränderte technische Produktwerte', async () => {
    const wrapper = mountStep()

    await wrapper.get('input[type="search"]').setValue('docker-ce')
    expect(wrapper.findAll('[data-testid="produktkarte"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('Docker Engine')

    await wrapper.get('input[type="search"]').setValue('Privatsphäre')
    expect(wrapper.text()).toContain('Proton VPN')
  })

  it('kombiniert Kategorie-, Herkunfts- und Kompatibilitätsfilter', async () => {
    const wrapper = mountStep({ architecture: 'arm64' })

    await wrapper.get('[aria-label="Kategorie Browser"]').trigger('click')
    await wrapper.get('[data-testid="origin-filter"]').setValue('manufacturer')
    await wrapper.get('[data-testid="compatibility-filter"]').setValue('incompatible')

    const cards = wrapper.findAll('[data-testid="produktkarte"]')
    expect(cards.length).toBeGreaterThan(0)
    expect(cards.every((card) => card.find('input[type="checkbox"]').attributes('disabled') !== undefined)).toBe(true)
    expect(wrapper.text()).toContain('Google Chrome')
    expect(wrapper.text()).not.toContain('Mozilla Firefox')
  })

  it('filtert Produkte nach deutscher Kategorie', async () => {
    const wrapper = mountStep()

    await wrapper.get('[aria-label="Kategorie Browser"]').trigger('click')

    expect(wrapper.findAll('[data-testid="produktkarte"]')).toHaveLength(8)
    expect(wrapper.text()).toContain('Brave Browser')
    expect(wrapper.text()).not.toContain('Docker Engine')
  })

  it('übernimmt nur die Auswahl kompatibler Produktkarten', async () => {
    const wrapper = mountStep()

    await wrapper.get('input[aria-label="Brave Browser auswählen"]').setValue(true)

    expect(wrapper.emitted('update:selectedIds')).toEqual([[['brave-browser']]])
  })

  it('entfernt nach einem Architekturwechsel inkompatible Auswahl und erklärt die Änderung', async () => {
    const wrapper = mountStep({ selectedIds: ['brave-browser', 'google-chrome'] })

    await wrapper.setProps({ architecture: 'arm64' })

    expect(wrapper.emitted('update:selectedIds')).toContainEqual([['brave-browser']])
    expect(wrapper.get('[role="status"]').text()).toContain('Architektur')
    expect(wrapper.get('[role="status"]').text()).toContain('Google Chrome')
  })

  it('entfernt nach einem Releasewechsel inkompatible Auswahl und nennt das Release', async () => {
    const wrapper = mountStep({ release: 'bookworm', selectedIds: ['brave-browser', 'azure-cli'] })

    await wrapper.setProps({ release: 'trixie' })

    expect(wrapper.emitted('update:selectedIds')).toContainEqual([['brave-browser']])
    expect(wrapper.get('[role="status"]').text()).toContain('Trixie')
    expect(wrapper.get('[role="status"]').text()).toContain('Microsoft Azure CLI')
  })
})
