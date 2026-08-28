# DebGen Modernization Design

## Goal

Modernize DebGen from its unsupported Vue 2/Vue CLI foundation to a current, secure, tested Vue application and restore deployment through GitHub Pages. The application must generate correct APT source configurations for every Debian release that is current on 2026-08-28 and expose canonical files at stable URLs for command-line use.

## Scope

- Replace Vue 2, Vue CLI, Vuetify 2, Babel, Yarn Classic, and the legacy lint setup.
- Use current stable Vue 3, TypeScript, Composition API, Vite, Vuetify, Vitest, Vue Test Utils, and ESLint releases that are mutually compatible.
- Preserve the generator's purpose and recognizable interaction model while modernizing usability, accessibility, responsiveness, and error handling.
- Generate modern DEB822 `.sources` files for all supported releases.
- Generate legacy one-line `.list` files for Bookworm and Bullseye as an explicit compatibility option.
- Publish canonical generated files through a versioned static API suitable for `curl`.
- Deploy the verified production build to GitHub Pages from GitHub Actions.
- Remove obsolete, insecure, broken, or unverifiable repository definitions and instructions.

## Supported Debian Releases

The release catalog is codename-based to prevent an alias such as `stable` or `testing` from causing an unexpected full distribution upgrade.

| Codename | Status on 2026-08-28 | DEB822 | Legacy one-line |
| --- | --- | --- | --- |
| trixie | stable | yes | no |
| bookworm | oldstable / LTS | yes | yes |
| bullseye | oldoldstable / LTS until 2026-08-31 | yes | yes |
| forky | testing | yes | no |
| sid | unstable | yes | no |

Historic releases that require `archive.debian.org` are outside the current-release selector. They must not be presented as current or silently use dead standard mirrors.

## Application Architecture

The application remains a static single-page application. It uses Vue 3 Single-File Components with TypeScript and the Composition API, built by Vite. Vuetify supplies accessible, responsive UI components.

There is one application view, so Vue Router is removed. Data is bundled and imported locally, so Axios and runtime downloads from the repository's `master` branch are removed. This eliminates unnecessary dependencies and makes a deployed build deterministic.

The implementation is divided into independently testable units:

- a typed Debian release and repository catalog;
- pure source-generation functions for DEB822 and legacy formats;
- validation for release capabilities, selected suites, components, and third-party definitions;
- focused Vue components for configuration, repository selection, output, copying, and downloading;
- a build-time static API generator that calls the same source-generation functions.

No state-management library is introduced because the application state is local and small.

## Official Source Generation

DEB822 output uses `/etc/apt/sources.list.d/debian.sources` and emits only fields applicable to the selected release:

- `Types: deb` or `Types: deb deb-src`;
- HTTPS `URIs` for Debian and Debian Security services;
- codename-based `Suites`;
- selected `Components`;
- `Signed-By` pointing at the Debian archive keyring filename shipped by the selected release: `.gpg` for Bookworm and Bullseye, `.pgp` for Trixie, Forky, and Sid.

`main` is always enabled. `contrib` and `non-free` are optional. `non-free-firmware` is separately selectable where the release provides it and is offered by default from Bookworm onward.

Security, updates, and backports are capability-driven rather than produced from string concatenation. Only Trixie offers supported backports; Bookworm Backports support ended on 2026-08-09. Sid has no security, updates, or backports stanza. Testing only receives suites that officially exist and are supported. The catalog explicitly records these differences so invalid combinations cannot be generated.

Legacy output uses the one-line syntax only for Bookworm and Bullseye. It carries the equivalent suite, component, source-package, and `signed-by` semantics and is clearly labeled deprecated compatibility output.

## Third-Party Repositories

Third-party definitions are typed data. Each retained entry must have a verified HTTPS repository, explicit supported Debian codenames, a dedicated keyring path, and safe installation guidance. The application must never emit `apt-key`, unauthenticated HTTP repositories, or commands that pipe a remote script directly into a privileged shell.

Entries that cannot be verified as current are removed rather than presented with a misleading guarantee. Third-party stanzas are separated from the official `debian.sources` content and receive their own suggested filename.

## Static Download API

GitHub Pages has no dynamic server. DebGen therefore publishes canonical, pre-generated profiles from the same tested generator used by the UI:

```text
/api/v1/releases.json
/api/v1/trixie/debian.sources
/api/v1/bookworm/debian.sources
/api/v1/bookworm/debian.list
/api/v1/bullseye/debian.sources
/api/v1/bullseye/debian.list
/api/v1/forky/debian.sources
/api/v1/sid/debian.sources
```

Canonical profiles enable binary packages, supported standard updates and security suites, and the recommended components for the release. Trixie backports remain opt-in in the interactive generator and are not silently enabled in canonical profiles.

The versioned `releases.json` manifest describes each profile, its status, format, target filename, and manifest-relative URL such as `trixie/debian.sources`. Resolving a file URL against the manifest URL must point to the sibling profile under `/api/v1/`. API output is deterministic and receives snapshot and semantic tests.

A documented console example is:

```sh
curl -fsSL https://maltekiefer.github.io/debgen/api/v1/trixie/debian.sources \
  | sudo tee /etc/apt/sources.list.d/debian.sources >/dev/null
```

## User Experience and Error Handling

The application defaults to Trixie and the modern DEB822 format. Controls that do not apply to a release are disabled with an explanation rather than producing empty fields. Generated output can be copied or downloaded with the correct filename.

Invalid catalog data fails validation during tests and builds. Runtime copy/download failures produce visible, actionable messages. External links opened in a new tab use safe opener isolation. Loading no longer depends on remote GitHub raw-content availability.

## Testing and Quality Gates

Development follows test-driven changes. Tests cover:

- all supported release profiles;
- release-compatible Debian archive keyring filenames;
- permitted and forbidden suite combinations;
- component availability, including `non-free-firmware`;
- binary-only and binary-plus-source output;
- DEB822 syntax and stanza separation;
- Bookworm and Bullseye legacy output;
- canonical static API files and manifest;
- UI selection, validation, copy, download, and error behavior.

Completion requires fresh successful runs of dependency installation, unit/component tests, type checking, ESLint, production build, generated-file validation, and dependency audit. Build output and asset sizes are inspected for regressions.

## Continuous Integration and Deployment

GitHub Actions runs verification on pushes and pull requests. A separate Pages deployment job builds from the default branch, uploads the Vite artifact, and deploys it using GitHub's official Pages actions and permissions. Workflow actions are pinned to immutable commit SHAs with readable version comments, and Dependabot checks GitHub Actions weekly.

Vite receives the repository base path for production while local development continues at `/`. The workflow pins the supported Node major and uses a committed lockfile with a frozen install.

## Documentation

The README documents prerequisites, installation, development, verification, build, GitHub Pages activation, supported Debian releases, output formats, static API stability, and copy-paste `curl` examples. It also states that users must review generated repositories before applying them and that testing/unstable can introduce breaking package changes.

## Out of Scope

- A dynamic backend or arbitrary query-parameter API.
- User accounts, stored configurations, analytics, or telemetry.
- Automatic privileged modification of a user's machine.
- Claiming support for archived Debian releases through normal mirrors.
- Retaining unverified third-party repositories merely for compatibility.

## Success Criteria

- The project installs without engine overrides on its declared Node versions.
- No Vue 2, Vue CLI, Vuetify 2, Babel, Yarn Classic, Axios, or unnecessary router dependency remains.
- All quality gates pass without errors or deprecation warnings owned by the project.
- The UI generates valid, release-appropriate APT configuration.
- Every documented static API URL is present in the production artifact and matches generator output.
- GitHub Actions can verify and deploy the site to GitHub Pages.
