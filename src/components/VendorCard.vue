<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { VENDOR_PRODUCTS } from '../features/vendors/catalog'
import { getVendorCompatibility } from '../features/vendors/compatibility'
import type { ReleaseCodename } from '../features/sources/model'
import type { SystemArchitecture, VendorProduct } from '../features/vendors/model'
import type { VendorMdiIcon } from '../features/vendors/icons'
import { getRepositorySource } from '../features/vendors/sources'
import { presentCompatibility, presentWarning } from '../features/vendors/presentation'
import { categoryMessageKey } from '../features/vendors/presentation'

const props = defineProps<{
  product: VendorProduct
  release: ReleaseCodename
  architecture: SystemArchitecture
  selected: boolean
}>()

const emit = defineEmits<{
  'update:selected': [value: boolean]
}>()
const { t } = useI18n()

const categoryIcons: Record<string, VendorMdiIcon> = {
  'web-browsers': 'mdi-web',
  'messaging-email': 'mdi-message-text-outline',
  'vpn-secure-networking': 'mdi-shield-lock-outline',
  'containers-kubernetes': 'mdi-cube-outline',
  'cloud-edge': 'mdi-cloud-outline',
  'developer-workstation': 'mdi-code-tags',
  'data-platforms': 'mdi-database-outline',
  'observability-logging': 'mdi-chart-line',
  'web-servers': 'mdi-web',
  'remote-desktop': 'mdi-message-text-outline',
  games: 'mdi-chart-areaspline',
  'gaming-tools': 'mdi-code-tags',
  'desktop-environments': 'mdi-web',
  'networking-vpn': 'mdi-vpn',
  'monitoring-security': 'mdi-server-security',
}

const compatibility = computed(() => getVendorCompatibility(
  props.product,
  props.release,
  props.architecture,
))
const compatibilityMessage = computed(() => {
  if (compatibility.value.compatible) return ''
  const reason = compatibility.value.reason
  if (!reason) return ''
  const descriptor = presentCompatibility(reason, props.product.name)
  return t(descriptor.key, descriptor.values)
})
const documentationUrl = computed(() => props.product.sourceId ? getRepositorySource(props.product.sourceId)?.documentationUrl : undefined)
const repositorySource = computed(() => props.product.sourceId ? getRepositorySource(props.product.sourceId) : undefined)
const productsUsingSource = computed(() => props.product.sourceId === null ? [] : VENDOR_PRODUCTS
  .filter((product) => product.sourceId === props.product.sourceId)
  .sort((left, right) => left.name.localeCompare(right.name)))
const sourceRelationship = computed(() => {
  const source = repositorySource.value
  if (!source) return ''
  return productsUsingSource.value.length > 1
    ? t('vendorCard.sharedSource', {
        source: source.name,
        products: productsUsingSource.value.map((product) => product.name).join(', '),
      })
    : t('vendorCard.source', { source: source.name })
})
const supportLevel = computed(() => t(`vendor.support.${props.product.supportLevel === 'generic-debian'
  ? 'genericDebian'
  : props.product.supportLevel === 'repository-only' ? 'repositoryOnly' : 'explicit'}`))
const provenanceLabel = computed(() => t(`vendor.origins.${props.product.sourceId === null
  ? 'debianNative'
  : props.product.provenance === 'community-endorsed' ? 'communityEndorsed' : props.product.provenance}`))
const productIcon = computed(() => props.product.icon ?? categoryIcons[props.product.category] ?? 'mdi-code-tags')
const compatibilityId = computed(() => `${props.product.id}-kompatibilitaet`)
const warningMessages = computed(() => props.product.warningKeys.map((warningKey) => {
  const descriptor = presentWarning(warningKey)
  return t(descriptor.key, descriptor.values)
}))
const reportIssueUrl = computed(() => {
  const url = new globalThis.URL('https://github.com/maltekiefer/debgen/issues/new')
  url.searchParams.set('title', `[Repository issue] ${props.product.name}`)
  url.searchParams.set('body', [
    `Product: ${props.product.name}`,
    `Product ID: ${props.product.id}`,
    `Source ID: ${props.product.sourceId ?? 'debian-native'}`,
    `Release: ${props.release}`,
    `Architecture: ${props.architecture}`,
    '',
    'Describe the problem:',
  ].join('\n'))
  return url.toString()
})
</script>

<template>
  <article
    class="vendor-card"
    data-testid="produktkarte"
    :class="{ 'vendor-card--incompatible': !compatibility.compatible }"
  >
    <header class="vendor-card__header">
      <v-icon
        :icon="productIcon"
        aria-hidden="true"
        class="vendor-card__icon"
        data-testid="kategorie-icon"
        size="28"
      />
      <div>
        <p class="vendor-card__category">
          {{ t(categoryMessageKey(product.category)) }}
        </p>
        <h3>
          {{ product.name }}
        </h3>
      </div>
    </header>

    <div class="vendor-card__badges">
      <v-chip
        data-testid="provenance"
        prepend-icon="mdi-check-decagram-outline"
        size="small"
        variant="tonal"
      >
        {{ provenanceLabel }}
      </v-chip>
      <v-chip data-testid="support-level" size="small" variant="outlined">
        {{ supportLevel }}
      </v-chip>
      <span class="vendor-card__architectures">
        <v-icon aria-hidden="true" icon="mdi-cpu-64-bit" size="18" />
        {{ product.supportedArchitectures.join(', ') }}
      </span>
    </div>

    <p
      v-if="sourceRelationship"
      class="vendor-card__source"
      data-testid="source-relationship"
    >
      <v-icon aria-hidden="true" icon="mdi-source-repository" size="18" />
      {{ sourceRelationship }}
    </p>
    <div
      :aria-label="`${product.name}: ${t('install.packagesAria')}`"
      class="vendor-card__packages"
      data-testid="product-packages"
    >
      <v-icon aria-hidden="true" icon="mdi-package-variant-closed" size="18" />
      <code v-for="packageName in product.packages" :key="packageName">{{ packageName }}</code>
    </div>

    <p
      v-if="!compatibility.compatible"
      :id="compatibilityId"
      class="vendor-card__reason"
    >
      {{ compatibilityMessage }}
    </p>
    <p
      v-if="product.warningKeys.length"
      class="vendor-card__warning"
    >
      <v-icon aria-hidden="true" icon="mdi-alert-outline" size="18" />
      {{ warningMessages.join(' ') }}
    </p>

    <footer class="vendor-card__footer">
      <label :for="`${product.id}-selected`" class="vendor-card__selection">
        <input
          :id="`${product.id}-selected`"
          :aria-describedby="compatibility.compatible ? undefined : compatibilityId"
          :aria-label="t('vendorCard.selectAria', { product: product.name })"
          :checked="selected"
          :disabled="!compatibility.compatible"
          type="checkbox"
          @change="emit('update:selected', ($event.target as HTMLInputElement).checked)"
        >
        <span>{{ selected ? t('vendorCard.selected') : t('vendorCard.select') }}</span>
      </label>
      <a
        :aria-label="t('vendorCard.documentationAria', { product: product.name })"
        :href="documentationUrl"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ t('vendorCard.documentation') }}
        <v-icon aria-hidden="true" icon="mdi-open-in-new" size="16" />
      </a>
      <a
        :aria-label="t('vendorCard.reportIssueAria', { product: product.name })"
        data-testid="report-issue"
        :href="reportIssueUrl"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ t('vendorCard.reportIssue') }}
        <v-icon aria-hidden="true" icon="mdi-bug-outline" size="16" />
      </a>
    </footer>
  </article>
</template>

<style scoped>
.vendor-card {
  display: grid;
  gap: 0.85rem;
  min-block-size: 100%;
  padding: 1rem;
  border: 1px solid #c9bcc1;
  border-radius: 0.75rem;
  background: #fff;
}

.vendor-card--incompatible {
  background: #faf7f8;
  color: #5f5358;
}

.vendor-card__header,
.vendor-card__badges,
.vendor-card__footer,
.vendor-card__architectures,
.vendor-card__warning,
.vendor-card__selection,
.vendor-card a {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.vendor-card__header {
  align-items: flex-start;
}

.vendor-card__icon {
  color: #8d123f;
}

.vendor-card__category,
.vendor-card h3,
.vendor-card__reason,
.vendor-card__warning {
  margin: 0;
}

.vendor-card__category {
  color: #6d5963;
  font-size: 0.8rem;
  font-weight: 700;
}

.vendor-card h3 {
  margin-top: 0.15rem;
}

.vendor-card__badges {
  flex-wrap: wrap;
}

.vendor-card__architectures {
  font-size: 0.9rem;
}

.vendor-card__reason,
.vendor-card__warning {
  padding: 0.6rem;
  border-radius: 0.4rem;
  background: #fff0f5;
  color: #761537;
  font-size: 0.9rem;
}

.vendor-card__warning {
  background: #fff7e5;
  color: #6d4c00;
}

.vendor-card__footer {
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: auto;
}

.vendor-card__selection,
.vendor-card a {
  min-block-size: 44px;
  color: inherit;
  font-weight: 700;
}

.vendor-card__selection {
  cursor: pointer;
}

.vendor-card__selection input {
  inline-size: 1.25rem;
  block-size: 1.25rem;
  accent-color: #d70a53;
}

.vendor-card__selection input:focus-visible,
.vendor-card a:focus-visible {
  outline: 3px solid #6b1539;
  outline-offset: 3px;
}
</style>
