import { SUPPORTED_LOCALES, type SupportedLocale } from '../i18n/locales'

export const SITE_ORIGIN = 'https://debgen.org'

const pathWithoutQueryOrFragment = (path: string): string => path.split(/[?#]/u, 1)[0] ?? ''

export const sitePath = (locale: SupportedLocale, segments: readonly string[] = []): string => {
  const encodedSegments = segments
    .filter(segment => segment.length > 0)
    .map(segment => encodeURIComponent(segment))

  return `/${[locale, ...encodedSegments].join('/')}/`
}

export const canonicalUrl = (path: string): string => {
  const cleanPath = pathWithoutQueryOrFragment(path)
  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`
  const trailingSlashPath = normalizedPath.endsWith('/') ? normalizedPath : `${normalizedPath}/`

  return `${SITE_ORIGIN}${trailingSlashPath}`
}

export const buildAlternates = (segments: readonly string[] = []) => [
  ...SUPPORTED_LOCALES.map(locale => ({ lang: locale, href: canonicalUrl(sitePath(locale, segments)) })),
  { lang: 'x-default', href: canonicalUrl(sitePath('en', segments)) },
] as const
