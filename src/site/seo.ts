import type { SeoMetadata } from './model'
import { canonicalUrl, sitePath, buildAlternates, SITE_ORIGIN } from './routes'
import type { SiteCopy } from './locales/en'
import type { SupportedLocale } from '../i18n/locales'

export interface SitemapEntry {
  path: string
  lastModified?: string
}

export interface PageMetadataOptions {
  locale: SupportedLocale
  segments?: readonly string[]
  title: string
  description: string
  structuredData?: unknown
}

const escapeXml = (value: string): string => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
})[character]!)

export const buildSeoMetadata = ({
  locale,
  segments = [],
  title,
  description,
  structuredData,
}: PageMetadataOptions): SeoMetadata => ({
  title,
  description,
  canonical: canonicalUrl(sitePath(locale, segments)),
  alternates: buildAlternates(segments),
  ...(structuredData === undefined ? {} : { structuredData }),
})

export const buildWebsiteJsonLd = (locale: SupportedLocale, copy: SiteCopy) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'DebGen',
  description: copy.seo.workbenchDescription,
  inLanguage: locale,
  url: canonicalUrl(sitePath(locale)),
})

export const buildBreadcrumbJsonLd = (locale: SupportedLocale, segments: readonly string[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'DebGen',
      item: canonicalUrl(sitePath(locale)),
    },
    ...segments.map((segment, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: segment,
      item: canonicalUrl(sitePath(locale, segments.slice(0, index + 1))),
    })),
  ],
})

export const renderSitemap = (entries: readonly SitemapEntry[]): string => {
  const urls = entries.map(({ path, lastModified }) => {
    const location = `<loc>${escapeXml(canonicalUrl(path))}</loc>`
    const modified = lastModified ? `<lastmod>${escapeXml(lastModified)}</lastmod>` : ''

    return `<url>${location}${modified}</url>`
  }).join('')

  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`
}

export const renderRobots = (): string => `User-agent: *\nAllow: /\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`
