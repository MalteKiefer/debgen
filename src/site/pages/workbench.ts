import { VENDOR_PRODUCTS } from '../../features/vendors/catalog'
import { REPOSITORY_SOURCES } from '../../features/vendors/sources'
import { SUPPORTED_LOCALES, type SupportedLocale } from '../../i18n/locales'
import { fill } from '../../workbench/text'
import { renderIcon } from '../icons'
import type { SiteCopy } from '../locales'
import type { SitePage } from '../model'
import { escapeHtml } from '../render'
import { canonicalUrl, sitePath } from '../routes'
import { buildSeoMetadata, buildWebsiteJsonLd } from '../seo'

export interface WorkbenchPageContext {
  locale: SupportedLocale
  copy: SiteCopy
  workbenchHtml: string
  serializedState: string
  clientScript: string
  root?: boolean
}

const REPOSITORY_URL = 'https://github.com/MalteKiefer/debgen'

const BRAND_MARK = '<svg class="brand__mark" aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M15.5 8.5a4.6 4.6 0 1 0-1.3 6.9"></path><path d="M12 3a9 9 0 1 0 8.6 11.6"></path></svg>'

const renderLanguageControl = (locale: SupportedLocale, copy: SiteCopy, root: boolean): string => {
  const { names, label } = copy.ui.locale
  const links = SUPPORTED_LOCALES.map((supportedLocale) => {
    const current = !root && supportedLocale === locale ? ' aria-current="page"' : ''
    return `<li><a href="${escapeHtml(sitePath(supportedLocale))}" hreflang="${supportedLocale}" lang="${supportedLocale}"${current}>${escapeHtml(names[supportedLocale])}</a></li>`
  }).join('')

  return `<details class="language-control"><summary><span class="visually-hidden">${escapeHtml(label)}: </span>${escapeHtml(names[locale])}</summary><nav aria-label="${escapeHtml(label)}"><ul>${links}</ul></nav></details>`
}

export const renderWorkbenchPage = ({
  locale,
  copy,
  workbenchHtml,
  serializedState,
  clientScript,
  root = false,
}: WorkbenchPageContext): SitePage => {
  const path = root ? '/' : sitePath(locale)
  const structuredData = buildWebsiteJsonLd(locale, copy)
  const localizedMetadata = buildSeoMetadata({
    locale,
    title: copy.seo.workbenchTitle,
    description: copy.seo.workbenchDescription,
    structuredData: root ? { ...structuredData, url: canonicalUrl(path) } : structuredData,
  })
  const metadata = root
    ? {
        ...localizedMetadata,
        canonical: canonicalUrl(path),
        alternates: [
          ...SUPPORTED_LOCALES.map(supportedLocale => ({ lang: supportedLocale, href: canonicalUrl(sitePath(supportedLocale)) })),
          { lang: 'x-default', href: canonicalUrl(path) },
        ],
      }
    : localizedMetadata
  const catalog = fill(copy.footer.catalog, { products: VENDOR_PRODUCTS.length, sources: REPOSITORY_SOURCES.length })

  const body = `<a class="skip-link" href="#setup">${escapeHtml(copy.skipLink)}</a>
<header class="site-header">
<a class="brand" href="${escapeHtml(path)}">${BRAND_MARK}<strong>DebGen</strong></a>
<nav class="site-nav" aria-label="DebGen"><a href="${REPOSITORY_URL}#readme">Docs</a><a href="/api/v1/catalog.json">API</a><a href="${REPOSITORY_URL}">GitHub ${renderIcon('external')}</a></nav>
${renderLanguageControl(locale, copy, root)}
</header>
<div id="workbench">${workbenchHtml}</div>
<footer class="site-footer"><p>${escapeHtml(copy.footer.notAffiliated)}</p><p>${escapeHtml(catalog)}</p><p><a href="${REPOSITORY_URL}">${escapeHtml(copy.footer.source)}</a></p><p><a href="${REPOSITORY_URL}/issues/new">${escapeHtml(copy.footer.report)}</a></p></footer>
<script id="workbench-state" type="application/json">${serializedState}</script>`

  return { ...metadata, lang: locale, path, body, scripts: [clientScript] }
}
