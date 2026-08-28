# Debian Studio and Official Third-Party Repositories Design

**Date:** 2026-08-28  
**Status:** Approved for implementation  
**Target:** DebGen Vue application, static API, and GitHub Pages deployment

## Objective

Transform DebGen into a polished, Debian-inspired repository studio and add a curated catalog of 25 widely used products backed exclusively by official, vendor-operated APT repositories. Users can combine Debian base sources with compatible vendor sources, split the result into maintainable files, inspect every generated artifact, and retrieve stable outputs through the browser or `curl`.

## Product Principles

- Prefer safety and clarity over maximizing the number of selectable entries.
- Never use PPAs, community mirrors, `apt-key`, unsigned repositories, or undocumented third-party repackaging.
- Treat the catalog as curated data checked into the repository; do not scrape vendor sites in the browser or during a production build.
- Generate the UI, downloads, installation instructions, and static API from the same typed catalog and pure functions.
- Never silently claim compatibility. An unsupported Debian release or architecture disables the product and explains why.
- Preserve the existing five Debian profiles: Trixie, Bookworm, Bullseye, Forky, and Sid.

## Curated Catalog

The initial catalog contains these 25 products. Each definition records its official documentation URL, repository and key URLs, package names, category, supported architectures, compatible Debian releases, suite strategy, components, keyring path, optional preference files, and any required warning.

| # | Category | Product | Compatibility policy |
|---:|---|---|---|
| 1 | Browser | Brave Browser | Official stable channel; amd64 and arm64; only releases satisfying Brave's current Linux requirements |
| 2 | Browser | Mozilla Firefox | Mozilla APT channel; Trixie uses DEB822, older supported releases may use the documented legacy form; include Mozilla pinning |
| 3 | Browser | Google Chrome | Official Google Linux repository; supported 64-bit architectures only |
| 4 | Browser | Microsoft Edge | Official Microsoft Edge repository; amd64 only |
| 5 | Browser | Vivaldi | Official Vivaldi archive; Debian 13 and later; amd64 and arm64 |
| 6 | Browser | Opera | Official Opera Debian repository; supported 64-bit architectures only |
| 7 | Communication | Signal Desktop | Official Signal Desktop channel; 64-bit Debian-based systems only |
| 8 | Privacy | Proton VPN | Official stable channel; only currently supported stable Debian releases and architectures; display the documented desktop-environment limitation |
| 9 | Privacy | Mullvad VPN | Official stable Mullvad repository; Debian 12 and later; supported architectures only |
| 10 | Privacy | Tor | Official Tor Project repository; amd64 and arm64; label explicitly as Tor daemon/client, not Tor Browser |
| 11 | Containers | Docker Engine | Trixie, Bookworm, and Bullseye; vendor-supported architectures; show Docker firewall warning |
| 12 | Containers | Kubernetes tools | Official `pkgs.k8s.io`; selected stable Kubernetes minor channel; supported architectures only |
| 13 | Cloud | Google Cloud CLI | Official `cloud-sdk` repository; architectures published by the vendor |
| 14 | Cloud | Microsoft Azure CLI | Bookworm and Bullseye only until Microsoft publishes a verified Trixie suite |
| 15 | Development | GitHub CLI | Official stable GitHub CLI channel and vendor keyring |
| 16 | Development | HashiCorp Terraform | Trixie, Bookworm, and Bullseye; official HashiCorp stable channel |
| 17 | Database | PostgreSQL PGDG | All five DebGen releases using `<codename>-pgdg`; architectures published for each suite |
| 18 | Database | MongoDB Community 8.0 | Only vendor-documented Debian releases and architectures; product major version remains explicit |
| 19 | Monitoring | Grafana | Official stable Grafana channel; published repository architectures |
| 20 | Containers | NVIDIA Container Toolkit | Official stable architecture-specific channel; visibly requires a supported NVIDIA GPU setup |
| 21 | Database | MariaDB Community 11.8 | Versioned official channel; Trixie, Bookworm, Bullseye, and Sid where published; never run the vendor setup script |
| 22 | Database | Redis Open Source | Bookworm and Trixie, matching Redis' current tested-platform policy |
| 23 | Database | ClickHouse | Official stable channel; amd64 and arm64; display that the repository is distribution-independent |
| 24 | Monitoring | InfluxDB 3 Core | Official stable channel; amd64 and arm64; Debian 12 or later |
| 25 | Monitoring | Zabbix 7.4 | Trixie, Bookworm, and Bullseye with the architectures published for each suite |

Versioned vendor products use explicit catalog versions rather than an unbounded `latest` placeholder. Updating Kubernetes, MongoDB, MariaDB, or Zabbix requires a catalog change, tests, and renewed verification of the official repository metadata.

## Source Verification Policy

Every product definition must link to current official documentation on a vendor or upstream-project domain. Repository and signing-key hosts must be either that official domain or a host explicitly named by that documentation. A build-time catalog validator rejects:

- duplicate IDs, filenames, or keyring paths;
- non-HTTPS repository, key, or documentation URLs;
- empty package, suite, component, or architecture sets;
- unknown Debian codenames;
- missing source citations or verification dates;
- keyring paths outside `/etc/apt/keyrings` or `/usr/share/keyrings`;
- shell substitutions that are not selected from a closed, tested set;
- products without at least one compatible DebGen release and architecture.

The catalog records `verifiedAt: '2026-08-28'`. Documentation changes after that date require re-verification before catalog values are altered.

## Architecture

### Domain model

Create a focused `src/features/vendors/` feature with:

- `model.ts` for product, repository, compatibility, output-mode, generated-file, and validation types;
- `catalog.ts` for the 25 immutable product definitions;
- `compatibility.ts` for release and architecture filtering with human-readable reasons;
- `validate.ts` for strict catalog invariants;
- `generate.ts` for DEB822 sources, optional preference files, key-install commands, and package-install commands;
- `group.ts` for deterministic file grouping;
- colocated tests for each behavior.

Existing Debian source generation remains in `src/features/sources/`. A small composition layer combines Debian and vendor artifacts without teaching the Debian generator about individual vendors.

### Output modes

Expose three modes:

1. `perVendor` — default. Produce `debian.sources` plus one predictably named `.sources` file per vendor, separate preference files where required, and a single reviewed installation script.
2. `combined` — produce one combined `.sources` file only where all selected entries can be represented safely in DEB822; keys remain separate.
3. `byCategory` — produce Debian base sources plus `browser.sources`, `privacy.sources`, `development.sources`, `cloud.sources`, `containers.sources`, `database.sources`, and `monitoring.sources` as required by the selection.

Legacy `.list` output remains available only for the existing Debian releases that already support it. New vendor repositories always use DEB822 `.sources` output. This avoids extending deprecated syntax while preserving backward compatibility for Debian base lists.

Generated filenames use lowercase ASCII slugs and are stable API identifiers. File ordering is Debian base first, then category, product name, and auxiliary files. Content always has exactly one trailing newline.

### Installation bundle

The generated shell instructions are a reviewable script, not an opaque `curl | sh` pipeline. It must:

- enable strict shell error handling;
- install `ca-certificates`, `curl`, and `gpg` when required;
- create `/etc/apt/keyrings` with safe permissions;
- download every vendor key from HTTPS to a temporary file;
- verify documented fingerprints when the vendor publishes them;
- dearmor only when the source key format requires it;
- install each key and source file under deterministic paths;
- run `apt-get update` once after all sources are installed;
- offer the selected package installation as a separate, visible command.

The UI warns users to inspect commands and files before running them. Products with material operational effects, including Docker firewall behavior and NVIDIA prerequisites, show product-specific warnings before generation.

## User Experience: Debian Studio

The chosen visual direction is **Debian Studio**:

- a dark warm shell using near-black aubergine tones;
- a bright, high-contrast work surface;
- Debian red used for progress, selection, primary actions, and focus accents;
- restrained gradients, soft depth, rounded panels, and short motion;
- Material Design Icons for actions, status, categories, files, architecture, safety, and navigation;
- product marks only where licensing and repository-hosting constraints permit; otherwise use consistent category icons and product initials.

The page becomes a three-step studio:

1. **Debian system:** release, architecture, format, components, source packages, security, updates, and backports.
2. **Official software:** searchable and filterable product-card grid with categories, compatibility state, vendor badge, architecture information, and selection controls.
3. **Review and export:** selected-product summary, output-mode choice, generated-file navigator, syntax preview, copy/download actions, installation instructions, and warnings.

A persistent summary shows the current release, architecture, selected repository count, and output mode. Desktop uses a generous two-column workspace where helpful; mobile becomes a linear flow with a sticky bottom action. The interface remains keyboard navigable, uses visible focus, meaningful landmarks, live status regions, sufficient contrast, touch targets of at least 44 pixels, and `prefers-reduced-motion` support.

All user-facing copy is German. Repository field names, package names, commands, filenames, and upstream product names remain technically exact.

## UI Components

Keep components small and responsibility-driven:

- `StudioHeader.vue` — brand, project links, and compact trust statement;
- `StudioProgress.vue` — accessible three-step progress navigation;
- `SystemStep.vue` — wraps and visually refreshes existing Debian controls;
- `VendorStep.vue` — search, category filters, selected count, and product grid;
- `VendorCard.vue` — one product's selection, compatibility, metadata, and warning affordance;
- `ReviewStep.vue` — grouping control, selected products, warnings, and generated files;
- `GeneratedFileTabs.vue` — individual file navigation, copy, and download;
- `InstallCommands.vue` — key/source/package commands with explicit copy controls;
- `SelectionSummary.vue` — persistent desktop summary and mobile action bar.

The top-level generator owns wizard state and delegates pure generation to feature modules. No component contains vendor-specific repository strings.

## Static API

Extend the generated API without breaking existing `/api/v1/<release>/debian.sources` and manifest URLs.

New canonical endpoints:

- `/api/v1/vendors.json` — catalog metadata, compatibility, documentation sources, and verification date;
- `/api/v1/vendors/<product-id>/<release>/<architecture>/<product-id>.sources` — canonical individual source file when compatible;
- `/api/v1/vendors/<product-id>/<release>/<architecture>/install.sh` — reviewed setup script for that single product;
- `/api/v1/catalog.json` — top-level manifest linking Debian releases and vendor resources.

Incompatible combinations are absent from the generated manifest and filesystem. Static API generation fails atomically if any catalog entry or generated artifact is invalid. API content is deterministic and sorted.

## State and Data Flow

The selected Debian release and architecture feed compatibility filtering. A product can be selected only when compatible. Changing either system value automatically removes newly incompatible selections and presents one concise status message naming what changed. Search and category filters never mutate selection.

Generation consumes an immutable configuration object containing Debian options, architecture, selected product IDs, and output mode. It returns a list of typed artifacts with filename, media type, description, content, category, and risk notes. UI previews and downloads consume that list directly; the static API generator invokes the same product generators with canonical configurations.

## Error Handling

- Invalid catalogs stop tests and production builds with product-specific messages.
- Unsupported combinations are disabled before generation and are rejected again by pure generator functions.
- Copy and download failures retain the current preview and provide a manual fallback.
- Empty vendor selection remains valid and produces only Debian sources.
- A product whose official repository disappears is removed or disabled in a catalog maintenance change; the app never falls back to another host.
- Browser rendering never fetches vendor keys or repositories, preventing CORS behavior and vendor uptime from affecting the UI.

## Testing and Verification

Follow red-green-refactor for production behavior. Required coverage includes:

- schema and invariant tests for all 25 products;
- exact compatibility matrices for every product, release, and supported architecture;
- snapshot and semantic tests for DEB822 output, key paths, fingerprints, shell quoting, package commands, ordering, and trailing newlines;
- grouping tests for `perVendor`, `combined`, and `byCategory`;
- API tests asserting that every manifest URL exists and every incompatible combination is absent;
- component tests for search, category filters, product selection, disabled reasons, selection cleanup after a release change, wizard navigation, output modes, previews, copy, and download;
- accessibility assertions for names, roles, focus order, live regions, disabled explanations, and reduced-motion CSS;
- responsive browser checks at representative mobile and desktop sizes;
- complete `npm run check` and `npm audit` runs;
- production-build inspection and live HTTP checks after GitHub Pages deployment.

## Documentation

Update the README with:

- the catalog's official-only policy and verification date;
- the exact 25 products and compatibility constraints;
- output mode explanations;
- safe installation examples that save and inspect scripts before execution;
- new static API endpoints and `curl` examples;
- a maintenance checklist for keys, fingerprints, product versions, suites, and architectures;
- explicit warnings that third-party repositories extend trust beyond Debian and may change independently.

## Delivery

Implementation occurs on an isolated feature branch with neutral commit messages. After tests, type checking, linting, dependency audit, production build, and final code review pass, merge to `master`, push to GitHub, wait for both CI and GitHub Pages deployment, and verify the live site plus representative vendor API endpoints. The delivered release is complete only when the newest `master` commit is publicly served by GitHub Pages.

## Out of Scope

- PPAs, community repositories, unofficial mirrors, Flatpak, Snap, AppImage, and direct standalone `.deb` downloads;
- automatic remote scraping or background refreshes;
- executing installation commands from the browser;
- custom user-entered repositories;
- beta, nightly, testing, or unstable vendor channels unless a named product's stable delivery model itself requires a versioned channel;
- guaranteeing vendor support beyond the recorded verification date.
