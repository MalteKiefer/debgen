export interface SiteCopy {
  steps: {
    system: string
    repositories: string
    review: string
    export: string
  }
  actions: {
    continue: string
    back: string
    copy: string
    download: string
    export: string
  }
  errors: {
    invalidSelection: string
    copyFailed: string
    downloadFailed: string
  }
  audit: {
    source: string
    operator: string
    repository: string
    signingKey: string
    fingerprint: string
    compatibility: string
    lastVerified: string
  }
  search: {
    label: string
    placeholder: string
    empty: string
  }
  trust: {
    official: string
    endorsed: string
    review: string
  }
  seo: {
    workbenchTitle: string
    workbenchDescription: string
    repositoryDescription: string
    sourceDescription: string
    categoryDescription: string
  }
}

export const en = {
  steps: { system: 'System & sources', repositories: 'Repositories', review: 'Review', export: 'Export' },
  actions: { continue: 'Continue', back: 'Back', copy: 'Copy', download: 'Download', export: 'Export plan' },
  errors: { invalidSelection: 'The selected configuration is not valid.', copyFailed: 'Copy failed. Copy the content manually.', downloadFailed: 'Download failed. Save the file manually.' },
  audit: { source: 'Source', operator: 'Operator', repository: 'Repository', signingKey: 'Signing key', fingerprint: 'Fingerprint', compatibility: 'Compatibility', lastVerified: 'Last verified' },
  search: { label: 'Search repositories', placeholder: 'Search software, packages, or repository hosts', empty: 'No repositories match your search.' },
  trust: { official: 'Official upstream or manufacturer source', endorsed: 'Community source explicitly recommended by upstream', review: 'Review every source, key, and command before use.' },
  seo: { workbenchTitle: 'DebGen — Debian Sources List Generator', workbenchDescription: 'Generate secure Debian APT sources lists and signed repository configurations for Debian and 100+ verified vendor repositories, reviewed before you apply them.', repositoryDescription: 'Review repository provenance, signing keys, packages, and Debian compatibility.', sourceDescription: 'Inspect a package source, its signing key, and supported Debian systems.', categoryDescription: 'Explore verified Debian package sources by category.' },
} satisfies SiteCopy
