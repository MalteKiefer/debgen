import { describe, expect, it } from 'vitest'
import { VENDOR_PRODUCTS } from '../../src/features/vendors/catalog'
import { SUPPORTED_LOCALES } from '../../src/i18n/locales'
import { getSiteCopyForBuild, SITE_COPY } from '../../src/site/locales'
import { buildAlternates, canonicalUrl, sitePath } from '../../src/site/routes'
import {
  buildBreadcrumbJsonLd,
  buildSeoMetadata,
  buildWebsiteJsonLd,
  renderRobots,
  renderSitemap,
} from '../../src/site/seo'
import { camelKey } from '../../src/workbench/text'

describe('localized site routes', () => {
  it('creates locale-prefixed paths with encoded segments and a trailing slash', () => {
    expect(sitePath('de', ['repositories', 'Docker Engine'])).toBe('/de/repositories/Docker%20Engine/')
  })

  it('creates reciprocal locale routes and x-default', () => {
    const links = buildAlternates(['repositories', 'docker-engine'])

    expect(links).toHaveLength(SUPPORTED_LOCALES.length + 1)
    expect(links).toContainEqual({ lang: 'de', href: 'https://debgen.org/de/repositories/docker-engine/' })
    expect(links).toContainEqual({ lang: 'x-default', href: 'https://debgen.org/en/repositories/docker-engine/' })
  })

  it('uses a query-free canonical URL', () => {
    expect(canonicalUrl('/de/repositories/docker-engine/?release=trixie#overview'))
      .toBe('https://debgen.org/de/repositories/docker-engine/')
  })
})

describe('SEO discovery artifacts', () => {
  it('builds self-canonical page metadata without an empty JSON-LD field', () => {
    expect(buildSeoMetadata({
      locale: 'fr',
      segments: ['repositories'],
      title: 'Dépôts DebGen',
      description: 'Des sources vérifiées.',
    })).toEqual({
      title: 'Dépôts DebGen',
      description: 'Des sources vérifiées.',
      canonical: 'https://debgen.org/fr/repositories/',
      alternates: expect.arrayContaining([
        { lang: 'fr', href: 'https://debgen.org/fr/repositories/' },
        { lang: 'x-default', href: 'https://debgen.org/en/repositories/' },
      ]),
    })
  })

  it('keeps query combinations out of the sitemap', () => {
    const sitemap = renderSitemap([
      { path: '/en/', lastModified: '2026-08-29' },
      { path: '/de/repositories/docker-engine/?release=trixie' },
    ])

    expect(sitemap).not.toContain('?')
    expect(sitemap).toContain('<loc>https://debgen.org/de/repositories/docker-engine/</loc>')
  })

  it('publishes the exact file URL for the sitemap', () => {
    expect(renderRobots()).toBe('User-agent: *\nAllow: /\nSitemap: https://debgen.org/sitemap.xml\n')
  })

  it('builds website and breadcrumb structured data for localized content', () => {
    expect(buildWebsiteJsonLd('de', SITE_COPY.de)).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      inLanguage: 'de',
      url: 'https://debgen.org/de/',
    })
    const breadcrumbs = buildBreadcrumbJsonLd('de', ['repositories', 'docker-engine'])

    expect(breadcrumbs).toMatchObject({ '@type': 'BreadcrumbList' })
    expect(breadcrumbs.itemListElement[0]).toMatchObject({
      position: 1,
      item: 'https://debgen.org/de/',
    })
    expect(breadcrumbs.itemListElement[2]).toMatchObject({
      position: 3,
      item: 'https://debgen.org/de/repositories/docker-engine/',
    })
  })
})

describe('build-time copy', () => {
  it('uses English only when the static build receives no locale', () => {
    expect(getSiteCopyForBuild(undefined)).toBe(SITE_COPY.en)
    expect(getSiteCopyForBuild('ja')).toBe(SITE_COPY.ja)
  })

  const leafPaths = (value: unknown, prefix = ''): string[] => typeof value === 'string'
    ? [prefix]
    : Object.entries(value as object).flatMap(([key, child]) => leafPaths(child, prefix ? `${prefix}.${key}` : key))

  it.each(SUPPORTED_LOCALES)('%s supplies every Workbench text with the English placeholders', (locale) => {
    const copy = SITE_COPY[locale]
    const read = (value: object, path: string): string => path.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], value) as string

    expect(leafPaths(copy).sort()).toEqual(leafPaths(SITE_COPY.en).sort())
    for (const path of leafPaths(SITE_COPY.en)) {
      const text = read(copy, path)
      expect(text, path).not.toBe('')
      expect(text.match(/\{\w+\}/gu)?.sort() ?? [], path).toEqual(read(SITE_COPY.en, path).match(/\{\w+\}/gu)?.sort() ?? [])
    }
  })

  it('names every catalog category in the interface copy', () => {
    const categoryKeys = Object.keys(SITE_COPY.en.ui.categories)
    for (const product of VENDOR_PRODUCTS) {
      expect(categoryKeys).toContain(camelKey(product.category))
    }
  })
})
