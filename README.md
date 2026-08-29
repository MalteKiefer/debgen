# DebGen

[![CI](https://github.com/MalteKiefer/debgen/actions/workflows/ci.yml/badge.svg)](https://github.com/MalteKiefer/debgen/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/MalteKiefer/debgen/actions/workflows/pages.yml/badge.svg)](https://github.com/MalteKiefer/debgen/actions/workflows/pages.yml)

A Debian sources list generator. Pick a release, pick your repos, get reviewed DEB822 `.sources` files, signing keys, and install scripts. No blind `curl | sudo bash`, ever.

**Live at [debgen.org](https://debgen.org/)** (mirror: [maltekiefer.github.io/debgen](https://maltekiefer.github.io/debgen/)). Runs entirely client-side, nothing you configure leaves your browser.

## What's in the box

- Trixie, Bookworm, Bullseye, Forky, Sid, DEB822 everywhere
- 103 verified vendor repos: manufacturer-operated or explicitly upstream-endorsed only, no PPAs, no unsigned mirrors, no `apt-key`
- Every signing key `Signed-By` pinned to its own keyring, fingerprints checked before you trust anything
- A versioned static API at `/api/v1/`, same deterministic data the UI runs on
- Ten languages, dark terminal UI, keyboard and vim navigation, works without JavaScript

## Quick curl

```sh
api=https://debgen.org/api/v1
curl -fsSLo /tmp/debian.sources "$api/trixie/debian.sources"
sed -n '1,50p' /tmp/debian.sources   # read it first, always
sudo install -m 0644 /tmp/debian.sources /etc/apt/sources.list.d/
```

## Repository policy

Manufacturer-operated or explicitly upstream-endorsed sources only. No PPAs, no Snap/Flatpak/AppImage, no unsigned HTTP repos, no security-critical product on community infrastructure. Full matrix, admission rules, and audit trail in [catalog maintenance](docs/catalog-maintenance.md).

## Local dev

```sh
npm ci
npm run dev      # local Vite server
npm run check    # tests, typecheck, lint, build
```

Node `>=24.15.0 <25`.

## Docs

- [Catalog maintenance](docs/catalog-maintenance.md) — product matrix, admission policy, key rotation, vendor audits
- [Translations](docs/translations.md) — locale schema, fallback, plural rules
- [Static API](docs/api.md) — manifests, canonical sources, curl safety, relative URL resolution

## GitHub Pages

Deploys on push to `master` via Actions. Base path comes from `configure-pages`, so it works for the custom domain and for forks alike, no hard-coded repo name. To enable on a fork: **Settings > Pages > Build and deployment > GitHub Actions**.
