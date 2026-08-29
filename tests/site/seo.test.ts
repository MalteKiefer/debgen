import { describe, expect, it } from 'vitest'
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

  it('publishes a crawler directive that names the sitemap', () => {
    expect(renderRobots()).toContain('Sitemap: https://debgen.org/sitemap.xml')
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

  it.each(SUPPORTED_LOCALES)('%s supplies every static Workbench copy group', (locale) => {
    const copy = SITE_COPY[locale]

    expect(Object.keys(copy.steps)).toEqual(['system', 'debian', 'repositories', 'review', 'export'])
    expect(copy.actions.export).not.toBe('')
    expect(copy.errors.copyFailed).not.toBe('')
    expect(copy.audit.fingerprint).not.toBe('')
    expect(copy.search.placeholder).not.toBe('')
    expect(copy.trust.official).not.toBe('')
    expect(copy.seo.workbenchDescription).not.toBe('')
  })
})
