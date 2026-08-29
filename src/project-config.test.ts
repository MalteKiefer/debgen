import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function projectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('project-facing configuration', () => {
  it.each([
    '.github/workflows/ci.yml',
    '.github/workflows/pages.yml',
  ])('fails %s for every npm vulnerability', (path) => {
    const auditCommands = [...projectFile(path).matchAll(/^\s*run:\s*(npm audit[^\r\n]*)$/gm)]
      .map((match) => match[1])

    expect(auditCommands).toEqual(['npm audit'])
  })

  it('documents the project, security policy, and static API contracts in English', () => {
    const readme = projectFile('README.md')

    expect(readme).toContain('actions/workflows/ci.yml/badge.svg')
    expect(readme).toContain('actions/workflows/pages.yml/badge.svg')
    expect(readme).toContain('curl -fsSLo')
    expect(readme).toContain('[Catalog maintenance](docs/catalog-maintenance.md)')
    expect(readme).toContain('[Translations](docs/translations.md)')
    expect(readme).toContain('[Static API](docs/api.md)')
    expect(readme).not.toMatch(/\b(?:und|oder|Quellen|Software auswählen|Statische API|Sicherheitshinweis)\b/i)
  })
})
