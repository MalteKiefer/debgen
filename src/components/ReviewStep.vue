<script setup lang="ts">
import { computed } from 'vue'
import type { ReleaseCodename } from '../features/sources/model'
import { VENDOR_PRODUCTS } from '../features/vendors/catalog'
import {
  generateInstallScript,
  generatePackageInstallCommand,
  generateVendorArtifacts,
} from '../features/vendors/generate'
import { composeArtifacts, groupArtifacts } from '../features/vendors/group'
import type { GeneratedArtifact, OutputMode, SystemArchitecture } from '../features/vendors/model'
import GeneratedFileTabs from './GeneratedFileTabs.vue'
import InstallCommands from './InstallCommands.vue'

const props = defineProps<{
  release: ReleaseCodename
  architecture: SystemArchitecture
  selectedIds: readonly string[]
  outputMode: OutputMode
  debianArtifact: GeneratedArtifact
}>()

const emit = defineEmits<{
  'update:outputMode': [value: OutputMode]
}>()

const modeOptions: readonly { value: OutputMode, label: string, description: string, icon: string }[] = [
  { value: 'perVendor', label: 'Je Anbieter', description: 'Eine eigene Datei pro Anbieter', icon: 'mdi-file-tree-outline' },
  { value: 'combined', label: 'Kombiniert', description: 'Alle Herstellerquellen in einer Datei', icon: 'mdi-file-link-outline' },
  { value: 'byCategory', label: 'Nach Kategorie', description: 'Dateien nach Einsatzgebiet bündeln', icon: 'mdi-shape-outline' },
]

const generationConfig = computed(() => ({
  release: props.release,
  architecture: props.architecture,
  productIds: props.selectedIds,
}))

const selectedProducts = computed(() => {
  const ids = new Set(props.selectedIds)
  return VENDOR_PRODUCTS.filter((product) => ids.has(product.id))
})

const vendorArtifacts = computed(() => generateVendorArtifacts(generationConfig.value))
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
const warnings = computed(() => selectedProducts.value.flatMap((product) => product.warning
  ? [{ productName: product.name, message: product.warning }]
  : []))

function updateMode(event: Event): void {
  emit('update:outputMode', (event.target as HTMLInputElement).value as OutputMode)
}
</script>

<template>
  <section aria-labelledby="review-step-title" class="review-step">
    <header class="review-step__heading">
      <div>
        <p class="review-step__eyebrow">Schritt 3 von 3</p>
        <h2 id="review-step-title" tabindex="-1">Prüfen und exportieren</h2>
        <p>Kontrolliere jede Datei und jeden Befehl, bevor du sie auf deinem Debian-System verwendest.</p>
      </div>
      <v-chip color="primary" prepend-icon="mdi-shield-check-outline" variant="tonal">
        Lokal erzeugt
      </v-chip>
    </header>

    <div class="review-step__overview">
      <section aria-label="Ausgewählte Software" class="review-step__selection">
        <div class="review-step__section-title">
          <v-icon aria-hidden="true" icon="mdi-package-variant-closed-check" />
          <h3>Ausgewählte Software</h3>
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
          Keine zusätzlichen Paketquellen ausgewählt. Es wird ausschließlich die Debian-Datei erzeugt.
        </p>
      </section>

      <fieldset aria-label="Ausgabeaufteilung" class="review-step__modes">
        <legend>Ausgabe aufteilen</legend>
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
      aria-label="Wichtige Hinweise"
      class="review-step__warnings"
      role="alert"
    >
      <div class="review-step__section-title">
        <v-icon aria-hidden="true" icon="mdi-alert-outline" />
        <h3>Vor dem Export beachten</h3>
      </div>
      <ul>
        <li v-for="warning in warnings" :key="warning.productName">
          <strong>{{ warning.productName }}:</strong> {{ warning.message }}
        </li>
      </ul>
    </section>

    <GeneratedFileTabs :artifacts="generatedFiles" />

    <InstallCommands
      v-if="setupArtifact"
      :package-command="packageCommand"
      :setup-artifact="setupArtifact"
    />
  </section>
</template>
