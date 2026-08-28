<script setup lang="ts">
import type { SystemArchitecture } from '../features/vendors/model'

defineProps<{
  release: string
  architecture: SystemArchitecture
  repositoryCount: number
  outputMode: 'perVendor' | 'combined' | 'byCategory'
}>()

function outputModeLabel(mode: 'perVendor' | 'combined' | 'byCategory'): string {
  if (mode === 'combined') return 'Kombiniert'
  if (mode === 'byCategory') return 'Nach Kategorie'
  return 'Je Anbieter'
}
</script>

<template>
  <aside
    aria-label="Aktuelle Auswahl"
    class="selection-summary"
    data-testid="auswahl-zusammenfassung"
  >
    <div class="selection-summary__content">
      <span><v-icon icon="mdi-debian" /> {{ release.charAt(0).toUpperCase() + release.slice(1) }}</span>
      <span><v-icon icon="mdi-cpu-64-bit" /> {{ architecture }}</span>
      <span><v-icon icon="mdi-package-variant-closed-check" /> {{ repositoryCount }} Paketquellen ausgewählt</span>
      <span><v-icon icon="mdi-file-tree-outline" /> {{ outputModeLabel(outputMode) }}</span>
    </div>
    <div
      class="selection-summary__mobile"
      data-testid="mobile-zusammenfassung"
    >
      {{ repositoryCount }} Quellen · {{ architecture }}
    </div>
  </aside>
</template>
