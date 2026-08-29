import type { GeneratedArtifact, OutputMode, VendorCategory } from './model'

type SourceAwareArtifact = GeneratedArtifact & { readonly sourceId?: string }

const categoryOrder: readonly VendorCategory[] = [
  'web-browsers',
  'messaging-email',
  'vpn-secure-networking',
  'remote-desktop',
  'containers-kubernetes',
  'cloud-edge',
  'infrastructure-automation',
  'data-platforms',
  'observability-logging',
  'security-secrets',
  'developer-workstation',
  'runtimes-sdks',
  'development-platforms-cicd',
  'web-servers',
  'file-synchronization',
  'virtualization',
  'games',
  'desktop-productivity',
]

const categoryLabels: Readonly<Record<VendorCategory, string>> = {
  'web-browsers': 'Webbrowser',
  'messaging-email': 'Messaging und E-Mail',
  'vpn-secure-networking': 'VPN und sichere Netzwerke',
  'remote-desktop': 'Remote-Desktop',
  'containers-kubernetes': 'Container und Kubernetes',
  'cloud-edge': 'Cloud und Edge',
  'infrastructure-automation': 'Infrastrukturautomatisierung',
  'data-platforms': 'Datenplattformen',
  'observability-logging': 'Observability und Logging',
  'security-secrets': 'Sicherheit und Secrets',
  'developer-workstation': 'Entwicklungsarbeitsplatz',
  'runtimes-sdks': 'Laufzeitumgebungen und SDKs',
  'development-platforms-cicd': 'Entwicklungsplattformen und CI/CD',
  'web-servers': 'Webserver',
  'file-synchronization': 'Dateisynchronisierung',
  virtualization: 'Virtualisierung',
  games: 'Spiele',
  'desktop-productivity': 'Desktop-Produktivität',
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
  const productName = compareCodePoints(
    left.productName ?? left.productId ?? '',
    right.productName ?? right.productId ?? '',
  )
  if (productName !== 0) return productName
  const sourceId = compareCodePoints(
    (left as SourceAwareArtifact).sourceId ?? left.productId ?? '',
    (right as SourceAwareArtifact).sourceId ?? right.productId ?? '',
  )
  if (sourceId !== 0) return sourceId
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

function withMergedRiskNotes(left: GeneratedArtifact, right: GeneratedArtifact): GeneratedArtifact {
  const riskNotes = mergedRiskNotes([left, right])
  return { ...left, ...(riskNotes ? { riskNotes } : {}) }
}

function deduplicateSourceArtifacts(artifacts: readonly GeneratedArtifact[]): GeneratedArtifact[] {
  const sourceById = new Map<string, GeneratedArtifact>()
  const preferenceByFilename = new Map<string, GeneratedArtifact>()
  const passthrough: GeneratedArtifact[] = []
  for (const artifact of [...artifacts].sort(compareArtifacts)) {
    const sourceId = (artifact as SourceAwareArtifact).sourceId
    if (sourceId !== undefined && artifact.filename.endsWith('.sources') && artifact.filename !== 'debian.sources') {
      const existing = sourceById.get(sourceId)
      if (existing !== undefined && existing.content !== artifact.content) {
        throw new Error(`Conflicting source artifact definition: ${sourceId}.`)
      }
      if (existing !== undefined) {
        sourceById.set(sourceId, withMergedRiskNotes(existing, artifact))
      } else {
        sourceById.set(sourceId, { ...artifact, filename: `${sourceId}.sources` })
      }
      continue
    }
    if (sourceId !== undefined && artifact.filename.endsWith('.pref')) {
      const existing = preferenceByFilename.get(artifact.filename)
      if (existing !== undefined && existing.content !== artifact.content) {
        throw new Error(`Conflicting preference artifact definition: ${artifact.filename}.`)
      }
      if (existing !== undefined) {
        preferenceByFilename.set(artifact.filename, withMergedRiskNotes(existing, artifact))
      } else {
        preferenceByFilename.set(artifact.filename, artifact)
      }
      continue
    }
    passthrough.push(artifact)
  }
  const deduplicated = [...sourceById.values(), ...preferenceByFilename.values(), ...passthrough]
  checkForCollisions(deduplicated)
  return deduplicated.sort(compareArtifacts)
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
  const ordered = deduplicateSourceArtifacts(artifacts)
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
  const composed = [debianArtifact, ...groupArtifacts(vendorArtifacts, mode)]
  checkForCollisions(composed)
  return composed
}
