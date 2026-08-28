<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { copyText, downloadText } from '../features/sources/download'
import { generateSources, getOutputFilename } from '../features/sources/generate'
import type { ReleaseCodename, SourceFormat, SourceOptions } from '../features/sources/model'
import type { SystemArchitecture } from '../features/vendors/model'
import { getRelease } from '../features/sources/releases'
import SelectionSummary from './SelectionSummary.vue'
import SourceOutput from './SourceOutput.vue'
import StudioProgress from './StudioProgress.vue'
import SystemStep from './SystemStep.vue'

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
let feedbackVersion = 0

const filename = computed(() => getOutputFilename(format.value))
const components = computed(() => [
  'main',
  ...(includeContrib.value ? ['contrib'] : []),
  ...(includeNonFree.value ? ['non-free'] : []),
  ...(includeFirmware.value ? ['non-free-firmware'] : []),
])

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

function generate(): void {
  feedbackVersion += 1
  feedback.value = null

  const options: SourceOptions = {
    release: release.value,
    format: format.value,
    includeSource: includeSource.value,
    includeSecurity: includeSecurity.value,
    includeUpdates: includeUpdates.value,
    includeBackports: includeBackports.value,
    components: components.value,
  }

  generatedText.value = generateSources(options)
}

async function copyGeneratedText(content: string): Promise<void> {
  const copyVersion = ++feedbackVersion
  feedback.value = null

  try {
    await copyText(content)
    if (copyVersion !== feedbackVersion) {
      return
    }
    feedback.value = { kind: 'success', message: 'Die erzeugte Konfiguration wurde kopiert.' }
  } catch {
    if (copyVersion !== feedbackVersion) {
      return
    }
    feedback.value = {
      kind: 'error',
      message: 'Kopieren fehlgeschlagen. Bitte wähle die erzeugte Konfiguration aus und kopiere sie manuell.',
    }
  }
}

function downloadGeneratedText(outputFilename: 'debian.sources' | 'debian.list', content: string): void {
  feedbackVersion += 1
  feedback.value = null

  try {
    downloadText(outputFilename, content)
    feedback.value = { kind: 'success', message: `${outputFilename} wurde heruntergeladen.` }
  } catch {
    feedback.value = {
      kind: 'error',
      message: 'Herunterladen fehlgeschlagen. Bitte wähle die erzeugte Konfiguration aus und speichere sie manuell.',
    }
  }
}
</script>

<template>
  <section
    aria-label="Debian Studio Arbeitsbereich"
    class="source-generator"
  >
    <StudioProgress v-model="activeStep" />

    <SelectionSummary
      :architecture="architecture"
      :repository-count="0"
      :release="release"
      output-mode="perVendor"
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
          color="primary"
          prepend-icon="mdi-file-document-plus-outline"
          size="large"
          @click="generate"
        >
          Paketquellen erzeugen
        </v-btn>
        <v-btn
          append-icon="mdi-arrow-right"
          variant="tonal"
          @click="activeStep = 2"
        >
          Weiter zur Software
        </v-btn>
      </div>

      <SourceOutput
        v-if="generatedText"
        :content="generatedText"
        :filename="filename"
      >
        <template #actions="{ content, filename: outputFilename }">
          <v-btn
            prepend-icon="mdi-content-copy"
            variant="tonal"
            @click="copyGeneratedText(content)"
          >
            Kopieren
          </v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-download"
            @click="downloadGeneratedText(outputFilename, content)"
          >
            Herunterladen
          </v-btn>
        </template>
      </SourceOutput>

      <div
        v-else
        aria-label="Aktionen für die erzeugte Konfiguration"
        class="source-output__actions"
        role="group"
      >
        <v-btn
          prepend-icon="mdi-content-copy"
          disabled
          variant="tonal"
        >
          Kopieren
        </v-btn>
        <v-btn
          color="primary"
          disabled
          prepend-icon="mdi-download"
        >
          Herunterladen
        </v-btn>
      </div>
    </template>

    <v-card
      v-else
      class="source-generator__next-step"
      variant="outlined"
    >
      <v-card-title>
        {{ activeStep === 2 ? 'Offizielle Software' : 'Prüfen und exportieren' }}
      </v-card-title>
      <v-card-text>
        Dieser Schritt wird mit den nächsten Studio-Bausteinen ergänzt. Deine Systemauswahl bleibt erhalten.
      </v-card-text>
      <v-card-actions>
        <v-btn @click="activeStep = 1">
          Zurück zum Debian-System
        </v-btn>
      </v-card-actions>
    </v-card>

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
