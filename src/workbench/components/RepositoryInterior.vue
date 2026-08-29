<script setup lang="ts">
import { computed } from 'vue'
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

const compatibleProducts = computed(() => props.products.filter(product => (
  getVendorCompatibility(product as never, props.state.release, props.state.architecture).compatible
)))

const selected = (id: string): boolean => props.state.repositories.includes(id)

const toggleRepository = (id: string, event: Event): void => {
  const checked = (event.currentTarget as unknown as { checked: boolean }).checked
  const repositories = checked
    ? [...props.state.repositories, id]
    : props.state.repositories.filter(repository => repository !== id)
  emit('change', repositories)
}
</script>

<template>
  <label for="repository-search">
    {{ copy.search.label }}
    <input
      id="repository-search"
      type="search"
      name="q"
      :placeholder="copy.search.placeholder"
      autocomplete="off"
    >
  </label>
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
          <th scope="col">{{ copy.audit.operator }}</th>
          <th scope="col">{{ copy.audit.compatibility }}</th>
          <th scope="col">Select</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="product in compatibleProducts"
          :key="product.id"
          :data-repository-id="product.id"
        >
          <th scope="row">{{ product.name }}</th>
          <td>{{ product.provenance }}</td>
          <td>{{ product.supportLevel }}</td>
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
      </tbody>
    </table>
  </div>
  <p class="audit-note">{{ copy.trust.review }}</p>
</template>
