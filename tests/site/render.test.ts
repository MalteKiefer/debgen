import { describe, expect, it } from 'vitest'
import { escapeHtml, escapeJsonForHtml, renderDocument } from '../../src/site/render'

describe('static document rendering', () => {
  it('escapes untrusted catalog text and emits useful HTML before scripts', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;')
    const html = renderDocument({
      lang: 'en', path: '/en/', title: 'DebGen', description: 'APT workbench',
      canonical: 'https://debgen.org/en/', alternates: [], body: '<main><h1>DebGen</h1></main>',
    })
    expect(html).toContain('<html lang="en">')
    expect(html.indexOf('<h1>DebGen</h1>')).toBeLessThan(html.indexOf('<script'))
  })

  it('escapes metadata attributes, renders alternate links, and defers module scripts', () => {
    const html = renderDocument({
      lang: 'en" onclick="alert(1)',
      path: '/en/',
      title: 'DebGen <trusted>',
      description: 'APT & source "workbench"',
      canonical: 'https://debgen.org/en/?q="<script>',
      alternates: [{ lang: 'de" onclick="alert(1)', href: 'https://debgen.org/de/?q=<script>' }],
      body: '<main>Trusted content</main>',
      scripts: ['/assets/main.js?x=<script>'],
    })

    expect(html).toContain('<html lang="en&quot; onclick=&quot;alert(1)">')
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">')
    expect(html).toContain('<title>DebGen &lt;trusted&gt;</title>')
    expect(html).toContain('content="APT &amp; source &quot;workbench&quot;"')
    expect(html).toContain('rel="canonical" href="https://debgen.org/en/?q=&quot;&lt;script&gt;"')
    expect(html).toContain('rel="alternate" hreflang="de&quot; onclick=&quot;alert(1)"')
    expect(html).toContain('href="https://debgen.org/de/?q=&lt;script&gt;"')
    expect(html).toContain('<link rel="stylesheet" href="/assets/site.css">')
    expect(html).toContain('<script type="module" src="/assets/main.js?x=&lt;script&gt;" defer></script>')
  })

  it('makes structured JSON inert inside HTML', () => {
    expect(escapeJsonForHtml({ name: '</script><script>alert(1)</script>', value: '&' }))
      .toBe('{"name":"\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e","value":"\\u0026"}')

    const html = renderDocument({
      lang: 'en', path: '/en/', title: 'DebGen', description: 'APT workbench',
      canonical: 'https://debgen.org/en/', alternates: [], body: '<main>Trusted content</main>',
      structuredData: { name: '</script><script>alert(1)</script>' },
    })

    expect(html).toContain('<script type="application/ld+json">{"name":"\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e"}</script>')
  })
})
