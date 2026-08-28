import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function projectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('project-facing configuration', () => {
  it('declares the German document language and fallback copy', () => {
    const document = new DOMParser().parseFromString(projectFile('index.html'), 'text/html')

    expect(document.documentElement.lang).toBe('de')
    expect(document.title).toBe('DebGen – Debian-Paketquellen erstellen')
    expect(document.querySelector('noscript')?.textContent?.trim())
      .toBe('DebGen benötigt JavaScript, um Debian-Paketquellen zu erzeugen.')
  })

  it.each([
    '.github/workflows/ci.yml',
    '.github/workflows/pages.yml',
  ])('fails %s for every npm vulnerability', (path) => {
    const auditCommands = [...projectFile(path).matchAll(/^\s*run:\s*(npm audit[^\r\n]*)$/gm)]
      .map((match) => match[1])

    expect(auditCommands).toEqual(['npm audit'])
  })

  it('documents the same all-severity audit policy', () => {
    expect(projectFile('README.md')).toContain(
      '`npm audit` — bei jedem gemeldeten Sicherheitshinweis fehlschlagen.',
    )
  })
})
