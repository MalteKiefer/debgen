<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getVendorCompatibility } from '../../features/vendors/compatibility'
import { renderIcon } from '../../site/icons'
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
const categoryFilter = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const tableBody = ref<HTMLTableSectionElement | null>(null)
const pageSize = ref(10)
const currentPage = ref(1)

const PAGE_SIZES = [10, 25, 50] as const

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false
  if (target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return true
  if (target instanceof HTMLInputElement) return target.type !== 'checkbox' && target.type !== 'radio'
  return false
}

const isSectionVisible = (): boolean => searchInput.value !== null && searchInput.value.offsetParent !== null

const focusSearchOnSlash = (event: KeyboardEvent): void => {
  if (event.key !== '/' || isTypingTarget(event.target) || !searchInput.value) return
  if (!isSectionVisible()) return
  event.preventDefault()
  searchInput.value.focus()
}

const rowCheckboxes = (): HTMLInputElement[] => (
  tableBody.value ? [...tableBody.value.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')] : []
)

const focusedRowIndex = (checkboxes: readonly HTMLInputElement[]): number => (
  document.activeElement instanceof HTMLInputElement ? checkboxes.indexOf(document.activeElement) : -1
)

let lastGPressAt = 0

const handleVimNavigation = (event: KeyboardEvent): void => {
  if (isTypingTarget(event.target) || !isSectionVisible()) return
  if (event.altKey || event.ctrlKey || event.metaKey) return

  if (event.key === 'j' || event.key === 'k') {
    const checkboxes = rowCheckboxes()
    if (checkboxes.length === 0) return
    event.preventDefault()
    const delta = event.key === 'j' ? 1 : -1
    const nextIndex = Math.min(Math.max(focusedRowIndex(checkboxes) + delta, 0), checkboxes.length - 1)
    checkboxes[nextIndex]?.focus()
    return
  }

  if (event.key === 'g') {
    const now = Date.now()
    if (now - lastGPressAt < 500) {
      lastGPressAt = 0
      const checkboxes = rowCheckboxes()
      if (checkboxes.length === 0) return
      event.preventDefault()
      checkboxes[0]?.focus()
    } else {
      lastGPressAt = now
    }
    return
  }

  if (event.key === 'G') {
    const checkboxes = rowCheckboxes()
    if (checkboxes.length === 0) return
    event.preventDefault()
    checkboxes[checkboxes.length - 1]?.focus()
    return
  }

  if (event.key === 'n' || event.key === 'p') {
    event.preventDefault()
    currentPage.value = event.key === 'n'
      ? Math.min(currentPage.value + 1, totalPages.value)
      : Math.max(currentPage.value - 1, 1)
  }
}

onMounted(() => {
  window.addEventListener('keydown', focusSearchOnSlash)
  window.addEventListener('keydown', handleVimNavigation)
})
onUnmounted(() => {
  window.removeEventListener('keydown', focusSearchOnSlash)
  window.removeEventListener('keydown', handleVimNavigation)
})

const compareCodePoints = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0

const compatibleProducts = computed(() => [...props.products]
  .filter(product => getVendorCompatibility(product as never, props.state.release, props.state.architecture).compatible)
  .sort((left, right) => compareCodePoints(left.name, right.name)))

const categories = computed(() => [...new Set(compatibleProducts.value.map(product => product.category))].sort(compareCodePoints))

const normalize = (value: string): string => value.toLowerCase()

const filteredProducts = computed(() => {
  const needle = normalize(query.value.trim())
  return compatibleProducts.value.filter(product => (
    (categoryFilter.value === '' || product.category === categoryFilter.value)
    && (needle === '' || (
      normalize(product.name).includes(needle)
      || normalize(product.id).includes(needle)
      || normalize(product.category).includes(needle)
      || product.packages.some(packageName => normalize(packageName).includes(needle))
    ))
  ))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / pageSize.value)))

const pagedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredProducts.value.slice(start, start + pageSize.value)
})

watch([query, categoryFilter], () => {
  currentPage.value = 1
})

watch([filteredProducts, pageSize], () => {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
})

const onPageSizeChange = (event: Event): void => {
  pageSize.value = Number((event.currentTarget as HTMLSelectElement).value)
  currentPage.value = 1
}

const categoryLabel = (category: string): string => category.replace(/-/g, ' ')

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

const onCategoryChange = (event: Event): void => {
  categoryFilter.value = (event.currentTarget as unknown as { value: string }).value
}

const reportIssueUrl = (product: WorkbenchHydrationProduct): string => {
  const title = `Broken repository: ${product.name} (${product.id})`
  const body = [
    `Repository: ${product.name}`,
    `Catalog ID: ${product.id}`,
    `Category: ${product.category}`,
    `Packages: ${product.packages.join(', ')}`,
    '',
    'What is broken?',
    '',
    'Expected behavior:',
  ].join('\n')
  const params = new URLSearchParams({ title, body, labels: 'catalog' })
  return `https://github.com/MalteKiefer/debgen/issues/new?${params.toString()}`
}
</script>

<template>
  <div class="repository-toolbar">
    <div class="repository-filters">
      <label for="repository-search" class="search-field">
        <span v-html="renderIcon('search')" />
        <span class="visually-hidden">{{ copy.search.label }}</span>
        <input
          id="repository-search"
          ref="searchInput"
          type="search"
          name="q"
          :placeholder="copy.search.placeholder"
          autocomplete="off"
          :value="query"
          @input="onQueryInput"
        >
        <kbd class="search-field__hint" aria-hidden="true">/</kbd>
      </label>
      <label for="repository-category" class="category-field">
        <span v-html="renderIcon('filter')" />
        <span class="visually-hidden">Category</span>
        <select id="repository-category" :value="categoryFilter" @change="onCategoryChange">
          <option value="">All categories</option>
          <option v-for="category in categories" :key="category" :value="category">{{ categoryLabel(category) }}</option>
        </select>
      </label>
    </div>
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
          <th scope="col"><span class="visually-hidden">Report</span></th>
        </tr>
      </thead>
      <tbody ref="tableBody">
        <tr
          v-for="product in pagedProducts"
          :key="product.id"
          :data-repository-id="product.id"
        >
          <th scope="row">
            {{ product.name }}
            <span class="cell-sub"><code>{{ product.id }}</code> &middot; {{ categoryLabel(product.category) }}</span>
          </th>
          <td><code>{{ product.packages.join(' ') }}</code></td>
          <td>
            <span class="badge" :data-provenance="product.provenance">
              <span v-if="product.provenance === 'manufacturer'" v-html="renderIcon('shield')" />
              {{ product.provenance }}
            </span>
          </td>
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
          <td>
            <a
              class="report-link"
              :href="reportIssueUrl(product)"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`Report a problem with ${product.name}`"
              title="Report a problem"
            >
              <span v-html="renderIcon('flag')" />
            </a>
          </td>
        </tr>
        <tr v-if="pagedProducts.length === 0">
          <td colspan="6" class="empty-result">{{ copy.search.empty }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="pagination">
    <label for="repository-page-size" class="pagination__size">
      Show
      <select id="repository-page-size" :value="pageSize" @change="onPageSizeChange">
        <option v-for="size in PAGE_SIZES" :key="size" :value="size">{{ size }}</option>
      </select>
    </label>
    <div class="pagination__nav" role="group" aria-label="Repository pages">
      <button type="button" class="btn" :disabled="currentPage <= 1" @click="currentPage = Math.max(currentPage - 1, 1)">Prev</button>
      <span class="pagination__status" aria-live="polite">Page {{ currentPage }} / {{ totalPages }}</span>
      <button type="button" class="btn" :disabled="currentPage >= totalPages" @click="currentPage = Math.min(currentPage + 1, totalPages)">Next</button>
    </div>
    <p class="pagination__hint">j/k row &middot; gg/G top/bottom &middot; n/p page</p>
  </div>
  <p class="audit-note">{{ copy.trust.review }}</p>
</template>
