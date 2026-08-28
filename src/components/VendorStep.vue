<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { VENDOR_PRODUCTS } from '../features/vendors/catalog'
import { getVendorCompatibility } from '../features/vendors/compatibility'
import type { ReleaseCodename } from '../features/sources/model'
import type { SystemArchitecture, VendorCategory } from '../features/vendors/model'
import type { VendorMdiIcon } from '../features/vendors/icons'
import VendorCard from './VendorCard.vue'

const props = defineProps<{
  release: ReleaseCodename
  architecture: SystemArchitecture
  selectedIds: readonly string[]
}>()

const emit = defineEmits<{
  'update:selectedIds': [value: string[]]
}>()

const searchTerm = ref('')
const activeCategory = ref<VendorCategory | null>(null)
const cleanupMessage = ref('')
const pendingCleanupIds = ref<readonly string[] | null>(null)

const categories: readonly { readonly id: VendorCategory, readonly label: string, readonly icon: VendorMdiIcon }[] = [
  { id: 'browser', label: 'Browser', icon: 'mdi-web' },
  { id: 'communication', label: 'Kommunikation', icon: 'mdi-message-text-outline' },
  { id: 'privacy', label: 'Privatsphäre', icon: 'mdi-shield-lock-outline' },
  { id: 'containers', label: 'Container', icon: 'mdi-cube-outline' },
  { id: 'cloud', label: 'Cloud', icon: 'mdi-cloud-outline' },
  { id: 'development', label: 'Entwicklung', icon: 'mdi-code-tags' },
  { id: 'database', label: 'Datenbanken', icon: 'mdi-database-outline' },
  { id: 'monitoring', label: 'Überwachung', icon: 'mdi-chart-line' },
]

const visibleProducts = computed(() => {
  const query = searchTerm.value.trim().toLocaleLowerCase('de-DE')

  return VENDOR_PRODUCTS.filter((product) => {
    const categoryMatches = activeCategory.value === null || product.category === activeCategory.value
    const searchMatches = query === '' || product.name.toLocaleLowerCase('de-DE').includes(query)

    return categoryMatches && searchMatches
  })
})

const selectedCountText = computed(() => {
  const count = props.selectedIds.length
  return `${count} ${count === 1 ? 'Paketquelle ausgewählt' : 'Paketquellen ausgewählt'}`
})

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
      ? 'Die Auswahl wurde geprüft'
      : previous[0] !== release
        ? `Release ${release.charAt(0).toUpperCase()}${release.slice(1)}`
        : previous[1] !== architecture
          ? `Architektur ${architecture}`
          : 'Auswahl aktualisiert'
    const incompatiblePart = result.incompatibleNames.length > 0
      ? `${result.incompatibleNames.join(', ')} wurde aus der Auswahl entfernt, weil die Auswahl nicht kompatibel ist.`
      : ''
    const unknownPart = result.unknownCount > 0
      ? `${result.unknownCount === 1 ? 'Eine unbekannte Auswahl wurde' : `${result.unknownCount} unbekannte Auswahlen wurden`} entfernt.`
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
          Schritt 2 von 3
        </p>
        <h2 id="vendor-step-title" tabindex="-1">
          Offizielle Software
        </h2>
        <p>
          Wähle geprüfte Paketquellen, die mit deinem Debian-System kompatibel sind.
        </p>
      </div>
      <v-chip prepend-icon="mdi-source-repository" variant="tonal">
        {{ release.charAt(0).toUpperCase() + release.slice(1) }} · {{ architecture }}
      </v-chip>
    </header>

    <div class="vendor-step__filters">
      <label class="vendor-step__search" for="vendor-search">
        <span>Software suchen</span>
        <v-icon aria-hidden="true" icon="mdi-magnify" />
        <input
          id="vendor-search"
          v-model="searchTerm"
          placeholder="Zum Beispiel Docker oder Firefox"
          type="search"
        >
      </label>
      <div aria-label="Software-Kategorien" class="vendor-step__categories" role="group">
        <button
          :aria-pressed="activeCategory === null"
          class="vendor-step__category"
          type="button"
          @click="activeCategory = null"
        >
          Alle Kategorien
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          :aria-label="`Kategorie ${category.label}`"
          :aria-pressed="activeCategory === category.id"
          class="vendor-step__category"
          type="button"
          @click="activeCategory = category.id"
        >
          <v-icon :icon="category.icon" aria-hidden="true" size="18" />
          {{ category.label }}
        </button>
      </div>
    </div>

    <p aria-atomic="true" aria-live="polite" class="vendor-step__status" role="status">
      {{ selectedCountText }}
      <template v-if="cleanupMessage"> {{ cleanupMessage }}</template>
    </p>

    <div aria-label="Produktkatalog" class="vendor-step__grid">
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
      Keine Produkte entsprechen deiner Suche und Kategorie.
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
