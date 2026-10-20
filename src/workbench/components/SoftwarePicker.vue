<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getVendorCompatibility } from '../../features/vendors/compatibility'
import type { SupportedLocale } from '../../i18n/locales'
import { matchesSearch } from '../../i18n/format'
import { renderIcon } from '../../site/icons'
import type { SiteCopy } from '../../site/locales'
import type { WorkbenchState } from '../state'
import { camelKey, compareCodePoints, fill } from '../text'
import type { WorkbenchHydrationProduct } from '../types'

const props = defineProps<{
  copy: SiteCopy
  locale: SupportedLocale
  products: readonly WorkbenchHydrationProduct[]
  state: WorkbenchState
}>()

const emit = defineEmits<{
  toggle: [id: string, checked: boolean]
}>()

const query = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false
  if (target instanceof HTMLInputElement) return target.type !== 'checkbox' && target.type !== 'radio'
  return target.isContentEditable || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA'
}

const focusSearchOnSlash = (event: KeyboardEvent): void => {
  if (event.key !== '/' || isTypingTarget(event.target) || !searchInput.value) return
  event.preventDefault()
  searchInput.value.focus()
}

onMounted(() => window.addEventListener('keydown', focusSearchOnSlash))
onUnmounted(() => window.removeEventListener('keydown', focusSearchOnSlash))

const ui = computed(() => props.copy.ui)
const lookup = (messages: object, key: string): string | undefined => (messages as Readonly<Record<string, string>>)[camelKey(key)]

const categoryLabel = (category: string): string => lookup(ui.value.categories, category) ?? category
const categoryOrder = computed(() => Object.keys(ui.value.categories))

const unavailableReason = (product: WorkbenchHydrationProduct): string | null => {
  const result = getVendorCompatibility(product as never, props.state.release, props.state.architecture)
  if (result.compatible) return null
  const { reason } = result
  return reason.code === 'unsupported-release'
    ? fill(ui.value.compatibility.unsupportedRelease, { release: reason.release, product: product.name, supported: reason.supportedReleases.join(', ') })
    : fill(ui.value.compatibility.unsupportedArchitecture, { architecture: reason.architecture, product: product.name, supported: reason.supportedArchitectures.join(', ') })
}

const groups = computed(() => {
  const byCategory = new Map<string, { product: WorkbenchHydrationProduct, reason: string | null }[]>()
  const sorted = [...props.products].sort((left, right) => compareCodePoints(left.name, right.name))
  for (const product of sorted) {
    const label = categoryLabel(product.category)
    if (!matchesSearch(query.value, [product.name, label], [product.id, ...product.packages], props.locale)) continue
    const rows = byCategory.get(product.category) ?? []
    rows.push({ product, reason: unavailableReason(product) })
    byCategory.set(product.category, rows)
  }
  const rank = (category: string): number => categoryOrder.value.indexOf(camelKey(category))
  return [...byCategory.entries()]
    .sort(([left], [right]) => rank(left) - rank(right))
    .map(([category, rows]) => ({ category, title: categoryLabel(category), rows }))
})

const selected = (id: string): boolean => props.state.repositories.includes(id)

const onQueryInput = (event: Event): void => {
  query.value = (event.currentTarget as unknown as { value: string }).value
}

const onToggle = (id: string, event: Event): void => {
  emit('toggle', id, (event.currentTarget as unknown as { checked: boolean }).checked)
}

const reportIssueUrl = (product: WorkbenchHydrationProduct): string => {
  const params = new URLSearchParams({
    title: `Broken repository: ${product.name} (${product.id})`,
    body: [
      `Repository: ${product.name}`,
      `Catalog ID: ${product.id}`,
      `Category: ${product.category}`,
      `Packages: ${product.packages.join(', ')}`,
      '',
      'What is broken?',
      '',
      'Expected behavior:',
    ].join('\n'),
    labels: 'catalog',
  })
  return `https://github.com/MalteKiefer/debgen/issues/new?${params.toString()}`
}
</script>

<template>
  <section class="card software" aria-labelledby="software-title">
    <div class="card__head">
      <h2 id="software-title">{{ copy.sections.software }}</h2>
      <p class="software__count" role="status" aria-live="polite">{{ fill(copy.software.selected, { count: state.repositories.length }) }}</p>
    </div>
    <label for="software-search" class="search">
      <span v-html="renderIcon('search')" />
      <span class="visually-hidden">{{ ui.vendor.searchLabel }}</span>
      <input
        id="software-search"
        ref="searchInput"
        type="search"
        name="q"
        :placeholder="ui.vendor.searchPlaceholder"
        autocomplete="off"
        :value="query"
        @input="onQueryInput"
      >
      <kbd aria-hidden="true">/</kbd>
    </label>

    <p v-if="groups.length === 0" class="hint">{{ ui.vendor.empty }}</p>
    <div v-for="group in groups" :key="group.category" class="software__group">
      <h3>{{ group.title }}</h3>
      <ul>
        <li
          v-for="{ product, reason } in group.rows"
          :key="product.id"
          class="product"
          :data-repository-id="product.id"
          :data-unavailable="reason ? 'true' : undefined"
        >
          <div class="product__text">
            <span class="product__name">{{ product.name }}</span>
            <span v-if="reason" class="product__meta">{{ reason }}</span>
            <span v-else class="product__meta">{{ lookup(ui.vendor.origins, product.provenance) ?? product.provenance }} · <code>{{ product.packages.join(' ') }}</code></span>
          </div>
          <a
            class="product__report"
            :href="reportIssueUrl(product)"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="fill(ui.vendorCard.reportIssueAria, { product: product.name })"
            :title="ui.vendorCard.reportIssue"
          ><span v-html="renderIcon('flag')" /></a>
          <label class="pick">
            <input
              type="checkbox"
              name="repository"
              :value="product.id"
              :checked="!reason && selected(product.id)"
              :disabled="Boolean(reason)"
              :aria-label="fill(ui.vendorCard.selectAria, { product: product.name })"
              @change="onToggle(product.id, $event)"
            >
            <span class="pick__off">{{ ui.vendorCard.select }}</span>
            <span class="pick__on"><span v-html="renderIcon('check')" />{{ ui.vendorCard.selected }}</span>
          </label>
        </li>
      </ul>
    </div>
  </section>
</template>
