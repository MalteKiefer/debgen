# DebGen Vue Stepper and Technical SEO Redesign

Date: 2026-08-29
Status: approved
Supersedes: `docs/superpowers/specs/2026-08-29-html-first-workbench-redesign-design.md` where this document differs

## Objective

Deliver a modern, technical five-step Debian repository Workbench using Vue 3 for rich interaction while retaining complete statically rendered content for search engines and users without JavaScript. Preserve the approved Structured Workbench visual direction, safe source generation, versioned API, ten languages, official repository policy, and GitHub Pages hosting.

The application targets Debian administrators and Linux enthusiasts. It must feel like an auditable system tool rather than a marketplace, SaaS dashboard, or decorative wizard.

## Binding product decisions

- Keep the workflow order: System, Debian sources, Repositories, Review, Export.
- Use Vue 3 for a single shared stepper state and component model.
- Render the Vue application to complete HTML during the build and hydrate that same markup in the browser.
- Do not restore Vuetify or an icon font.
- Retain the Structured Workbench layout, dense tables, technical typography, restrained Debian red, light/dark themes, and native semantics.
- Make `debgen.org` the production canonical host only after public DNSSEC validation and GitHub Pages HTTPS succeed.
- Publish a verified functional release at intervals of no more than 30 minutes while implementation is active and verified changes exist.
- Use at least five specialized agent contributions in each major implementation wave, rotated through the available parallel slots.
- Keep commits and repository content implementation focused and free of tool attribution.

## Current state and migration safety

Commit `833f39b` is the last published implementation baseline. The localized `/en/` and `/de/` routes show the new static Workbench, while the project root still shows the old Vue design. The first implementation slice must replace the root with the new Workbench.

The feature worktree contains interrupted, uncommitted changes from a root-page correction and System/Debian step work. Before implementation resumes, those changes must be inspected file by file. Valid work may be integrated with tests; conflicting work must be replaced deliberately. No user or agent changes may be discarded blindly.

## Architecture

### Vue server rendering and hydration

Use one Vue 3 Workbench application because all five steps share configuration, validation, history, repository selection, review, and export state. Render it at build time with Vue server rendering. The client hydrates exactly the generated markup rather than mounting into an empty root.

Search engines and users without JavaScript receive meaningful headings, forms, repository data, audit information, documentation links, and canonical downloads. Hydration adds step visibility, validation, history, search, selection, live review, copying, and generated downloads.

Vue components must not duplicate domain rules. Existing pure release, compatibility, validation, grouping, generation, shell-quoting, and public-artifact functions remain the shared source of truth.

### Loading boundaries

The essential bundle contains the stepper shell, shared state, URL codec, history, System and Debian interactions, validation, and focus management. Repository catalog interaction and composed export generation are separate lazy chunks loaded when the Repositories step is entered or restored from a shared URL.

The browser loads a small versioned manifest rather than embedding the full source catalog twice. The former Vue/Vuetify application entry and unused framework assets must be removed from the final artifact.

Initial budgets:

- essential Vue stepper JavaScript at or below 100 KB gzip;
- essential CSS at or below 50 KB gzip;
- no Vuetify, MDI font, or unused legacy application bundle;
- useful HTML visible before hydration;
- no layout shift caused by hydration.

### State and history

Define one validated `WorkbenchState` containing active step, Debian release, architecture, source format, suites, components, official-source options, selected repository IDs, and output grouping.

- Parse all URL state as untrusted input.
- Serialize state deterministically in readable parameters and a step fragment.
- Use `pushState` after valid step transitions.
- Use `replaceState` for normalized input and harmless draft changes.
- Restore the full state on initial load and `popstate`.
- Preserve valid state across language switches.
- Reject unknown, hostile, obsolete, or incompatible values with a visible explanation and safe defaults.
- Preserve valid downstream selections when earlier values change and remove only invalid choices with an explicit notice.

The URL remains the shareable source of truth. Session storage may retain uncommitted drafts but must not override an explicit URL.

## Stepper experience

### Shared behavior

With JavaScript, emphasize one active step and gate forward progress. Completed steps remain directly revisitable. Without JavaScript, render all five sections in order with anchor navigation and useful canonical information.

Continue validates and commits the current step, updates history, activates the next step, and focuses its heading. Back never discards valid state. Browser Back and Forward restore state and focus. Failed validation focuses the first invalid field and presents a linked error summary.

Do not implement a tab widget or custom arrow-key navigation. Preserve native tab order, Enter, Space, form controls, links, and browser navigation shortcuts. `/` focuses repository search only when focus is not in an editable or interactive control.

### Validation gates

- System to Debian sources: require a supported release, architecture, and compatible output format.
- Debian sources to Repositories: require a base suite, always include `main`, and allow only release-supported capabilities.
- Repositories to Review: every selected source must support the selected release and architecture; zero external repositories is valid.
- Review to Export: all blocking incompatibilities must already be resolved; provenance and support notes remain visible.

Never silently coerce a selection or export stale output.

### Desktop and mobile

Desktop keeps the compact left ordered navigation. Each item shows its number, label, and restrained Current, Complete, or Pending text. A compact monospace line summarizes release, architecture, format, and selected-source count.

On small screens, show five numbered targets above the active content with accessible step names and at least 44-pixel targets. Do not use a fixed bottom bar, progress percentage, circular meter, celebratory animation, or oversized summary panel.

Transitions use only a short color or opacity change and never delay focus. Disable transitions and smooth scrolling under reduced-motion preferences.

## Step content

### System

Select Debian release, architecture, and source format. Explain unsupported combinations immediately. Preserve old Debian archive support and compatible legacy formats.

### Debian sources

Configure official base, updates, security, backports, archive, and components from a safe recommendation. Provide a valid Debian-only path and canonical static downloads without requiring JavaScript.

### Repositories

Use an alphabetically sorted, compact semantic table rather than product cards. Show compatible entries by default. Search covers product, operator, package, host, source ID, and category. Audit disclosures show provenance, host, suites, components, architectures, signing key, fingerprint, verification date, documentation, and issue link.

### Review

Present a technical change plan with system values, official Debian sources, one row per external source, generated files, keyrings, fingerprints, preferences, packages, warnings, deduplicated entries, and removed incompatible selections. Provide Edit links to relevant steps without losing state.

### Export

Provide one dominant Download reviewed plan action. Secondary controls offer individual files, copying, inspection, grouping, and safe manifest-based curl retrieval. Always separate download, inspection, and privileged application. Never generate or recommend blind `curl | sudo sh` execution.

## Visual system

- System sans-serif for interface text and system monospace for commands, paths, hosts, packages, fingerprints, and state summaries.
- Debian red only for the primary action, current step, selection, and visible focus.
- Flat surfaces, subtle separators, compact spacing, and dense technical tables.
- No gradients, ornamental metrics, nested card stacks, excessive pills, icon-only navigation, or icon font.
- A small local inline SVG set is allowed when an icon communicates faster than text.
- Full light/dark theme support, visible focus, reduced motion, high contrast, 320-pixel layouts, and safe wrapping or contained scrolling for long technical values.

## Technical SEO

“SEO proof” means every controllable technical signal is deterministic, validated in CI, and verified after deployment. It does not guarantee crawling, indexation, canonical selection, rankings, or real-user Core Web Vitals.

### Canonical host and DNS gate

`debgen.org` becomes the single production origin only after:

- the registrar DS record is removed or matches the current deSEC DNSKEY;
- Cloudflare, Google, and Quad9 resolve A, AAAA, NS, and SOA without `SERVFAIL`;
- the four GitHub Pages A and AAAA records are visible;
- `www` resolves to `maltekiefer.github.io`;
- GitHub Pages accepts the custom domain and provisions HTTPS;
- HTTP redirects consistently to HTTPS and the chosen canonical host.

Until this gate passes, do not activate the GitHub custom domain. A deployment must never publish canonical and sitemap URLs pointing at an unreachable origin.

### Locale and root policy

- `/` is a neutral, self-canonical `x-default` entry with static language links.
- Browser detection highlights or recommends the best supported language but never forces a redirect.
- Locale roots remain `/en/`, `/de/`, `/es/`, `/fr/`, `/it/`, `/ru/`, `/pt/`, `/pl/`, `/zh-CN/`, and `/ja/`.
- Every localized page is self-canonical and has reciprocal `hreflang` links to every real translated equivalent.
- English is the content fallback, not a runtime excuse for partially translated indexable pages.

### Indexable page families

Generate complete localized HTML for:

- product pages;
- repository/source pages;
- Debian release pages;
- architecture pages;
- category pages;
- the Workbench and neutral root.

Each indexable page requires a unique title and description, exactly one useful H1, self-canonical URL, reciprocal language cluster, visible substantive content, Breadcrumb navigation, structured data matching visible claims, and at least one normal incoming link. Every indexable page must be reachable within three clicks.

Unknown IDs, invalid variants, and removed entities must resolve to a true custom 404 page, not a soft homepage.

### Metadata and discovery

- Generate `WebSite` or `WebApplication` data for the Workbench and `BreadcrumbList` for detail pages.
- Add only defensible `SoftwareApplication`, `TechArticle`, or dataset data matching visible content.
- Do not fabricate ratings, offers, authors, or unsupported claims.
- Add absolute Open Graph and social-card metadata with localized titles, descriptions, URL, locale, image, dimensions, type, and alt text.
- Generate XML sitemap entries exactly once for every indexable canonical.
- Exclude query state, fragments, API artifacts, downloads, aliases, and 404 pages from the sitemap.
- Use meaningful content-change dates rather than build timestamps for `lastmod`.
- Publish robots at the actual canonical host root.

Selection state has no independent search value. Clean Workbench pages remain canonical; stateful URLs are excluded from navigation and sitemaps and canonicalize to the clean locale Workbench.

### SEO validation

CI and post-deploy checks must cover:

- HTML validity and exactly one H1;
- unique titles and descriptions;
- canonical host and self-canonical paths;
- reciprocal `hreflang` clusters and language attributes;
- structured data parseability and visible-claim consistency;
- Open Graph and social metadata;
- sitemap equality with the indexable route inventory;
- internal link integrity, no orphan pages, no redirect chains, and no mixed content;
- branded noindex 404 behavior;
- JavaScript-disabled content;
- mobile layout, keyboard operation, focus, reduced motion, and asset budgets;
- live HTTP 200 for all sitemap URLs and representative API/download resources from the deployed commit.

Search Console submission and monitoring of Page Indexing, selected canonicals, language issues, and Core Web Vitals are operational follow-up work.

## Repository policy and expansion

Continue to accept manufacturer/upstream APT repositories and reputable community repositories explicitly recommended by upstream. Security-critical products must never rely on an untrusted third party.

- Add Proxmox VE 9 for Debian 13/Trixie with distinct enterprise and clearly labeled no-subscription channels.
- Add Proxmox Ceph Squid only as a PVE-bound source, not generic Debian Ceph.
- Do not offer test channels by default.
- Do not imply enterprise channels work without a subscription.
- Keep Nextcloud excluded because no qualifying upstream Debian APT repository exists.
- Add further products only after primary-source verification of repository, suites, architectures, keys, fingerprints where published, packages, and support policy.

## Future analytics seam

Provide a disabled-by-default, provider-neutral event interface for later measurement of configuration starts, step completion, repository selection, review, export, downloads, curl-copy actions, language, and Debian release. Do not activate a tracking provider in this implementation.

Future analytics must address consent, data minimization, retention, self-hosting, and the limitations of counting downloads on static GitHub Pages.

## Security and failure handling

- Treat URL state, catalog values, manifests, and localized strings as untrusted input.
- Escape server-rendered HTML and JSON-LD.
- Avoid `innerHTML` for dynamic catalog and review projection.
- Preserve strict package, URL, suite, component, architecture, key, path, and shell validation.
- Preserve safe shell quoting and `apt-get install -y --`.
- Reject control characters, option-like package names, unsafe URLs, and unknown repository IDs.
- If hydration or a lazy chunk fails, leave the static document readable and canonical downloads accessible.
- Never deploy a known broken intermediate state merely to satisfy the release interval.

## Testing and release process

- Follow test-driven development for features and fixes.
- Keep existing domain and security tests.
- Add SSR/hydration parity, state round-trip, popstate, validation gate, focus, hostile input, lazy loading, and export tests.
- Add static SEO route inventory, metadata, sitemap, link, structured-data, and 404 tests.
- Test 320, 736, and 1280 pixel layouts in light, dark, reduced-motion, keyboard, JavaScript-enabled, and JavaScript-disabled modes.
- Run tests, type checking, linting, production build, dependency audit, asset budgets, and live smoke checks before every publication.
- Use rotating implementation, specification review, quality review, security review, accessibility review, SEO review, and live-deployment review contributions, with at least five specialized agent contributions per major wave.
- Publish verified working slices at intervals of no more than 30 minutes while active changes exist.

## Delivery slices

1. Inspect interrupted changes and publish the new SSR Workbench at the project root.
2. Implement the Vue stepper state, history, focus, and System/Debian validation.
3. Implement repository search, filtering, compatibility, selection, and lazy manifest loading.
4. Implement technical Review and secure Export.
5. Generate localized product, repository, release, architecture, category, social, sitemap, and 404 surfaces.
6. Add verified Proxmox and additional repository data.
7. Remove the legacy entry/assets, enforce performance/accessibility/SEO budgets, update documentation, and complete independent review.

Each slice must leave GitHub Pages functional. The first slice must eliminate the old design from the project root.

## Acceptance criteria

- The root and all locale Workbench routes show the approved Structured Workbench, never the old UI.
- Vue 3 SSR and hydration provide one shared five-step state without hiding core content from crawlers or no-JavaScript users.
- Step validation, browser history, URL restoration, focus, compatibility cleanup, Review, and Export work as specified.
- Ten genuine localized route families and all SEO entity pages are statically rendered and internally linked.
- Canonical, `hreflang`, sitemap, robots, structured data, social metadata, and 404 behavior pass CI and live checks.
- The custom domain is enabled only after DNSSEC and HTTPS validation.
- Essential JavaScript is at or below 100 KB gzip and CSS at or below 50 KB gzip.
- Vuetify, MDI, and the legacy application bundle are absent from the final artifact.
- Proxmox VE and Proxmox Ceph are accurate; Nextcloud remains excluded unless future primary evidence changes the repository policy result.
- Existing API, source generation, legacy Debian support, security boundaries, and safe command behavior remain covered and functional.
- Every published slice passed verification and remained live on GitHub Pages.
