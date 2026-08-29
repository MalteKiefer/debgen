# DebGen HTML-first Workbench Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hydrated Vue interface with a localized, SEO-ready, static HTML Workbench enhanced by small TypeScript modules, while preserving safe Debian source generation and expanding the verified repository catalog.

**Architecture:** A Node TypeScript build renders complete localized HTML, metadata, sitemap files, and canonical downloads from the existing validated domain model. Native HTML and CSS provide the five-step interface; isolated browser modules add search, URL-backed selection, review, clipboard, and custom downloads without making core content dependent on JavaScript.

**Tech Stack:** Node.js 24, TypeScript 6, Vite 8 library bundling, Vitest 4, ESLint 10, native HTML/CSS, GitHub Pages

**Spec:** `docs/superpowers/specs/2026-08-29-html-first-workbench-redesign-design.md`

## Global Constraints

- Keep the workflow order: System, Debian sources, Repositories, Review, Export.
- Continue to host on GitHub Pages without a required application server.
- Keep all configuration generation local to the browser or build process.
- Never generate or promote a blind `curl | sudo sh` workflow.
- Include only upstream or manufacturer repositories, plus reputable community repositories explicitly recommended by upstream. Security-critical products must not use third-party repositories.
- Keep intermediate releases deployable at no more than 30-minute intervals while implementation is active and verified changes exist.
- Commit messages and repository content must remain implementation focused and contain no tool attribution.
- Essential JavaScript must be at or below 50 KB gzip and essential CSS at or below 50 KB gzip.
- Vue, Vuetify, Vue I18n, and the MDI font must be absent from final production assets.
- Preserve ten languages, the static API, safe shell quoting, strict catalog validation, deterministic generation, and all supported Debian releases.

## File map

- `src/site/model.ts`: serializable page, locale, navigation, and SEO contracts.
- `src/site/render.ts`: safe document and fragment rendering with centralized escaping.
- `src/site/routes.ts`: stable localized route and canonical URL construction.
- `src/site/seo.ts`: metadata, structured data, robots, and sitemap generation.
- `src/site/pages/workbench.ts`: five-step Workbench page renderer.
- `src/site/pages/repository.ts`: repository and product audit page renderer.
- `src/site/locales/*.ts`: build-time interface copy for each supported locale.
- `src/site/styles/workbench.css`: framework-free responsive visual system.
- `src/client/state.ts`: validated URL state codec.
- `src/client/catalog.ts`: search, filters, disclosure, and keyboard enhancement.
- `src/client/composer.ts`: selection, compatibility, review, and export enhancement.
- `src/client/clipboard.ts`: optional copy behavior.
- `src/client/events.ts`: disabled-by-default provider-neutral analytics seam.
- `scripts/build-site.ts`: orchestrates API generation, HTML rendering, client bundling, and output validation.
- `scripts/check-budgets.ts`: verifies asset and no-JavaScript budgets.
- `tests/site/*.test.ts`: renderer, route, SEO, page, and security tests.
- `tests/client/*.test.ts`: browser enhancement tests.
- `tests/catalog/*.test.ts`: new repository provenance and compatibility tests.

---

### Task 1: Static site contracts and safe renderer

**Files:**
- Create: `src/site/model.ts`
- Create: `src/site/render.ts`
- Create: `tests/site/render.test.ts`
- Modify: `tsconfig.app.json`

**Interfaces:**
- Produces: `SitePage`, `SeoMetadata`, `renderDocument(page: SitePage): string`, `escapeHtml(value: string): string`, and `escapeJsonForHtml(value: unknown): string`.
- Consumes: no new project interfaces.

- [ ] **Step 1: Write failing renderer and escaping tests**

```ts
import { describe, expect, it } from 'vitest'
import { escapeHtml, renderDocument } from '../../src/site/render'

describe('static document rendering', () => {
  it('escapes untrusted catalog text and emits useful HTML before scripts', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;')
    const html = renderDocument({
      lang: 'en', path: '/en/', title: 'DebGen', description: 'APT workbench',
      canonical: 'https://debgen.org/en/', alternates: [], body: '<main><h1>DebGen</h1></main>',
    })
    expect(html).toContain('<html lang="en">')
    expect(html.indexOf('<h1>DebGen</h1>')).toBeLessThan(html.indexOf('<script'))
  })
})
```

- [ ] **Step 2: Run the focused test and confirm it fails because the module is absent**

Run: `npx vitest run tests/site/render.test.ts`

Expected: FAIL with an import error for `src/site/render`.

- [ ] **Step 3: Implement the typed renderer with escaped attributes and inert structured JSON**

```ts
export interface SitePage {
  lang: string
  path: string
  title: string
  description: string
  canonical: string
  alternates: ReadonlyArray<{ lang: string; href: string }>
  body: string
  structuredData?: unknown
  scripts?: readonly string[]
}

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]!)

export const escapeJsonForHtml = (value: unknown) => JSON.stringify(value)
  .replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026')
```

`renderDocument()` must create the doctype, language, viewport, canonical, description, alternates, stylesheet, optional JSON-LD, body, and deferred module scripts. It accepts only already-rendered trusted body fragments; all catalog values must pass through `escapeHtml()` at their rendering boundary.

- [ ] **Step 4: Run focused tests, type checking, and diff validation**

Run: `npx vitest run tests/site/render.test.ts && npm run typecheck && git diff --check`

Expected: all commands exit 0.

- [ ] **Step 5: Commit the renderer slice**

```bash
git add src/site/model.ts src/site/render.ts tests/site/render.test.ts tsconfig.app.json
git commit -m "feat: add safe static page renderer"
```

### Task 2: Localized routes and SEO foundation

**Files:**
- Create: `src/site/routes.ts`
- Create: `src/site/seo.ts`
- Create: `src/site/locales/index.ts`
- Create: `src/site/locales/en.ts`
- Create: `src/site/locales/de.ts`
- Create: `src/site/locales/es.ts`
- Create: `src/site/locales/fr.ts`
- Create: `src/site/locales/it.ts`
- Create: `src/site/locales/ru.ts`
- Create: `src/site/locales/pt.ts`
- Create: `src/site/locales/pl.ts`
- Create: `src/site/locales/zh-CN.ts`
- Create: `src/site/locales/ja.ts`
- Create: `tests/site/seo.test.ts`

**Interfaces:**
- Consumes: `SitePage` from `src/site/model.ts` and existing locale identifiers from `src/i18n/locales.ts` during migration.
- Produces: `sitePath(locale, segments): string`, `canonicalUrl(path): string`, `buildAlternates(segments)`, `renderSitemap(entries): string`, `renderRobots(): string`, and `SiteCopy`.

- [ ] **Step 1: Write failing canonical, hreflang, sitemap, and robots tests**

```ts
it('creates reciprocal locale routes and x-default', () => {
  const links = buildAlternates(['repositories', 'docker-engine'])
  expect(links).toContainEqual({ lang: 'de', href: 'https://debgen.org/de/repositories/docker-engine/' })
  expect(links).toContainEqual({ lang: 'x-default', href: 'https://debgen.org/en/repositories/docker-engine/' })
})

it('keeps query combinations out of the sitemap', () => {
  expect(renderSitemap([{ path: '/en/', lastModified: '2026-08-29' }])).not.toContain('?')
  expect(renderRobots()).toContain('Sitemap: https://debgen.org/sitemap.xml')
})
```

- [ ] **Step 2: Run the focused test and verify missing route modules cause failure**

Run: `npx vitest run tests/site/seo.test.ts`

Expected: FAIL resolving `src/site/routes` or `src/site/seo`.

- [ ] **Step 3: Implement stable routes, metadata, reciprocal alternates, JSON-LD builders, sitemap, robots, and ten typed copy modules**

`SiteCopy` must contain the five step names, actions, error labels, audit labels, search copy, trust wording, and SEO descriptions. English is the fallback at build time; no runtime locale fallback is shipped.

- [ ] **Step 4: Run locale, SEO, type, and lint checks**

Run: `npx vitest run tests/site/seo.test.ts src/i18n/interface.test.ts && npm run typecheck && npm run lint`

Expected: all commands exit 0 and every locale satisfies `SiteCopy`.

- [ ] **Step 5: Commit localized SEO infrastructure**

```bash
git add src/site tests/site/seo.test.ts
git commit -m "feat: add localized SEO route foundation"
```

### Task 3: Structured Workbench shell and visual system

**Files:**
- Create: `src/site/pages/workbench.ts`
- Create: `src/site/styles/workbench.css`
- Create: `src/site/icons.ts`
- Create: `tests/site/workbench.test.ts`

**Interfaces:**
- Consumes: `SiteCopy`, `renderDocument()`, existing release data from `src/features/sources/releases.ts`.
- Produces: `renderWorkbenchPage(context: WorkbenchPageContext): SitePage` and `renderIcon(name: WorkbenchIcon): string`.

- [ ] **Step 1: Write failing structure and accessibility tests**

```ts
it('renders the approved five-step Workbench with native landmarks', () => {
  const html = renderDocument(renderWorkbenchPage(testContext))
  expect(html).toContain('<nav aria-label="Workflow">')
  expect(html).toContain('data-step="system"')
  expect(html).toContain('data-step="debian"')
  expect(html).toContain('data-step="repositories"')
  expect(html).toContain('data-step="review"')
  expect(html).toContain('data-step="export"')
  expect(html).not.toContain('mdi-')
  expect(html).not.toContain('<div id="app"></div>')
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run tests/site/workbench.test.ts`

Expected: FAIL because `renderWorkbenchPage` does not exist.

- [ ] **Step 3: Implement the compact header, left step navigation, responsive main region, native controls, light/dark tokens, reduced motion, and small inline SVG icon set**

CSS must use Debian red only for focus, active state, and the primary action. It must not contain gradients, fixed mobile summary panels, card shadows, icon fonts, or framework selectors.

- [ ] **Step 4: Render fixtures at 320, 736, and 1280 pixels and run focused tests**

Run: `npx vitest run tests/site/workbench.test.ts && npm run typecheck && npm run lint`

Expected: tests pass; manual browser inspection shows no horizontal overflow and all controls retain visible focus.

- [ ] **Step 5: Commit the Workbench shell**

```bash
git add src/site/pages/workbench.ts src/site/styles/workbench.css src/site/icons.ts tests/site/workbench.test.ts
git commit -m "feat: add structured Workbench shell"
```

### Task 4: Static site build and first deployable slice

**Files:**
- Create: `scripts/build-site.ts`
- Create: `scripts/build-site.test.ts`
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/pages.yml`

**Interfaces:**
- Consumes: `renderWorkbenchPage()`, SEO builders, locale copy, and `scripts/generate-api.ts`.
- Produces: `buildSite({ outputDir, baseUrl }): Promise<BuildManifest>` and a deployable `dist/` tree.

- [ ] **Step 1: Write a failing temporary-directory build test**

```ts
it('builds useful localized HTML and preserves the versioned API', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'debgen-site-'))
  const manifest = await buildSite({ outputDir, baseUrl: 'https://debgen.org/' })
  expect(await readFile(join(outputDir, 'en', 'index.html'), 'utf8')).toContain('<h1>')
  expect(await readFile(join(outputDir, 'de', 'index.html'), 'utf8')).toContain('System')
  expect(manifest.locales).toHaveLength(10)
})
```

- [ ] **Step 2: Run the test and verify it fails because the build orchestrator is absent**

Run: `npx vitest run scripts/build-site.test.ts`

Expected: FAIL resolving `buildSite`.

- [ ] **Step 3: Implement deterministic rendering, asset copying, API generation, root language entry, sitemap, robots, and Vite client entry bundling**

Change `npm run build` to run API generation, type checking, client bundling, and `tsx scripts/build-site.ts`. Keep output deterministic so unchanged catalog data does not create noisy diffs.

- [ ] **Step 4: Run the full check and inspect the generated tree**

Run: `npm run check`

Expected: exit 0; `dist/en/index.html`, `dist/de/index.html`, `dist/sitemap.xml`, `dist/robots.txt`, and `dist/api/v1/releases.json` exist.

- [ ] **Step 5: Commit, push, deploy, and smoke-test the first HTML-first slice**

```bash
git add scripts package.json package-lock.json vite.config.ts .github/workflows
git commit -m "feat: build localized static Workbench"
git push origin master
gh run watch --repo MalteKiefer/debgen "$(gh run list --repo MalteKiefer/debgen --workflow pages.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
```

Verify the live root, `/en/`, `/de/`, sitemap, robots, and API return 200 before continuing.

### Task 5: System and Debian source steps

**Files:**
- Create: `src/site/pages/system-step.ts`
- Create: `src/site/pages/debian-step.ts`
- Create: `tests/site/system-debian.test.ts`
- Modify: `src/site/pages/workbench.ts`

**Interfaces:**
- Consumes: existing `DebianRelease`, source configuration types, and safe Debian generator functions.
- Produces: `renderSystemStep(context): string` and `renderDebianStep(context): string` using native forms and canonical artifact links.

- [ ] **Step 1: Write failing tests for release, architecture, archive, and Debian-only output**

```ts
it('renders supported systems and archive guidance without JavaScript', () => {
  const html = renderSystemStep({ locale: 'en', selectedRelease: 'trixie', selectedArchitecture: 'amd64' })
  expect(html).toContain('<option value="trixie" selected>')
  expect(html).toContain('<option value="amd64" selected>')
  expect(html).toContain('<form')
})
```

- [ ] **Step 2: Run focused tests and confirm missing renderers fail**

Run: `npx vitest run tests/site/system-debian.test.ts`

Expected: FAIL with missing module errors.

- [ ] **Step 3: Implement native fieldsets, validation summaries, official suites, security, updates, backports, archive behavior, and direct Debian-only downloads**

The selected system must constrain later compatibility data. Unsupported combinations must produce visible explanatory text and no privileged command.

- [ ] **Step 4: Run source generator and page tests**

Run: `npx vitest run tests/site/system-debian.test.ts src/features/sources/*.test.ts && npm run typecheck && npm run lint`

Expected: all commands exit 0.

- [ ] **Step 5: Commit the first two functional steps**

```bash
git add src/site/pages tests/site/system-debian.test.ts
git commit -m "feat: render system and Debian source steps"
```

### Task 6: Repository index, audit pages, and small search enhancement

**Files:**
- Create: `src/site/pages/repositories-step.ts`
- Create: `src/site/pages/repository.ts`
- Create: `src/client/catalog.ts`
- Create: `tests/site/repositories.test.ts`
- Create: `tests/client/catalog.test.ts`
- Modify: `scripts/build-site.ts`

**Interfaces:**
- Consumes: validated vendor/source catalog, compatibility functions, route and SEO builders.
- Produces: `renderRepositoriesStep(context): string`, `renderRepositoryPage(context): SitePage`, and `enhanceCatalog(root: HTMLElement): void`.

- [ ] **Step 1: Write failing static table, audit, alphabetical order, and search tests**

```ts
it('renders compatible repositories alphabetically with audit details', () => {
  const html = renderRepositoriesStep(testRepositoryContext)
  expect(html.indexOf('Docker Engine')).toBeLessThan(html.indexOf('Tailscale'))
  expect(html).toContain('<table')
  expect(html).toContain('<details')
  expect(html).toContain('Fingerprint')
})

it('matches product, package, host, source id, and category', () => {
  expect(searchCatalog(testIndex, 'download.docker.com').map(item => item.id)).toContain('docker-engine')
})
```

- [ ] **Step 2: Run both focused test files and verify missing modules fail**

Run: `npx vitest run tests/site/repositories.test.ts tests/client/catalog.test.ts`

Expected: FAIL resolving the new modules.

- [ ] **Step 3: Implement the semantic table, compatible-by-default filter, native details, static repository pages, `/` search focus, and text normalization**

Do not use `innerHTML` for search results. Toggle `hidden` and update an `aria-live` count. Repository detail pages must include operator, provenance, host, suites, components, architectures, key, fingerprint, verification date, documentation, and issue link.

- [ ] **Step 4: Run focused, catalog, hostile-input, and SEO tests**

Run: `npx vitest run tests/site/repositories.test.ts tests/client/catalog.test.ts src/features/vendors/*.test.ts tests/site/seo.test.ts`

Expected: all tests pass.

- [ ] **Step 5: Commit and deploy the repository discovery slice**

```bash
git add src/site src/client scripts/build-site.ts tests
git commit -m "feat: add auditable repository index"
git push origin master
```

Wait for CI and Pages, then smoke-test repository pages and search before continuing.

### Task 7: URL state, selection, review, and export composer

**Files:**
- Create: `src/client/state.ts`
- Create: `src/client/composer.ts`
- Create: `src/client/clipboard.ts`
- Create: `src/client/events.ts`
- Create: `src/site/pages/review-step.ts`
- Create: `src/site/pages/export-step.ts`
- Create: `tests/client/state.test.ts`
- Create: `tests/client/composer.test.ts`
- Create: `tests/client/events.test.ts`
- Create: `tests/site/review-export.test.ts`
- Modify: `src/site/pages/workbench.ts`

**Interfaces:**
- Consumes: existing safe generation, grouping, compatibility, and public artifact command functions.
- Produces: `WorkbenchState`, `parseWorkbenchState(url): ParseResult`, `serializeWorkbenchState(state): URLSearchParams`, `enhanceComposer(root, manifest): void`, `createEventEmitter(sink?: WorkbenchEventSink): (event: WorkbenchEvent) => void`, `renderReviewStep(plan): string`, and `renderExportStep(plan): string`.

- [ ] **Step 1: Write failing round-trip, hostile input, deduplication, and safe export tests**

```ts
it('round-trips only known compatible state', () => {
  const parsed = parseWorkbenchState(new URL('https://debgen.org/en/?release=trixie&arch=amd64&repo=docker-engine'))
  expect(parsed.state).toEqual({ release: 'trixie', architecture: 'amd64', repositories: ['docker-engine'] })
  expect(serializeWorkbenchState(parsed.state).get('repo')).toBe('docker-engine')
})

it('rejects control characters and unknown repositories', () => {
  const parsed = parseWorkbenchState(new URL('https://debgen.org/en/?repo=bad%0Avalue'))
  expect(parsed.state.repositories).toEqual([])
  expect(parsed.warnings).toHaveLength(1)
})

it('keeps analytics disabled until a future provider is explicitly registered', () => {
  const emit = createEventEmitter()
  expect(() => emit({ type: 'export_created', release: 'trixie' })).not.toThrow()
})
```

- [ ] **Step 2: Run focused tests and verify the new interfaces are absent**

Run: `npx vitest run tests/client/state.test.ts tests/client/composer.test.ts tests/client/events.test.ts tests/site/review-export.test.ts`

Expected: FAIL with missing imports.

- [ ] **Step 3: Implement validated URL state, browser history, selection, compatibility cleanup, technical change plan, one primary export, secondary downloads, clipboard, manifest-based curl commands, and the disabled provider-neutral event interface**

The generated UI must never concatenate untrusted strings into HTML or shell. Reuse the existing safe generation functions. Preserve download, inspect, apply separation and `apt-get install -y --`.

- [ ] **Step 4: Run composer, security, generator, and browser tests**

Run: `npx vitest run tests/client tests/site/review-export.test.ts src/features/sources/*.test.ts src/features/vendors/generate.test.ts src/features/vendors/validate.test.ts`

Expected: all tests pass with no DOM injection or unsafe command regression.

- [ ] **Step 5: Commit and deploy the complete five-step flow**

```bash
git add src/client src/site/pages tests
git commit -m "feat: add shareable review and export flow"
git push origin master
```

Wait for CI and Pages, then validate a Debian-only configuration and a multi-repository configuration on the live page.

### Task 8: Proxmox catalog family and additional verified repositories

**Files:**
- Modify: `src/features/vendors/model.ts`
- Modify: `src/features/vendors/catalog.ts`
- Modify: `src/features/vendors/sources.ts`
- Modify: `src/features/vendors/icons.ts`
- Modify: `src/features/vendors/catalog.test.ts`
- Modify: `src/features/vendors/sources.test.ts`
- Create: `docs/repository-research-2026-08-29.md`

**Interfaces:**
- Consumes: existing vendor/source models and validation rules.
- Produces: distinct verified Proxmox VE and Proxmox Ceph products/sources plus only those additional candidates that satisfy the repository policy.

- [ ] **Step 1: Record primary-source evidence and write failing catalog tests**

```ts
it('models Proxmox VE and Ceph as distinct official repository products', () => {
  expect(vendorById('proxmox-ve')?.sourceIds.length).toBeGreaterThan(0)
  expect(vendorById('proxmox-ceph')?.sourceIds.length).toBeGreaterThan(0)
  expect(vendorById('proxmox-ve')?.sourceIds).not.toEqual(vendorById('proxmox-ceph')?.sourceIds)
})

it('does not claim Nextcloud has a vendor APT source without qualifying evidence', () => {
  expect(vendorById('nextcloud')).toBeUndefined()
})
```

The research document must cite current official documentation for product ownership, supported suites, architectures, signing keys, enterprise subscription requirements, no-subscription warnings, and every acceptance or rejection.

- [ ] **Step 2: Run catalog tests and verify Proxmox entries are initially absent**

Run: `npx vitest run src/features/vendors/catalog.test.ts src/features/vendors/sources.test.ts`

Expected: FAIL on missing `proxmox-ve` or `proxmox-ceph`.

- [ ] **Step 3: Add official Proxmox VE and Ceph data and separately tested additional qualifying sources**

Model enterprise and no-subscription sources accurately and never enable a subscription-only source by default. Reject Nextcloud when current official evidence confirms no qualifying vendor or endorsed APT repository. Add each further product in an isolated data block with its documentation URL and exact compatibility matrix.

- [ ] **Step 4: Run all provenance, source, snapshot, and API generation tests**

Run: `npx vitest run src/features/vendors scripts/generate-api.test.ts && npm run generate:api && git diff --check`

Expected: all tests pass, generated manifests contain the accepted products in alphabetical presentation order, and Nextcloud is absent unless newly discovered primary evidence changes the test and research record.

- [ ] **Step 5: Commit and deploy the verified catalog expansion**

```bash
git add src/features/vendors scripts/__snapshots__ docs/repository-research-2026-08-29.md
git commit -m "feat: add verified Proxmox repositories"
git push origin master
```

Verify live product and source API entries after Pages succeeds.

### Task 9: Accessibility, SEO, no-JavaScript, and performance gates

**Files:**
- Create: `scripts/check-budgets.ts`
- Create: `scripts/check-budgets.test.ts`
- Create: `tests/site/no-js.test.ts`
- Create: `tests/site/accessibility.test.ts`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: built `dist/` tree and the build manifest.
- Produces: `checkBudgets(distDir): BudgetReport` and CI failures for missing static content, framework assets, metadata, unsafe HTML, overflow fixtures, or exceeded budgets.

- [ ] **Step 1: Write failing asset and static-content gate tests**

```ts
it('rejects framework assets and oversized essentials', async () => {
  const report = await checkBudgets(fixtureDist)
  expect(report.javascriptGzipBytes).toBeLessThanOrEqual(50 * 1024)
  expect(report.cssGzipBytes).toBeLessThanOrEqual(50 * 1024)
  expect(report.assetNames.some(name => /vuetify|mdi|vue/i.test(name))).toBe(false)
})

it('keeps navigation, catalog, and canonical downloads in HTML', async () => {
  const html = await readFile('dist/en/index.html', 'utf8')
  expect(html).toContain('<nav')
  expect(html).toContain('<table')
  expect(html).toContain('/api/v1/')
})
```

- [ ] **Step 2: Run budget tests and confirm the current Vue build fails the new limits**

Run: `npx vitest run scripts/check-budgets.test.ts tests/site/no-js.test.ts tests/site/accessibility.test.ts`

Expected: FAIL because the current production assets exceed budgets or framework assets remain.

- [ ] **Step 3: Implement gzip accounting, forbidden-asset checks, essential HTML assertions, heading/label checks, and CI budget command**

Add `check:budgets` to `npm run check`. Budget reports must list exact offending assets and byte counts.

- [ ] **Step 4: Run full verification and inspect at 320, 736, and 1280 pixels in light, dark, keyboard-only, reduced-motion, and JavaScript-disabled modes**

Run: `npm run check && npm audit --audit-level=moderate`

Expected: all checks exit 0 and the audit reports zero moderate-or-higher vulnerabilities.

- [ ] **Step 5: Commit the quality gates**

```bash
git add scripts tests package.json package-lock.json .github/workflows/ci.yml
git commit -m "test: enforce static site quality budgets"
```

### Task 10: Remove the former Vue application and finalize documentation

**Files:**
- Delete: `src/components/*.vue`
- Delete: `src/components/*.test.ts`
- Delete: `src/plugins/vuetify.ts`
- Delete: `src/App.vue`
- Delete: `src/App.test.ts`
- Delete: obsolete runtime files under `src/i18n/`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts`
- Modify: `tsconfig.app.json`
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `docs/api.md`
- Modify: `docs/translations.md`
- Modify: `docs/catalog-maintenance.md`

**Interfaces:**
- Consumes: all replacement render and enhancement modules from Tasks 1 through 9.
- Produces: final framework-free production dependency graph and English project documentation.

- [ ] **Step 1: Add a failing dependency-boundary test**

```ts
it('ships without former UI framework dependencies', () => {
  const manifest = JSON.parse(readFileSync('package.json', 'utf8'))
  expect(manifest.dependencies ?? {}).not.toHaveProperty('vue')
  expect(manifest.dependencies ?? {}).not.toHaveProperty('vuetify')
  expect(manifest.dependencies ?? {}).not.toHaveProperty('vue-i18n')
  expect(manifest.dependencies ?? {}).not.toHaveProperty('@mdi/font')
})
```

- [ ] **Step 2: Run the boundary test and verify it fails while the dependencies remain**

Run: `npx vitest run src/project-config.test.ts`

Expected: FAIL listing the former UI dependencies.

- [ ] **Step 3: Remove obsolete application files and dependencies, simplify Vite and TypeScript configuration, and update English documentation**

README must explain the five-step workflow, no-JavaScript behavior, URL sharing, repository admission policy, API/curl use, local development, tests, translations, SEO routes, and security model. Do not describe Nextcloud as available if it was rejected.

- [ ] **Step 4: Run a clean install and complete verification**

Run: `npm ci && npm run check && npm audit --audit-level=moderate`

Expected: clean install succeeds, all tests and budgets pass, build succeeds, and the audit reports zero moderate-or-higher vulnerabilities.

- [ ] **Step 5: Commit, push, deploy, and perform final live verification**

```bash
git add -A
git commit -m "refactor: complete HTML-first Workbench"
git push origin master
```

Wait for CI and Pages. Verify homepage, all ten locale roots, representative product and source pages, sitemap, robots, API counts, Debian-only export, multi-repository export, mobile layout, keyboard navigation, and JavaScript-disabled content.

### Task 11: Independent reviews and release audit

**Files:**
- Modify only files required by confirmed review findings.

**Interfaces:**
- Consumes: final implementation and specification.
- Produces: independent requirements, security, accessibility, SEO, performance, catalog, and live-deployment review results.

- [ ] **Step 1: Dispatch at least five independent review contributions in rotating parallel waves**

Assign separate reviewers for specification compliance, command/security handling, accessibility/keyboard/mobile behavior, SEO/static rendering, performance/dependency boundaries, catalog provenance, and live GitHub Pages behavior. The runtime supports at most three subagents alongside the primary agent, so rotate completed reviewers into the next wave.

- [ ] **Step 2: Verify every reported finding against code or a reproducible test before changing anything**

For each confirmed issue, record the file, exact behavior, severity, and reproducing command. Reject findings that conflict with primary documentation or cannot be reproduced.

- [ ] **Step 3: For each confirmed defect, add a failing regression test and implement the smallest correction**

Run the focused test before and after each correction. Do not bundle unrelated cleanup.

- [ ] **Step 4: Run the final evidence suite**

Run: `npm ci && npm run check && npm audit --audit-level=moderate && git diff --check`

Expected: exit 0, all tests pass, budgets pass, zero moderate-or-higher vulnerabilities, and no whitespace errors.

- [ ] **Step 5: Push the final reviewed release and verify GitHub Pages**

```bash
git push origin master
gh run list --repo MalteKiefer/debgen --branch master --limit 4
```

Confirm CI and Pages succeeded for the same head SHA. Fetch cache-busted live HTML, sitemap, robots, vendors, sources, releases, and representative artifacts; verify status 200 and expected content before reporting completion.
