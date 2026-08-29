import type { SitePage } from './model'

export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]!)

export const escapeJsonForHtml = (value: unknown): string => (JSON.stringify(value) ?? 'null')
  .replaceAll('<', '\\u003c')
  .replaceAll('>', '\\u003e')
  .replaceAll('&', '\\u0026')

export const renderDocument = (page: SitePage): string => {
  const alternates = page.alternates
    .map(({ lang, href }) => `<link rel="alternate" hreflang="${escapeHtml(lang)}" href="${escapeHtml(href)}">`)
    .join('\n')
  const structuredData = page.structuredData === undefined
    ? ''
    : `\n<script type="application/ld+json">${escapeJsonForHtml(page.structuredData)}</script>`
  const scripts = (page.scripts ?? ['/assets/site.js'])
    .map(script => `<script type="module" src="${escapeHtml(script)}" defer></script>`)
    .join('\n')

  return `<!doctype html>
<html lang="${escapeHtml(page.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(page.title)}</title>
<meta name="description" content="${escapeHtml(page.description)}">
<link rel="canonical" href="${escapeHtml(page.canonical)}">
${alternates}
<link rel="stylesheet" href="/assets/site.css">${structuredData}
</head>
<body>
${page.body}
${scripts}
</body>
</html>`
}
