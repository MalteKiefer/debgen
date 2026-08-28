import { describe, expect, it, vi } from 'vitest'
import { copyText, downloadText, type DownloadEnvironment } from './download'

describe('copyText', () => {
  it('writes the exact generated text to the supplied clipboard', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined)

    await copyText('Types: deb\nSuites: trixie\n', { writeText })

    expect(writeText).toHaveBeenCalledOnce()
    expect(writeText).toHaveBeenCalledWith('Types: deb\nSuites: trixie\n')
  })

  it('propagates a clipboard rejection', async () => {
    const rejection = new Error('Permission denied')
    const writeText = vi.fn<(text: string) => Promise<void>>().mockRejectedValue(rejection)

    await expect(copyText('deb https://deb.debian.org/debian bullseye main\n', { writeText }))
      .rejects.toBe(rejection)
  })

  it('rejects with guidance when the Clipboard API is unavailable', async () => {
    await expect(copyText('Types: deb\n', undefined))
      .rejects.toThrow('Clipboard API is unavailable')
  })
})

describe('downloadText', () => {
  it('downloads text with the requested filename and revokes the object URL', () => {
    let blobParts: BlobPart[] | undefined
    let blobOptions: BlobPropertyBag | undefined
    function Blob(parts: BlobPart[], options: BlobPropertyBag): Blob {
      blobParts = parts
      blobOptions = options
      return { marker: 'blob' } as unknown as Blob
    }
    const anchor = {
      download: '',
      href: '',
      click: vi.fn(),
    }
    const environment: DownloadEnvironment = {
      document: { createElement: vi.fn().mockReturnValue(anchor) } as unknown as Document,
      Blob: Blob as unknown as typeof globalThis.Blob,
      createObjectURL: vi.fn().mockReturnValue('blob:debian-sources'),
      revokeObjectURL: vi.fn(),
    }

    downloadText('debian.sources', 'Types: deb\nSuites: trixie\n', environment)

    expect(blobParts).toEqual(['Types: deb\nSuites: trixie\n'])
    expect(blobOptions).toEqual({ type: 'text/plain;charset=utf-8' })
    expect(anchor.download).toBe('debian.sources')
    expect(anchor.href).toBe('blob:debian-sources')
    expect(anchor.click).toHaveBeenCalledOnce()
    expect(environment.revokeObjectURL).toHaveBeenCalledOnce()
    expect(environment.revokeObjectURL).toHaveBeenCalledWith('blob:debian-sources')
  })

  it('preserves an artifact media type while adding UTF-8 for text downloads', () => {
    let blobOptions: BlobPropertyBag | undefined
    function Blob(_parts: BlobPart[], options: BlobPropertyBag): Blob {
      blobOptions = options
      return {} as Blob
    }
    const environment: DownloadEnvironment = {
      document: { createElement: vi.fn().mockReturnValue({ click: vi.fn() }) } as unknown as Document,
      Blob: Blob as unknown as typeof globalThis.Blob,
      createObjectURL: vi.fn().mockReturnValue('blob:install-script'),
      revokeObjectURL: vi.fn(),
    }

    downloadText(
      'install-vendor-repositories.sh',
      '#!/usr/bin/env bash\n',
      environment,
      'text/x-shellscript',
    )

    expect(blobOptions).toEqual({ type: 'text/x-shellscript;charset=utf-8' })
  })

  it('propagates Blob failures', () => {
    const failure = new Error('Blob failed')
    function Blob(): Blob {
      throw failure
    }
    const environment: DownloadEnvironment = {
      document: {} as Document,
      Blob: Blob as unknown as typeof globalThis.Blob,
      createObjectURL: vi.fn(),
      revokeObjectURL: vi.fn(),
    }

    expect(() => downloadText('debian.sources', 'Types: deb\n', environment)).toThrow(failure)
    expect(environment.createObjectURL).not.toHaveBeenCalled()
    expect(environment.revokeObjectURL).not.toHaveBeenCalled()
  })

  it('propagates object URL creation failures', () => {
    const failure = new Error('URL failed')
    function Blob(): Blob {
      return {} as Blob
    }
    const environment: DownloadEnvironment = {
      document: {} as Document,
      Blob: Blob as unknown as typeof globalThis.Blob,
      createObjectURL: vi.fn().mockImplementation(() => { throw failure }),
      revokeObjectURL: vi.fn(),
    }

    expect(() => downloadText('debian.sources', 'Types: deb\n', environment)).toThrow(failure)
    expect(environment.revokeObjectURL).not.toHaveBeenCalled()
  })

  it('revokes the object URL when anchor creation fails', () => {
    const failure = new Error('Anchor failed')
    function Blob(): Blob {
      return {} as Blob
    }
    const environment: DownloadEnvironment = {
      document: { createElement: vi.fn().mockImplementation(() => { throw failure }) } as unknown as Document,
      Blob: Blob as unknown as typeof globalThis.Blob,
      createObjectURL: vi.fn().mockReturnValue('blob:debian-sources'),
      revokeObjectURL: vi.fn(),
    }

    expect(() => downloadText('debian.sources', 'Types: deb\n', environment)).toThrow(failure)
    expect(environment.revokeObjectURL).toHaveBeenCalledWith('blob:debian-sources')
  })

  it('revokes the object URL when clicking the anchor fails', () => {
    const failure = new Error('Click failed')
    function Blob(): Blob {
      return {} as Blob
    }
    const anchor = {
      download: '',
      href: '',
      click: vi.fn().mockImplementation(() => { throw failure }),
    }
    const environment: DownloadEnvironment = {
      document: { createElement: vi.fn().mockReturnValue(anchor) } as unknown as Document,
      Blob: Blob as unknown as typeof globalThis.Blob,
      createObjectURL: vi.fn().mockReturnValue('blob:debian-sources'),
      revokeObjectURL: vi.fn(),
    }

    expect(() => downloadText('debian.sources', 'Types: deb\n', environment)).toThrow(failure)
    expect(environment.revokeObjectURL).toHaveBeenCalledWith('blob:debian-sources')
  })
})
