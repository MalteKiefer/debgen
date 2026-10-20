export interface TarEntry {
  readonly name: string
  readonly content: string
}

const BLOCK = 512

const writeField = (header: Uint8Array, offset: number, length: number, value: string): void => {
  header.set(new TextEncoder().encode(value).subarray(0, length), offset)
}

const octal = (value: number, length: number): string => `${value.toString(8).padStart(length - 1, '0')}\0`

// Minimal POSIX ustar writer for the generated text files; mtime 0 keeps archives reproducible.
export function createTar(entries: readonly TarEntry[]): Uint8Array<ArrayBuffer> {
  const encoded = entries.map(entry => {
    if (!/^\w[\w.-]{0,99}$/u.test(entry.name)) throw new Error(`Unsafe tar entry name: ${entry.name}`)
    return { name: entry.name, data: new TextEncoder().encode(entry.content) }
  })
  const size = encoded.reduce((total, { data }) => total + BLOCK + Math.ceil(data.length / BLOCK) * BLOCK, 2 * BLOCK)
  const archive = new Uint8Array(size)
  let offset = 0
  for (const { name, data } of encoded) {
    const header = archive.subarray(offset, offset + BLOCK)
    writeField(header, 0, 100, name)
    writeField(header, 100, 8, octal(0o644, 8))
    writeField(header, 108, 8, octal(0, 8))
    writeField(header, 116, 8, octal(0, 8))
    writeField(header, 124, 12, octal(data.length, 12))
    writeField(header, 136, 12, octal(0, 12))
    writeField(header, 148, 8, ' '.repeat(8))
    writeField(header, 156, 1, '0')
    writeField(header, 257, 8, 'ustar\u000000')
    const checksum = header.reduce((total, byte) => total + byte, 0)
    writeField(header, 148, 8, `${checksum.toString(8).padStart(6, '0')}\0 `)
    archive.set(data, offset + BLOCK)
    offset += BLOCK + Math.ceil(data.length / BLOCK) * BLOCK
  }
  return archive
}
