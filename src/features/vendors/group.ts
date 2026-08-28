import type { GeneratedArtifact, OutputMode, VendorCategory } from './model'

const categoryOrder: readonly VendorCategory[] = [
  'browser', 'communication', 'privacy', 'development', 'cloud', 'containers', 'database', 'monitoring',
]

const categoryLabels: Readonly<Record<VendorCategory, string>> = {
  browser: 'Browser',
  communication: 'Kommunikation',
  privacy: 'Privatsphäre',
  development: 'Entwicklung',
  cloud: 'Cloud',
  containers: 'Container',
  database: 'Datenbanken',
  monitoring: 'Überwachung',
}

function compareCodePoints(left: string, right: string): number {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

function compareArtifacts(left: GeneratedArtifact, right: GeneratedArtifact): number {
  if (left.filename === 'debian.sources') return -1
  if (right.filename === 'debian.sources') return 1
  const leftCategory = categoryOrder.indexOf(left.category as VendorCategory)
  const rightCategory = categoryOrder.indexOf(right.category as VendorCategory)
  const category = (leftCategory < 0 ? categoryOrder.length : leftCategory)
    - (rightCategory < 0 ? categoryOrder.length : rightCategory)
  if (category !== 0) return category
  const product = compareCodePoints(left.productId ?? '', right.productId ?? '')
  if (product !== 0) return product
  const source = Number(left.filename.endsWith('.sources')) - Number(right.filename.endsWith('.sources'))
  if (source !== 0) return -source
  return compareCodePoints(left.filename, right.filename)
}

function withOneTrailingNewline(content: string): string {
  return content.replace(/\n+$/, '') + '\n'
}

function checkForCollisions(artifacts: readonly GeneratedArtifact[]): void {
  const filenames = new Set<string>()
  for (const artifact of artifacts) {
    if (filenames.has(artifact.filename)) throw new Error('Duplicate artifact filename: ' + artifact.filename + '.')
    filenames.add(artifact.filename)
  }
}

function sourceArtifacts(artifacts: readonly GeneratedArtifact[]): GeneratedArtifact[] {
  return artifacts.filter((artifact) => artifact.filename.endsWith('.sources') && artifact.filename !== 'debian.sources')
}

function auxiliaryArtifacts(artifacts: readonly GeneratedArtifact[]): GeneratedArtifact[] {
  return artifacts.filter((artifact) => artifact.filename !== 'debian.sources' && !artifact.filename.endsWith('.sources'))
}

function debianArtifacts(artifacts: readonly GeneratedArtifact[]): GeneratedArtifact[] {
  return artifacts.filter((artifact) => artifact.filename === 'debian.sources')
}

function mergedRiskNotes(artifacts: readonly GeneratedArtifact[]): readonly string[] | undefined {
  const notes = [...new Set(artifacts.flatMap((artifact) => artifact.riskNotes ?? []))]
  return notes.length > 0 ? notes : undefined
}

function combinedArtifact(sources: readonly GeneratedArtifact[]): GeneratedArtifact | undefined {
  if (sources.length === 0) return undefined
  const riskNotes = mergedRiskNotes(sources)
  return {
    filename: 'vendors.sources',
    mediaType: 'text/plain',
    description: 'Kombinierte Paketquellen von Herstellern',
    content: withOneTrailingNewline(sources.map((artifact) => artifact.content.replace(/\n+$/, '')).join('\n\n')),
    ...(riskNotes ? { riskNotes } : {}),
  }
}

function categoryArtifacts(sources: readonly GeneratedArtifact[]): GeneratedArtifact[] {
  for (const artifact of sources) {
    if (!categoryOrder.includes(artifact.category as VendorCategory)) {
      throw new Error('Missing or unsupported category for source artifact "' + (artifact.productId ?? artifact.filename) + '".')
    }
  }
  return categoryOrder.flatMap((category) => {
    const members = sources.filter((artifact) => artifact.category === category)
    if (members.length === 0) return []
    const riskNotes = mergedRiskNotes(members)
    return [{
      filename: category + '.sources',
      mediaType: 'text/plain',
      description: 'Paketquellen: ' + categoryLabels[category],
      content: withOneTrailingNewline(members.map((artifact) => artifact.content.replace(/\n+$/, '')).join('\n\n')),
      category,
      ...(riskNotes ? { riskNotes } : {}),
    }]
  })
}

export function groupArtifacts(artifacts: readonly GeneratedArtifact[], mode: OutputMode = 'perVendor'): GeneratedArtifact[] {
  checkForCollisions(artifacts)
  const ordered = [...artifacts].sort(compareArtifacts)
  if (mode === 'perVendor') return ordered

  const debian = debianArtifacts(ordered)
  const sources = sourceArtifacts(ordered)
  const auxiliary = auxiliaryArtifacts(ordered)
  if (mode === 'combined') {
    const combined = combinedArtifact(sources)
    return [...debian, ...(combined ? [combined] : []), ...auxiliary]
  }
  if (mode === 'byCategory') return [...debian, ...categoryArtifacts(sources), ...auxiliary]
  throw new Error('Unsupported output mode: ' + String(mode) + '.')
}

export function composeArtifacts(
  debianArtifact: GeneratedArtifact,
  vendorArtifacts: readonly GeneratedArtifact[],
  mode: OutputMode = 'perVendor',
): GeneratedArtifact[] {
  checkForCollisions([debianArtifact, ...vendorArtifacts])
  const composed = [debianArtifact, ...groupArtifacts(vendorArtifacts, mode)]
  checkForCollisions(composed)
  return composed
}
