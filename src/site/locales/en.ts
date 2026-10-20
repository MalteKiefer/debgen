export interface LocaleCopy {
  skipLink: string
  hero: {
    title: string
    lead: string
  }
  sections: {
    system: string
    software: string
    files: string
    install: string
  }
  software: {
    selected: string
  }
  files: {
    downloadAll: string
  }
  install: {
    debian: string
    vendor: string
    packages: string
  }
  footer: {
    notAffiliated: string
    catalog: string
    source: string
    report: string
  }
  actions: {
    copy: string
    download: string
    copied: string
    downloaded: string
  }
  errors: {
    copyFailed: string
    downloadFailed: string
  }
  trust: {
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
  skipLink: 'Skip to setup',
  hero: { title: 'Let’s set up {release}.', lead: 'Pick your Debian version and the software you want. DebGen writes the source files and shows every command before you run it.' },
  sections: { system: 'Your system', software: 'Your software', files: 'Your files', install: 'How to install' },
  software: { selected: '{count} selected' },
  files: { downloadAll: 'Download all files (.tar)' },
  install: { debian: 'Install the Debian sources', vendor: 'Add the vendor repositories', packages: 'Update and install' },
  footer: { notAffiliated: 'Made for Debian users. Not affiliated with the Debian project.', catalog: '{products} apps from {sources} vendor repositories.', source: 'Source on GitHub', report: 'Report a problem' },
  actions: { copy: 'Copy', download: 'Download', copied: 'Copied.', downloaded: 'Downloaded.' },
  errors: { copyFailed: 'Copy failed. Copy the content manually.', downloadFailed: 'Download failed. Save the file manually.' },
  trust: { review: 'Review every source, key, and command before use.' },
  seo: { workbenchTitle: 'DebGen — Debian Sources List Generator', workbenchDescription: 'Generate secure Debian APT sources lists and signed repository configurations for Debian and 100+ verified vendor repositories, reviewed before you apply them.', repositoryDescription: 'Review repository provenance, signing keys, packages, and Debian compatibility.', sourceDescription: 'Inspect a package source, its signing key, and supported Debian systems.', categoryDescription: 'Explore verified Debian package sources by category.' },
} satisfies LocaleCopy
