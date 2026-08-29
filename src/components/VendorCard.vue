<script setup lang="ts">
import { computed } from 'vue'
import { getVendorCompatibility } from '../features/vendors/compatibility'
import type { ReleaseCodename } from '../features/sources/model'
import type { SystemArchitecture, VendorCategory, VendorProduct } from '../features/vendors/model'
import type { VendorMdiIcon } from '../features/vendors/icons'
import { getRepositorySource } from '../features/vendors/sources'
import { presentWarning } from '../features/vendors/presentation'

const props = defineProps<{
  product: VendorProduct
  release: ReleaseCodename
  architecture: SystemArchitecture
  selected: boolean
}>()

const emit = defineEmits<{
  'update:selected': [value: boolean]
}>()

const categoryIcons: Record<VendorCategory, VendorMdiIcon> = {
  browser: 'mdi-web',
  communication: 'mdi-message-text-outline',
  privacy: 'mdi-shield-lock-outline',
  containers: 'mdi-cube-outline',
  cloud: 'mdi-cloud-outline',
  development: 'mdi-code-tags',
  database: 'mdi-database-outline',
  monitoring: 'mdi-chart-line',
}

const categoryLabels: Record<VendorCategory, string> = {
  browser: 'Browser',
  communication: 'Kommunikation',
  privacy: 'Privatsphäre',
  containers: 'Container',
  cloud: 'Cloud',
  development: 'Entwicklung',
  database: 'Datenbanken',
  monitoring: 'Überwachung',
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
  if (reason.code === 'unsupported-release') {
    return `Das Release „${reason.release}“ wird von ${props.product.name} nicht unterstützt. Unterstützte Releases: ${reason.supportedReleases.join(', ')}.`
  }
  return `Die Architektur „${reason.architecture}“ wird von ${props.product.name} nicht unterstützt. Unterstützte Architekturen: ${reason.supportedArchitectures.join(', ')}.`
})
const documentationUrl = computed(() => props.product.sourceId ? getRepositorySource(props.product.sourceId)?.documentationUrl : undefined)
const productIcon = computed(() => props.product.icon ?? categoryIcons[props.product.category])
const compatibilityId = computed(() => `${props.product.id}-kompatibilitaet`)
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
          {{ categoryLabels[product.category] }}
        </p>
        <h3>
          {{ product.name }}
        </h3>
      </div>
    </header>

    <div class="vendor-card__badges">
      <v-chip
        prepend-icon="mdi-check-decagram-outline"
        size="small"
        variant="tonal"
      >
        Offizielle Quelle
      </v-chip>
      <span class="vendor-card__architectures">
        <v-icon aria-hidden="true" icon="mdi-cpu-64-bit" size="18" />
        {{ product.supportedArchitectures.join(', ') }}
      </span>
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
      {{ product.warningKeys.map(presentWarning).join(', ') }}
    </p>

    <footer class="vendor-card__footer">
      <label :for="`${product.id}-selected`" class="vendor-card__selection">
        <input
          :id="`${product.id}-selected`"
          :aria-describedby="compatibility.compatible ? undefined : compatibilityId"
          :aria-label="`${product.name} auswählen`"
          :checked="selected"
          :disabled="!compatibility.compatible"
          type="checkbox"
          @change="emit('update:selected', ($event.target as HTMLInputElement).checked)"
        >
        <span>{{ selected ? 'Ausgewählt' : 'Auswählen' }}</span>
      </label>
      <a
        :aria-label="`${product.name}: offizielle Anleitung (öffnet in neuem Tab)`"
        :href="documentationUrl"
        rel="noreferrer"
        target="_blank"
      >
        Anleitung
        <v-icon aria-hidden="true" icon="mdi-open-in-new" size="16" />
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
