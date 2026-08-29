<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { VENDOR_PRODUCTS } from '../features/vendors/catalog'
import { getVendorCompatibility } from '../features/vendors/compatibility'
import type { ReleaseCodename } from '../features/sources/model'
import type { SystemArchitecture, VendorCategory, VendorProduct } from '../features/vendors/model'
import type { VendorMdiIcon } from '../features/vendors/icons'
import { getRepositorySource } from '../features/vendors/sources'
import { categoryMessageKey } from '../features/vendors/presentation'
import { formatPlural, matchesSearch } from '../i18n/format'
import type { SupportedLocale } from '../i18n'
import VendorCard from './VendorCard.vue'

const props = defineProps<{
  release: ReleaseCodename
  architecture: SystemArchitecture
  selectedIds: readonly string[]
}>()

const emit = defineEmits<{
  'update:selectedIds': [value: string[]]
}>()
const { locale, t } = useI18n()

const searchTerm = ref('')
const activeCategory = ref<VendorCategory | null>(null)
const originFilter = ref<'all' | VendorProduct['provenance']>('all')
const compatibilityFilter = ref<'all' | 'compatible' | 'incompatible'>('all')
const cleanupMessage = ref('')
const pendingCleanupIds = ref<readonly string[] | null>(null)

const categoryIcons: Readonly<Record<string, VendorMdiIcon>> = {
  'web-browsers': 'mdi-web', 'messaging-email': 'mdi-message-text-outline', 'vpn-secure-networking': 'mdi-shield-lock-outline',
  'containers-kubernetes': 'mdi-cube-outline', 'cloud-edge': 'mdi-cloud-outline', 'developer-workstation': 'mdi-code-tags',
  'data-platforms': 'mdi-database-outline', 'observability-logging': 'mdi-chart-line', 'web-servers': 'mdi-web',
  'remote-desktop': 'mdi-message-text-outline', games: 'mdi-chart-areaspline', 'gaming-tools': 'mdi-code-tags',
  'desktop-productivity': 'mdi-web', 'infrastructure-automation': 'mdi-terraform',
  'security-secrets': 'mdi-server-security', 'runtimes-sdks': 'mdi-code-tags',
  'development-platforms-cicd': 'mdi-code-tags', 'file-synchronization': 'mdi-cloud-outline',
  virtualization: 'mdi-cube-outline',
}
const categories = computed(() => [...new Set(VENDOR_PRODUCTS.map((product) => product.category))]
  .map((id) => ({ id, icon: categoryIcons[id] ?? 'mdi-code-tags' }))
  .sort((left, right) => t(categoryMessageKey(left.id)).localeCompare(
    t(categoryMessageKey(right.id)), locale.value,
  )))

const originOptions = computed(() => [
  { value: 'all', label: t('vendor.filters.allOrigins') },
  { value: 'manufacturer', label: t('vendor.origins.manufacturer') },
  { value: 'upstream', label: t('vendor.origins.upstream') },
  { value: 'community-endorsed', label: t('vendor.origins.communityEndorsed') },
  { value: 'debian-native', label: t('vendor.origins.debianNative') },
])

const compatibilityOptions = computed(() => [
  { value: 'all', label: t('vendor.filters.allCompatibility') },
  { value: 'compatible', label: t('vendor.filters.compatible') },
  { value: 'incompatible', label: t('vendor.filters.incompatible') },
])

const visibleProducts = computed(() => {
  const activeLocale = locale.value as SupportedLocale
  return VENDOR_PRODUCTS.filter((product) => {
    const categoryMatches = activeCategory.value === null || product.category === activeCategory.value
    const originMatches = originFilter.value === 'all' || product.provenance === originFilter.value
    const compatible = getVendorCompatibility(product, props.release, props.architecture).compatible
    const compatibilityMatches = compatibilityFilter.value === 'all'
      || (compatibilityFilter.value === 'compatible' ? compatible : !compatible)
    const source = product.sourceId ? getRepositorySource(product.sourceId) : undefined
    const searchMatches = matchesSearch(
      searchTerm.value,
      [product.name, t(categoryMessageKey(product.category)), source?.name ?? ''],
      [product.id, product.sourceId ?? '', ...product.packages],
      activeLocale,
    )

    return categoryMatches && originMatches && compatibilityMatches && searchMatches
  }).sort((left, right) => left.name.localeCompare(right.name, activeLocale))
})

const selectedProducts = computed(() => {
  const selected = new Set(props.selectedIds)
  return VENDOR_PRODUCTS.filter((product) => selected.has(product.id))
})
const selectedSourceCount = computed(() => new Set(selectedProducts.value
  .flatMap((product) => product.sourceId === null ? [] : [product.sourceId])).size)
const selectedPackageCount = computed(() => new Set(selectedProducts.value.flatMap((product) => product.packages)).size)

function formatCount(kind: 'products' | 'sources' | 'packages', count: number): string {
  return formatPlural(locale.value as SupportedLocale, count, {
    zero: t(`counts.${kind}.zero`, { count }), one: t(`counts.${kind}.one`, { count }), two: t(`counts.${kind}.two`, { count }),
    few: t(`counts.${kind}.few`, { count }), many: t(`counts.${kind}.many`, { count }), other: t(`counts.${kind}.other`, { count }),
  })
}
const selectedCountText = computed(() => [
  formatCount('products', selectedProducts.value.length),
  formatCount('sources', selectedSourceCount.value),
  formatCount('packages', selectedPackageCount.value),
].join(' · '))

function updateProductSelection(productId: string, selected: boolean): void {
  const product = VENDOR_PRODUCTS.find((candidate) => candidate.id === productId)
  if (!product || !getVendorCompatibility(product, props.release, props.architecture).compatible) {
    return
  }

  const next = new Set(props.selectedIds)
  if (selected) {
    next.add(productId)
  } else {
    next.delete(productId)
  }
  emit('update:selectedIds', [...next])
}

function normalizeSelection(release: ReleaseCodename, architecture: SystemArchitecture) {
  const seenIds = new Set<string>()
  const normalizedIds: string[] = []
  const incompatibleNames: string[] = []
  let unknownCount = 0

  for (const id of props.selectedIds) {
    if (seenIds.has(id)) continue
    seenIds.add(id)

    const product = VENDOR_PRODUCTS.find((candidate) => candidate.id === id)
    if (!product) {
      unknownCount += 1
      continue
    }
    if (!getVendorCompatibility(product, release, architecture).compatible) {
      incompatibleNames.push(product.name)
      continue
    }
    normalizedIds.push(id)
  }

  return { normalizedIds, incompatibleNames, unknownCount }
}

function hasSameIds(first: readonly string[], second: readonly string[]): boolean {
  return first.length === second.length && first.every((id, index) => id === second[index])
}

watch(
  () => [props.release, props.architecture, props.selectedIds] as const,
  ([release, architecture], previous) => {
    const result = normalizeSelection(release, architecture)
    if (hasSameIds(props.selectedIds, result.normalizedIds)) {
      if (pendingCleanupIds.value && hasSameIds(props.selectedIds, pendingCleanupIds.value)) {
        pendingCleanupIds.value = null
        return
      }
      pendingCleanupIds.value = null
      cleanupMessage.value = ''
      return
    }

    pendingCleanupIds.value = result.normalizedIds
    emit('update:selectedIds', result.normalizedIds)
    const changedSystem = !previous
      ? t('selection.checked')
      : previous[0] !== release
        ? t('selection.releaseChanged', { release: release.charAt(0).toUpperCase() + release.slice(1) })
        : previous[1] !== architecture
          ? t('selection.architectureChanged', { architecture })
          : t('selection.updated')
    const incompatiblePart = result.incompatibleNames.length > 0
      ? t(result.incompatibleNames.length === 1 ? 'selection.incompatibleRemoved' : 'selection.incompatibleRemovedMany', {
          products: result.incompatibleNames.join(', '),
        })
      : ''
    const unknownPart = result.unknownCount > 0
      ? t(result.unknownCount === 1 ? 'selection.unknownRemoved' : 'selection.unknownRemovedMany', { count: result.unknownCount })
      : ''
    cleanupMessage.value = `${changedSystem}: ${[incompatiblePart, unknownPart].filter(Boolean).join(' ')}`
  },
  { immediate: true },
)
</script>

<template>
  <section aria-labelledby="vendor-step-title" class="vendor-step">
    <header class="vendor-step__heading">
      <div>
        <p class="vendor-step__eyebrow">
          {{ t('vendor.eyebrow') }}
        </p>
        <h2 id="vendor-step-title" tabindex="-1">
          {{ t('vendor.heading') }}
        </h2>
        <p>
          {{ t('vendor.description') }}
        </p>
      </div>
      <v-chip prepend-icon="mdi-source-repository" variant="tonal">
        {{ release.charAt(0).toUpperCase() + release.slice(1) }} · {{ architecture }}
      </v-chip>
    </header>

    <div class="vendor-step__filters">
      <label class="vendor-step__search" for="vendor-search">
        <span>{{ t('vendor.searchLabel') }}</span>
        <v-icon aria-hidden="true" icon="mdi-magnify" />
        <input
          id="vendor-search"
          v-model="searchTerm"
          :placeholder="t('vendor.searchPlaceholder')"
          type="search"
        >
      </label>
      <div :aria-label="t('vendor.categoryGroup')" class="vendor-step__categories" role="group">
        <button
          :aria-pressed="activeCategory === null"
          class="vendor-step__category"
          type="button"
          @click="activeCategory = null"
        >
          {{ t('vendor.allCategories') }}
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          :aria-label="t('vendor.categoryAria', { category: t(categoryMessageKey(category.id)) })"
          :aria-pressed="activeCategory === category.id"
          class="vendor-step__category"
          type="button"
          @click="activeCategory = category.id"
        >
          <v-icon :icon="category.icon" aria-hidden="true" size="18" />
          {{ t(categoryMessageKey(category.id)) }}
        </button>
      </div>
      <label class="vendor-step__select-filter">
        <span>{{ t('vendor.filters.originLabel') }}</span>
        <select v-model="originFilter" data-testid="origin-filter">
          <option v-for="option in originOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <label class="vendor-step__select-filter">
        <span>{{ t('vendor.filters.compatibilityLabel') }}</span>
        <select v-model="compatibilityFilter" data-testid="compatibility-filter">
          <option v-for="option in compatibilityOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
    </div>

    <p aria-atomic="true" aria-live="polite" class="vendor-step__status" role="status">
      {{ selectedCountText }}
      <template v-if="cleanupMessage"> {{ cleanupMessage }}</template>
    </p>

    <div :aria-label="t('vendor.catalog')" class="vendor-step__grid">
      <VendorCard
        v-for="product in visibleProducts"
        :key="product.id"
        :architecture="architecture"
        :product="product"
        :release="release"
        :selected="selectedIds.includes(product.id)"
        @update:selected="updateProductSelection(product.id, $event)"
      />
    </div>
    <p v-if="visibleProducts.length === 0" class="vendor-step__empty">
      {{ t('vendor.empty') }}
    </p>
  </section>
</template>

<style scoped>
.vendor-step {
  display: grid;
  gap: 1rem;
}

.vendor-step__heading,
.vendor-step__filters,
.vendor-step__categories {
  display: flex;
  gap: 0.75rem;
}

.vendor-step__heading {
  align-items: flex-start;
  justify-content: space-between;
}

.vendor-step__heading p,
.vendor-step h2,
.vendor-step__status,
.vendor-step__empty {
  margin: 0;
}

.vendor-step__eyebrow {
  color: #8d123f;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.vendor-step h2 {
  margin-block: 0.2rem 0.35rem;
}

.vendor-step__filters {
  align-items: flex-start;
  flex-wrap: wrap;
}

.vendor-step__search {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.4rem 0.6rem;
  min-inline-size: min(100%, 18rem);
  min-block-size: 44px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #8d7b84;
  border-radius: 0.5rem;
  background: #fff;
}

.vendor-step__select-filter {
  display: grid;
  gap: 0.25rem;
  min-inline-size: 11rem;
  font-size: 0.8rem;
  font-weight: 700;
}

.vendor-step__select-filter select {
  min-block-size: 44px;
  padding-inline: 0.65rem;
  border: 1px solid #8d7b84;
  border-radius: 0.5rem;
  background: #fff;
  color: inherit;
  font: inherit;
}

.vendor-step__search span {
  grid-column: 1 / -1;
  font-size: 0.8rem;
  font-weight: 700;
}

.vendor-step__search input {
  min-inline-size: 0;
  border: 0;
  color: inherit;
  font: inherit;
}

.vendor-step__search:has(input:focus-visible) {
  outline: 3px solid #6b1539;
  outline-offset: 3px;
}

.vendor-step__categories {
  flex: 1;
  flex-wrap: wrap;
}

.vendor-step__category {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-block-size: 44px;
  padding: 0.45rem 0.7rem;
  border: 1px solid #c9bcc1;
  border-radius: 999px;
  background: #fff;
  color: #261b20;
  font: inherit;
  cursor: pointer;
}

.vendor-step__category[aria-pressed='true'] {
  border-color: #d70a53;
  background: #fff0f5;
  color: #8d123f;
  font-weight: 800;
}

.vendor-step__category:focus-visible {
  outline: 3px solid #6b1539;
  outline-offset: 3px;
}

.vendor-step__status {
  color: #4a343e;
  font-weight: 700;
}

.vendor-step__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  gap: 1rem;
}

@media (max-width: 700px) {
  .vendor-step__heading {
    flex-direction: column;
  }

  .vendor-step__search {
    inline-size: 100%;
  }
}
</style>
