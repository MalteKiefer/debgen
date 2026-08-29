# Static API

The public API is static and language-neutral. The primary GitHub Pages origin is `https://maltekiefer.github.io/debgen/api/v1/`; a fork has its own Pages origin and repository path. Consumers must resolve every manifest `url` relative to the manifest URL, not concatenate a hard-coded host. This keeps direct downloads correct for the primary site, forks, custom Pages paths, and local previews.

## Manifests and Debian files

`catalog.json` is the root manifest. It links to `releases.json` and `vendors.json`. The Debian release manifest lists only the files available for each release:

- `releases.json`
- `vendors.json`
- `sources.json` in the source-aware API
- `trixie/debian.sources`
- `bookworm/debian.sources` and `bookworm/debian.list`
- `bullseye/debian.sources` and `bullseye/debian.list`
- `forky/debian.sources`
- `sid/debian.sources`

`releases.json` URLs such as `trixie/debian.sources` are relative to `https://maltekiefer.github.io/debgen/api/v1/releases.json`. A client can resolve one safely with `new URL(file.url, manifestUrl)`. A valid manifest path is lowercase ASCII, contains no query, fragment, traversal, or absolute URL, and resolves directly beneath the manifest directory.

`vendors.json` remains the product manifest. It contains stable product IDs, names, categories, nullable `sourceId`, package arrays, documentation URLs, verification dates, presentation keys, and only compatible release and architecture resources. Debian-native `nodejs` and `libreoffice` have `sourceId: null` and package metadata only. They intentionally have no third-party `.sources` or repository install script.

## Compatibility aliases and canonical source endpoints

The existing product endpoints are backward-compatible aliases. For a compatible third-party product, this form remains valid:

```
vendors/<product-id>/<release>/<architecture>/<product-id>.sources
vendors/<product-id>/<release>/<architecture>/install.sh
```

For example, the current compatibility alias for Brave on Trixie amd64 is:

```
vendors/brave-browser/trixie/amd64/brave-browser.sources
vendors/brave-browser/trixie/amd64/install.sh
```

The source-aware API adds the canonical deduplicated source artifact:

```
sources/<source-id>/<release>/<architecture>/<source-id>.sources
```

For a shared source, consumers should prefer the canonical source endpoint. For example, all compatible `mullvad-vpn` and `mullvad-browser` selections map to `sources/mullvad/<release>/<architecture>/mullvad.sources`; HashiCorp products map to `sources/hashicorp/.../hashicorp.sources`; Grafana products map to `sources/grafana/.../grafana.sources`; Microsoft products map to `sources/microsoft-prod/.../microsoft-prod.sources`; and Elastic products map to `sources/elastic-9/.../elastic-9.sources`. Product aliases remain available so existing clients do not break.

`sources.json` is the source-aware manifest. It lists each unique source, its keys, locations, support levels, verification date, associated products, warnings, auxiliary trust files, preference files, and compatible canonical artifacts. It is the correct input for a client that wants deduplication.

Both manifests omit incompatible combinations, and generation must not create their files. Do not guess a URL from a product's declared matrix: resolve a manifest URL and fetch only a listed resource.

## Curl: save, inspect, then apply

Use a URL resolved from a manifest. These commands use the primary Pages endpoint solely as a concrete example; a manifest-derived URL is the portable form.

```sh
api_root=https://maltekiefer.github.io/debgen/api/v1
curl -fsSLo /tmp/debian.sources "$api_root/trixie/debian.sources"
sed -n '1,220p' /tmp/debian.sources
sudo install -m 0644 /tmp/debian.sources /etc/apt/sources.list.d/debian.sources
```

For a current product-compatible alias, save and inspect both the source and reviewed installer before any privileged action:

```sh
api_root=https://maltekiefer.github.io/debgen/api/v1
curl -fsSLo /tmp/brave-browser.sources "$api_root/vendors/brave-browser/trixie/amd64/brave-browser.sources"
curl -fsSLo /tmp/brave-browser-install.sh "$api_root/vendors/brave-browser/trixie/amd64/install.sh"
sed -n '1,220p' /tmp/brave-browser.sources
sed -n '1,260p' /tmp/brave-browser-install.sh
bash -n /tmp/brave-browser-install.sh
chmod 0755 /tmp/brave-browser-install.sh
sudo /tmp/brave-browser-install.sh
```

Never recommend `curl | sudo sh`, `curl | bash`, or an opaque vendor setup script. Review the release, architecture, key URL, full fingerprint set, destination paths, package names, and commands first.

## Debian-only skip flow

The Studio can go directly from System to Output. It leaves the product selection empty, produces only the Debian base artifacts, moves focus to the Output heading, and offers a return action to add software. The same direct Debian `curl` command is visible in this state. It does not create an empty vendor source, key, auxiliary file, preference, or third-party install script.

## API maintenance checks

Run `npm run generate:api` through the build, then verify the output twice for deterministic trees. Check that every manifest URL passes safe relative resolution and exists, every compatible source or alias artifact exists, every incompatible artifact is absent, aliases match their canonical source output, and native entries contain packages without repository artifacts. Keep API output language-neutral: use stable presentation keys, not translated prose.
