import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { generateSources } from '../features/sources/generate'
import { VENDOR_PRODUCTS } from '../features/vendors/catalog'
import {
  generateInstallScript,
  generatePackageInstallCommand,
  generateVendorArtifacts,
} from '../features/vendors/generate'
import { i18n, setLocale, SUPPORTED_LOCALES } from './index'
import * as format from './format'

const representativeHeadings = {
  en: 'Official software',
  de: 'Offizielle Software',
  es: 'Software oficial',
  fr: 'Logiciels officiels',
  it: 'Software ufficiale',
  ru: 'Официальное ПО',
  pt: 'Software oficial',
  pl: 'Oficjalne oprogramowanie',
  'zh-CN': '官方软件',
  ja: '公式ソフトウェア',
} as const

describe('complete interface localization', () => {
  it.each(SUPPORTED_LOCALES)('%s translates representative core interface copy', (nextLocale) => {
    setLocale(nextLocale, { document: null, storage: null })

    expect(i18n.global.t('vendor.heading')).toBe(representativeHeadings[nextLocale])
    expect(i18n.global.t('review.heading')).not.toBe('review.heading')
    expect(i18n.global.t('actions.copy')).not.toBe('actions.copy')
    expect(i18n.global.t('workspace.ariaLabel')).not.toBe('workspace.ariaLabel')
    expect(i18n.global.t('warnings.docker-firewall')).not.toBe('warnings.docker-firewall')
  })

  it('matches localized human text while preserving exact technical search tokens', () => {
    const matchesSearch = (format as unknown as {
      matchesSearch(
        query: string,
        humanValues: readonly string[],
        technicalValues: readonly string[],
        locale: 'de',
      ): boolean
    }).matchesSearch

    expect(matchesSearch('PRIVATSPHÄRE', ['Privatsphäre'], [], 'de')).toBe(true)
    expect(matchesSearch('docker-ce', ['Docker Engine'], ['docker-ce'], 'de')).toBe(true)
    expect(matchesSearch('docker ce', ['Docker Engine'], ['docker-ce'], 'de')).toBe(false)
  })

  it('contains no known visible interface literals or Unicode long dashes outside locale modules', () => {
    const files = [
      'index.html',
      'src/App.vue',
      'src/components/GeneratedFileTabs.vue',
      'src/components/GeneratorControls.vue',
      'src/components/InstallCommands.vue',
      'src/components/ReviewStep.vue',
      'src/components/SelectionSummary.vue',
      'src/components/SourceGenerator.vue',
      'src/components/SourceOutput.vue',
      'src/components/StudioHeader.vue',
      'src/components/StudioProgress.vue',
      'src/components/SystemStep.vue',
      'src/components/VendorCard.vue',
      'src/components/VendorStep.vue',
    ]
    const forbidden = [
      'Nur offizielle Paketquellen',
      'Offizielle Software',
      'Paketquellen konfigurieren',
      'Erzeugte Dateien',
      'Kopieren fehlgeschlagen',
      'Herunterladen fehlgeschlagen',
      'Aktuelle Auswahl',
      'Prüfen und exportieren',
      'Software suchen',
      'DebGen benötigt JavaScript',
    ]

    for (const file of files) {
      const source = readFileSync(resolve(file), 'utf8')
      expect(source, file).not.toMatch(/[\u2013\u2014]/u)
      for (const literal of forbidden) expect(source, `${file}: ${literal}`).not.toContain(literal)
    }
  })
})

describe('locale neutral technical artifacts', () => {
  it('keeps sources, scripts, filenames, commands, URLs, packages, and fingerprints byte stable', () => {
    const product = VENDOR_PRODUCTS.find((candidate) => candidate.id === 'brave-browser')
    expect(product).toBeDefined()
    if (!product) return

    const config = {
      release: 'trixie' as const,
      architecture: 'amd64' as const,
      productIds: [product.id],
    }
    const capture = () => {
      const debian = generateSources({
        release: 'trixie',
        format: 'deb822',
        includeSource: true,
        includeSecurity: true,
        includeUpdates: true,
        includeBackports: false,
        components: ['main', 'contrib', 'non-free-firmware'],
      })
      const artifacts = generateVendorArtifacts(config)
      const install = generateInstallScript(config, artifacts)

      return JSON.stringify({
        debian,
        artifacts: artifacts.map(({ filename, mediaType, content }) => ({ filename, mediaType, content })),
        install: { filename: install.filename, mediaType: install.mediaType, content: install.content },
        packageCommand: generatePackageInstallCommand(config),
        packages: product.packages,
        sourceId: product.sourceId,
      })
    }
    const baseline = capture()

    for (const nextLocale of SUPPORTED_LOCALES) {
      setLocale(nextLocale, { document: null, storage: null })
      expect(capture()).toBe(baseline)
    }
  })
})
