export interface SeoMetadata {
  title: string
  description: string
  canonical: string
  alternates: ReadonlyArray<{ lang: string; href: string }>
  structuredData?: unknown
}

export interface SitePage extends SeoMetadata {
  lang: string
  path: string
  body: string
  scripts?: readonly string[]
}
