<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { SystemArchitecture } from '../features/vendors/model'

defineProps<{
  release: string
  architecture: SystemArchitecture
  repositoryCount: number
  outputMode: 'perVendor' | 'combined' | 'byCategory'
}>()

const mobileViewport = window.matchMedia('(max-width: 700px)')
const isMobile = ref(mobileViewport.matches)

function updateViewport(event: MediaQueryListEvent): void {
  isMobile.value = event.matches
}

onMounted(() => {
  mobileViewport.addEventListener('change', updateViewport)
})

onUnmounted(() => {
  mobileViewport.removeEventListener('change', updateViewport)
})

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
    <div
      v-if="!isMobile"
      class="selection-summary__content"
      data-testid="desktop-zusammenfassung"
    >
      <span><v-icon icon="mdi-debian" /> {{ release.charAt(0).toUpperCase() + release.slice(1) }}</span>
      <span><v-icon icon="mdi-cpu-64-bit" /> {{ architecture }}</span>
      <span><v-icon icon="mdi-package-variant-closed-check" /> {{ repositoryCount }} Paketquellen ausgewählt</span>
      <span><v-icon icon="mdi-file-tree-outline" /> {{ outputModeLabel(outputMode) }}</span>
    </div>
    <div
      v-else
      class="selection-summary__mobile"
      data-testid="mobile-zusammenfassung"
    >
      <span><v-icon icon="mdi-debian" /> {{ release.charAt(0).toUpperCase() + release.slice(1) }}</span>
      <span><v-icon icon="mdi-cpu-64-bit" /> {{ architecture }}</span>
      <span><v-icon icon="mdi-package-variant-closed-check" /> {{ repositoryCount }} Paketquellen ausgewählt</span>
      <span><v-icon icon="mdi-file-tree-outline" /> {{ outputModeLabel(outputMode) }}</span>
    </div>
  </aside>
</template>
