# Debian Workbench Catalog and Internationalization Expansion

**Date:** 2026-08-29  
**Status:** Approved design, pending written specification review  
**Target:** DebGen Vue application, static API, documentation, and GitHub Pages

## Objective

Evolve DebGen from a one product per repository catalog into a repository source and product model, expand the catalog from 25 to exactly 100 major Linux products, provide the complete interface in ten languages, make direct `curl` retrieval visible for every generated configuration, and refine the interface into the approved Debian Workbench design.

The release must preserve every existing Debian and vendor API URL while adding new product and source metadata. It must remain a static application with deterministic build time output.

## Non Negotiable Product Rules

- Repositories operated by the manufacturer or upstream project are the default and preferred source.
- A community operated repository is eligible only when the manufacturer or upstream project explicitly recommends that exact repository, the product is not security critical, and the UI and API label the source `community-endorsed`.
- Security critical products may use only manufacturer operated or upstream project operated repositories. They never fall back to community infrastructure.
- Debian native products are eligible without an additional repository and are labeled `debian-native`. They generate package selections but no redundant source or key artifact.
- PPAs, unendorsed community mirrors, direct standalone DEB downloads, Snap, Flatpak, AppImage, HTTP repositories, and opaque remote setup scripts are excluded.
- Repository configuration uses HTTPS, DEB822, separate keyrings, `Signed-By`, and every full fingerprint explicitly published by the manufacturer.
- Fingerprints derived only from a downloaded key may be recorded as audit evidence but are not treated as manufacturer published pins.
- Compatibility uses the intersection of the official support statement and actual repository package availability.
- Technical availability without an explicit release statement is labeled `generic-debian` or `repository-only` instead of being presented as explicit vendor support.
- The UI distinguishes selected products from the smaller number of unique repository sources.

## Repository and Product Architecture

Replace the one to one `VendorProduct` repository model with two immutable entities.

### RepositorySource

```ts
interface RepositorySource {
  readonly id: string
  readonly name: string
  readonly documentationUrl: string
  readonly verifiedAt: '2026-08-29'
  readonly locations: readonly RepositoryLocation[]
  readonly keys: readonly RepositoryKey[]
  readonly auxiliaryTrustFiles: readonly AuxiliaryTrustFile[]
  readonly preferenceFiles: readonly PreferenceFileDefinition[]
  readonly warnings: readonly WarningKey[]
}
```

`RepositoryLocation` supports:

- release and architecture scoped URIs;
- generic and codename based suites;
- arbitrary exact path suites such as `/`, `apt/stable/`, and `binary/` with no components;
- versioned components such as `stable/v18`;
- closed architecture sets;
- explicit support levels: `explicit`, `generic-debian`, or `repository-only`.

`RepositoryKey` supports multiple keys, release scoped key URLs, a shared deterministic keyring path, key format, and zero or more manufacturer published full fingerprints. Multiple products may reference the same source and keyring without duplication.

`AuxiliaryTrustFile` supports HTTPS downloaded, deterministic files required by a manufacturer. The first required use is the 1Password `debsig-verify` policy and its separate debsig keyring. Every auxiliary file has a fixed destination allowlist, expected media type, and optional published fingerprint. Arbitrary destinations are rejected.

### VendorProduct

```ts
interface VendorProduct {
  readonly id: string
  readonly sourceId: string | null
  readonly name: string
  readonly category: VendorCategory
  readonly icon: MdiIconName
  readonly packages: readonly string[]
  readonly supportedReleases: readonly ReleaseCodename[]
  readonly supportedArchitectures: readonly SystemArchitecture[]
  readonly supportLevel: 'explicit' | 'generic-debian' | 'repository-only'
  readonly provenance: 'manufacturer' | 'upstream' | 'community-endorsed' | 'debian-native'
  readonly securityCritical: boolean
  readonly warningKeys: readonly WarningKey[]
}
```

Products are selectable cards. Sources are generated artifacts. A null `sourceId` is valid only for `debian-native` products. Selecting multiple products with the same non-null `sourceId` generates one source, downloads each key once, installs each auxiliary trust file once, deduplicates package names, and preserves every relevant warning.

Validators reject unknown source references, duplicate product IDs, duplicate package names within a product, unsafe URLs or destinations, incomplete release mappings, unsupported exact path combinations, conflicting key definitions, and sources without a selectable product.

## Existing Product Migration

The current 25 products migrate without changing their public product IDs or existing static API endpoints. Sources that already serve several products become shared groups where applicable:

- Mullvad source: Mullvad VPN and Mullvad Browser
- HashiCorp source: Terraform, Vault, and Packer
- Grafana source: Grafana and Grafana Alloy
- Microsoft product feed: PowerShell and .NET SDK where release specific locations permit
- Elastic 9 source: Elasticsearch, Kibana, Logstash, and Filebeat as one selectable Elastic Stack bundle

The migration includes compatibility snapshot tests proving that all existing product and API combinations remain byte compatible unless a documented security correction requires a change.

## First 25 Additional Products

The second catalog release adds exactly these products. The compatibility matrix is conservative and is verified again during implementation against current official metadata.

| # | Product | Source relationship | Packages | Initial compatibility policy |
|---:|---|---|---|---|
| 1 | Mullvad Browser | Existing Mullvad source | `mullvad-browser` | Bookworm and Trixie, amd64 stable APT only |
| 2 | 1Password | New 1Password source with debsig files | `1password` | Bullseye, Bookworm, Trixie, amd64 |
| 3 | Visual Studio Code | New VS Code source | `code` | Bullseye, Bookworm, Trixie, amd64, arm64, armhf |
| 4 | PowerShell 7.6 | Shared Microsoft product feed | `powershell` | Trixie, amd64 and arm64 |
| 5 | .NET SDK 10 | Shared Microsoft product feed | `dotnet-sdk-10.0` | Bookworm and Trixie, amd64 and arm64 |
| 6 | Tailscale | New Tailscale source with release scoped keys | `tailscale` | All five Debian profiles, published architectures |
| 7 | Cloudflare WARP | New Cloudflare WARP source | `cloudflare-warp` | Bookworm and Trixie, amd64 and arm64 |
| 8 | cloudflared | New Cloudflare Tunnel source | `cloudflared` | Generic Debian source, amd64, arm64, armhf |
| 9 | OpenTofu | New OpenTofu source with two keys | `tofu` | Generic Debian source, published architectures |
| 10 | AnyDesk | New AnyDesk source | `anydesk` | Bullseye, Bookworm, Trixie, published architectures |
| 11 | Sublime Text | New componentless exact path source | `sublime-text` | Generic Debian source, amd64 and arm64 |
| 12 | Element Desktop | New Element source | `element-desktop` | Bullseye, Bookworm, Trixie, amd64 and arm64 |
| 13 | Oracle VirtualBox 7.2 | New Oracle source | `virtualbox-7.2` | Bullseye, Bookworm, Trixie, amd64 |
| 14 | GitLab Community Edition | New GitLab source | `gitlab-ce` | Bullseye, Bookworm, Trixie, amd64 and arm64 |
| 15 | GitLab Runner | New GitLab Runner source | `gitlab-runner` | Bullseye, Bookworm, Trixie, Forky, supported architectures |
| 16 | Jenkins LTS | New componentless exact path source | `jenkins` | Trixie, amd64 and arm64 |
| 17 | NGINX Stable | New NGINX source and preference file | `nginx` | Bullseye, Bookworm, Trixie, amd64 and arm64 |
| 18 | HashiCorp Vault | Existing HashiCorp source | `vault` | Bullseye, Bookworm, Trixie, amd64 and arm64 |
| 19 | HashiCorp Packer | Existing HashiCorp source | `packer` | Bullseye, Bookworm, Trixie, amd64 and arm64 |
| 20 | Elastic Stack 9 | New shared Elastic source | `elasticsearch`, `kibana`, `logstash`, `filebeat` | Bookworm and Trixie, amd64 and arm64 |
| 21 | Syncthing Stable v2 | New Syncthing source and preference file | `syncthing` | Generic Debian source, amd64, arm64, armhf |
| 22 | Amazon Corretto 21 | New Corretto source | `java-21-amazon-corretto-jdk` | Generic Debian source, amd64 and arm64 |
| 23 | Eclipse Temurin 25 | New Adoptium source | `temurin-25-jdk` | Bullseye, Bookworm, Trixie, supported architectures |
| 24 | Grafana Alloy | Existing Grafana source | `alloy` | Same conservative matrix as the Grafana source |
| 25 | Caddy | New distribution independent Caddy source | `caddy` | Generic Debian source, amd64, arm64, armhf |

The implementation rechecks each row before coding its catalog definition. If an official endpoint, package, signing method, or support statement changed after 2026-08-29, the product is replaced by the first fully eligible reserve candidate rather than weakening the policy. Prioritized reserves are Icinga 2, Neo4j Community, Wazuh Agent, Datadog Agent, and Teleport Community Edition.

## Final 50 Additional Products

The third catalog block brings the total to exactly 100. NodeSource is explicitly excluded. Node.js and LibreOffice use Debian packages without an extra source. Yarn is deliberately named Yarn Classic 1.x because current Yarn uses Corepack rather than an APT repository. Every security critical row uses manufacturer or upstream infrastructure only.

| # | Product | Provenance and installation | Package selection |
|---:|---|---|---|
| 1 | Node.js | Debian native, no NodeSource | `nodejs` |
| 2 | Yarn Classic 1.x | Official Yarn upstream APT | `yarn` |
| 3 | LibreOffice | Debian native, no TDF APT exists | `libreoffice` |
| 4 | Mozilla Thunderbird | Shared Mozilla upstream APT | `thunderbird` |
| 5 | Firefox Developer Edition | Shared Mozilla upstream APT | `firefox-devedition` |
| 6 | 1Password CLI | Shared 1Password manufacturer APT | `1password-cli` |
| 7 | GitLab Enterprise Edition | GitLab manufacturer APT | `gitlab-ee` |
| 8 | Jenkins Weekly | Jenkins upstream APT | `jenkins` |
| 9 | NGINX Mainline | Shared NGINX manufacturer APT | `nginx` |
| 10 | Grafana Enterprise | Shared Grafana manufacturer APT | `grafana-enterprise` |
| 11 | HashiCorp Consul | Shared HashiCorp manufacturer APT | `consul` |
| 12 | HashiCorp Nomad | Shared HashiCorp manufacturer APT | `nomad` |
| 13 | HashiCorp Boundary | Shared HashiCorp manufacturer APT | `boundary` |
| 14 | Elastic Agent 9 | Shared Elastic manufacturer APT | `elastic-agent` |
| 15 | Kubernetes Node Tools 1.36 | Kubernetes upstream APT | `kubelet`, `kubeadm` |
| 16 | Microsoft OpenJDK 21 | Microsoft manufacturer APT | `msopenjdk-21` |
| 17 | Microsoft OpenJDK 25 | Microsoft manufacturer APT | `msopenjdk-25` |
| 18 | Eclipse Temurin 8 | Shared Adoptium upstream APT | `temurin-8-jdk` |
| 19 | Eclipse Temurin 11 | Shared Adoptium upstream APT | `temurin-11-jdk` |
| 20 | Eclipse Temurin 17 | Shared Adoptium upstream APT | `temurin-17-jdk` |
| 21 | Eclipse Temurin 21 | Shared Adoptium upstream APT | `temurin-21-jdk` |
| 22 | Amazon Corretto 8 | Shared Amazon manufacturer APT | `java-1.8.0-amazon-corretto-jdk` |
| 23 | Amazon Corretto 11 | Shared Amazon manufacturer APT | `java-11-amazon-corretto-jdk` |
| 24 | Amazon Corretto 17 | Shared Amazon manufacturer APT | `java-17-amazon-corretto-jdk` |
| 25 | Amazon Corretto 25 | Shared Amazon manufacturer APT | `java-25-amazon-corretto-jdk` |
| 26 | Azul Zulu JDK 21 | Azul manufacturer APT | `zulu21-jdk` |
| 27 | BellSoft Liberica JDK 21 | BellSoft manufacturer APT | `bellsoft-java21` |
| 28 | TeamViewer | TeamViewer manufacturer APT | `teamviewer` |
| 29 | Steam Launcher | Valve manufacturer APT | `steam-launcher` |
| 30 | Google Earth Pro | Google manufacturer APT | `google-earth-pro-stable` |
| 31 | Sublime Merge | Shared Sublime manufacturer APT | `sublime-merge` |
| 32 | Typora | Typora manufacturer APT | `typora` |
| 33 | Warp Terminal | Warp manufacturer APT | `warp-terminal` |
| 34 | NordVPN | Nord Security manufacturer APT | `nordvpn` |
| 35 | IVPN | IVPN manufacturer APT | `ivpn` |
| 36 | Teleport Community Edition 18 | Teleport upstream APT | `teleport` |
| 37 | Wazuh Agent | Wazuh manufacturer APT | `wazuh-agent` |
| 38 | Apache CouchDB 3.5 | Apache upstream documented APT | `couchdb` |
| 39 | Neo4j Community Edition | Neo4j manufacturer APT | `neo4j` |
| 40 | Icinga 2 | Icinga upstream APT | `icinga2` |
| 41 | MySQL Community Server 8.4 LTS | Oracle manufacturer APT | `mysql-server` |
| 42 | OpenSearch 3 | OpenSearch upstream APT | `opensearch` |
| 43 | Datadog Agent 7 | Datadog manufacturer APT | `datadog-agent` |
| 44 | Falco | Falco upstream APT | `falco` |
| 45 | Trivy | Aqua Security upstream APT | `trivy` |
| 46 | CrowdSec Security Engine | CrowdSec manufacturer APT | `crowdsec` |
| 47 | Fluent Bit | Fluent Bit upstream APT | `fluent-bit` |
| 48 | DBeaver Community | DBeaver upstream APT | `dbeaver-ce` |
| 49 | Buildkite Agent | Buildkite manufacturer APT | `buildkite-agent` |
| 50 | Buildkite CLI | Buildkite manufacturer APT | `bk` |

Implementation must verify repository metadata, package existence, signing keys, architectures, Debian support, and any interactive or privileged behavior before adding each definition. A failing candidate is replaced from the verified reserve pool without reducing the total: Syncthing alternatives, VSCodium only as a labeled non-security-critical endorsed-community exception, ONLYOFFICE Desktop Editors after raw-key verification, Google Chrome Beta, Microsoft Edge Beta, Brave Beta, Opera Beta, or Vivaldi Snapshot. Helm is excluded because cluster package management is security critical and its documented APT infrastructure is community operated.

## Explicit Exclusions

Do not add Tor Browser, Docker Desktop, Discord, Zoom, Slack, JetBrains Toolbox, Postman, Bitwarden Desktop, GitKraken, RustDesk, OBS Studio, or Dropbox because their official Linux delivery does not meet the repository policy. Do not use Spotify as a primary entry because Spotify states that Linux is not actively supported.

RabbitMQ, Percona, Puppet Core, Netdata, New Relic, TimescaleDB, CockroachDB, Kopia, OpenVPN Access Server, and Helm remain outside this release because their setup, transport, key, community provenance, or version coupling fails the approved policy or requires a model not needed by the selected 100.

## Output and Deduplication

The three existing output modes remain:

1. `perVendor`, shown as one file per unique repository source
2. `combined`, one safe combined DEB822 file when representable
3. `byCategory`, grouped source files using localized category labels only in the UI

Product selection order never affects output. Source files sort by category, displayed product name, source ID, then auxiliary file. Package commands deduplicate packages and sort them deterministically.

Every generated artifact includes:

- browser preview;
- copy action;
- download action;
- canonical public API URL when a static canonical variant exists;
- a visible `curl -fsSL` command that downloads the exact file;
- a separate safe save, inspect, and apply sequence.

The UI never recommends piping a remote file directly into a privileged shell. Commands save the file, display or syntax check it, and only then show the separate privileged installation step.

## Skip Software Flow

The System step has two primary paths:

- continue to Software;
- skip Software and open Output.

Skipping leaves the product selection empty, generates only Debian base artifacts, moves focus to the Output heading, and exposes Debian file download plus direct `curl` commands. Output offers a visible action to return and add software. The path works with keyboard, screen reader, mobile bottom action bar, and browser history independent state.

## Internationalization

Use `vue-i18n` with statically bundled, typed message modules. Supported locales are exactly:

```ts
export const SUPPORTED_LOCALES = [
  'en', 'de', 'es', 'fr', 'it', 'ru', 'pt', 'pl', 'zh-CN', 'ja',
] as const
```

English is the canonical message schema and fallback. Every other locale must satisfy the complete schema at compile time with no missing or extra keys.

Locale resolution order:

1. valid locally stored user choice;
2. exact normalized match from `navigator.languages`;
3. language base fallback such as `de-AT` to `de` and `pt-BR` to `pt`;
4. all supported Chinese variants to `zh-CN`;
5. English.

Changing language updates Vue I18n, Vuetify, `document.documentElement.lang`, and persistent local storage. Invalid or unavailable storage never blocks startup. The language selector is keyboard accessible, uses a globe icon, shows native language names, and remains available in the header.

All visible UI copy, ARIA labels, live announcements, warnings, artifact descriptions, compatibility explanations, category names, and error messages come from translation keys. Domain logic returns structured reason descriptors instead of localized strings. Technical output and exact tokens are never translated, including URLs, paths, package names, fingerprints, Debian codenames, suites, architectures, DEB822 fields, commands, and filenames.

Use `Intl.PluralRules` for locale correct counts, including Russian and Polish forms. Search uses locale aware normalization while preserving exact technical tokens.

No visible translation string may contain Unicode en dash or em dash characters. Tests scan all locale files for `U+2013` and `U+2014`. Hyphens inside technical values remain unchanged.

## Debian Workbench Interface

The approved visual direction is Debian Workbench.

- Preserve the warm dark outer shell, bright work surface, Debian red focus and action accents, compact technical status, and short restrained motion.
- Increase information density moderately without turning the entire interface into a terminal imitation.
- Keep the three numbered steps and persistent release, architecture, product count, unique source count, and output mode summary.
- Show package names and shared source relationships on product cards.
- Use product or category MDI icons, official source status, architecture indicators, fingerprint status, file type icons, and terminal icons.
- Present terminal blocks as equal output options rather than secondary documentation.
- Retain 44 pixel targets, visible focus, focused step transitions, accessible tab semantics, reduced motion, mobile fixed action bar, and content reserve space.

Header controls:

- Debian and DebGen identity;
- language selector with globe icon;
- Liberapay as a heart icon only;
- GitHub as a GitHub icon only.

Icon only controls retain descriptive accessible names, tooltips, focus states, `target="_blank"`, and safe `rel` values. No visible `Liberapay` or `GitHub` text appears in the header.

## Static API

All current `/api/v1/` URLs remain valid. Add source aware metadata while retaining product compatible URLs.

- `/api/v1/sources.json` lists unique repository sources, keys, support levels, products, and verification dates.
- `/api/v1/vendors.json` remains the product manifest and adds `sourceId`, packages, and localized presentation keys.
- Existing `/api/v1/vendors/<product-id>/<release>/<architecture>/...` endpoints remain aliases generated from the product selection.
- New `/api/v1/sources/<source-id>/<release>/<architecture>/<source-id>.sources` endpoints expose canonical deduplicated sources.
- Bundle endpoints expose canonical Debian only and selected predefined bundles where deterministic URLs are practical.

The browser constructs direct `curl` commands from manifest URLs, never from hard coded host strings. Forks and alternative Pages paths therefore work correctly.

API output stays language neutral except stable translation keys. The application localizes descriptions at render time.

## Error Handling and Security

- Catalog validation fails the build before writing output.
- Source and product compatibility are both checked before selection and generation.
- Shared sources never install duplicate keys, auxiliary files, preferences, or packages.
- Multiple primary signing keys require an exact complete published fingerprint set when the manufacturer publishes it.
- Shell generation rejects unsafe filenames, destinations, line breaks, delimiters, package names, and substitutions.
- Auxiliary trust files use a closed destination kind, not an arbitrary filesystem path.
- Product specific operational warnings remain visible before download and inside reviewed scripts.
- A failed translation lookup is a development error and falls back to English in production without exposing raw keys.

## Testing

Follow red, green, refactor for all new behavior.

Required automated coverage:

- source and product schema invariants;
- shared source deduplication for Mullvad, HashiCorp, Grafana, Microsoft, and Elastic;
- multiple keys, release scoped URLs, arbitrary exact path suites, auxiliary trust files, and preferences;
- all 100 product compatibility matrices across five releases and closed architectures;
- exact published fingerprint sets and safe installer behavior;
- all three output modes and deterministic artifact order;
- direct `curl` URL resolution against manifests;
- System to Output skip flow, focus transfer, empty selection, and return to Software;
- locale resolution, storage precedence, region fallback, Chinese mapping, English fallback, and Vuetify synchronization;
- translation schema completeness, plural categories, no visible German literals outside locale modules, and no Unicode dash characters;
- component behavior in all ten locales, with deeper coverage for English, German, Russian, Polish, and simplified Chinese;
- byte identical technical source and script output before and after presentation migration;
- responsive mobile action bar, keyboard navigation, accessible names, contrast, reduced motion, and no overflow;
- full API tree determinism, manifest existence, compatible presence, and incompatible absence.

Final verification requires `npm run check`, zero threshold `npm audit`, production manifest inspection, desktop and mobile browser checks, merge to `master`, push, successful CI and Pages workflows, and live HTTP checks for the homepage, language selection, source manifest, Debian only curl output, Mullvad Browser, 1Password, and representative shared source endpoints.

## Documentation

Update the README and add focused maintenance documentation covering:

- the source and product data model;
- all 100 products and compatibility limits;
- official only admission policy and explicit exclusions;
- source sharing and deduplication;
- multiple keys, auxiliary trust files, preferences, fingerprints, and key rotation;
- ten locale workflow, adding and reviewing translations, plural rules, and fallback behavior;
- all static API manifests and direct `curl` examples;
- Debian only skip flow;
- safe save, inspect, and apply commands;
- release scoped vendor URLs and versioned products;
- the verification date and a repeatable vendor metadata audit checklist.

## Delivery

Implementation occurs in an isolated feature branch. Each behavior receives failing tests before production changes and independent review. After final verification, merge to `master`, push, wait for CI and GitHub Pages, and verify the live site serves the new commit. Commit messages remain neutral and describe only delivered changes.
