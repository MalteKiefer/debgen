<script setup lang="ts">
import { computed, ref } from 'vue'
import { getVendorCompatibility } from '../../features/vendors/compatibility'
import type { SiteCopy } from '../../site/locales'
import type { WorkbenchState } from '../state'
import type { WorkbenchHydrationProduct } from '../types'

const props = defineProps<{
  copy: SiteCopy
  products: readonly WorkbenchHydrationProduct[]
  state: WorkbenchState
}>()

const emit = defineEmits<{
  change: [repositories: readonly string[]]
}>()

const query = ref('')

const compatibleProducts = computed(() => [...props.products]
  .filter(product => getVendorCompatibility(product as never, props.state.release, props.state.architecture).compatible)
  .sort((left, right) => left.name.localeCompare(right.name)))

const normalize = (value: string): string => value.toLowerCase()

const filteredProducts = computed(() => {
  const needle = normalize(query.value.trim())
  if (!needle) return compatibleProducts.value
  return compatibleProducts.value.filter(product => (
    normalize(product.name).includes(needle)
    || normalize(product.id).includes(needle)
    || normalize(product.category).includes(needle)
    || product.packages.some(packageName => normalize(packageName).includes(needle))
  ))
})

const selected = (id: string): boolean => props.state.repositories.includes(id)

const selectedCount = computed(() => props.state.repositories.length)

const toggleRepository = (id: string, event: Event): void => {
  const checked = (event.currentTarget as unknown as { checked: boolean }).checked
  const repositories = checked
    ? [...props.state.repositories, id]
    : props.state.repositories.filter(repository => repository !== id)
  emit('change', repositories)
}

const onQueryInput = (event: Event): void => {
  query.value = (event.currentTarget as unknown as { value: string }).value
}
</script>

<template>
  <div class="repository-toolbar">
    <label for="repository-search">
      {{ copy.search.label }}
      <input
        id="repository-search"
        type="search"
        name="q"
        :placeholder="copy.search.placeholder"
        autocomplete="off"
        :value="query"
        @input="onQueryInput"
      >
    </label>
    <p class="result-count" role="status" aria-live="polite">
      {{ filteredProducts.length }} / {{ compatibleProducts.length }} repositories &middot; {{ selectedCount }} selected
    </p>
  </div>
  <div
    class="table-scroll"
    tabindex="0"
    role="region"
    aria-label="Repository results"
  >
    <table>
      <thead>
        <tr>
          <th scope="col">{{ copy.audit.repository }}</th>
          <th scope="col">Package</th>
          <th scope="col">{{ copy.audit.operator }}</th>
          <th scope="col">{{ copy.audit.compatibility }}</th>
          <th scope="col">Select</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="product in filteredProducts"
          :key="product.id"
          :data-repository-id="product.id"
        >
          <th scope="row">
            {{ product.name }}
            <span class="cell-sub"><code>{{ product.id }}</code> &middot; {{ product.category }}</span>
          </th>
          <td><code>{{ product.packages.join(' ') }}</code></td>
          <td><span class="badge" :data-provenance="product.provenance">{{ product.provenance }}</span></td>
          <td><span class="badge" :data-support-level="product.supportLevel">{{ product.supportLevel }}</span></td>
          <td>
            <label class="compact-choice">
              <input
                type="checkbox"
                name="repository"
                :value="product.id"
                :checked="selected(product.id)"
                @change="toggleRepository(product.id, $event)"
              >
              Include
            </label>
          </td>
        </tr>
        <tr v-if="filteredProducts.length === 0">
          <td colspan="5" class="empty-result">{{ copy.search.empty }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p class="audit-note">{{ copy.trust.review }}</p>
</template>
