# Debian Workbench Catalog and Internationalization Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand DebGen to exactly 100 major Linux products using deduplicated repository sources and Debian native package selections, add ten complete languages, expose direct curl retrieval, refine Debian Workbench, and publish the verified result to GitHub Pages.

**Architecture:** Split repository trust and location data from selectable product data. Pure source, product, compatibility, generation, and manifest functions feed the localized Vue interface and build time static API. Vue I18n owns presentation text while technical artifacts remain language neutral and byte stable.

**Tech Stack:** Vue 3.5, Vuetify 4, Vue I18n, TypeScript 6, Vite 8, Vitest 4, Vue Test Utils, Sass, GitHub Actions, GitHub Pages

**Spec:** `docs/superpowers/specs/2026-08-29-workbench-catalog-i18n-expansion-design.md`

## Global Constraints

- Preserve all existing product IDs and public `/api/v1/` URLs.
- Deliver exactly 100 selectable products, including Mullvad Browser, 1Password, Node.js, Yarn Classic 1.x, and LibreOffice.
- Prefer manufacturer or upstream APT repositories. Permit an explicitly endorsed community repository only for a non-security-critical product and label it. Never use a community repository for security-critical software.
- Represent Node.js and LibreOffice as Debian-native products without redundant third-party sources. Never use NodeSource for Node.js.
- Deduplicate shared sources, keys, auxiliary trust files, preferences, warnings, and package names.
- Support `en`, `de`, `es`, `fr`, `it`, `ru`, `pt`, `pl`, `zh-CN`, and `ja`; browser detection and saved choice fall back to English.
- Never translate technical files, commands, URLs, package names, fingerprints, Debian codenames, suites, architectures, or filenames.
- Visible translations contain no Unicode en dash or em dash.
- Retain HTTPS, DEB822, separate keyrings, exact published fingerprint sets, safe shell generation, 44 pixel targets, focus transfer, reduced motion, and zero threshold dependency audit.
- Commit messages remain neutral and describe delivered changes only.

---

### Task 1: Repository source and product domain model

**Files:**
- Modify: `src/features/vendors/model.ts`
- Modify: `src/features/vendors/validate.ts`
- Modify: `src/features/vendors/validate.test.ts`
- Create: `src/features/vendors/source-model.test.ts`

**Interfaces:**
- Produces: `RepositorySource`, `RepositoryLocation`, `RepositoryKey`, `AuxiliaryTrustFile`, `PreferenceFileDefinition`, revised `VendorProduct`, and `validateRepositoryCatalog(sources, products): void`.

- [ ] Write failing tests for shared sources, multiple keys, release scoped locations and keys, arbitrary componentless exact paths, auxiliary trust destination kinds, unknown source references, conflicting definitions, and sources without products.
- [ ] Run focused tests and verify expected failures from missing interfaces.
- [ ] Implement readonly closed types and fail closed validation. Auxiliary destinations use an enum and deterministic derived paths, never an arbitrary path string.
- [ ] Migrate synthetic validator fixtures and keep unsafe URL, slug, fingerprint, path traversal, and duplicate property tests green.
- [ ] Run focused tests and typecheck.
- [ ] Commit with `refactor: separate products from repository sources`.

### Task 2: Migrate the current 25 products without regressions

**Files:**
- Modify: `src/features/vendors/catalog.ts`
- Modify: `src/features/vendors/catalog.test.ts`
- Modify: `src/features/vendors/compatibility.ts`
- Modify: `src/features/vendors/compatibility.test.ts`
- Create: `src/features/vendors/sources.ts`
- Create: `src/features/vendors/sources.test.ts`

**Interfaces:**
- Produces: immutable `REPOSITORY_SOURCES`, migrated `VENDOR_PRODUCTS`, `getRepositorySource(id)`, structured `CompatibilityResult`.

- [ ] Write failing exact migration tests for the original 25 IDs, source references, packages, compatibility matrices, fingerprints, warnings, and source definitions.
- [ ] Capture existing canonical vendor artifacts as byte compatibility fixtures before changing production data.
- [ ] Implement the migrated current catalog and structured compatibility reasons with no localized strings in domain code.
- [ ] Prove every old compatible combination and artifact remains unchanged unless an explicit safety correction is recorded in the test.
- [ ] Run catalog, compatibility, generator, and type tests.
- [ ] Commit with `refactor: migrate vendor catalog to shared sources`.

### Task 3: Add the 75 verified Linux products

**Files:**
- Modify: `src/features/vendors/catalog.ts`
- Modify: `src/features/vendors/sources.ts`
- Modify: catalog, source, and compatibility tests.
- Update: `README.md`

**Interfaces:**
- Consumes: Task 1 and 2 model.
- Produces: exactly 100 products and all required source definitions.

- [ ] Reverify every selected product against its official documentation, Release or InRelease metadata, Packages indexes, key files, and published fingerprints on the implementation date.
- [ ] Write a failing expected table for all 100 IDs, nullable `sourceId`, package sets, releases, architectures, support levels, provenance, security classification, and versioned products.
- [ ] Add Mullvad Browser, 1Password, VS Code, PowerShell 7.6, .NET SDK 10, Tailscale, Cloudflare WARP, cloudflared, OpenTofu, AnyDesk, Sublime Text, Element Desktop, VirtualBox 7.2, GitLab CE, GitLab Runner, Jenkins LTS, NGINX Stable, Vault, Packer, Elastic Stack 9, Syncthing, Corretto 21, Temurin 25, Grafana Alloy, and Caddy.
- [ ] Add the exact final 50-product table from the spec, including Debian-native Node.js and LibreOffice, Yarn Classic 1.x, shared product families, desktop tools, runtimes, infrastructure, observability, and security products.
- [ ] Enforce provenance policy in tests: security-critical products reject `community-endorsed`; Debian-native products require null `sourceId`; every other product requires a validated HTTPS source.
- [ ] Add shared, multi key, release scoped, exact path, auxiliary trust, and preference data exactly as required by the spec.
- [ ] Run exhaustive validation and compatibility tests.
- [ ] Document the exact 100 product matrix, provenance, security classification, installation type, exclusions, and verification date.
- [ ] Commit with `feat: expand official Linux product catalog`.

### Task 4: Shared source generation and safe installation

**Files:**
- Modify: `src/features/vendors/generate.ts`
- Modify: `src/features/vendors/generate.test.ts`
- Modify: `src/features/vendors/group.ts`
- Modify: `src/features/vendors/group.test.ts`
- Update snapshots.

**Interfaces:**
- Produces: `generateRepositoryArtifacts(config)`, source aware package command and installation script, deterministic deduplication.

- [ ] Write failing tests for Mullvad shared source, HashiCorp and Grafana shared packages, Elastic bundle, two OpenTofu keys, release scoped Tailscale and Microsoft locations, Sublime and Jenkins exact paths, 1Password auxiliary trust files, NGINX and Syncthing preferences.
- [ ] Verify duplicate sources, keys, packages, auxiliary files, and preferences fail or deduplicate according to the spec.
- [ ] Implement source driven DEB822 and script generation while retaining heredoc, filename, destination, fingerprint, temporary file, and shell quoting defenses.
- [ ] Update grouping so each unique source appears once in all three modes and warnings remain lossless.
- [ ] Run vendor feature tests, snapshots, typecheck, and lint.
- [ ] Commit with `feat: generate shared repository configurations`.

### Task 5: Typed internationalization foundation

**Files:**
- Modify: `package.json`, `package-lock.json`, `src/main.ts`, `src/plugins/vuetify.ts`
- Create: `src/i18n/locales.ts`, `src/i18n/index.ts`, `src/i18n/format.ts`
- Create: `src/i18n/messages/en.ts`, `de.ts`, `es.ts`, `fr.ts`, `it.ts`, `ru.ts`, `pt.ts`, `pl.ts`, `zh-CN.ts`, `ja.ts`, `index.ts`
- Create corresponding tests.

**Interfaces:**
- Produces: `SupportedLocale`, `resolveLocale`, locale store, complete typed `MessageSchema`, plural formatter, Vue I18n and Vuetify integration.

- [ ] Write failing locale resolution tests for saved preference, exact match, regional fallback, Portuguese, Chinese variants, invalid storage, and English fallback.
- [ ] Write compile and runtime tests requiring identical message keys for all ten locales and correct English, German, Russian, and Polish plural categories.
- [ ] Install the current stable Vue I18n version compatible with Vue 3.5 and record it in the lockfile.
- [ ] Implement static messages, locale persistence, document language synchronization, and Vuetify locale synchronization.
- [ ] Add a test that rejects Unicode en dash or em dash in every visible message.
- [ ] Run i18n tests, typecheck, lint, and dependency audit.
- [ ] Commit with `feat: add ten language interface foundation`.

### Task 6: Migrate the complete interface to translation keys

**Files:**
- Modify every `src/components/*.vue` file and relevant component tests.
- Modify: `src/features/vendors/compatibility.ts`, `catalog.ts`, `generate.ts`, `group.ts`.
- Create: `src/features/vendors/presentation.ts` and tests.

**Interfaces:**
- Consumes: Task 5 translation system.
- Produces: fully localized UI and structured warning, compatibility, and artifact description descriptors.

- [ ] Write failing scans proving visible German and English literals remain outside locale modules and that technical artifacts are byte identical across locale changes.
- [ ] Replace catalog warning text with stable warning keys and compatibility strings with structured reason values.
- [ ] Replace artifact description strings with structured presentation descriptors.
- [ ] Migrate templates, ARIA labels, live announcements, tooltips, errors, categories, and feedback to `t()` and plural helpers.
- [ ] Parameterize representative component tests across all ten locales, with deeper behavior tests for English, German, Russian, Polish, and simplified Chinese.
- [ ] Verify locale changes never alter source, script, filename, command, URL, package, or fingerprint output.
- [ ] Run the complete component and domain test suites.
- [ ] Commit with `feat: localize Debian Workbench interface`.

### Task 7: Language selector and Workbench header polish

**Files:**
- Create: `src/components/LanguageSelect.vue` and tests.
- Modify: `src/components/StudioHeader.vue`, `src/App.vue`, `src/styles/main.scss` and tests.

**Interfaces:**
- Produces: persistent accessible native language selector, icon only Liberapay and GitHub actions.

- [ ] Write failing tests for ten native language names, browser initial locale, persisted changes, `html[lang]`, keyboard access, and English fallback.
- [ ] Write failing accessibility tests for icon only Liberapay and GitHub links with tooltips, names, new tab behavior, 44 pixel targets, and focus states.
- [ ] Implement the approved Debian Workbench header and compact technical presentation.
- [ ] Verify no visible Liberapay or GitHub text and no hidden loss of accessible names.
- [ ] Run focused tests, typecheck, lint, and responsive component checks.
- [ ] Commit with `feat: refine localized Workbench header`.

### Task 8: Product selection, skip flow, and direct curl output

**Files:**
- Modify: `VendorStep.vue`, `VendorCard.vue`, `SelectionSummary.vue`, `SourceGenerator.vue`, `ReviewStep.vue`, `GeneratedFileTabs.vue`, `InstallCommands.vue`, styles and tests.
- Create: `src/features/sources/public-url.ts` and tests.

**Interfaces:**
- Produces: product and unique source counts, shared source labels, System to Output skip flow, canonical manifest based curl commands.

- [ ] Write failing UI tests for multiple products sharing one source, package labels, support levels, product count versus source count, and compatibility cleanup.
- [ ] Write failing skip tests for System directly to Output, Debian only artifacts, focus transfer, mobile action, and return to Software.
- [ ] Write failing URL tests resolving canonical artifact URLs from manifests under the primary Pages path and arbitrary fork base paths.
- [ ] Implement direct `curl -fsSL` plus save, inspect, and apply sequences for every canonical artifact without privileged remote piping.
- [ ] Add copy actions and localized safety explanations while preserving exact commands.
- [ ] Run component, accessibility, mobile, type, and lint tests.
- [ ] Commit with `feat: add Debian only and curl workflows`.

### Task 9: Source aware static API and complete documentation

**Files:**
- Modify: `scripts/generate-api.ts`, `scripts/generate-api.test.ts`, snapshots.
- Modify: `README.md`
- Create: `docs/catalog-maintenance.md`, `docs/translations.md`, `docs/api.md`

**Interfaces:**
- Produces: `sources.json`, extended compatible `vendors.json`, canonical `/sources/` files, preserved product aliases, complete maintenance documentation.

- [ ] Write failing full tree tests preserving every existing URL and adding deterministic source aware endpoints.
- [ ] Assert every manifest URL resolves safely, every compatible artifact exists, every incompatible artifact is absent, and product aliases match canonical source output.
- [ ] Generate `sources.json`, source endpoints, product aliases, auxiliary artifacts, and safe scripts atomically.
- [ ] Document all 100 products, provenance rules, exclusions, shared source behavior, fingerprints, key rotation, auxiliary files, ten language maintenance, API manifests, curl usage, and skip flow.
- [ ] Build twice and compare complete output trees.
- [ ] Commit with `feat: publish shared repository API`.

### Task 10: Final review, verification, merge, and live release

**Files:**
- Modify only files required by verified review findings.

- [ ] Request independent whole branch architecture, security, accessibility, localization, and API review against the approved specification.
- [ ] Fix valid findings test first in one controlled fix wave and perform one scoped re-review.
- [ ] Run fresh `npm run check`, plain `npm audit`, complete manifest validation, and repository status checks.
- [ ] Verify desktop and mobile Workbench in English, German, Russian, and simplified Chinese, including scrolling, overflow, focus, skip flow, shared sources, and curl commands.
- [ ] Merge into `master`, rerun checks on the merged tree, push, and wait for successful CI and GitHub Pages workflows.
- [ ] Verify the live commit, homepage language detection, manual language choice, `sources.json`, Debian only output, Mullvad Browser, 1Password, and representative shared source endpoints return HTTP 200.
- [ ] Remove the feature worktree and merged branch while preserving unrelated worktrees.
