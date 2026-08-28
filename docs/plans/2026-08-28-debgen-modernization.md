# DebGen Modernization Implementation Plan

> **Implementation note:** Execute this plan task-by-task with independent review gates. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unsupported Vue 2 application with a tested Vue 3/Vuetify 4 site that generates correct current Debian APT sources and publishes canonical files through GitHub Pages.

**Architecture:** A static Vue application imports one typed release catalog and pure APT generators. The web UI and a build-time static API generator consume those same functions, so browser downloads and stable `curl` URLs cannot drift.

**Tech Stack:** Vue 3.5.42, Vuetify 4.1.12, Vite 8.2.2, TypeScript 6.0.3, Vitest 4.1.11, Vue Test Utils 2.5.0, ESLint 10.9.1, Sass 1.103.1, npm 11, Node 24.

**Spec:** `docs/specs/2026-08-28-debgen-modernization-design.md`

## Global Constraints

- The supported release set is exactly `trixie`, `bookworm`, `bullseye`, `forky`, and `sid` as of 2026-08-28.
- Official APT sources use HTTPS and the release-compatible Debian archive keyring: `.gpg` for Bookworm/Bullseye and `.pgp` for Trixie/Forky/Sid.
- Bullseye has `main contrib non-free`, security, and updates, but no `non-free-firmware` and no backports.
- Forky and Sid generate base sources only because testing/unstable do not receive normal timely Debian Security Team support.
- Legacy one-line output is available only for Bookworm and Bullseye and is labeled deprecated.
- The first modernized release contains no third-party repositories; all 57 legacy definitions are removed as unverifiable, stale, or unsafe.
- Dependencies are exact-pinned and installed from `package-lock.json` with `npm ci`.
- Supported Node runtime is `>=24.15.0 <25`; CI uses Node 24.
- Every production behavior is introduced by a failing test and a verified red-green cycle.
- Every commit message is neutral and uses conventional project language only.

---

### Task 1: Modern Toolchain and Application Shell

**Files:**
- Replace: `package.json`
- Create: `package-lock.json`
- Delete: `yarn.lock`, `babel.config.js`, `vue.config.js`
- Replace: `jsconfig.json` with `tsconfig.json`
- Create: `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `eslint.config.js`, `src/env.d.ts`
- Create: `src/test/setup.ts`
- Replace: `public/index.html` with root `index.html`
- Replace: `src/main.js` with `src/main.ts`
- Replace: `src/plugins/vuetify.js` with `src/plugins/vuetify.ts`
- Create: `src/App.test.ts`
- Replace: `src/App.vue`
- Delete: `src/router.js`

**Interfaces:**
- Produces: Vite/Vitest/ESLint/TypeScript commands and a mountable Vuetify 4 application shell.
- Produces npm scripts: `dev`, `build`, `test`, `test:run`, `typecheck`, `lint`, `generate:api`, `check`.
- Later tasks place domain code under `src/features/sources/` and render the generator inside `App.vue`.

- [ ] **Step 1: Replace package metadata and build configuration**

Use exact compatible versions. TypeScript is pinned to 6.0.3 rather than 7 because `typescript-eslint@8.68.0` supports TypeScript `<6.1.0`. Include `@vitejs/plugin-vue@6.0.8`, `vite-plugin-vuetify@2.1.3`, `@vue/compiler-sfc@3.5.42`, `@vue/compiler-dom@3.5.42`, `@vue/server-renderer@3.5.42`, `vue-tsc@3.3.11`, `typescript-eslint@8.68.0`, `eslint-plugin-vue@10.10.0`, `@eslint/js@10.0.1`, `jsdom@30.0.1`, `tsx@4.23.12`, `@types/node@24.13.3`, `@mdi/font@7.4.47`, and `sass@1.103.1`.

Configure Vite with Vue, Vuetify auto-import, `base: process.env.VITE_BASE_PATH ?? '/'`, `build.chunkSizeWarningLimit: 500`, and Vitest `environment: 'jsdom'`, `globals: true`, and `setupFiles: ['./src/test/setup.ts']`. The setup file initializes browser polyfills Vuetify actually requires and resets the DOM after each test. Configure ESLint 10 flat config for TypeScript and Vue files. Define `check` as the sequential aggregate of `test:run`, `typecheck`, `lint`, and `build`. Remove Vue CLI, Babel, Webpack loaders, Axios, Vue Router, and Yarn Classic artifacts.

- [ ] **Step 2: Install the new dependency graph**

Run: `npm install`

Expected: exit 0, a new `package-lock.json`, and no engine override.

- [ ] **Step 3: Write the failing shell test**

Create `src/App.test.ts` that mounts the real `App` with the real Vuetify plugin, awaits Vuetify layout, and asserts accessible text `DebGen`, a `main` landmark, and safe `target="_blank"` links that also contain `rel="noopener noreferrer"`. The production changes that make it fail are removing the application shell/main landmark or dropping opener isolation.

- [ ] **Step 4: Verify RED**

Run: `npm run test:run -- src/App.test.ts`

Expected: FAIL because the Vue 2 application/plugin cannot mount in the Vue 3 harness.

- [ ] **Step 5: Implement the minimal Vue 3 shell**

Create `src/main.ts` using `createApp(App).use(vuetify).mount('#app')`. Configure Vuetify 4 with Material Design Icons CSS imported from `@mdi/font`, and replace `App.vue` with a minimal semantic shell containing the title and an empty `<main>` generator slot; Task 4 mounts the migrated generator there. External links use normal anchors with `target="_blank" rel="noopener noreferrer"`.

- [ ] **Step 6: Verify GREEN and static checks**

Run: `npm run test:run -- src/App.test.ts && npm run typecheck && npm run lint`

Expected: all commands exit 0 with no project-owned deprecation warnings.

- [ ] **Step 7: Commit**

```sh
git add package.json package-lock.json tsconfig*.json vite.config.ts eslint.config.js index.html src
git add -u yarn.lock babel.config.js vue.config.js jsconfig.json public/index.html
git commit -m "build: migrate application toolchain"
```

### Task 2: Typed Debian Catalog and APT Generators

**Files:**
- Create: `src/features/sources/model.ts`
- Create: `src/features/sources/releases.ts`
- Create: `src/features/sources/generate.ts`
- Create: `src/features/sources/generate.test.ts`
- Delete: `repos/debian_*.json`, `repos/releases.json`, `repos/releases_status.json`

**Interfaces:**
- Produces: `ReleaseCodename`, `SourceFormat`, `SourceOptions`, `DebianRelease`, `RELEASES`, `validateReleaseCatalog()`, `getRelease()`, `generateDeb822()`, `generateLegacyList()`, `generateSources()`, and `getOutputFilename()`.
- `SourceOptions` contains `release`, `format`, `includeSource`, `includeSecurity`, `includeUpdates`, `includeBackports`, and `components`.
- Later tasks import these exact exports for API generation and UI state.

- [ ] **Step 1: Write failing catalog and generator tests**

Use literal, hand-checked expected output. Cover:

- Trixie DEB822 with base+updates, separate security stanza, all selected components, and `.pgp` Signed-By.
- Trixie with optional backports and Bookworm rejecting backports after support ended on 2026-08-09.
- Bullseye rejecting `non-free-firmware` and backports.
- Forky and Sid emitting base-only output for valid options and rejecting security, updates, or backports flags.
- `deb deb-src` when source indexes are enabled.
- Bookworm/Bullseye legacy lines with `[signed-by=/usr/share/keyrings/debian-archive-keyring.gpg]`.
- Legacy format rejection for Trixie, Forky, and Sid.
- Empty or unknown release/component input rejection.
- Catalog rejection for duplicate codenames, malformed HTTPS URIs, invalid suite names, missing keyring, recommended components not present in the release, and contradictory capability flags.
- Correct filenames: `debian.sources` and `debian.list`.

Each table row contains a literal expected string rather than calling generator helpers to derive expectations.

- [ ] **Step 2: Verify RED**

Run: `npm run test:run -- src/features/sources/generate.test.ts`

Expected: FAIL because the domain modules do not exist.

- [ ] **Step 3: Implement immutable release data**

Model capabilities explicitly. Trixie: security, updates, backports, four components. Bookworm: security and updates, four components, no backports after support ended on 2026-08-09. Bullseye: security and updates, three components, no backports. Forky and Sid: base only and four components. Default release is Trixie. Use `https://deb.debian.org/debian` for base/update/backports and `https://security.debian.org/debian-security` for security. Model the release-compatible keyring path explicitly. `validateReleaseCatalog()` enforces uniqueness, HTTPS, suite-name shape, keyring presence, component membership, and capability/suite consistency; call it at module initialization so malformed catalog edits fail tests and builds.

- [ ] **Step 4: Implement pure generators**

Require programmatic options to match release capabilities uniformly. Always include `main`; preserve component order `main contrib non-free non-free-firmware`. Emit a trailing newline, one blank line between DEB822 stanzas, and one suite per legacy line. Throw descriptive errors for every unsupported format, suite flag, release, or component. Task 4 prevents invalid UI state before calling the strict generator.

- [ ] **Step 5: Verify GREEN**

Run: `npm run test:run -- src/features/sources/generate.test.ts`

Expected: all generator tests pass.

- [ ] **Step 6: Remove obsolete Debian JSON files and verify the suite**

Run: `npm run test:run && npm run typecheck && npm run lint`

Expected: exit 0.

- [ ] **Step 7: Commit**

```sh
git add src/features/sources repos
git commit -m "feat: generate current Debian sources"
```

### Task 3: Versioned Static Download API

**Files:**
- Create: `scripts/generate-api.ts`
- Create: `scripts/generate-api.test.ts`
- Create: `scripts/__snapshots__/generate-api.test.ts.snap`
- Modify: `package.json`
- Modify: `vite.config.ts`
- Generate during build: `public/api/v1/**`

**Interfaces:**
- Consumes: `RELEASES`, `generateSources()`, and `getOutputFilename()` from Task 2.
- Produces: `generateApi(outputRoot: string): Promise<void>` and the exact `/api/v1/` paths defined by the specification.
- Produces manifest entries `{ codename, status, formats, files }`, where each file is `{ format: 'deb822' | 'legacy', filename: 'debian.sources' | 'debian.list', url: '<codename>/<filename>' }`; URLs are relative to `releases.json`.

- [ ] **Step 1: Write the failing API-generation test**

Create a temporary directory, call `generateApi`, and assert the exact eight artifacts: `releases.json`, five `.sources` files, and two `.list` files. Parse the manifest, compare its exact file-record schema and literal relative URLs, and compare each file to a literal or independently selected expected stanza. Assert Bullseye contains neither `non-free-firmware` nor backports, and canonical profiles do not enable backports. Add a committed Vitest snapshot for the complete manifest and canonical file map while keeping semantic assertions for release rules.

- [ ] **Step 2: Verify RED**

Run: `npm run test:run -- scripts/generate-api.test.ts`

Expected: FAIL because `generateApi` does not exist.

- [ ] **Step 3: Implement deterministic API generation**

Generate canonical binary-only profiles with main plus release-recommended firmware component, supported updates/security, and no backports. Sort manifest keys and entries deterministically, end text files with one newline, and remove/recreate only the passed versioned output directory.

- [ ] **Step 4: Integrate API generation into the build**

Set `generate:api` to run the TypeScript script and `build` to execute API generation before `vue-tsc -b` and `vite build`. Do not commit generated `public/api` output if the build recreates it; add the narrow generated path to `.gitignore`.

- [ ] **Step 5: Verify GREEN and production artifact paths**

Run: `npm run test:run -- scripts/generate-api.test.ts && npm run build`

Expected: tests pass and `dist/api/v1/trixie/debian.sources`, `dist/api/v1/bookworm/debian.list`, and `dist/api/v1/releases.json` exist.

- [ ] **Step 6: Commit**

```sh
git add scripts package.json package-lock.json vite.config.ts .gitignore
git commit -m "feat: publish versioned source profiles"
```

### Task 4: Modern Generator Interface

**Files:**
- Replace: `src/components/SourceGenerator.vue`
- Create: `src/components/SourceGenerator.test.ts`
- Create: `src/components/GeneratorControls.vue`
- Create: `src/components/GeneratorControls.test.ts`
- Create: `src/components/SourceOutput.vue`
- Create: `src/components/SourceOutput.test.ts`
- Modify: `src/App.vue`
- Create: `src/styles/main.scss`

**Interfaces:**
- Consumes: release catalog and generators from Task 2.
- Exposes user-visible controls with accessible labels: Debian release, output format, source packages, contrib, non-free, non-free-firmware, security, updates, and backports.
- Produces generated text and filename for Task 5 actions.

- [ ] **Step 1: Write failing component tests**

Mount the real component with Vuetify and assert behavior, not Vuetify internals:

- defaults to Trixie and DEB822;
- generating shows a Trixie DEB822 stanza;
- selecting Bookworm disables backports and explains the 2026-08-09 support end date;
- selecting Bullseye disables firmware and backports and offers the deprecated legacy format;
- selecting Sid disables security, updates, and backports;
- selecting Trixie does not offer legacy format;
- source-package selection changes `Types: deb` to `Types: deb deb-src`;
- controls have accessible labels and status explanations.

- [ ] **Step 2: Verify RED**

Run: `npm run test:run -- src/components/SourceGenerator.test.ts`

Expected: FAIL because the Vue 2 component cannot satisfy the Vue 3 behavior.

- [ ] **Step 3: Implement the Vue 3 Composition API component**

Use typed `ref`/`computed` state and release-driven availability in `SourceGenerator.vue`. Put configuration inputs and capability explanations in `GeneratorControls.vue`; put the generated filename, preview, and action slot in `SourceOutput.vue`. Do not fetch runtime data. Reset unsupported selections when release changes before calling the strict generator. Use Vuetify 4 cards, selects, switches/checkboxes, alerts, and a monospace output area with semantic labels. Remove the third-party repository table and privileged key-command textarea.

- [ ] **Step 4: Add responsive styling**

Use a narrow readable content width, responsive control grid, visible focus states, adequate contrast, and an output area that remains usable on mobile. Keep the Debian identity without copying the old oversized vendor CSS bundle.

- [ ] **Step 5: Verify GREEN**

Run: `npm run test:run -- src/components/SourceGenerator.test.ts src/components/GeneratorControls.test.ts src/components/SourceOutput.test.ts src/App.test.ts && npm run typecheck && npm run lint`

Expected: all checks pass.

- [ ] **Step 6: Commit**

```sh
git add src/components src/App.vue src/styles
git commit -m "feat: modernize source generator interface"
```

### Task 5: Copy, Download, and Error Feedback

**Files:**
- Create: `src/features/sources/download.ts`
- Create: `src/features/sources/download.test.ts`
- Modify: `src/components/SourceGenerator.vue`
- Modify: `src/components/SourceGenerator.test.ts`
- Modify: `src/components/SourceOutput.vue`
- Modify: `src/components/SourceOutput.test.ts`

**Interfaces:**
- Produces: `copyText(text: string, clipboard?: Pick<Clipboard, 'writeText'>): Promise<void>` and `downloadText(filename: string, text: string, environment?: DownloadEnvironment): void`, where `DownloadEnvironment` injects `document`, `Blob`, `createObjectURL`, and `revokeObjectURL`.
- Consumes generated text and filename from Tasks 2 and 4.

- [ ] **Step 1: Write failing helper tests**

Assert that `copyText` writes the exact generated text, propagates clipboard rejection, and rejects when no Clipboard API is available. Assert `downloadText` creates a `text/plain;charset=utf-8` Blob, uses the provided filename, invokes the anchor once, always revokes the object URL, and propagates Blob/URL/anchor failures after cleanup.

- [ ] **Step 2: Verify RED**

Run: `npm run test:run -- src/features/sources/download.test.ts`

Expected: FAIL because the helpers do not exist.

- [ ] **Step 3: Implement minimal browser helpers**

Keep every browser boundary injectable for real behavior tests. Use `navigator.clipboard.writeText`, `Blob`, `URL.createObjectURL`, an ephemeral anchor, and `finally` cleanup.

- [ ] **Step 4: Write failing UI action tests**

Verify Copy reports success only after the promise resolves, clipboard rejection produces an actionable alert, Download uses `debian.sources` or `debian.list`, a download exception produces an actionable alert, and no button is active before valid output exists.

- [ ] **Step 5: Verify UI RED**

Run: `npm run test:run -- src/components/SourceGenerator.test.ts`

Expected: FAIL on missing actions/status feedback.

- [ ] **Step 6: Wire actions and visible feedback**

Add Copy and Download buttons, an ARIA-live status region, deterministic success text, and actionable failure text. Clear stale status when options change.

- [ ] **Step 7: Verify GREEN**

Run: `npm run test:run -- src/features/sources/download.test.ts src/components/SourceGenerator.test.ts src/components/SourceOutput.test.ts && npm run typecheck && npm run lint`

Expected: all checks pass.

- [ ] **Step 8: Commit**

```sh
git add src/features/sources/download.ts src/features/sources/download.test.ts src/components
git commit -m "feat: add source copy and download actions"
```

### Task 6: CI, GitHub Pages, Documentation, and Legacy Cleanup

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/pages.yml`
- Modify: `.github/dependabot.yml`
- Replace: `README.md`
- Delete: `repos/repos.json`
- Delete when empty: `repos/`

**Interfaces:**
- Consumes all npm scripts and production artifacts from Tasks 1-5.
- Produces repeatable CI and a GitHub Pages deployment artifact.

- [ ] **Step 1: Add CI and Pages workflows**

CI checks out code, sets up Node 24 with npm cache, runs `npm ci`, then `npm run check` and `npm audit --audit-level=high`. Pages uses one workflow with a verify job and a deploy job that has `needs: verify`, so an unverified commit cannot deploy. It uses GitHub's official configure/upload/deploy actions, `contents: read`, `pages: write`, and `id-token: write`, the protected `github-pages` environment, concurrency cancellation, and deploys only from the repository's current default branch (`master`). The build step derives `VITE_BASE_PATH` from `GITHUB_REPOSITORY` as `/<repository-name>/`, so forks and repository renames remain valid.

Update Dependabot to target npm on the default branch, group routine development dependency updates, and retain the weekly schedule.

- [ ] **Step 2: Replace documentation**

Document the exact Node requirement `>=24.15.0 <25`, npm commands, supported releases/formats, release-specific `.gpg`/`.pgp` keyring behavior, GitHub Pages setup, all static API URLs, and safe `curl -fsSL | sudo tee` examples. State that Bookworm Backports support ended on 2026-08-09, Bullseye LTS ends 2026-08-31, testing/unstable do not provide stable-grade security support, legacy format is deprecated, and users must inspect output before installation.

- [ ] **Step 3: Remove unverified third-party data**

Delete `repos/repos.json` and the now-empty legacy data directory. Confirm no source or documentation references raw GitHub runtime data, `apt-key`, HTTP APT sources, or obsolete Debian releases.

- [ ] **Step 4: Run focused policy checks**

Run: `rg -n "raw.githubusercontent.com|apt-key|deb http://|stretch|buster|jessie|vue-cli|vue-template-compiler|axios|vue-router" --glob '!docs/specs/**' --glob '!docs/plans/**' .`

Expected: no application/configuration matches. Documentation may mention removed technologies only in historical design documents excluded above.

- [ ] **Step 5: Run complete verification**

Run: `npm ci && npm run check && npm audit --audit-level=high`

Expected: every command exits 0, all tests pass, typecheck and lint report no errors, production build contains all eight API artifacts, and audit reports no high/critical vulnerabilities.

- [ ] **Step 6: Inspect the production bundle**

Run a production build with `VITE_BASE_PATH=/debgen/`, confirm generated HTML references `/debgen/` assets, all referenced assets exist, source maps are absent, and Vite reports no chunk above the configured 500 KiB warning limit.

- [ ] **Step 7: Commit**

```sh
git add .github README.md repos
git commit -m "ci: verify and deploy GitHub Pages site"
```

### Task 7: Final Cross-Cutting Verification

**Files:**
- Modify only files required by verified failures.

**Interfaces:**
- Consumes the complete application and its documented requirements.
- Produces fresh completion evidence and no uncommitted changes.

- [ ] **Step 1: Re-read the specification and check every success criterion**

Map each criterion in `docs/specs/2026-08-28-debgen-modernization-design.md` to a passing command, test, generated artifact, or inspected file.

- [ ] **Step 2: Run the clean-room command sequence**

Run: `npm ci && npm run test:run && npm run typecheck && npm run lint && npm run build && npm audit --audit-level=high`

Expected: exit 0 throughout with zero failing tests and zero high/critical advisories.

- [ ] **Step 3: Validate generated API content independently**

Parse `dist/api/v1/releases.json`; enumerate its files; verify every declared URL exists. Inspect Trixie, Bookworm, Bullseye, Forky, and Sid output for exact suite/component/keyring rules and confirm legacy output exists only for Bookworm and Bullseye.

- [ ] **Step 4: Verify repository hygiene**

Run: `git diff --check` and `git status --short`, then inspect the commit subjects and authored diff for repository-hygiene violations.

Expected: no whitespace errors and only intentional changes before the final commit.

- [ ] **Step 5: Commit any verification-driven fixes**

```sh
git add -A
git commit -m "fix: resolve final verification findings"
```

Skip the commit when verification required no code change.

- [ ] **Step 6: Recheck cleanliness after the optional commit**

Run: `git diff --check && git status --short`

Expected: no output.
