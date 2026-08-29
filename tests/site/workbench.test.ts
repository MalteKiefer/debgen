import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { RELEASES } from '../../src/features/sources/releases'
import { SUPPORTED_LOCALES } from '../../src/i18n/locales'
import { de } from '../../src/site/locales/de'
import { en, type SiteCopy } from '../../src/site/locales/en'
import { renderWorkbenchPage } from '../../src/site/pages/workbench'
import { renderIcon } from '../../src/site/icons'
import { renderDocument } from '../../src/site/render'
import { sitePath } from '../../src/site/routes'
import { renderWorkbenchApp } from '../../src/workbench/server'
import { createDefaultState, DEFAULT_WORKBENCH_MANIFEST, type WorkbenchStep } from '../../src/workbench/state'
import { toWorkbenchHydrationProduct } from '../../src/workbench/types'

const testContext = {
  locale: 'en' as const,
  copy: en,
  activeStep: 'debian' as const,
}

const renderPage = async ({
  locale,
  copy,
  activeStep = 'system',
}: {
  locale: 'en' | 'de'
  copy: SiteCopy
  activeStep?: WorkbenchStep
}): Promise<string> => {
  const state = { ...createDefaultState(), activeStep }
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
    activeStep,
    workbenchHtml: rendered.html,
    serializedState: rendered.serializedState,
    clientScript: '/assets/client-test.js',
  }))
}

describe('Structured Workbench page', () => {
  it('renders the approved five-step Workbench with native landmarks', async () => {
    const html = await renderPage(testContext)

    expect(html).toContain('<a class="skip-link" href="#workbench">Skip to Workbench</a>')
    expect(html).toContain('<header class="site-header">')
    expect(html).toContain('<nav aria-label="Workflow">')
    expect(html).toContain('<div id="workbench" tabindex="-1">')
    expect(html).toContain('href="https://github.com/MalteKiefer/debgen"')

    const steps = ['system', 'debian', 'repositories', 'review', 'export'] as const
    const positions = steps.map(step => html.indexOf(`data-step="${step}"`))
    expect(positions.every(position => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((left, right) => left - right))
    expect(html.match(/aria-current="step"/gu)).toHaveLength(1)
    expect(html).toContain('<a href="#debian" aria-current="step">')
    expect(html).not.toContain('mdi-')
    expect(html).not.toContain('<div id="app"></div>')
  })

  it('uses native controls and release data while keeping every step useful before scripts run', async () => {
    const html = await renderPage(testContext)

    expect(html).toContain('<form id="workbench-form" class="workbench-form"')
    expect(html).toContain('<select id="release" name="release"')
    for (const release of RELEASES) {
      expect(html).toContain(`<option value="${release.codename}"`)
    }
    expect(html).toContain('<select id="architecture" name="architecture"')
    expect(html).toContain('<select id="format" name="format"')
    expect(html).toContain('<input type="checkbox" name="suite" value="security"')
    expect(html).toContain('<input type="checkbox" name="component" value="main"')
    expect(html).toContain('<input id="repository-search" type="search" name="q"')
    expect(html).toContain('<button type="submit" class="primary-action">Export plan</button>')
    expect(html).toContain('<script type="module" src="/assets/client-test.js" defer></script>')
  })

  it('links utilities to published documentation and the concrete API catalog', async () => {
    const html = await renderPage(testContext)

    expect(html).toContain('<a href="https://github.com/MalteKiefer/debgen#readme">Docs</a>')
    expect(html).toContain('<a href="/api/v1/catalog.json">API</a>')
    expect(html).not.toContain('href="/en/docs/"')
    expect(html).not.toContain('href="/api/"')
  })

  it('localizes repository audit headings and links every supported language natively', async () => {
    const html = await renderPage({ locale: 'de', copy: de })

    expect(html).toContain(`<th scope="col">${de.audit.repository}</th>`)
    expect(html).toContain(`<th scope="col">${de.audit.operator}</th>`)
    expect(html).toContain(`<th scope="col">${de.audit.compatibility}</th>`)
    expect(html).not.toContain('<th scope="col">Operator</th>')
    expect(html).toContain('<details class="language-control">')
    expect(html).toContain('<nav aria-label="Language">')
    for (const locale of SUPPORTED_LOCALES) {
      const current = locale === 'de' ? ' aria-current="page"' : ''
      expect(html).toContain(`<a href="${sitePath(locale)}" hreflang="${locale}" lang="${locale}"${current}>${locale}</a>`)
    }
    expect(html.match(/aria-current="page"/gu)).toHaveLength(1)
  })

  it('escapes localized copy before placing it in text and attributes', async () => {
    const hostileCopy: SiteCopy = {
      ...en,
      steps: { ...en.steps, system: '<img src=x onerror=alert(1)>' },
      search: { ...en.search, placeholder: '" autofocus onfocus="alert(1)' },
    }
    const html = await renderPage({ ...testContext, copy: hostileCopy })

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).toContain('placeholder="&quot; autofocus onfocus=&quot;alert(1)"')
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
  })

  it('renders only the small local decorative SVG allowlist', () => {
    expect(renderIcon('theme')).toMatch(/^<svg aria-hidden="true"/u)
    expect(renderIcon('external')).toContain('<path')
    expect(renderIcon('check')).not.toContain('<use')
    expect(() => (renderIcon as (name: string) => string)('mdi-menu')).toThrow('Unknown Workbench icon')
  })

  it('switches color themes with native controls and CSS instead of an inert selector', async () => {
    const html = await renderPage(testContext)
    const css = readFileSync(resolve('src/site/styles/workbench.css'), 'utf8')

    expect(html).toContain('<details class="theme-control">')
    expect(html).toContain('<input type="radio" id="theme-system" name="theme" value="system" checked>')
    expect(html).toContain('<input type="radio" id="theme-light" name="theme" value="light">')
    expect(html).toContain('<input type="radio" id="theme-dark" name="theme" value="dark">')
    expect(html).not.toContain('<select id="theme"')
    expect(css).toContain(':root:has(#theme-light:checked)')
    expect(css).toContain(':root:has(#theme-dark:checked)')
  })

  it('ships responsive theme, focus, and reduced-motion safeguards without forbidden decoration', () => {
    const css = readFileSync(resolve('src/site/styles/workbench.css'), 'utf8')

    expect(css).toContain('color-scheme: light dark')
    expect(css).toContain(':focus-visible')
    expect(css).toContain('prefers-reduced-motion: reduce')
    expect(css).toContain('@media (min-width: 46rem)')
    expect(css).toContain('@media (min-width: 80rem)')
    expect(css).toContain('#workbench[data-enhanced="true"] .workbench-step:not([data-active="true"])')
    expect(css).not.toMatch(/\.skip-link\s*\{[^}]*var\(--accent\)/su)
    expect(css).not.toMatch(/gradient|position:\s*fixed|\.v-|mdi-/u)
  })
})
