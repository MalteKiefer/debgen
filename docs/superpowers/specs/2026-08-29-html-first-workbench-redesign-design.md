# DebGen HTML-first Workbench Redesign

Date: 2026-08-29
Status: approved

## Objective

Replace the current Vue and Vuetify interface with a fast, dense, auditable Debian repository workbench. Preserve the verified domain model, generators, security constraints, catalog, static API, tests, ten languages, and GitHub Pages deployment. The new interface must remain useful without JavaScript and use small progressive enhancements only where browser interaction is required.

The redesign targets Debian administrators and Linux enthusiasts. It prioritizes transparency, keyboard use, technical detail, and predictable output over marketplace cards, dashboard metrics, decoration, or framework-specific interaction patterns.

## Constraints

- Keep the workflow order: System, Debian sources, Repositories, Review, Export.
- Continue to host on GitHub Pages without a required application server.
- Keep all configuration generation local to the browser or build process.
- Never generate or promote a blind `curl | sudo sh` workflow.
- Include only upstream or manufacturer repositories, plus reputable community repositories explicitly recommended by upstream. Security-critical products must not use third-party repositories.
- Keep intermediate releases deployable at no more than 30-minute intervals while implementation is active and verified changes exist.
- Commit messages and repository content must remain implementation focused and contain no tool attribution.

## Current-state findings

The current page is an empty application mount without JavaScript. Its production artifact contains approximately 688 KB JavaScript, 644 KB CSS, and a 403 KB WOFF2 icon font. All ten translations, the catalog, Vue, Vue I18n, Vuetify, and Material Design Icons load on the initial route.

The product-card interface is too spacious for a catalog of more than one hundred products, hides high-value audit data, and creates excessive scrolling and keyboard stops. Terms such as Studio, Workbench, and Workspace are inconsistent. The output area repeats similar commands and artifacts without one dominant action.

The underlying deterministic generators, validation rules, source provenance, compatibility logic, deduplication, static API, and tests are suitable for reuse.

## Architecture

### Build-time rendering

Node-based TypeScript remains the source of truth for catalog validation and artifact generation. The build produces:

- complete localized HTML pages;
- repository and product detail pages;
- Debian release and architecture landing pages;
- canonical downloadable source files and scripts;
- small browser manifests for search, compatibility, and composition;
- sitemap, robots directives, metadata, and structured data.

Vue, Vuetify, Vue I18n, the Material Design Icons font, and full-page hydration are removed from the production interface. Native HTML elements and CSS implement layout, navigation, forms, disclosure, responsive behavior, and themes.

### Progressive enhancement

Small, independently testable TypeScript modules enhance the static pages:

- catalog search and filtering;
- repository selection and compatibility feedback;
- URL-backed state restoration and sharing;
- live review and custom multi-repository composition;
- copy-to-clipboard and generated downloads;
- optional browser-language redirection on the root route.

The static catalog, repository documentation, navigation, canonical downloads, and individual source pages remain usable when JavaScript is unavailable. Advanced arbitrary combinations require the composer enhancement because GitHub Pages has no server runtime.

### State and URLs

Language uses stable path prefixes such as `/en/` and `/de/`. System and selection state use readable, validated URL parameters so configurations are bookmarkable, shareable, and restorable. Unknown, obsolete, or incompatible parameters are ignored with a visible explanation rather than executed or silently coerced.

## Information architecture

### Global shell

The header is narrow and contains the DebGen identity, current workflow step, language, theme control, and links to documentation, API, and GitHub. The single product term is `Workbench`; `Studio` and `Workspace` are removed from interface copy.

Desktop uses a compact left step navigation. Mobile moves the steps above the content and does not reserve a fixed summary panel. Browser history and direct links reflect meaningful workflow locations.

### Step 1: System

Collect Debian release, architecture, and output format. Display concise support information and reject unsupported combinations before repository selection. Preserve legacy Debian archive behavior.

### Step 2: Debian sources

Configure official Debian suites and components, including updates, security, backports, and archive sources where applicable. Start from a safe recommended configuration. Keep the Debian-only fast path.

### Step 3: Repositories

Replace large cards with an alphabetically sorted, compact semantic table. Show compatible entries by default. Search covers product name, vendor, package, repository host, source ID, and category. Filters remain restrained and relevant to the selected system.

Each row exposes expandable audit details:

- operator and provenance;
- repository host and source format;
- suites, components, and architectures;
- signing key URL, keyring path, and published fingerprint where available;
- compatibility and support policy;
- last verification date;
- official documentation and issue-report links.

### Step 4: Review

Present a technical change plan rather than dashboard statistics. It lists every file, repository host, key, fingerprint, suite, component, preference, package, compatibility warning, shared source, and removed duplicate. Trust claims distinguish official upstream sources from explicitly upstream-endorsed community sources.

### Step 5: Export

Provide one dominant action to export the plan. Secondary options include individual downloads, copyable commands, grouping controls, and safe manifest-based curl retrieval. The interface always separates download, inspection, and privileged application.

## Visual system

The selected direction is the Structured Workbench mockup.

- Use Debian red only for primary actions, active state, and focus.
- Use system sans-serif for interface text and system monospace for commands, package names, hosts, paths, and fingerprints.
- Favor flat surfaces, subtle separators, compact spacing, and tables.
- Avoid gradients, decorative metrics, nested cards, excessive pills, and icon-only navigation.
- Use a small local inline SVG sprite for the few icons whose meaning is clearer than text.
- Support light and dark themes, reduced motion, visible focus, keyboard operation, and layouts down to 320 pixels.
- Keep touch targets usable without making desktop rows oversized.

Keyboard conventions include `/` to focus repository search and native form navigation. Arrow-key behavior is added only where it follows an established composite-widget pattern and includes correct accessibility semantics.

## Repository catalog expansion

Add Proxmox VE and Proxmox Ceph as distinct catalog products and sources after validating their current official documentation, supported Debian and Proxmox release matrix, architectures, signing keys, suites, and no-subscription versus enterprise policy. Do not imply that an enterprise source is usable without the required subscription.

Evaluate Nextcloud against the repository admission policy. Include it only if Nextcloud currently operates an official Debian APT repository or explicitly recommends a reputable repository that satisfies the policy. A downloadable package, appliance, Snap, Docker image, PPA, or unofficial OBS entry does not qualify by itself.

Research additional Linux-focused candidates using official primary documentation. Every accepted entry must have a working APT source, provenance evidence, compatible Debian matrix, key handling, and tests. Rejected candidates are documented in maintenance notes when their omission is likely to be questioned.

## SEO and discovery

Every indexable page contains meaningful server-rendered content. The build creates:

- localized routes with reciprocal `hreflang` links and an `x-default`;
- canonical URLs;
- unique titles and descriptions;
- product, source, category, Debian release, and architecture pages;
- internal links between related products, sources, releases, categories, documentation, and API resources;
- XML sitemaps and valid `robots.txt`;
- Open Graph and social preview metadata;
- structured data for the website, breadcrumbs, and appropriate technical content;
- useful headings, descriptions, and stable slugs without keyword stuffing.

The default English pages are canonical only for English content. Each translation is self-canonical. Generated parameter combinations that add no distinct searchable value are not indexed, preventing crawl duplication.

## Future analytics seam

No analytics provider or tracking is enabled in this redesign. The interaction layer exposes a provider-neutral, disabled-by-default event interface for later measurement of configuration starts, repository selections, exports, downloads, curl-copy actions, language, and Debian release.

A future analytics decision must address consent, data minimization, retention, self-hosting, and the limits of counting static GitHub Pages downloads. Reliable download accounting may require a separate privacy-preserving redirect or download endpoint and is outside this implementation.

## Security and failure handling

- Preserve strict package, URL, suite, component, architecture, key, and path validation.
- Treat catalog content and URL state as untrusted input.
- Escape all generated HTML and structured data.
- Do not insert catalog strings with `innerHTML` in browser enhancements.
- Keep shell quoting and `apt-get --` protections.
- Reject control characters and option-like package values.
- Render incompatible or invalid choices as actionable errors.
- If an enhancement fails, retain readable static content and canonical downloads.

## Testing and budgets

Keep existing domain tests and add:

- build-render tests for every page family;
- HTML validity and escaping tests;
- metadata, canonical, `hreflang`, sitemap, and robots tests;
- keyboard, focus, contrast, reduced-motion, mobile, and no-JavaScript checks;
- URL-state round-trip and hostile-input tests;
- repository provenance and compatibility tests;
- production smoke tests against GitHub Pages.

Initial production budgets for the main workbench route:

- no icon font;
- no full UI framework runtime;
- essential JavaScript at or below 50 KB gzip;
- essential CSS at or below 50 KB gzip;
- useful HTML visible before JavaScript;
- no horizontal overflow at 320 pixels;
- no known moderate or higher dependency vulnerabilities.

## Delivery strategy

Implement in deployable vertical slices:

1. static renderer, localized shell, and SEO foundation;
2. Structured Workbench layout and system/Debian steps;
3. repository table, search, filters, audit details, and URL state;
4. review and export enhancements;
5. Proxmox VE, Proxmox Ceph, qualified Nextcloud result, and additional verified repositories;
6. accessibility, performance, documentation, and cleanup of the former Vue stack.

Each slice must pass the relevant tests, linting, type checks, security audit, production build, and live smoke check before deployment. During active implementation, publish a verified stable slice at least every 30 minutes when new verified work is available. Never deploy a known broken intermediate state merely to meet the interval.

## Acceptance criteria

- The five-step order and all current safe generation capabilities remain available.
- Primary content and canonical downloads work without JavaScript.
- The interface matches the approved Structured Workbench direction and is responsive and keyboard accessible.
- Vue, Vuetify, Vue I18n, and the MDI font are absent from production assets.
- Ten localized page families, SEO metadata, structured data, sitemap, and internal links are generated.
- Proxmox VE and Proxmox Ceph are represented accurately from official sources.
- Nextcloud is included only if it meets the repository policy, otherwise its verified rejection is documented.
- Accepted additional products meet the same provenance and test requirements.
- Main-route assets stay within the stated budgets.
- Existing security properties and generator behavior remain covered by automated tests.
- GitHub Pages serves each released slice successfully.
