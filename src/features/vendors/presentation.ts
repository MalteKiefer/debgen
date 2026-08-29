import type { CompatibilityReason } from './compatibility'
import type { GeneratedArtifact, VendorCategory, WarningKey } from './model'

export interface PresentationDescriptor {
  readonly key: string
  readonly values: Readonly<Record<string, string | number>>
}

const knownWarningKeys = new Set<WarningKey>([
  'buildkite-agent-token-required',
  'clickhouse-generic-debian',
  'couchdb-interactive-configuration',
  'datadog-api-key-required',
  'docker-firewall',
  'elastic-agent-enrollment',
  'elastic-stack-resource-requirements',
  'falco-driver-setup',
  'gitlab-server-prerequisites',
  'jenkins-java-prerequisite',
  'kubernetes-node-configuration',
  'mariadb-no-setup-script',
  'mysql-interactive-configuration',
  'nvidia-container-toolkit-prerequisites',
  'opensearch-security-bootstrap',
  'proton-vpn-supported-environment',
  'steam-i386-multiarch',
  'tor-not-browser',
  'wazuh-manager-enrollment',
  'yarn-classic-only',
])

const categoryMessageKeys: Readonly<Record<VendorCategory, string>> = {
  'web-browsers': 'webBrowsers',
  'messaging-email': 'messagingEmail',
  'vpn-secure-networking': 'vpnSecureNetworking',
  'remote-desktop': 'remoteDesktop',
  'containers-kubernetes': 'containersKubernetes',
  'cloud-edge': 'cloudEdge',
  'infrastructure-automation': 'infrastructureAutomation',
  'data-platforms': 'dataPlatforms',
  'observability-logging': 'observabilityLogging',
  'security-secrets': 'securitySecrets',
  'developer-workstation': 'developerWorkstation',
  'runtimes-sdks': 'runtimesSdks',
  'development-platforms-cicd': 'developmentPlatformsCicd',
  'web-servers': 'webServers',
  'file-synchronization': 'fileSynchronization',
  virtualization: 'virtualization',
  games: 'games',
  'desktop-productivity': 'desktopProductivity',
}

export function categoryMessageKey(category: VendorCategory): string {
  return `categories.${categoryMessageKeys[category]}`
}

export function presentWarning(key: WarningKey): PresentationDescriptor {
  return knownWarningKeys.has(key)
    ? { key: `warnings.${key}`, values: {} }
    : { key: 'warnings.unknown', values: { warningKey: key } }
}

export function presentCompatibility(
  reason: CompatibilityReason,
  productName: string,
): PresentationDescriptor {
  if (reason.code === 'unsupported-release') {
    return {
      key: 'compatibility.unsupportedRelease',
      values: {
        product: productName,
        release: reason.release,
        supported: reason.supportedReleases.join(', '),
      },
    }
  }

  return {
    key: 'compatibility.unsupportedArchitecture',
    values: {
      product: productName,
      architecture: reason.architecture,
      supported: reason.supportedArchitectures.join(', '),
    },
  }
}

export function presentArtifact(artifact: GeneratedArtifact): PresentationDescriptor {
  if (artifact.filename === 'debian.sources' || artifact.filename === 'debian.list') {
    return { key: 'artifacts.descriptions.debianSource', values: {} }
  }
  if (artifact.filename === 'install-vendor-repositories.sh') {
    return { key: 'artifacts.descriptions.setupScript', values: {} }
  }
  if (artifact.filename === 'vendors.sources') {
    return { key: 'artifacts.descriptions.combinedSources', values: {} }
  }
  if (artifact.filename.endsWith('.pref')) {
    return {
      key: 'artifacts.descriptions.preference',
      values: { product: artifact.productName ?? artifact.filename },
    }
  }
  if (artifact.productName) {
    return {
      key: 'artifacts.descriptions.repositorySource',
      values: { product: artifact.productName },
    }
  }
  if (artifact.category && artifact.filename === `${artifact.category}.sources`) {
    return {
      key: 'artifacts.descriptions.categorySources',
      values: { category: artifact.category },
    }
  }
  return {
    key: 'artifacts.descriptions.generic',
    values: { filename: artifact.filename },
  }
}
