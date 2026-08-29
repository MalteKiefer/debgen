<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SystemArchitecture } from '../features/vendors/model'
import { formatPlural } from '../i18n/format'
import type { SupportedLocale } from '../i18n'

const props = defineProps<{
  release: string
  architecture: SystemArchitecture
  productCount: number
  sourceCount: number
  packageCount: number
  outputMode: 'perVendor' | 'combined' | 'byCategory'
  currentStep: number
}>()

const emit = defineEmits<{
  navigate: [step: number]
  skipSoftware: []
}>()
const { locale, t } = useI18n()

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
  if (props.currentStep === 2) return { label: t('actions.reviewSelection'), targetStep: 3 }
  if (props.currentStep === 3) return { label: t('actions.editSelection'), targetStep: 2 }
  return { label: t('actions.nextSoftware'), targetStep: 2 }
})
function formatCount(kind: 'products' | 'sources' | 'packages', count: number): string {
  return formatPlural(locale.value as SupportedLocale, count, {
    zero: t(`counts.${kind}.zero`, { count }), one: t(`counts.${kind}.one`, { count }), two: t(`counts.${kind}.two`, { count }),
    few: t(`counts.${kind}.few`, { count }), many: t(`counts.${kind}.many`, { count }), other: t(`counts.${kind}.other`, { count }),
  })
}
const productCountText = computed(() => formatCount('products', props.productCount))
const sourceCountText = computed(() => formatCount('sources', props.sourceCount))
const packageCountText = computed(() => formatCount('packages', props.packageCount))

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
  return t(`summary.modes.${mode}`)
}
</script>

<template>
  <aside
    :aria-label="t('summary.ariaLabel')"
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
      <span><v-icon icon="mdi-package-variant-closed-check" /> {{ productCountText }}</span>
      <span><v-icon icon="mdi-source-repository" /> {{ sourceCountText }}</span>
      <span><v-icon icon="mdi-package-down" /> {{ packageCountText }}</span>
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
      <span><v-icon icon="mdi-package-variant-closed-check" /> {{ productCountText }}</span>
      <span><v-icon icon="mdi-source-repository" /> {{ sourceCountText }}</span>
      <span><v-icon icon="mdi-package-down" /> {{ packageCountText }}</span>
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
      <v-btn
        v-if="currentStep === 1"
        class="selection-summary__action studio-touch-target"
        data-testid="mobile-skip-software"
        variant="outlined"
        @click="emit('skipSoftware')"
      >
        {{ t('actions.skipSoftware') }}
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
