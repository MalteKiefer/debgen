import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { RELEASES } from '../../src/features/sources/releases'
import { SUPPORTED_LOCALES } from '../../src/i18n/locales'
import { getSiteCopyForBuild, type SiteCopy } from '../../src/site/locales'
import { renderWorkbenchPage } from '../../src/site/pages/workbench'
import { renderIcon } from '../../src/site/icons'
import { renderDocument } from '../../src/site/render'
import { sitePath } from '../../src/site/routes'
import { renderWorkbenchApp } from '../../src/workbench/server'
import { createDefaultState, DEFAULT_WORKBENCH_MANIFEST, type WorkbenchState } from '../../src/workbench/state'
import { toWorkbenchHydrationProduct } from '../../src/workbench/types'

const en = getSiteCopyForBuild('en')
const de = getSiteCopyForBuild('de')

const renderPage = async ({
  locale = 'en',
  copy = en,
  state = createDefaultState(),
}: {
  locale?: 'en' | 'de'
  copy?: SiteCopy
  state?: WorkbenchState
} = {}): Promise<string> => {
  const payload = {
    locale,
    path: sitePath(locale),
    basePath: '/',
    siteOrigin: 'https://debgen.org',
    copy,
    state,
    manifest: {
      releases: DEFAULT_WORKBENCH_MANIFEST.releases,
      products: DEFAULT_WORKBENCH_MANIFEST.products.map(toWorkbenchHydrationProduct),
    },
  }
  const rendered = await renderWorkbenchApp(payload)
  return renderDocument(renderWorkbenchPage({
    locale,
    copy,
    workbenchHtml: rendered.html,
    serializedState: rendered.serializedState,
    clientScript: '/assets/client-test.js',
  }))
}

describe('Workbench page', () => {
  it('renders one setup page with native landmarks and no third-party scripts', async () => {
    const html = await renderPage()

    expect(html).toContain('<a class="skip-link" href="#setup">Skip to setup</a>')
    expect(html).toContain('<header class="site-header">')
    expect(html).toContain('<main class="workbench" tabindex="-1">')
    expect(html).toContain('<form id="setup" class="setup" action="/en/" method="get">')
    expect(html).toContain('<footer class="site-footer">')
    for (const heading of Object.values(en.sections)) expect(html).toContain(`>${heading}</h2>`)
    expect(html).toContain('<script type="module" src="/assets/client-test.js" defer></script>')
    expect(html).not.toMatch(/<script[^>]+src="(?:https?:)?\/\//u)
    expect(html).not.toMatch(/plausible|googleapis|gstatic/u)
    expect(html).not.toContain('mdi-')
  })

  it('uses native controls so the default configuration is readable before scripts run', async () => {
    const html = await renderPage()

    for (const release of RELEASES) {
      expect(html).toMatch(new RegExp(`<input type="radio" name="release" value="${release.codename}"`, 'u'))
    }
    for (const architecture of ['amd64', 'arm64', 'armhf', 'i386']) {
      expect(html).toContain(`<input type="radio" name="architecture" value="${architecture}"`)
    }
    expect(html).toContain('name="suite" value="security"')
    expect(html).toContain('name="component" value="main"')
    expect(html).toContain('<input id="software-search" type="search" name="q"')
    expect(html).toContain('<input type="checkbox" name="repository" value="docker-engine"')
    expect(html).toContain('URIs:</span> https://deb.debian.org/debian')
    expect(html).toContain(`>${en.files.downloadAll}</button>`)
    expect(html).toContain(en.trust.review)
    expect(html).toContain('https://github.com/MalteKiefer/debgen/issues/new?title=Broken+repository')
  })

  it('shows incompatible software as disabled with the reason', async () => {
    const html = await renderPage({ state: { ...createDefaultState(), architecture: 'i386' } })
    const row = html.match(/<li class="product" data-repository-id="docker-engine" data-unavailable="true">.*?<\/li>/su)?.[0]

    expect(row).toBeDefined()
    expect(row).toContain('Architecture &quot;i386&quot; is not supported by Docker Engine.')
    expect(row).toMatch(/<input type="checkbox" name="repository" value="docker-engine" disabled/u)
  })

  it('links utilities to published documentation and the concrete API catalog', async () => {
    const html = await renderPage()

    expect(html).toContain('<a href="https://github.com/MalteKiefer/debgen#readme">Docs</a>')
    expect(html).toContain('<a href="/api/v1/catalog.json">API</a>')
  })

  it('localizes the page and links every supported language natively', async () => {
    const html = await renderPage({ locale: 'de', copy: de })

    expect(html).toContain(`>${de.sections.software}</h2>`)
    expect(html).toContain(`<legend>${de.ui.controls.fields.architecture}</legend>`)
    expect(html).toContain('<details class="language-control">')
    for (const locale of SUPPORTED_LOCALES) {
      const current = locale === 'de' ? ' aria-current="page"' : ''
      expect(html).toContain(`<a href="${sitePath(locale)}" hreflang="${locale}" lang="${locale}"${current}>${de.ui.locale.names[locale]}</a>`)
    }
    expect(html.match(/aria-current="page"/gu)).toHaveLength(1)
  })

  it('escapes localized copy before placing it in text and attributes', async () => {
    const hostileCopy: SiteCopy = {
      ...en,
      skipLink: '<img src=x onerror=alert(1)>',
      ui: { ...en.ui, vendor: { ...en.ui.vendor, searchPlaceholder: '" autofocus onfocus="alert(1)' } },
    }
    const html = await renderPage({ copy: hostileCopy })

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).toContain('placeholder="&quot; autofocus onfocus=&quot;alert(1)"')
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
  })

  it('renders only the small local decorative SVG allowlist', () => {
    expect(renderIcon('search')).toMatch(/^<svg aria-hidden="true"/u)
    expect(renderIcon('external')).toContain('<path')
    expect(renderIcon('check')).not.toContain('<use')
    expect(() => (renderIcon as (name: string) => string)('mdi-menu')).toThrow('Unknown Workbench icon')
  })

  it('self-hosts its fonts and keeps focus and motion safeguards', () => {
    const css = readFileSync(resolve('src/site/styles/workbench.css'), 'utf8')
    const urls = [...css.matchAll(/url\("([^"]+)"\)/gu)].map(match => match[1])

    expect(urls.length).toBeGreaterThan(0)
    expect(urls.every(url => /^fonts\/[a-z-]+\.woff2$/u.test(url!))).toBe(true)
    expect(css).not.toContain('@import')
    expect(css).toContain('color-scheme: light')
    expect(css).toContain(':focus-visible')
    expect(css).toContain('prefers-reduced-motion: reduce')
  })
})
