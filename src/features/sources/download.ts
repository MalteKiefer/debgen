export interface DownloadEnvironment {
  document: Pick<Document, 'createElement'>
  Blob: typeof globalThis.Blob
  createObjectURL: typeof URL.createObjectURL
  revokeObjectURL: typeof URL.revokeObjectURL
}

export async function copyText(
  text: string,
  clipboard: Pick<Clipboard, 'writeText'> | undefined = globalThis.navigator?.clipboard,
): Promise<void> {
  if (!clipboard) {
    throw new Error('Clipboard API is unavailable. Copy the generated configuration manually.')
  }

  await clipboard.writeText(text)
}

export function downloadText(
  filename: string,
  text: string,
  environment: DownloadEnvironment = {
    document: globalThis.document,
    Blob: globalThis.Blob,
    createObjectURL: globalThis.URL.createObjectURL.bind(globalThis.URL),
    revokeObjectURL: globalThis.URL.revokeObjectURL.bind(globalThis.URL),
  },
  mediaType = 'text/plain',
): void {
  const contentType = mediaType.startsWith('text/') && !/;\s*charset=/i.test(mediaType)
    ? `${mediaType};charset=utf-8`
    : mediaType
  const blob = new environment.Blob([text], { type: contentType })
  const objectUrl = environment.createObjectURL(blob)

  try {
    const anchor = environment.document.createElement('a')
    anchor.download = filename
    anchor.href = objectUrl
    anchor.click()
  } finally {
    environment.revokeObjectURL(objectUrl)
  }
}
