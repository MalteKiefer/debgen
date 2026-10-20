export const fill = (template: string, values: Readonly<Record<string, string | number>>): string => (
  template.replace(/\{(\w+)\}/gu, (match, name: string) => Object.hasOwn(values, name) ? String(values[name]) : match)
)

// Catalog ids are kebab-case while the message catalogs use camelCase keys.
export const camelKey = (value: string): string => value.replace(/-(\w)/gu, (_, letter: string) => letter.toUpperCase())

export const compareCodePoints = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0
