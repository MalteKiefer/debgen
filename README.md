# DebGen

[![CI](https://github.com/MalteKiefer/debgen/actions/workflows/ci.yml/badge.svg)](https://github.com/MalteKiefer/debgen/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/MalteKiefer/debgen/actions/workflows/pages.yml/badge.svg)](https://github.com/MalteKiefer/debgen/actions/workflows/pages.yml)

DebGen is a client-side Debian repository workbench. It builds reviewable APT source files and installation commands from a checked-in catalog of official vendor and upstream repositories. It also publishes the same deterministic data through a versioned static API.

Use the hosted application at [maltekiefer.github.io/debgen](https://maltekiefer.github.io/debgen/). No configuration or product selection is sent to a server.

## Highlights

- Debian Trixie, Bookworm, Bullseye, Forky, and Sid profiles.
- DEB822 output everywhere, with legacy `.list` output only where Debian still requires it.
- Exactly 103 products backed by verified HTTPS APT repositories.
- Shared-source deduplication for product families such as Mullvad, HashiCorp, Grafana, Microsoft, Elastic, Adoptium, Corretto, Sublime, and 1Password.
- Multiple signing keys, release-scoped keys and locations, exact-path repositories, preference files, and auxiliary trust files.
- Per-source, combined, and category-grouped output modes.
- A direct Debian-only path when no additional software is needed.
- English, German, Spanish, French, Italian, Russian, Portuguese, Polish, Simplified Chinese, and Japanese.
- A deterministic, manifest-driven static API that works from the primary site, forks, and custom GitHub Pages paths.

## Architecture

DebGen keeps repository facts, generation, presentation, and publishing separate:

- `src/features/sources/` owns Debian release profiles, Debian source generation, downloads, and public manifest URL handling.
- `src/features/vendors/model.ts` defines the closed product, repository, trust, compatibility, and artifact contracts.
- `src/features/vendors/catalog.ts` contains selectable products; `src/features/vendors/sources.ts` contains shared repository and trust definitions.
- `src/features/vendors/compatibility.ts` evaluates release and architecture support before generation.
- `src/features/vendors/generate.ts` produces deterministic DEB822 sources, preference files, package commands, and reviewed setup scripts. Shared sources, keys, auxiliary files, preferences, and packages are deduplicated.
- `src/i18n/` contains the canonical locale schema, locale resolution, pluralization, and all visible interface messages.
- `src/components/` renders the accessible Workbench flow and local previews.
- `scripts/generate-api.ts` validates and writes the complete static API into a staging directory, then atomically replaces the published tree.

The application never fetches a vendor key or repository while rendering. Generated files are local until the user explicitly saves or copies them.

## Repository policy

The catalog snapshot contains 103 products and was verified on 2026-08-29. A product is admitted only when its repository is operated by the manufacturer or upstream project, or when an upstream project explicitly endorses the exact community source for a non-security-critical product.

The catalog rejects unendorsed mirrors, PPAs, standalone DEB downloads, Snap, Flatpak, AppImage, HTTP or unsigned repositories, `apt-key`, arbitrary filesystem destinations, and opaque remote setup scripts. Security-critical products cannot use community infrastructure. Support is classified conservatively as `explicit`, `generic-debian`, or `repository-only`; repository availability alone is never upgraded into a stronger vendor support claim.

Each source records its official documentation, locations, suites, components, architectures, signing-key URLs, keyring paths, published primary fingerprints, verification date, optional trust files, preference files, and warning keys. Products reference sources by stable `sourceId` and add their package set, category, support matrix, provenance, and product-specific warnings.

The full authoritative table and audit procedure are in [Catalog maintenance](docs/catalog-maintenance.md). Explicit exclusions are documented there as policy decisions, not silently replaced with less trustworthy sources.

## Supported Debian profiles

| Release | Debian status | Formats | Notes |
| --- | --- | --- | --- |
| Trixie | stable | DEB822 `.sources` | Stable security and updates are included. |
| Bookworm | oldstable / LTS | DEB822 `.sources`, legacy `.list` | Security and updates are included; backports ended on 2026-08-09. |
| Bullseye | oldoldstable / LTS | DEB822 `.sources`, legacy `.list` | LTS ends on 2026-08-31; no backports are generated. |
| Forky | testing | DEB822 `.sources` | Testing does not provide stable-level security support. |
| Sid | unstable | DEB822 `.sources` | Unstable does not provide stable-level security support. |

Debian archive entries use HTTPS and the archive keyring shipped by the selected Debian release. DebGen does not download, alter, or replace Debian trust keys.

## Languages

The interface supports ten locales: English (`en`), German (`de`), Spanish (`es`), French (`fr`), Italian (`it`), Russian (`ru`), Portuguese (`pt`), Polish (`pl`), Simplified Chinese (`zh-CN`), and Japanese (`ja`).

English is the canonical fallback. A saved language preference takes precedence over browser language detection. Region variants fall back to their supported base locale, supported Chinese variants map to Simplified Chinese, and unsupported values fall back to English. Russian and Polish use locale-correct plural categories.

All human-facing text belongs in locale modules. Repository IDs, package names, file names, commands, fingerprints, URLs, and generated source bytes remain language-neutral. See [Translation maintenance](docs/translations.md) for schema, fallback, review, and testing rules.

## Static API

The versioned API root is:

```text
https://maltekiefer.github.io/debgen/api/v1/
```

Its root manifest is `catalog.json`:

- `releases.json` lists Debian profiles and their manifest-relative files.
- `vendors.json` lists all 103 products, packages, presentation keys, source IDs, and compatible product aliases.
- `sources.json` lists unique repositories, keys, locations, support data, products, trust metadata, and canonical compatible artifacts.

Canonical Debian files remain at paths such as `trixie/debian.sources`. Existing product-compatible aliases remain stable:

```text
vendors/<product-id>/<release>/<architecture>/<product-id>.sources
vendors/<product-id>/<release>/<architecture>/install.sh
```

Source-aware clients should prefer canonical deduplicated resources:

```text
sources/<source-id>/<release>/<architecture>/<source-id>.sources
sources/<source-id>/<release>/<architecture>/<preference-id>.pref
sources/<source-id>/<release>/<architecture>/install.sh
```

The canonical source installer configures repository trust and updates the package index but does not install every product that happens to share the source. Product alias installers retain their single-product package behavior.

Every public `url` is relative to the manifest that contains it. Resolve it with `new URL(resource.url, manifestUrl)` instead of concatenating a hard-coded host. Incompatible release and architecture combinations are absent from both manifests and the filesystem. See [Static API](docs/api.md) for the full contract.

## Safe curl examples

Always save and inspect generated files before applying them. Do not pipe a remote script into a privileged shell.

Download and inspect the Debian Trixie profile:

```sh
api_root=https://maltekiefer.github.io/debgen/api/v1
curl -fsSLo /tmp/debian.sources "$api_root/trixie/debian.sources"
sed -n '1,220p' /tmp/debian.sources
sudo install -m 0644 /tmp/debian.sources /etc/apt/sources.list.d/debian.sources
```

Download and inspect an existing product-compatible alias:

```sh
api_root=https://maltekiefer.github.io/debgen/api/v1
curl -fsSLo /tmp/brave-browser.sources "$api_root/vendors/brave-browser/trixie/amd64/brave-browser.sources"
curl -fsSLo /tmp/brave-browser-install.sh "$api_root/vendors/brave-browser/trixie/amd64/install.sh"
sed -n '1,220p' /tmp/brave-browser.sources
sed -n '1,300p' /tmp/brave-browser-install.sh
bash -n /tmp/brave-browser-install.sh
chmod 0755 /tmp/brave-browser-install.sh
sudo /tmp/brave-browser-install.sh
```

Download a shared canonical source without duplicating the repository definition:

```sh
api_root=https://maltekiefer.github.io/debgen/api/v1
curl -fsSLo /tmp/mullvad.sources "$api_root/sources/mullvad/trixie/amd64/mullvad.sources"
curl -fsSLo /tmp/mullvad-repository-install.sh "$api_root/sources/mullvad/trixie/amd64/install.sh"
sed -n '1,220p' /tmp/mullvad.sources
sed -n '1,300p' /tmp/mullvad-repository-install.sh
bash -n /tmp/mullvad-repository-install.sh
```

Before running any installer, confirm the release, architecture, HTTPS endpoints, complete fingerprint set, destination paths, package names, warnings, and commands. Third-party repositories extend trust beyond Debian and can change independently.

## Local development

Use Node.js `>=24.15.0 <25` and the bundled npm version.

```sh
npm ci
npm run dev
```

Project commands:

- `npm run dev` - start the local Vite server.
- `npm run test` - run tests in watch mode.
- `npm run test:run` - run the test suite once.
- `npm run typecheck` - type-check application and build tooling.
- `npm run lint` - lint the repository.
- `npm run generate:api` - regenerate `public/api/v1/` atomically.
- `npm run build` - generate the API, type-check, and build `dist/`.
- `npm run check` - run tests, type-checking, linting, and the production build.
- `npm audit` - fail on every reported vulnerability.

Run `npm run check` and `npm audit` before submitting a change. CI and the Pages workflow use the same zero-tolerance audit command.

## Maintenance

- [Catalog maintenance](docs/catalog-maintenance.md) covers the source/product model, the 103-product matrix, admission policy, key rotation, fingerprints, compatibility, and repeatable vendor audits.
- [Translation maintenance](docs/translations.md) covers all ten locales, schema parity, fallback behavior, plural rules, and review checks.
- [Static API](docs/api.md) covers manifests, relative URL resolution, canonical sources, compatibility aliases, curl safety, and deterministic tree verification.

When updating a repository, re-check the official installation documentation, `Release` or `InRelease` metadata, package index, signing keys, published primary fingerprints, suite, components, package names, and architecture support. Keep shared trust definitions source-owned and product-specific packages or warnings product-owned.

## GitHub Pages

The Pages workflow runs for pushes to `master`. It installs locked dependencies, runs the full check and audit, derives the base path from `GITHUB_REPOSITORY`, builds the site, and deploys only after verification succeeds. Forks therefore publish under their own repository path without a hard-coded project name.

To enable a fork, open **Settings > Pages > Build and deployment** and select **GitHub Actions** as the source.
