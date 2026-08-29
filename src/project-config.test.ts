import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function projectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('project-facing configuration', () => {
  it('declares the canonical English document fallback before locale initialization', () => {
    const document = new DOMParser().parseFromString(projectFile('index.html'), 'text/html')

    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toBe('DebGen - Create Debian package sources')
    expect(document.querySelector('noscript')?.textContent?.trim())
      .toBe('DebGen needs JavaScript to generate Debian package sources.')
  })

  it.each([
    '.github/workflows/ci.yml',
    '.github/workflows/pages.yml',
  ])('fails %s for every npm vulnerability', (path) => {
    const auditCommands = [...projectFile(path).matchAll(/^\s*run:\s*(npm audit[^\r\n]*)$/gm)]
      .map((match) => match[1])

    expect(auditCommands).toEqual(['npm audit'])
  })

  it('documents the English project, security, localization, and static API contracts', () => {
    const readme = projectFile('README.md')
    const catalogMaintenance = projectFile('docs/catalog-maintenance.md')

    expect(readme).toContain('actions/workflows/ci.yml/badge.svg')
    expect(readme).toContain('actions/workflows/pages.yml/badge.svg')
    expect(readme).toContain('103 products')
    expect(readme).toContain('English, German, Spanish, French, Italian, Russian, Portuguese, Polish, Simplified Chinese, and Japanese')
    expect(readme).toContain('`sources.json`')
    expect(readme).toContain('curl -fsSLo')
    expect(readme).toContain('[Catalog maintenance](docs/catalog-maintenance.md)')
    expect(readme).toContain('[Translation maintenance](docs/translations.md)')
    expect(readme).toContain('[Static API](docs/api.md)')
    expect(readme).toContain('`npm audit` - fail on every reported vulnerability.')
    expect(readme).not.toMatch(/\b(?:und|oder|Quellen|Software auswählen|Statische API|Sicherheitshinweis)\b/i)
    expect(catalogMaintenance).toContain('## Current 103-product matrix')
    expect(catalogMaintenance).toContain('| openvpn-community | openvpn-community | openvpn | trixie, bookworm, bullseye | amd64, arm64 | explicit | upstream | yes |')
    expect(catalogMaintenance).toContain('| librewolf | librewolf | librewolf | trixie, bookworm, bullseye, forky, sid | amd64, arm64 | generic-debian | upstream | yes |')
    expect(catalogMaintenance).toContain('| lutris | lutris | lutris | trixie | amd64 | explicit | community-endorsed | no |')
  })
})
