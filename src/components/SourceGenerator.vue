<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { copyText, downloadText } from '../features/sources/download'
import { generateSources, getOutputFilename } from '../features/sources/generate'
import type { ReleaseCodename, SourceFormat, SourceOptions } from '../features/sources/model'
import { VENDOR_PRODUCTS } from '../features/vendors/catalog'
import { getVendorCompatibility } from '../features/vendors/compatibility'
import type { GeneratedArtifact, OutputMode, SystemArchitecture } from '../features/vendors/model'
import { getRelease } from '../features/sources/releases'
import SelectionSummary from './SelectionSummary.vue'
import ReviewStep from './ReviewStep.vue'
import SourceOutput from './SourceOutput.vue'
import StudioProgress from './StudioProgress.vue'
import SystemStep from './SystemStep.vue'
import VendorStep from './VendorStep.vue'

const { t } = useI18n()

const release = ref<ReleaseCodename>('trixie')
const architecture = ref<SystemArchitecture>('amd64')
const format = ref<SourceFormat>('deb822')
const includeSource = ref(false)
const includeContrib = ref(false)
const includeNonFree = ref(false)
const includeFirmware = ref(true)
const includeSecurity = ref(true)
const includeUpdates = ref(true)
const includeBackports = ref(false)
const generatedText = ref('')
const feedback = ref<{ kind: 'success' | 'error', message: string } | null>(null)
const activeStep = ref(1)
const selectedIds = ref<string[]>([])
const outputMode = ref<OutputMode>('perVendor')
let feedbackVersion = 0

const stepFocusTargets: Readonly<Record<number, string>> = {
  1: 'system-step-title',
  2: 'vendor-step-title',
  3: 'review-step-title',
}

const filename = computed(() => getOutputFilename(format.value))
const components = computed(() => [
  'main',
  ...(includeContrib.value ? ['contrib'] : []),
  ...(includeNonFree.value ? ['non-free'] : []),
  ...(includeFirmware.value ? ['non-free-firmware'] : []),
])
const sourceOptions = computed<SourceOptions>(() => ({
  release: release.value,
  format: format.value,
  includeSource: includeSource.value,
  includeSecurity: includeSecurity.value,
  includeUpdates: includeUpdates.value,
  includeBackports: includeBackports.value,
  components: components.value,
}))
const debianArtifact = computed<GeneratedArtifact>(() => ({
  filename: getOutputFilename(format.value),
  mediaType: 'text/plain',
  description: 'debian-source',
  content: generateSources(sourceOptions.value),
}))

watch(release, (codename) => {
  const selected = getRelease(codename)

  if (!selected.formats.includes(format.value)) {
    format.value = selected.formats[0]
  }
  if (!selected.components.includes('contrib')) {
    includeContrib.value = false
  }
  if (!selected.components.includes('non-free')) {
    includeNonFree.value = false
  }
  if (!selected.components.includes('non-free-firmware')) {
    includeFirmware.value = false
  }
  if (!selected.capabilities.security) {
    includeSecurity.value = false
  }
  if (!selected.capabilities.updates) {
    includeUpdates.value = false
  }
  if (!selected.capabilities.backports) {
    includeBackports.value = false
  }
}, { flush: 'sync' })

watch([
  release,
  architecture,
  format,
  includeSource,
  includeContrib,
  includeNonFree,
  includeFirmware,
  includeSecurity,
  includeUpdates,
  includeBackports,
], () => {
  feedbackVersion += 1
  generatedText.value = ''
  feedback.value = null
})

watch([release, architecture], ([nextRelease, nextArchitecture], previousSystem) => {
  const selected = new Set(selectedIds.value)
  const removedProducts = VENDOR_PRODUCTS.filter((product) => selected.has(product.id)
    && !getVendorCompatibility(product, nextRelease, nextArchitecture).compatible)
  if (removedProducts.length === 0) return

  const removedIds = new Set(removedProducts.map((product) => product.id))
  selectedIds.value = selectedIds.value.filter((id) => !removedIds.has(id))
  feedbackVersion += 1
  const changedSystem = previousSystem?.[0] !== nextRelease
    ? t('selection.releaseChanged', { release: nextRelease.charAt(0).toUpperCase() + nextRelease.slice(1) })
    : t('selection.architectureChanged', { architecture: nextArchitecture })
  feedback.value = {
    kind: 'success',
    message: `${changedSystem}: ${t(
      removedProducts.length === 1 ? 'selection.incompatibleRemoved' : 'selection.incompatibleRemovedMany',
      { products: removedProducts.map((product) => product.name).join(', ') },
    )}`,
  }
}, { flush: 'post' })

watch(activeStep, async (step) => {
  await nextTick()
  document.getElementById(stepFocusTargets[step] ?? '')?.focus()
}, { flush: 'post' })

function generate(): void {
  feedbackVersion += 1
  feedback.value = null

  generatedText.value = generateSources(sourceOptions.value)
}

async function copyGeneratedText(content: string): Promise<void> {
  const copyVersion = ++feedbackVersion
  feedback.value = null

  try {
    await copyText(content)
    if (copyVersion !== feedbackVersion) {
      return
    }
    feedback.value = { kind: 'success', message: t('feedback.generatedCopySuccess') }
  } catch {
    if (copyVersion !== feedbackVersion) {
      return
    }
    feedback.value = {
      kind: 'error',
      message: t('feedback.generatedCopyError'),
    }
  }
}

function downloadGeneratedText(outputFilename: 'debian.sources' | 'debian.list', content: string): void {
  feedbackVersion += 1
  feedback.value = null

  try {
    downloadText(outputFilename, content)
    feedback.value = { kind: 'success', message: t('feedback.generatedDownloadSuccess', { filename: outputFilename }) }
  } catch {
    feedback.value = {
      kind: 'error',
      message: t('feedback.generatedDownloadError'),
    }
  }
}
</script>

<template>
  <section
    :aria-label="t('workspace.ariaLabel')"
    class="source-generator"
  >
    <StudioProgress v-model="activeStep" />

    <SelectionSummary
      :architecture="architecture"
      :repository-count="selectedIds.length"
      :release="release"
      :output-mode="outputMode"
      :current-step="activeStep"
      @navigate="activeStep = $event"
    />

    <template v-if="activeStep === 1">
      <SystemStep
      v-model:release="release"
      v-model:architecture="architecture"
      v-model:format="format"
      v-model:include-source="includeSource"
      v-model:include-contrib="includeContrib"
      v-model:include-non-free="includeNonFree"
      v-model:include-firmware="includeFirmware"
      v-model:include-security="includeSecurity"
      v-model:include-updates="includeUpdates"
      v-model:include-backports="includeBackports"
      />

      <div class="source-generator__submit">
        <v-btn
          class="studio-touch-target"
          color="primary"
          prepend-icon="mdi-file-document-plus-outline"
          size="large"
          @click="generate"
        >
          {{ t('actions.generateSources') }}
        </v-btn>
        <v-btn
          append-icon="mdi-arrow-right"
          class="studio-touch-target"
          variant="tonal"
          @click="activeStep = 2"
        >
          {{ t('actions.nextSoftware') }}
        </v-btn>
      </div>

      <SourceOutput
        v-if="generatedText"
        :content="generatedText"
        :filename="filename"
      >
        <template #actions="{ content, filename: outputFilename }">
          <v-btn
            class="studio-touch-target"
            prepend-icon="mdi-content-copy"
            variant="tonal"
            @click="copyGeneratedText(content)"
          >
            {{ t('actions.copy') }}
          </v-btn>
          <v-btn
            class="studio-touch-target"
            color="primary"
            prepend-icon="mdi-download"
            @click="downloadGeneratedText(outputFilename, content)"
          >
            {{ t('actions.download') }}
          </v-btn>
        </template>
      </SourceOutput>

      <div
        v-else
        :aria-label="t('sourceOutput.actions')"
        class="source-output__actions"
        role="group"
      >
        <v-btn
          class="studio-touch-target"
          prepend-icon="mdi-content-copy"
          disabled
          variant="tonal"
        >
          {{ t('actions.copy') }}
        </v-btn>
        <v-btn
          class="studio-touch-target"
          color="primary"
          disabled
          prepend-icon="mdi-download"
        >
          {{ t('actions.download') }}
        </v-btn>
      </div>
    </template>

    <template v-else-if="activeStep === 2">
      <VendorStep
        v-model:selected-ids="selectedIds"
        :architecture="architecture"
        :release="release"
      />
      <div class="source-generator__submit source-generator__submit--between">
        <v-btn
          class="studio-touch-target"
          prepend-icon="mdi-arrow-left"
          variant="text"
          @click="activeStep = 1"
        >
          {{ t('actions.backSystem') }}
        </v-btn>
        <v-btn
          append-icon="mdi-arrow-right"
          class="studio-touch-target"
          color="primary"
          @click="activeStep = 3"
        >
          {{ t('actions.reviewSelection') }}
        </v-btn>
      </div>
    </template>

    <template v-else>
      <ReviewStep
        v-model:output-mode="outputMode"
        :architecture="architecture"
        :debian-artifact="debianArtifact"
        :release="release"
        :selected-ids="selectedIds"
      />
      <div class="source-generator__submit source-generator__submit--between">
        <v-btn
          class="studio-touch-target"
          prepend-icon="mdi-arrow-left"
          variant="text"
          @click="activeStep = 2"
        >
          {{ t('actions.editSelection') }}
        </v-btn>
        <v-btn
          class="studio-touch-target"
          prepend-icon="mdi-cog-outline"
          variant="tonal"
          @click="activeStep = 1"
        >
          {{ t('actions.editSystem') }}
        </v-btn>
      </div>
    </template>

    <div
      aria-live="polite"
      class="source-generator__feedback"
    >
      <p
        v-if="feedback?.kind === 'success'"
        role="status"
      >
        {{ feedback.message }}
      </p>
      <p
        v-else-if="feedback?.kind === 'error'"
        role="alert"
      >
        {{ feedback.message }}
      </p>
    </div>
  </section>
</template>
