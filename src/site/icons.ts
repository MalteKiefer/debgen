export type WorkbenchIcon =
  | 'check'
  | 'external'
  | 'search'
  | 'copy'
  | 'download'
  | 'shield'
  | 'flag'
  | 'filter'

const iconPaths: Record<WorkbenchIcon, readonly string[]> = {
  check: ['M4.5 12.5 9 17l10.5-10.5'],
  external: ['M14 5h5v5M19 5l-8 8M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'M21 21l-4.3-4.3'],
  copy: ['M9 9h10v10H9z', 'M5 15V5h10'],
  download: ['M12 4v11', 'M7 11l5 5 5-5', 'M5 20h14'],
  shield: ['M12 3l7 3v6c0 4.4-3 7.5-7 9-4-1.5-7-4.6-7-9V6z', 'M9 12l2 2 4-4'],
  flag: ['M6 21V4', 'M6 4h11l-2.5 3.5L17 11H6'],
  filter: ['M4 5h16', 'M7 12h10', 'M10 19h4'],
}

export const renderIcon = (name: WorkbenchIcon): string => {
  if (!Object.hasOwn(iconPaths, name)) {
    throw new Error(`Unknown Workbench icon: ${String(name)}`)
  }

  const paths = iconPaths[name].map(d => `<path d="${d}"></path>`).join('')
  return `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
}
