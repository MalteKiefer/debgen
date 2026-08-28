import type { DebianRelease, ReleaseCodename } from './model'

const BASE_URI = 'https://deb.debian.org/debian'
const SECURITY_URI = 'https://security.debian.org/debian-security'
const GPG_KEYRING = '/usr/share/keyrings/debian-archive-keyring.gpg'
const PGP_KEYRING = '/usr/share/keyrings/debian-archive-keyring.pgp'

function release(
  codename: ReleaseCodename,
  status: string,
  components: string[],
  recommendedComponents: string[],
  formats: DebianRelease['formats'],
  keyring: string,
  capabilities: DebianRelease['capabilities'],
): DebianRelease {
  return {
    codename,
    status,
    formats,
    components,
    recommendedComponents,
    keyring,
    baseUri: BASE_URI,
    securityUri: SECURITY_URI,
    suites: {
      base: codename,
      ...(capabilities.security ? { security: `${codename}-security` } : {}),
      ...(capabilities.updates ? { updates: `${codename}-updates` } : {}),
      ...(capabilities.backports ? { backports: `${codename}-backports` } : {}),
    },
    capabilities,
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach((child) => deepFreeze(child))
    Object.freeze(value)
  }
  return value
}

const catalog: DebianRelease[] = [
  release('trixie', 'stable', ['main', 'contrib', 'non-free', 'non-free-firmware'], ['main', 'non-free-firmware'], ['deb822'], PGP_KEYRING, { security: true, updates: true, backports: true }),
  release('bookworm', 'oldstable / LTS', ['main', 'contrib', 'non-free', 'non-free-firmware'], ['main', 'non-free-firmware'], ['deb822', 'legacy'], GPG_KEYRING, { security: true, updates: true, backports: false }),
  release('bullseye', 'oldoldstable / LTS', ['main', 'contrib', 'non-free'], ['main'], ['deb822', 'legacy'], GPG_KEYRING, { security: true, updates: true, backports: false }),
  release('forky', 'testing', ['main', 'contrib', 'non-free', 'non-free-firmware'], ['main', 'non-free-firmware'], ['deb822'], PGP_KEYRING, { security: false, updates: false, backports: false }),
  release('sid', 'unstable', ['main', 'contrib', 'non-free', 'non-free-firmware'], ['main', 'non-free-firmware'], ['deb822'], PGP_KEYRING, { security: false, updates: false, backports: false }),
]

const suitePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function validateHttpsUri(uri: string, field: string, codename: string): void {
  try {
    if (new URL(uri).protocol !== 'https:') {
      throw new Error('not HTTPS')
    }
  } catch {
    throw new Error(`Release "${codename}" ${field} must be an HTTPS URI.`)
  }
}

function validateOptionalSuite(
  releaseEntry: DebianRelease,
  name: keyof DebianRelease['capabilities'],
): void {
  const suite = releaseEntry.suites[name]
  const enabled = releaseEntry.capabilities[name]
  if (enabled && suite === undefined) {
    throw new Error(`Release "${releaseEntry.codename}" ${name} capability requires a suite.`)
  }
  if (!enabled && suite !== undefined) {
    throw new Error(`Release "${releaseEntry.codename}" has a ${name} suite without its ${name} capability.`)
  }
  if (suite !== undefined && suite !== `${releaseEntry.codename}-${name}`) {
    throw new Error(`Release "${releaseEntry.codename}" has an invalid ${name} suite.`)
  }
}

export function validateReleaseCatalog(entries: readonly DebianRelease[]): void {
  const codenames = new Set<string>()

  for (const releaseEntry of entries) {
    if (codenames.has(releaseEntry.codename)) {
      throw new Error(`Duplicate codename in Debian release catalog: ${releaseEntry.codename}.`)
    }
    codenames.add(releaseEntry.codename)

    validateHttpsUri(releaseEntry.baseUri, 'base URI', releaseEntry.codename)
    validateHttpsUri(releaseEntry.securityUri, 'security URI', releaseEntry.codename)
    if (!releaseEntry.keyring) {
      throw new Error(`Release "${releaseEntry.codename}" requires a keyring.`)
    }
    if (!releaseEntry.keyring.startsWith('/usr/share/keyrings/')) {
      throw new Error(`Release "${releaseEntry.codename}" keyring must be in /usr/share/keyrings.`)
    }
    if (!suitePattern.test(releaseEntry.suites.base) || releaseEntry.suites.base !== releaseEntry.codename) {
      throw new Error(`Release "${releaseEntry.codename}" has an invalid base suite.`)
    }

    validateOptionalSuite(releaseEntry, 'security')
    validateOptionalSuite(releaseEntry, 'updates')
    validateOptionalSuite(releaseEntry, 'backports')

    if (!releaseEntry.components.includes('main')) {
      throw new Error(`Release "${releaseEntry.codename}" must include main.`)
    }
    for (const component of releaseEntry.recommendedComponents) {
      if (!releaseEntry.components.includes(component)) {
        throw new Error(`Release "${releaseEntry.codename}" has recommended component "${component}" that is unavailable.`)
      }
    }
  }
}

validateReleaseCatalog(catalog)

export const RELEASES: readonly DebianRelease[] = deepFreeze(catalog)

export function getRelease(codename?: string): DebianRelease {
  if (codename === undefined) {
    return RELEASES[0]
  }
  if (codename.length === 0) {
    throw new Error('A Debian release codename is required.')
  }
  const releaseEntry = RELEASES.find((entry) => entry.codename === codename)
  if (!releaseEntry) {
    throw new Error(`Unknown release: ${codename}.`)
  }
  return releaseEntry
}
