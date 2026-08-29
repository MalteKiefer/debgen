import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { RELEASES } from '../../src/features/sources/releases'
import { en, type SiteCopy } from '../../src/site/locales/en'
import { renderWorkbenchPage } from '../../src/site/pages/workbench'
import { renderIcon } from '../../src/site/icons'
import { renderDocument } from '../../src/site/render'

const testContext = {
  locale: 'en' as const,
  copy: en,
  activeStep: 'debian' as const,
}

describe('Structured Workbench page', () => {
  it('renders the approved five-step Workbench with native landmarks', () => {
    const html = renderDocument(renderWorkbenchPage(testContext))

    expect(html).toContain('<a class="skip-link" href="#workbench">Skip to Workbench</a>')
    expect(html).toContain('<header class="site-header">')
    expect(html).toContain('<nav aria-label="Workflow">')
    expect(html).toContain('<main id="workbench"')
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

  it('uses native controls and release data while keeping every step useful without scripts', () => {
    const html = renderDocument(renderWorkbenchPage(testContext))

    expect(html).toContain('<form class="workbench-form"')
    expect(html).toContain('<select id="release" name="release">')
    for (const release of RELEASES) {
      expect(html).toContain(`<option value="${release.codename}"`)
    }
    expect(html).toContain('<select id="architecture" name="architecture">')
    expect(html).toContain('<select id="format" name="format">')
    expect(html).toContain('<input type="checkbox" name="suite" value="security"')
    expect(html).toContain('<input type="checkbox" name="component" value="main"')
    expect(html).toContain('<input type="search" id="repository-search" name="q"')
    expect(html).toContain('<button type="submit" class="primary-action">Export plan</button>')
    expect(html).not.toContain('<script type="module"')
  })

  it('escapes localized copy before placing it in text and attributes', () => {
    const hostileCopy: SiteCopy = {
      ...en,
      steps: { ...en.steps, system: '<img src=x onerror=alert(1)>' },
      search: { ...en.search, placeholder: '" autofocus onfocus="alert(1)' },
    }
    const html = renderDocument(renderWorkbenchPage({ ...testContext, copy: hostileCopy }))

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

  it('ships responsive theme, focus, and reduced-motion safeguards without forbidden decoration', () => {
    const css = readFileSync(resolve('src/site/styles/workbench.css'), 'utf8')

    expect(css).toContain('color-scheme: light dark')
    expect(css).toContain(':focus-visible')
    expect(css).toContain('prefers-reduced-motion: reduce')
    expect(css).toContain('@media (min-width: 46rem)')
    expect(css).toContain('@media (min-width: 80rem)')
    expect(css).not.toMatch(/\.skip-link\s*\{[^}]*var\(--accent\)/su)
    expect(css).not.toMatch(/gradient|box-shadow|position:\s*fixed|\.v-|mdi-/u)
  })
})
