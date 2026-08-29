import { SUPPORTED_LOCALES, type SupportedLocale } from '../../i18n/locales'
import type { WorkbenchStep } from '../../workbench/state'
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
  activeStep?: WorkbenchStep
  root?: boolean
}

const renderLanguageControl = (locale: SupportedLocale, root: boolean): string => {
  const links = SUPPORTED_LOCALES.map((supportedLocale) => {
    const current = !root && supportedLocale === locale ? ' aria-current="page"' : ''
    return `<li><a href="${escapeHtml(sitePath(supportedLocale))}" hreflang="${supportedLocale}" lang="${supportedLocale}"${current}>${supportedLocale}</a></li>`
  }).join('')

  const currentLocale = root ? '' : ` <strong>${escapeHtml(locale)}</strong>`
  return `<details class="language-control"><summary>Language${currentLocale}</summary><nav aria-label="Language"><ul>${links}</ul></nav></details>`
}

export const renderWorkbenchPage = ({
  locale,
  copy,
  workbenchHtml,
  serializedState,
  clientScript,
  activeStep = 'system',
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

  const body = `<a class="skip-link" href="#workbench">Skip to Workbench</a>
<header class="site-header">
<a class="brand" href="${escapeHtml(path)}" aria-label="DebGen home"><strong>DebGen</strong><span>Workbench</span></a>
<p class="current-step"><span>Current step</span><strong>${escapeHtml(copy.steps[activeStep])}</strong></p>
<nav class="utility-nav" aria-label="Utilities"><a href="https://github.com/MalteKiefer/debgen#readme">Docs</a><a href="/api/v1/catalog.json">API</a><a href="https://github.com/MalteKiefer/debgen">GitHub ${renderIcon('external')}</a></nav>
${renderLanguageControl(locale, root)}
</header>
<div id="workbench" tabindex="-1">${workbenchHtml}</div>
<script id="workbench-state" type="application/json">${serializedState}</script>`

  return { ...metadata, lang: locale, path, body, scripts: [clientScript] }
}
