import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createTar } from './tar'

describe('createTar', () => {
  it('writes an archive that the system tar extracts byte for byte', () => {
    const directory = mkdtempSync(join(tmpdir(), 'debgen-tar-'))
    try {
      const entries = [
        { name: 'debian.sources', content: 'Types: deb\nURIs: https://deb.debian.org/debian\n' },
        { name: 'install-vendor-repositories.sh', content: `#!/usr/bin/env bash\n${'x'.repeat(700)}\nü\n` },
      ]
      writeFileSync(join(directory, 'bundle.tar'), createTar(entries))
      execFileSync('tar', ['-xf', 'bundle.tar'], { cwd: directory })

      for (const entry of entries) {
        expect(readFileSync(join(directory, entry.name), 'utf8')).toBe(entry.content)
      }
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('rejects entry names that could escape the extraction directory', () => {
    expect(() => createTar([{ name: '../etc/passwd', content: '' }])).toThrow('Unsafe tar entry name')
  })
})
