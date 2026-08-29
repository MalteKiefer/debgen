export type WorkbenchIcon = 'check' | 'external' | 'theme'

const iconPaths: Record<WorkbenchIcon, string> = {
  check: 'M4.5 12.5 9 17l10.5-10.5',
  external: 'M14 5h5v5M19 5l-8 8M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  theme: 'M12 3a9 9 0 1 0 0 18V3Zm0 3v12a6 6 0 0 1 0-12Z',
}

export const renderIcon = (name: WorkbenchIcon): string => {
  if (!Object.hasOwn(iconPaths, name)) {
    throw new Error(`Unknown Workbench icon: ${String(name)}`)
  }

  return `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18"><path d="${iconPaths[name]}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path></svg>`
}
