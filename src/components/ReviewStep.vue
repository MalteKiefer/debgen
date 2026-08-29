<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ReleaseCodename } from '../features/sources/model'
import { VENDOR_PRODUCTS } from '../features/vendors/catalog'
import {
  generateInstallScript,
  generatePackageInstallCommand,
  generateRepositoryArtifacts,
} from '../features/vendors/generate'
import { composeArtifacts, groupArtifacts } from '../features/vendors/group'
import { presentWarning } from '../features/vendors/presentation'
import type { GeneratedArtifact, OutputMode, SystemArchitecture } from '../features/vendors/model'
import GeneratedFileTabs from './GeneratedFileTabs.vue'
import InstallCommands from './InstallCommands.vue'

const props = defineProps<{
  release: ReleaseCodename
  architecture: SystemArchitecture
  selectedIds: readonly string[]
  outputMode: OutputMode
  debianArtifact: GeneratedArtifact
  publicUrls?: Readonly<Record<string, string>>
}>()

const emit = defineEmits<{
  'update:outputMode': [value: OutputMode]
}>()
const { t } = useI18n()

const modeOptions = computed(() => ([
  { value: 'perVendor', label: t('review.modes.perVendor.label'), description: t('review.modes.perVendor.description'), icon: 'mdi-file-tree-outline' },
  { value: 'combined', label: t('review.modes.combined.label'), description: t('review.modes.combined.description'), icon: 'mdi-file-link-outline' },
  { value: 'byCategory', label: t('review.modes.byCategory.label'), description: t('review.modes.byCategory.description'), icon: 'mdi-shape-outline' },
] satisfies readonly { value: OutputMode, label: string, description: string, icon: string }[]))

const generationConfig = computed(() => ({
  release: props.release,
  architecture: props.architecture,
  productIds: props.selectedIds,
}))

const selectedProducts = computed(() => {
  const ids = new Set(props.selectedIds)
  return VENDOR_PRODUCTS.filter((product) => ids.has(product.id))
})

const vendorArtifacts = computed(() => generateRepositoryArtifacts(generationConfig.value))
const groupedVendorArtifacts = computed(() => groupArtifacts(vendorArtifacts.value, props.outputMode))
const generatedFiles = computed(() => composeArtifacts(
  props.debianArtifact,
  vendorArtifacts.value,
  props.outputMode,
))
const setupArtifact = computed(() => selectedProducts.value.length > 0
  ? generateInstallScript(
      generationConfig.value,
      groupedVendorArtifacts.value,
      { includePackageInstallation: false },
    )
  : null)
const packageCommand = computed(() => generatePackageInstallCommand(generationConfig.value))
const warnings = computed(() => selectedProducts.value.flatMap((product) => product.warningKeys
  .map((warningKey) => {
    const descriptor = presentWarning(warningKey)
    return { productName: product.name, message: t(descriptor.key, descriptor.values) }
  })))

function updateMode(event: Event): void {
  emit('update:outputMode', (event.target as HTMLInputElement).value as OutputMode)
}
</script>

<template>
  <section aria-labelledby="review-step-title" class="review-step">
    <header class="review-step__heading">
      <div>
        <p class="review-step__eyebrow">{{ t('review.eyebrow') }}</p>
        <h2 id="review-step-title" tabindex="-1">{{ t('review.heading') }}</h2>
        <p>{{ t('review.description') }}</p>
      </div>
      <v-chip color="primary" prepend-icon="mdi-shield-check-outline" variant="tonal">
        {{ t('review.localGenerated') }}
      </v-chip>
    </header>

    <div class="review-step__overview">
      <section :aria-label="t('review.selectedSoftware')" class="review-step__selection">
        <div class="review-step__section-title">
          <v-icon aria-hidden="true" icon="mdi-package-variant-closed-check" />
          <h3>{{ t('review.selectedSoftware') }}</h3>
        </div>
        <div v-if="selectedProducts.length > 0" class="review-step__chips">
          <v-chip
            v-for="product in selectedProducts"
            :key="product.id"
            :prepend-icon="product.icon ?? 'mdi-source-repository'"
            variant="outlined"
          >
            {{ product.name }}
          </v-chip>
        </div>
        <p v-else aria-live="polite" role="status">
          {{ t('review.emptySelection') }}
        </p>
      </section>

      <fieldset :aria-label="t('review.outputAria')" class="review-step__modes">
        <legend>{{ t('review.outputLegend') }}</legend>
        <label v-for="mode in modeOptions" :key="mode.value" class="review-step__mode studio-touch-target">
          <input
            :checked="outputMode === mode.value"
            :value="mode.value"
            name="output-mode"
            type="radio"
            @change="updateMode"
          >
          <v-icon :icon="mode.icon" aria-hidden="true" />
          <span><strong>{{ mode.label }}</strong><small>{{ mode.description }}</small></span>
        </label>
      </fieldset>
    </div>

    <section
      v-if="warnings.length > 0"
      :aria-label="t('review.warningsAria')"
      class="review-step__warnings"
      role="alert"
    >
      <div class="review-step__section-title">
        <v-icon aria-hidden="true" icon="mdi-alert-outline" />
        <h3>{{ t('review.warningsTitle') }}</h3>
      </div>
      <ul>
        <li v-for="warning in warnings" :key="warning.productName">
          <strong>{{ warning.productName }}:</strong> {{ warning.message }}
        </li>
      </ul>
    </section>

    <GeneratedFileTabs :artifacts="generatedFiles" :public-urls="publicUrls" />

    <InstallCommands
      v-if="setupArtifact"
      :package-command="packageCommand"
      :setup-artifact="setupArtifact"
    />
  </section>
</template>
