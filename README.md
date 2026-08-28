# debgen

debgen is a client-side Debian repository source generator. It creates APT source configuration from a reviewed, built-in release catalog and publishes canonical configurations as static files.

## Requirements and development

Use Node.js `>=24.15.0 <25` and the npm version bundled with it.

```sh
npm ci
npm run dev
```

The available project commands are:

- `npm run dev` — start the local Vite development server.
- `npm run test` — run tests in watch mode.
- `npm run test:run` — run the test suite once.
- `npm run typecheck` — type-check the application and build tooling.
- `npm run lint` — lint the repository.
- `npm run generate:api` — regenerate the static API under `public/api/v1/`.
- `npm run build` — regenerate the API, type-check, and create the production site in `dist/`.
- `npm run check` — run tests, type-checking, linting, and a production build.
- `npm audit --audit-level=high` — fail on high- or critical-severity dependency advisories.

Run `npm run check` before submitting a change.

## Supported releases and formats

| Release | Debian status | Formats | Notes |
| --- | --- | --- | --- |
| Trixie | stable | DEB822 `.sources` | Includes stable security, updates, and optional backports. |
| Bookworm | oldstable / LTS | DEB822 `.sources`, legacy `.list` | Includes security and updates. Backports support ended on 2026-08-09 and is unavailable. |
| Bullseye | oldoldstable / LTS | DEB822 `.sources`, legacy `.list` | LTS ends 2026-08-31; includes security and updates, but not backports. |
| Forky | testing | DEB822 `.sources` | Does not provide stable-grade security support. |
| Sid | unstable | DEB822 `.sources` | Does not provide stable-grade security support. |

DEB822 is the preferred format. The legacy one-line format is deprecated and is provided only for Bookworm and Bullseye compatibility.

Every generated entry uses HTTPS and scopes archive verification to the keyring filename shipped by that Debian release (or the equivalent `signed-by` option in legacy output). Bookworm and Bullseye use `/usr/share/keyrings/debian-archive-keyring.gpg`; Trixie, Forky, and Sid use `/usr/share/keyrings/debian-archive-keyring.pgp`. Both files come from Debian's `debian-archive-keyring` package for the applicable release; debgen does not download, modify, or replace trust keys.

Generated configurations can change package sources on a system. Choose the release that matches the installed Debian version, review the selected components and suites, and inspect the complete output before installing it. Testing and unstable are rolling suites and do not provide stable-grade security support.

## Official third-party catalog

The built-in vendor catalog is a manually reviewed, static list. It contains only repositories operated by the named vendor or upstream project; it never uses PPAs, community mirrors, `apt-key`, unsigned sources, or a vendor setup script. Every catalog entry links to the vendor's installation documentation and has been verified on **2026-08-28**. A third-party repository extends the system's trust beyond Debian and can change independently, so always review the generated source and installation instructions before using them.

| Product | Compatible DebGen releases | Architectures / limitation |
| --- | --- | --- |
| Brave Browser | Trixie, Bookworm, Bullseye, Forky, Sid | amd64, arm64 |
| Mozilla Firefox | Trixie, Bookworm, Bullseye | amd64, arm64; Mozilla pinning is included |
| Google Chrome | Trixie, Bookworm, Bullseye, Forky, Sid | amd64 |
| Microsoft Edge | Trixie, Bookworm, Bullseye, Forky, Sid | amd64 |
| Vivaldi | Trixie, Forky, Sid | amd64, arm64; Debian 13 or newer |
| Opera | Trixie, Bookworm, Bullseye, Forky, Sid | amd64 |
| Signal Desktop | Trixie, Bookworm, Bullseye, Forky, Sid | amd64 |
| Proton VPN | Trixie | amd64, arm64; GNOME desktop only, not headless |
| Mullvad VPN | Trixie, Bookworm, Forky, Sid | amd64, arm64; Debian 12 or newer |
| Tor | Trixie, Bookworm, Bullseye | amd64, arm64; daemon/client, not Tor Browser |
| Docker Engine | Trixie, Bookworm, Bullseye | amd64, arm64, armhf; can affect firewall rules |
| Kubernetes tools v1.36 | Trixie, Bookworm, Bullseye, Forky, Sid | amd64, arm64; versioned `pkgs.k8s.io` channel |
| Google Cloud CLI | Trixie, Bookworm, Bullseye | amd64, arm64 |
| Microsoft Azure CLI | Bookworm, Bullseye | amd64, arm64; no verified Trixie suite |
| GitHub CLI | Trixie, Bookworm, Bullseye, Forky, Sid | amd64, arm64 |
| HashiCorp Terraform | Trixie, Bookworm, Bullseye | amd64, arm64 |
| PostgreSQL PGDG | Trixie, Bookworm, Bullseye, Forky, Sid | amd64, arm64; `<codename>-pgdg` suites |
| MongoDB Community 8.0 | Bookworm | amd64 only |
| Grafana | Trixie, Bookworm, Bullseye, Forky, Sid | amd64, arm64 |
| NVIDIA Container Toolkit | Trixie, Bookworm, Bullseye, Forky, Sid | amd64, arm64; supported NVIDIA GPU, driver, and runtime required |
| MariaDB Community 11.8 | Trixie, Bookworm, Bullseye, Sid | amd64, arm64; no vendor setup script |
| Redis Open Source | Trixie, Bookworm | amd64, arm64 |
| ClickHouse | Trixie, Bookworm, Bullseye, Forky, Sid | amd64, arm64; distribution-independent repository |
| InfluxDB 3 Core | Trixie, Bookworm, Forky, Sid | amd64, arm64; Debian 12 or newer |
| Zabbix 7.4 | Trixie, Bookworm, Bullseye | amd64, arm64 |

### Catalog maintenance

When updating the catalog, verify the current official installation documentation, repository `Release` or `InRelease` metadata, signing-key URL, suite, component, package name, and published architecture support. Keep versioned channels explicit: Kubernetes v1.36, MongoDB 8.0, MariaDB 11.8, and Zabbix 7.4 must never become an unbounded `latest` entry. Update the verification date, compatibility tests, and any vendor-published fingerprint at the same time. Remove or disable an entry when its official repository disappears; never substitute a different host.

## Static API

The public GitHub Pages API root is `https://maltekiefer.github.io/debgen/api/v1/`. Forks use their own Pages host and repository name. All published endpoints are static text or JSON:

- `https://maltekiefer.github.io/debgen/api/v1/releases.json`
- `https://maltekiefer.github.io/debgen/api/v1/trixie/debian.sources`
- `https://maltekiefer.github.io/debgen/api/v1/bookworm/debian.sources`
- `https://maltekiefer.github.io/debgen/api/v1/bookworm/debian.list`
- `https://maltekiefer.github.io/debgen/api/v1/bullseye/debian.sources`
- `https://maltekiefer.github.io/debgen/api/v1/bullseye/debian.list`
- `https://maltekiefer.github.io/debgen/api/v1/forky/debian.sources`
- `https://maltekiefer.github.io/debgen/api/v1/sid/debian.sources`

The manifest at `releases.json` reports the release status, supported formats, filenames, and manifest-relative URLs such as `trixie/debian.sources`. Resolve each `url` against the manifest URL itself; for example, `new URL(file.url, manifestUrl)` resolves beneath `/api/v1/` on both the primary site and forks.

### Installing a reviewed configuration

First fetch and inspect the file without elevated privileges:

```sh
curl -fsSL https://maltekiefer.github.io/debgen/api/v1/trixie/debian.sources
```

Only after confirming that the output matches the installed release and desired components, write it to APT's source directory:

```sh
curl -fsSL https://maltekiefer.github.io/debgen/api/v1/trixie/debian.sources \
  | sudo tee /etc/apt/sources.list.d/debian.sources >/dev/null
```

For a system that specifically requires the deprecated legacy format, inspect the legacy endpoint first, then use a `.list` destination:

```sh
curl -fsSL https://maltekiefer.github.io/debgen/api/v1/bookworm/debian.list
curl -fsSL https://maltekiefer.github.io/debgen/api/v1/bookworm/debian.list \
  | sudo tee /etc/apt/sources.list.d/debian.list >/dev/null
```

Back up or remove conflicting existing source definitions separately; these commands overwrite only the named destination file.

## GitHub Pages

The Pages workflow runs only for pushes to `master`. Its verification job installs locked dependencies, runs the complete check and security audit, derives the site base path from `GITHUB_REPOSITORY`, builds the site, and uploads `dist/`. The deployment job cannot run unless verification succeeds and deploys through the protected `github-pages` environment.

To enable deployment for a repository, open **Settings → Pages → Build and deployment** and select **GitHub Actions** as the source. No hard-coded repository name is needed in the workflow, so forks and renamed repositories build under their own `/<repository-name>/` base path.
