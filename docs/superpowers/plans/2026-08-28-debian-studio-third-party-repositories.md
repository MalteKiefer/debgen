# Debian Studio and Official Third-Party Repositories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a polished Debian Studio UI and a tested catalog of 25 official vendor APT repositories with safe split outputs, downloads, static API endpoints, and a live GitHub Pages release.

**Architecture:** Typed immutable vendor data feeds pure validation, compatibility, generation, grouping, Vue components, and build-time API generation. Existing Debian generation remains isolated and is composed with vendor artifacts at the application boundary. Every behavior is developed red-green-refactor and all generated output is deterministic.

**Tech Stack:** Vue 3.5, Vuetify 4, TypeScript 6, Vite 8, Vitest 4, Vue Test Utils, Sass, GitHub Actions, GitHub Pages

**Spec:** `docs/superpowers/specs/2026-08-28-debian-studio-third-party-repositories-design.md`

## Global Constraints

- Include exactly the 25 products named in the spec and only official vendor or upstream-project sources.
- Preserve Trixie, Bookworm, Bullseye, Forky, Sid and every existing `/api/v1/<release>/` URL.
- Use HTTPS, separate keyrings, `Signed-By`, DEB822 vendor sources, deterministic filenames, and one trailing newline.
- Never emit `apt-key`, PPAs, community mirrors, opaque `curl | sh`, or executable browser behavior.
- Default output mode is `perVendor`; also support `combined` and `byCategory`.
- User-facing copy is German; technical identifiers remain exact.
- Commit messages remain neutral and describe only the delivered change.

---

### Task 1: Vendor domain model and strict catalog validator

**Files:**
- Create: `src/features/vendors/model.ts`
- Create: `src/features/vendors/validate.ts`
- Create: `src/features/vendors/validate.test.ts`

**Interfaces:**
- Produces: `VendorProduct`, `VendorCategory`, `SystemArchitecture`, `OutputMode`, `GeneratedArtifact`, `validateVendorCatalog(products): void`.
- Consumers: all later vendor tasks and build-time generation.

- [ ] **Step 1: Write failing tests** covering duplicate IDs/filenames/keyrings, HTTP URLs, missing metadata, unknown releases, unsafe keyring paths, empty compatibility, and one valid minimal product.
- [ ] **Step 2: Run `npm test -- src/features/vendors/validate.test.ts`** and confirm failures because the model and validator do not exist.
- [ ] **Step 3: Implement minimal readonly types and validator**. Use closed unions for the five release codenames and supported Debian architectures; throw messages containing the offending product ID and invariant.
- [ ] **Step 4: Run the focused test and `npm run typecheck`**; confirm green.
- [ ] **Step 5: Commit** with `feat: add vendor repository model`.

### Task 2: Verified catalog of 25 official products

**Files:**
- Create: `src/features/vendors/catalog.ts`
- Create: `src/features/vendors/catalog.test.ts`
- Update: `README.md`

**Interfaces:**
- Consumes: Task 1 types and validation.
- Produces: `VENDOR_PRODUCTS` as an immutable, validated array; `getVendorProduct(id)`.

- [ ] **Step 1: Write failing catalog tests** asserting exactly 25 unique entries, the exact product IDs from the spec, `verifiedAt === '2026-08-28'`, official documentation links, package names, and explicit compatibility for every entry.
- [ ] **Step 2: Run the focused test** and verify the catalog import fails.
- [ ] **Step 3: Implement the 25 definitions** using the official documentation and Release/InRelease metadata recorded during design research. Version Kubernetes, MongoDB, MariaDB, and Zabbix explicitly. Record fingerprints only when the vendor publishes them.
- [ ] **Step 4: Run catalog and validator tests**; confirm all definitions validate.
- [ ] **Step 5: Add the exact catalog and maintenance policy to README** without adding unverified compatibility claims.
- [ ] **Step 6: Commit** with `feat: add official vendor catalog`.

### Task 3: Compatibility engine

**Files:**
- Create: `src/features/vendors/compatibility.ts`
- Create: `src/features/vendors/compatibility.test.ts`

**Interfaces:**
- Consumes: `VendorProduct`, `ReleaseCodename`, `SystemArchitecture`.
- Produces: `getVendorCompatibility(product, release, architecture): { compatible: boolean; reason?: string }` and `compatibleProducts(...)`.

- [ ] **Step 1: Write failing tests** for supported combinations, unsupported releases, unsupported architectures, and human-readable German reasons; include Brave, Firefox, Mullvad, Docker, Azure CLI, PostgreSQL, and MongoDB boundary cases.
- [ ] **Step 2: Run the focused test** and verify missing-function failures.
- [ ] **Step 3: Implement table-driven compatibility** with no vendor-specific branching outside catalog metadata.
- [ ] **Step 4: Run focused and catalog tests**; confirm green.
- [ ] **Step 5: Commit** with `feat: add vendor compatibility checks`.

### Task 4: Vendor source, command, and grouping generators

**Files:**
- Create: `src/features/vendors/generate.ts`
- Create: `src/features/vendors/generate.test.ts`
- Create: `src/features/vendors/group.ts`
- Create: `src/features/vendors/group.test.ts`
- Create: `src/features/vendors/__snapshots__/generate.test.ts.snap`

**Interfaces:**
- Consumes: validated catalog products and system selection.
- Produces: `generateVendorArtifacts(config): GeneratedArtifact[]`, `groupArtifacts(artifacts, mode): GeneratedArtifact[]`, and `generateInstallScript(config, artifacts): GeneratedArtifact`.

- [ ] **Step 1: Write failing semantic tests** for DEB822 fields, suites, architectures, keyring paths, fingerprint verification, shell quoting, warnings, and rejection of incompatible inputs.
- [ ] **Step 2: Run tests** and verify correct missing-function failures.
- [ ] **Step 3: Implement minimal pure DEB822 and install-command generation** with deterministic ordering and a single trailing newline. Commands download keys to temporary files and never pipe remote scripts into a shell.
- [ ] **Step 4: Write failing grouping tests** for `perVendor`, `combined`, and `byCategory`, including Debian-base-first order and collision rejection.
- [ ] **Step 5: Implement grouping and snapshots**; combined output joins complete DEB822 stanzas while key paths stay distinct.
- [ ] **Step 6: Run all vendor feature tests and typecheck**; confirm green.
- [ ] **Step 7: Commit** with `feat: generate split vendor sources`.

### Task 5: Debian Studio shell and three-step interaction

**Files:**
- Modify: `src/App.vue`
- Modify: `src/components/SourceGenerator.vue`
- Modify: `src/components/GeneratorControls.vue`
- Create: `src/components/StudioHeader.vue`
- Create: `src/components/StudioProgress.vue`
- Create: `src/components/SystemStep.vue`
- Create: `src/components/SelectionSummary.vue`
- Modify/Create corresponding `*.test.ts` files.

**Interfaces:**
- Produces: accessible three-step navigation and system state including architecture.
- Consumers: product selection and review tasks.

- [ ] **Step 1: Write failing component tests** for German headings, step navigation, release/architecture state, keyboard-accessible controls, and responsive summary content.
- [ ] **Step 2: Run the focused component tests** and confirm expected failures.
- [ ] **Step 3: Implement the Debian Studio shell** while preserving existing Debian options and generation behavior.
- [ ] **Step 4: Run component tests and typecheck**; confirm green.
- [ ] **Step 5: Commit** with `feat: introduce Debian Studio workflow`.

### Task 6: Product discovery and selection UI

**Files:**
- Create: `src/components/VendorStep.vue`
- Create: `src/components/VendorCard.vue`
- Create: `src/components/VendorStep.test.ts`
- Create: `src/components/VendorCard.test.ts`

**Interfaces:**
- Consumes: catalog, compatibility engine, release, architecture, selected IDs.
- Produces: search/category filters and compatible product selection events.

- [ ] **Step 1: Write failing tests** for all product cards, search, category filters, icons, official badge, compatible selection, disabled reasons, and cleanup after system changes.
- [ ] **Step 2: Run focused tests** and verify failure because components are absent.
- [ ] **Step 3: Implement cards and filtering** using accessible buttons/checkboxes, stable IDs, live selected count, and no repository network requests.
- [ ] **Step 4: Run component tests, typecheck, and lint**; confirm green.
- [ ] **Step 5: Commit** with `feat: add vendor repository selection`.

### Task 7: Review, split output, downloads, and polished styling

**Files:**
- Create: `src/components/ReviewStep.vue`
- Create: `src/components/GeneratedFileTabs.vue`
- Create: `src/components/InstallCommands.vue`
- Create corresponding `*.test.ts` files.
- Modify: `src/components/SourceGenerator.vue`
- Modify: `src/styles/main.scss`
- Modify: `src/plugins/vuetify.ts`

**Interfaces:**
- Consumes: selected system configuration, products, generation/grouping functions.
- Produces: output-mode control, individual artifact previews, copy/download actions, warnings, and installation commands.

- [ ] **Step 1: Write failing tests** for default `perVendor`, all three modes, selected summary, file tabs, individual copy/download, empty vendor selection, and warnings.
- [ ] **Step 2: Run focused tests** and verify expected failures.
- [ ] **Step 3: Implement the review components** and compose generated Debian/vendor artifacts.
- [ ] **Step 4: Add Debian Studio styling**: warm dark shell, bright workspace, Debian-red accents, richer icon use, 44px targets, mobile flow, visible focus, and reduced-motion rules.
- [ ] **Step 5: Run all component tests, typecheck, and lint**; confirm green.
- [ ] **Step 6: Commit** with `feat: add repository review and export`.

### Task 8: Static vendor API and documentation

**Files:**
- Modify: `scripts/generate-api.ts`
- Modify: `scripts/generate-api.test.ts`
- Modify: `scripts/__snapshots__/generate-api.test.ts.snap`
- Modify: `README.md`

**Interfaces:**
- Consumes: catalog, compatibility, and generation functions.
- Produces: `vendors.json`, `catalog.json`, compatible vendor `.sources`, install scripts, and manifest links under `/api/v1/`.

- [ ] **Step 1: Write failing API tests** for the new manifests, representative Brave/Firefox/Mullvad files, every declared URL, deterministic output, and absent incompatible combinations.
- [ ] **Step 2: Run focused tests** and confirm missing endpoint failures.
- [ ] **Step 3: Extend atomic API generation** while preserving every existing endpoint and manifest shape relied on by users.
- [ ] **Step 4: Update README** with safe save-inspect-run `curl` examples, output modes, all endpoints, trust warning, and catalog maintenance checklist.
- [ ] **Step 5: Run API tests and production build**; parse manifests and verify all referenced files exist.
- [ ] **Step 6: Commit** with `feat: publish vendor repository API`.

### Task 9: Independent review, full verification, merge, and Pages release

**Files:**
- Modify only files required by verified review findings.

**Interfaces:**
- Consumes: all completed tasks.
- Produces: clean reviewed branch, merged and pushed `master`, successful CI/Pages deployment, live HTTP verification.

- [ ] **Step 1: Request independent code and security review** against the approved spec; classify findings by severity and reproduce each valid issue with a failing test.
- [ ] **Step 2: Fix valid findings test-first** and rerun focused suites after each correction.
- [ ] **Step 3: Run `npm run check` and `npm audit`** from a clean repository state; require zero failures and zero known dependency vulnerabilities.
- [ ] **Step 4: Inspect `dist/api/v1/catalog.json`** and verify every manifest URL resolves to a generated file.
- [ ] **Step 5: Review the UI at desktop and mobile widths** including keyboard focus, reduced motion, overflow, empty selection, incompatible selection, and all output modes.
- [ ] **Step 6: Merge the feature branch to `master` and push** after verifying the branch is current.
- [ ] **Step 7: Wait for CI and GitHub Pages workflows** and require successful conclusions.
- [ ] **Step 8: Verify the live homepage, `catalog.json`, `vendors.json`, and representative Brave, Firefox, and Mullvad endpoints return HTTP 200 and the deployed commit matches `master`.
