<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { SystemArchitecture } from '../features/vendors/model'

const props = defineProps<{
  release: string
  architecture: SystemArchitecture
  repositoryCount: number
  outputMode: 'perVendor' | 'combined' | 'byCategory'
  currentStep: number
}>()

const emit = defineEmits<{
  navigate: [step: number]
}>()

const mobileViewport = window.matchMedia('(max-width: 700px)')
const isMobile = ref(mobileViewport.matches)
const mobilePositionStyle = {
  position: 'fixed',
  right: '0',
  bottom: '0',
  left: '0',
} as const
const mobileBodyReserve = '12rem'
let previousBodyPaddingBottom: string | undefined
const mobileAction = computed(() => {
  if (props.currentStep === 2) return { label: 'Auswahl prüfen', targetStep: 3 }
  if (props.currentStep === 3) return { label: 'Auswahl bearbeiten', targetStep: 2 }
  return { label: 'Weiter zur Software', targetStep: 2 }
})

function updateViewport(event: MediaQueryListEvent): void {
  isMobile.value = event.matches
  updateBodyReserve(event.matches)
}

function updateBodyReserve(mobile: boolean): void {
  if (mobile) {
    previousBodyPaddingBottom ??= document.body.style.paddingBottom
    document.body.style.paddingBottom = mobileBodyReserve
  } else if (previousBodyPaddingBottom !== undefined) {
    document.body.style.paddingBottom = previousBodyPaddingBottom
    previousBodyPaddingBottom = undefined
  }
}

onMounted(() => {
  mobileViewport.addEventListener('change', updateViewport)
  updateBodyReserve(isMobile.value)
})

onUnmounted(() => {
  mobileViewport.removeEventListener('change', updateViewport)
  updateBodyReserve(false)
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
    :class="['selection-summary', { 'selection-summary--mobile': isMobile }]"
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
      :style="mobilePositionStyle"
    >
      <span><v-icon icon="mdi-debian" /> {{ release.charAt(0).toUpperCase() + release.slice(1) }}</span>
      <span><v-icon icon="mdi-cpu-64-bit" /> {{ architecture }}</span>
      <span><v-icon icon="mdi-package-variant-closed-check" /> {{ repositoryCount }} Paketquellen ausgewählt</span>
      <span><v-icon icon="mdi-file-tree-outline" /> {{ outputModeLabel(outputMode) }}</span>
      <v-btn
        append-icon="mdi-arrow-right"
        class="selection-summary__action studio-touch-target"
        color="primary"
        data-testid="mobile-schrittaktion"
        @click="emit('navigate', mobileAction.targetStep)"
      >
        {{ mobileAction.label }}
      </v-btn>
    </div>
  </aside>
</template>

<style scoped>
.selection-summary.selection-summary--mobile {
  position: static;
  inset: auto;
  z-index: auto;
  padding: 0;
  border: 0;
  background: none;
  box-shadow: none;
}

.selection-summary--mobile .selection-summary__mobile {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 100;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
  box-sizing: border-box;
  padding: 0.75rem max(0.75rem, env(safe-area-inset-right)) max(0.75rem, env(safe-area-inset-bottom)) max(0.75rem, env(safe-area-inset-left));
  border-top: 1px solid rgb(255 255 255 / 18%);
  background: linear-gradient(110deg, #2b1722, #422238);
  box-shadow: 0 -12px 30px rgb(38 17 28 / 28%);
  color: #fff8fa;
}

.selection-summary--mobile .selection-summary__mobile span {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.35rem;
  font-size: 0.8rem;
}

.selection-summary__action {
  grid-column: 1 / -1;
  width: 100%;
}
</style>
