# DebGen Vue Stepper and Technical SEO Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Vue 3 SSR and hydration based five-step Debian repository Workbench with complete static SEO surfaces, safe exports, verified repository data, and a new design at every public entry route.

**Architecture:** Build-time Vue SSR emits complete localized HTML and hydrates one shared Workbench state in the browser. Pure domain modules remain authoritative for validation and generation; repository interaction and composed export code load lazily. A static site generator creates the Workbench, entity pages, metadata, sitemap, social surfaces, and custom 404 for GitHub Pages.

**Tech Stack:** Node.js 24, TypeScript 6, Vue 3.5, Vue server renderer, Vite 8, Vitest 4, ESLint 10, native HTML/CSS, GitHub Pages

**Spec:** `docs/superpowers/specs/2026-08-29-vue-stepper-seo-redesign-design.md`

## Global Constraints

- Keep the exact step order: System, Debian sources, Repositories, Review, Export.
- Use Vue 3 SSR and hydrate the same complete markup; never mount the production Workbench into an empty root.
- Do not restore Vuetify or an icon font.
- Keep the Structured Workbench visual language and useful no-JavaScript content.
- Essential JavaScript must be at or below 100 KB gzip and essential CSS at or below 50 KB gzip.
- Preserve ten languages, the versioned API, all supported Debian releases, safe shell quoting, strict catalog validation, and deterministic generation.
- Never emit or recommend blind `curl | sudo sh` execution.
- Enable `debgen.org` only after DNSSEC succeeds through Cloudflare, Google, and Quad9 and GitHub Pages HTTPS is ready.
- Publish only verified working slices, at intervals of no more than 30 minutes while verified active changes exist.
- Use at least five specialized agent contributions per major wave through rotating implementation and review roles.
- Commit messages and repository content must remain implementation focused and contain no tool attribution.
- Inspect and preserve valid interrupted work; do not discard uncommitted changes blindly.

## File map

- `src/workbench/state.ts`: serializable Workbench state, defaults, and immutable transitions.
- `src/workbench/url-state.ts`: hostile-input-safe URL parsing and deterministic serialization.
- `src/workbench/validation.ts`: step gates and compatibility cleanup using existing domain rules.
- `src/workbench/plan.ts`: structured technical change-plan derivation.
- `src/workbench/App.vue`: SSR-safe Workbench shell and shared state owner.
- `src/workbench/components/*.vue`: focused five-step and navigation components.
- `src/workbench/server.ts`: locale-aware SSR entry.
- `src/workbench/client.ts`: hydration, history, focus, and lazy feature bootstrap.
- `src/workbench/lazy/catalog.ts`: repository manifest, search, filtering, and selection.
- `src/workbench/lazy/export.ts`: review projection and generated downloads.
- `src/site/pages/*.ts`: localized product, repository, release, architecture, category, root, and 404 renderers.
- `src/site/seo.ts`: canonical, hreflang, social, structured-data, robots, and sitemap builders.
- `scripts/build-site.ts`: deterministic site and API orchestration.
- `scripts/check-seo.ts`: route inventory, metadata, link, sitemap, and 404 gates.
- `scripts/check-budgets.ts`: compressed asset and forbidden-dependency gates.

---

### Task 1: Reconcile interrupted work and replace the public root

**Files:**
- Modify: `scripts/build-site.ts`
- Modify: `scripts/build-site.test.ts`
- Review and either integrate or preserve separately: `src/site/pages/system-step.ts`
- Review and either integrate or preserve separately: `src/site/pages/debian-step.ts`
- Review and either integrate or preserve separately: `tests/site/system-debian.test.ts`
- Modify only if required by integrated step work: `src/site/pages/workbench.ts`

**Interfaces:**
- Consumes: committed `renderWorkbenchPage()` and `buildSite()` at `833f39b` plus interrupted working-tree changes.
- Produces: a root `dist/index.html` containing the new Structured Workbench and a documented disposition for every interrupted file.

- [ ] **Step 1: Inventory interrupted diffs and record ownership before editing**

Run: `git status --short && git diff -- scripts/build-site.ts scripts/build-site.test.ts src/site/pages/workbench.ts && git diff --no-index NUL src/site/pages/system-step.ts`

Expected: root correction and System/Debian work are visible; unrelated snapshot hashes match the index after normalization.

- [ ] **Step 2: Write the failing root regression test**

```ts
it('publishes the Structured Workbench at the project root', async () => {
  const outputDir = await mkdtemp(join(tmpdir(), 'debgen-root-'))
  await buildSite({ outputDir, baseUrl: 'https://debgen.org/' })
  const html = await readFile(join(outputDir, 'index.html'), 'utf8')
  expect(html).toContain('data-step="system"')
  expect(html).not.toContain('<div id="app"></div>')
  expect(html).not.toContain('/src/main.ts')
})
```

- [ ] **Step 3: Run the focused test and verify RED against the committed behavior**

Run: `npx vitest run scripts/build-site.test.ts -t "project root"`

Expected: FAIL because root still contains the former application shell.

- [ ] **Step 4: Integrate the smallest safe root correction and keep valid interrupted System/Debian tests in a separate commit boundary**

Root is a neutral x-default Structured Workbench with static language navigation. Do not add browser redirect or domain activation. Preserve API generation and all locale roots.

- [ ] **Step 5: Verify, commit, review, publish, and live-smoke the root slice**

Run: `npx vitest run scripts/build-site.test.ts tests/site/workbench.test.ts && npm run typecheck && npm run lint && npm run build && git diff --check`

Expected: commands exit 0; built root and all locale roots contain the new Workbench. Commit as `fix: publish Workbench at project root`. After task review, push `HEAD:master`, wait for CI and Pages on the same SHA, then verify root, `/en/`, `/de/`, sitemap, robots, and API return 200.

### Task 2: Workbench state, URL codec, and validation boundaries

**Files:**
- Create: `src/workbench/state.ts`
- Create: `src/workbench/url-state.ts`
- Create: `src/workbench/validation.ts`
- Create: `tests/workbench/state.test.ts`
- Create: `tests/workbench/url-state.test.ts`
- Create: `tests/workbench/validation.test.ts`

**Interfaces:**
- Consumes: release, source format, compatibility, vendor ID, and validation types from existing feature modules.
- Produces: `WorkbenchState`, `createDefaultState()`, `reduceWorkbenchState(state, action)`, `parseWorkbenchUrl(url, manifest): ParsedWorkbenchState`, `serializeWorkbenchUrl(state): URLSearchParams`, `validateStep(step, state, manifest): StepValidation`, and `reconcileCompatibility(state, manifest): ReconcileResult`.

- [ ] **Step 1: Write failing literal round-trip and hostile-state tests**

```ts
it('round-trips a validated configuration in stable order', () => {
  const state = { ...createDefaultState(), release: 'trixie', architecture: 'amd64', repositories: ['docker-engine'] }
  expect(serializeWorkbenchUrl(state).toString()).toBe('release=trixie&arch=amd64&format=deb822&repo=docker-engine')
})

it('rejects control characters and unknown repository ids', () => {
  const parsed = parseWorkbenchUrl(new URL('https://debgen.org/en/?repo=bad%0Avalue'), testManifest)
  expect(parsed.state.repositories).toEqual([])
  expect(parsed.warnings).toHaveLength(1)
})
```

- [ ] **Step 2: Run focused tests and verify missing-module failures**

Run: `npx vitest run tests/workbench/state.test.ts tests/workbench/url-state.test.ts tests/workbench/validation.test.ts`

Expected: FAIL resolving the new modules.

- [ ] **Step 3: Implement immutable state, deterministic URL codec, step gates, and explicit compatibility reconciliation**

Do not duplicate package/source grammar. Unknown values never reach generators. Changing release or architecture preserves valid selections and reports every removed value.

- [ ] **Step 4: Run focused tests, existing domain tests, typecheck, and lint**

Run: `npx vitest run tests/workbench src/features/sources/*.test.ts src/features/vendors/compatibility.test.ts src/features/vendors/validate.test.ts && npm run typecheck && npm run lint`

Expected: all commands exit 0.

- [ ] **Step 5: Commit the pure state foundation**

```bash
git add src/workbench tests/workbench
git commit -m "feat: add validated Workbench state"
```

### Task 3: Vue SSR and hydration shell

**Files:**
- Create: `src/workbench/App.vue`
- Create: `src/workbench/components/StepperNavigation.vue`
- Create: `src/workbench/components/StepperSection.vue`
- Create: `src/workbench/server.ts`
- Create: `src/workbench/client.ts`
- Create: `tests/workbench/ssr.test.ts`
- Create: `tests/workbench/hydration.test.ts`
- Modify: `vite.config.ts`
- Modify: `scripts/build-site.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 2 state/validation and Task 1 static build.
- Produces: `renderWorkbenchApp(context): Promise<{ html: string; serializedState: string }>` and `hydrateWorkbench(root, initialState): App<Element>`.

- [ ] **Step 1: Write failing SSR parity and non-empty-root tests**

```ts
it('SSR renders all five steps before hydration', async () => {
  const result = await renderWorkbenchApp(testContext)
  expect(result.html.match(/data-step=/g)).toHaveLength(5)
  expect(result.html).toContain('data-step="system"')
  expect(result.html).toContain('data-step="export"')
})

it('hydrates existing SSR markup without replacing the root', async () => {
  document.body.innerHTML = `<div id="workbench">${serverHtml}</div>`
  const before = document.querySelector('#workbench')
  hydrateWorkbench(before!, testState)
  expect(document.querySelector('#workbench')).toBe(before)
})
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npx vitest run tests/workbench/ssr.test.ts tests/workbench/hydration.test.ts`

Expected: FAIL because SSR and hydration entries do not exist.

- [ ] **Step 3: Implement one SSR-safe Vue app, exact hydration state script, lazy boundaries, and framework-free CSS integration**

All five sections remain in SSR HTML. Add `data-enhanced` only after successful hydration; only then may CSS hide inactive steps. Avoid browser globals in SSR modules.

- [ ] **Step 4: Verify SSR/hydration, no-JS HTML, full tests, and production build**

Run: `npx vitest run tests/workbench tests/site && npm run typecheck && npm run lint && npm run build`

Expected: no hydration warnings; built root and locale HTML include complete step content before the module script.

- [ ] **Step 5: Commit, task-review, publish, and smoke-test the Vue SSR slice**

Commit as `feat: add Vue SSR Workbench`. After review, publish and verify root/locale HTML, asset loading, JavaScript-disabled content, and CI/Pages on the same SHA.

### Task 4: Interactive stepper, history, focus, System, and Debian sources

**Files:**
- Create: `src/workbench/components/SystemStep.vue`
- Create: `src/workbench/components/DebianStep.vue`
- Create: `src/workbench/components/ValidationSummary.vue`
- Create: `src/workbench/history.ts`
- Create: `tests/workbench/stepper.test.ts`
- Create: `tests/workbench/history.test.ts`
- Modify: `src/workbench/App.vue`
- Modify: `src/site/locales/*.ts`

**Interfaces:**
- Consumes: Task 2 state/validation and existing safe Debian generators.
- Produces: five-step navigation events, `createHistoryCoordinator(window, callbacks)`, localized System/Debian components, and committed URL transitions.

- [ ] **Step 1: Write failing forward-gate, back, popstate, focus, and compatibility cleanup tests**

```ts
it('blocks Continue and focuses the first invalid System field', async () => {
  const wrapper = mount(App, { props: invalidSystemProps })
  await wrapper.get('[data-action="continue"]').trigger('click')
  expect(wrapper.get('[role="alert"]').text()).toContain('architecture')
  expect(document.activeElement?.id).toBe('architecture')
})
```

- [ ] **Step 2: Run focused tests and verify RED against the noninteractive shell**

Run: `npx vitest run tests/workbench/stepper.test.ts tests/workbench/history.test.ts`

Expected: FAIL because transitions/history are absent.

- [ ] **Step 3: Implement valid forward transitions, lossless Back, popstate restoration, heading focus, error summaries, status text, and localized System/Debian controls**

No custom tab/arrow semantics. No-JS SSR keeps every section visible. A valid Debian-only configuration must reach Review with zero external repositories.

- [ ] **Step 4: Run focused, generator, accessibility, and full tests**

Run: `npx vitest run tests/workbench src/features/sources/*.test.ts && npm run typecheck && npm run lint && npm run test:run`

Expected: all commands exit 0.

- [ ] **Step 5: Commit, review, publish, and live-test System/Debian flow**

Commit as `feat: add interactive Debian stepper`. Verify browser back/forward, direct shared URL, keyboard focus, no-JS fallback, and mobile step navigation after deployment.

### Task 5: Lazy repository catalog, search, and selection

**Files:**
- Create: `src/workbench/components/RepositoriesStep.vue`
- Create: `src/workbench/components/RepositoryRow.vue`
- Create: `src/workbench/lazy/catalog.ts`
- Create: `tests/workbench/catalog.test.ts`
- Create: `tests/workbench/repositories-step.test.ts`
- Modify: `src/workbench/App.vue`
- Modify: `scripts/build-site.ts`

**Interfaces:**
- Consumes: Task 2 state/compatibility, versioned source manifest, and existing catalog presentation data.
- Produces: `loadCatalog(manifestUrl): Promise<CatalogIndex>`, `searchCatalog(index, query, filters): CatalogEntry[]`, and selected repository state actions.

- [ ] **Step 1: Write failing lazy-load, alphabetical, search-field, compatibility, and selection tests**

```ts
it('matches product, package, host, source id, and category', () => {
  expect(searchCatalog(testIndex, 'download.docker.com', defaults).map(item => item.id)).toContain('docker-engine')
})

it('keeps incompatible entries out of the default result', () => {
  expect(searchCatalog(testIndex, '', trixieArm64Filters).every(item => item.compatible)).toBe(true)
})
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npx vitest run tests/workbench/catalog.test.ts tests/workbench/repositories-step.test.ts`

Expected: FAIL resolving catalog modules/components.

- [ ] **Step 3: Implement lazy manifest loading, semantic table, native details audit data, `/` search focus, filters, selection, and visible load errors**

Use text binding, never `v-html`, for catalog data. The SSR page contains a crawlable repository index and audit links before lazy enhancement.

- [ ] **Step 4: Run catalog/domain/security tests and verify chunk splitting**

Run: `npx vitest run tests/workbench src/features/vendors/*.test.ts && npm run typecheck && npm run lint && npm run build`

Expected: all tests pass and the catalog feature is a separate lazy production chunk.

- [ ] **Step 5: Commit, review, publish, and live-test discovery**

Commit as `feat: add repository selection step`. Verify alphabetic output, representative searches, compatible default, audit disclosure, and shared URL restoration live.

### Task 6: Technical review and secure export

**Files:**
- Create: `src/workbench/plan.ts`
- Create: `src/workbench/components/ReviewStep.vue`
- Create: `src/workbench/components/ExportStep.vue`
- Create: `src/workbench/lazy/export.ts`
- Create: `tests/workbench/plan.test.ts`
- Create: `tests/workbench/review-export.test.ts`
- Modify: `src/workbench/App.vue`

**Interfaces:**
- Consumes: WorkbenchState, existing generation/deduplication/public-command functions, and selected manifest records.
- Produces: `deriveChangePlan(state, manifest): ChangePlan`, reviewed file projections, Blob downloads, copy actions, and canonical manifest curl commands.

- [ ] **Step 1: Write failing literal plan, deduplication, hostile-value, and safe-command tests**

```ts
it('derives one shared source and key for products using the same repository', () => {
  const plan = deriveChangePlan(sharedGrafanaState, testManifest)
  expect(plan.sources).toHaveLength(1)
  expect(plan.keyrings).toHaveLength(1)
})

it('never emits direct download-to-privileged-shell execution', () => {
  expect(renderedCommands).not.toMatch(/curl[^\n|]*\|\s*(sudo\s+)?(sh|bash)/)
})
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npx vitest run tests/workbench/plan.test.ts tests/workbench/review-export.test.ts`

Expected: FAIL because plan and components are absent.

- [ ] **Step 3: Implement deterministic technical plan, Edit links, one primary reviewed download, secondary files/copy/inspection, and lazy custom composition**

Reuse safe domain generators. Never derive shell or HTML independently in Vue. Keep download, inspect, and apply instructions separate.

- [ ] **Step 4: Run review/export, security, generator, full, and build tests**

Run: `npx vitest run tests/workbench src/features/sources/*.test.ts src/features/vendors/generate.test.ts src/features/vendors/validate.test.ts && npm run check`

Expected: all commands exit 0.

- [ ] **Step 5: Commit, review, publish, and validate two live configurations**

Commit as `feat: add reviewed repository exports`. Live-test Debian-only and multi-repository plans, files, copy controls, curl commands, Back/Edit state, and downloads.

### Task 7: Complete localized SEO page graph

**Files:**
- Create: `src/site/pages/product.ts`
- Create: `src/site/pages/repository.ts`
- Create: `src/site/pages/release.ts`
- Create: `src/site/pages/architecture.ts`
- Create: `src/site/pages/category.ts`
- Create: `src/site/pages/not-found.ts`
- Create: `src/site/social.ts`
- Create: `scripts/check-seo.ts`
- Create: `scripts/check-seo.test.ts`
- Modify: `src/site/model.ts`
- Modify: `src/site/render.ts`
- Modify: `src/site/seo.ts`
- Modify: `scripts/build-site.ts`

**Interfaces:**
- Consumes: locale copy, routes, validated catalog/releases, Workbench SSR, and site renderer.
- Produces: complete indexable route inventory, social/structured metadata, `404.html`, and `checkSeo(distDir): SeoReport`.

- [ ] **Step 1: Write failing route-inventory, unique metadata, reciprocal hreflang, social, sitemap, link, and 404 tests**

```ts
it('emits every indexable route exactly once in the sitemap', async () => {
  const report = await checkSeo(fixtureDist)
  expect(report.sitemapUrls).toEqual(report.indexableCanonicalUrls)
})

it('renders a true branded noindex 404', async () => {
  const html = await readFile(join(fixtureDist, '404.html'), 'utf8')
  expect(html).toContain('name="robots" content="noindex"')
  expect(html).not.toContain('rel="canonical" href="https://debgen.org/"')
})
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npx vitest run scripts/check-seo.test.ts`

Expected: FAIL with missing page families and checker.

- [ ] **Step 3: Implement localized entity renderers, route graph, breadcrumbs, defensible JSON-LD, Open Graph/social data, custom 404, sitemap equality, and internal links**

Root is self-canonical x-default. Stateful query URLs canonicalize to the clean Workbench. Do not add API/download/query/404 URLs to sitemap.

- [ ] **Step 4: Run SEO, HTML, locale, full build, and route crawl checks**

Run: `npx vitest run scripts/check-seo.test.ts tests/site && npm run typecheck && npm run lint && npm run build && npm run check:seo`

Expected: all commands exit 0; every indexable page has one H1, unique metadata, valid reciprocal language cluster, and an incoming static link.

- [ ] **Step 5: Commit, review, publish, and live-check all sitemap URLs**

Commit as `feat: add localized repository SEO pages`. After deployment, fetch every sitemap URL and representative social/API assets with cache busting.

### Task 8: Proxmox family and additional verified repositories

**Files:**
- Modify: `src/features/vendors/catalog.ts`
- Modify: `src/features/vendors/sources.ts`
- Modify: `src/features/vendors/model.ts`
- Modify: `src/features/vendors/catalog.test.ts`
- Modify: `src/features/vendors/sources.test.ts`
- Create: `docs/repository-research-2026-08-29.md`

**Interfaces:**
- Consumes: existing catalog/source model and official primary-source evidence.
- Produces: distinct `proxmox-ve`, `proxmox-ceph`, and only additional qualifying products/sources.

- [ ] **Step 1: Document primary evidence and write failing Proxmox policy tests**

```ts
it('keeps Proxmox VE and PVE-bound Ceph sources distinct', () => {
  expect(vendorById('proxmox-ve')?.sourceIds).not.toEqual(vendorById('proxmox-ceph')?.sourceIds)
})

it('does not add Nextcloud without a qualifying vendor APT repository', () => {
  expect(vendorById('nextcloud')).toBeUndefined()
})
```

- [ ] **Step 2: Run focused catalog/source tests and verify missing Proxmox entries fail**

Run: `npx vitest run src/features/vendors/catalog.test.ts src/features/vendors/sources.test.ts`

Expected: FAIL for missing Proxmox products.

- [ ] **Step 3: Add PVE 9 Trixie enterprise/no-subscription, PVE-bound Ceph Squid, and independently tested qualifying products**

Use amd64, official Proxmox key data, subscription labels, and explicit lab-only warning for no-subscription. Exclude test channels, generic Debian Ceph claims, and Nextcloud. Every further product needs its own official evidence and compatibility test.

- [ ] **Step 4: Run all catalog, provenance, generation, API, and alphabetical presentation tests**

Run: `npx vitest run src/features/vendors scripts/generate-api.test.ts && npm run generate:api && npm run typecheck && npm run lint`

Expected: accepted products appear in generated manifests and searchable SEO pages; rejected products do not.

- [ ] **Step 5: Commit, review, publish, and live-check catalog/API/detail pages**

Commit as `feat: add verified Proxmox repositories`.

### Task 9: Performance, accessibility, cleanup, documentation, and DNS gate

**Files:**
- Create: `scripts/check-budgets.ts`
- Create: `scripts/check-budgets.test.ts`
- Create: `tests/workbench/accessibility.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts`
- Delete: obsolete `src/components/*.vue`, `src/plugins/vuetify.ts`, legacy app entry, and obsolete runtime localization files
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `SECURITY.md`
- Modify: `docs/api.md`
- Modify: `docs/translations.md`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/pages.yml`

**Interfaces:**
- Consumes: final built site and all previous task interfaces.
- Produces: `checkBudgets(distDir): BudgetReport`, framework-free dependency boundary, final English documentation, and a DNS activation decision.

- [ ] **Step 1: Write failing budgets, forbidden-assets, keyboard, no-JS, and dependency-boundary tests**

```ts
it('keeps essential assets within the approved budgets', async () => {
  const report = await checkBudgets(fixtureDist)
  expect(report.essentialJavaScriptGzip).toBeLessThanOrEqual(100 * 1024)
  expect(report.essentialCssGzip).toBeLessThanOrEqual(50 * 1024)
  expect(report.forbiddenAssets).toEqual([])
})
```

- [ ] **Step 2: Run focused gates and verify RED while legacy assets/dependencies remain**

Run: `npx vitest run scripts/check-budgets.test.ts tests/workbench/accessibility.test.ts src/project-config.test.ts`

Expected: FAIL on old Vuetify/MDI assets or dependencies.

- [ ] **Step 3: Remove legacy stack, enforce CI budgets/SEO, finish documentation, and add provider-neutral disabled analytics seam**

README documents Workbench, SEO routes, URL sharing, repository policy, API/curl, local development, tests, security, translations, and custom-domain gate. No tracking provider is activated.

- [ ] **Step 4: Run clean install and complete verification, then recheck DNSSEC publicly**

Run: `npm ci && npm run check && npm audit --audit-level=moderate && git diff --check`

Expected: all pass, no moderate-or-higher vulnerabilities. Query Cloudflare, Google, and Quad9 for A/AAAA/NS/SOA with DNSSEC validation. Activate `debgen.org` only if all pass and GitHub provisions HTTPS; otherwise keep GitHub Pages origin functional and report the DNS blocker.

- [ ] **Step 5: Commit, review, publish, and perform final live functional/SEO/performance checks**

Commit as `refactor: finalize Vue Workbench`. Verify the deployed SHA, all sitemap URLs, root/ten locales, representative entity/API/download/404 routes, JavaScript/no-JavaScript behavior, keyboard/mobile, and asset budgets.

### Task 10: Independent review waves and release audit

**Files:**
- Modify only files required by confirmed review findings.

**Interfaces:**
- Consumes: final branch, specification, plan, prior task reports, and deployed site.
- Produces: independent requirements, code quality, security, accessibility, SEO, performance, catalog provenance, and live-deployment verdicts.

- [ ] **Step 1: Dispatch at least five fresh specialized review contributions in rotating waves**

Use separate reviewers for specification compliance, Vue SSR/hydration, URL/security/export handling, accessibility/mobile/keyboard, SEO/link graph, performance/dependencies, repository provenance, and live GitHub Pages behavior.

- [ ] **Step 2: Verify findings against the diff or a reproducible focused test**

Record exact file, behavior, severity, reproduction, and whether the finding conflicts with the approved spec.

- [ ] **Step 3: Add a failing regression test for every confirmed defect and dispatch one consolidated fix wave**

Do not split final findings across conflicting implementers. Re-review only the fix diff and original findings.

- [ ] **Step 4: Run the final evidence suite**

Run: `npm ci && npm run check && npm audit --audit-level=moderate && git diff --check`

Expected: all exit 0, budgets and SEO gates pass, and no moderate-or-higher vulnerabilities remain.

- [ ] **Step 5: Publish final reviewed HEAD and verify the same SHA live**

Confirm CI and Pages success for the same head SHA. Fetch cache-busted root, all locale roots, sitemap, every sitemap URL, robots, social image, representative product/repository/release/category/architecture/404/API/download routes, and two complete Workbench configurations before reporting completion.
