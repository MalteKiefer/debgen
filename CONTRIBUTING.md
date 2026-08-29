# Contributing to DebGen

Thanks for helping improve DebGen. Contributions should keep generated APT configuration reviewable, deterministic, and conservative about repository trust.

## Before you begin

- Search existing [issues](https://github.com/MalteKiefer/debgen/issues) and pull requests before opening a new one.
- Use the supported Node.js version from `package.json` and install locked dependencies with `npm ci`.
- Keep each pull request focused. Explain user-visible behavior, data changes, and any compatibility impact.
- Do not include secrets, private keys, access tokens, or personal data in issues, commits, fixtures, or pull requests.

## Local checks

Run the complete verification suite before requesting review:

```sh
npm run check
npm audit
```

`npm run check` runs the tests, type checks, linting, API generation, and production build. Use `npm run test` while iterating on tests.

## Code and interface changes

Add or update focused tests with behavior changes. Keep generated output deterministic and do not hand-edit `public/api/v1/`; the build regenerates it from the catalog. For visible interface text, update the English schema and every supported locale as described in [Translation maintenance](docs/translations.md).

Accessibility matters: preserve keyboard access, useful labels, focus behavior, and readable error states. Keep technical values such as package names, URLs, fingerprints, paths, and commands exact.

## Catalog changes

Repository catalog changes require more evidence than a successful install. Follow the [catalog maintenance guide](docs/catalog-maintenance.md) and record the official documentation, provenance, supported releases and architectures, source locations, signing-key details, published primary fingerprints, package names, and verification date.

Do not add an unendorsed mirror, PPA, standalone package download, HTTP repository, unsigned repository, `apt-key`, opaque remote setup script, Snap, Flatpak, or AppImage. Security-critical products must use manufacturer or upstream infrastructure. Keep shared source and trust data source-owned, and product-specific package choices and warnings product-owned.

When changing a source, key, location, or package matrix, include the reason and the official evidence in the pull request description. Exercise the affected release and architecture combinations and confirm that incompatible artifacts are absent.

## Pull requests

Use the pull request template. A maintainer may ask for a smaller change, additional tests, a catalog re-audit, or wording changes before merging. By contributing, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security reports

Do not disclose a security vulnerability in a public issue. Follow [SECURITY.md](SECURITY.md) instead.
