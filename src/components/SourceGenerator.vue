<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { copyText, downloadText } from '../features/sources/download'
import { generateSources, getOutputFilename } from '../features/sources/generate'
import type { ReleaseCodename, SourceFormat, SourceOptions } from '../features/sources/model'
import { getRelease } from '../features/sources/releases'
import GeneratorControls from './GeneratorControls.vue'
import SourceOutput from './SourceOutput.vue'

const release = ref<ReleaseCodename>('trixie')
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
    feedback.value = { kind: 'success', message: 'Copied generated configuration.' }
  } catch {
    if (copyVersion !== feedbackVersion) {
      return
    }
    feedback.value = {
      kind: 'error',
      message: 'Copy failed. Please select the generated configuration and copy the configuration manually.',
    }
  }
}

function downloadGeneratedText(outputFilename: 'debian.sources' | 'debian.list', content: string): void {
  feedbackVersion += 1
  feedback.value = null

  try {
    downloadText(outputFilename, content)
    feedback.value = { kind: 'success', message: `Downloaded ${outputFilename}.` }
  } catch {
    feedback.value = {
      kind: 'error',
      message: 'Download failed. Please select the generated configuration and save the configuration manually.',
    }
  }
}
</script>

<template>
  <section
    class="source-generator"
    aria-labelledby="source-generator-title"
  >
    <v-card
      class="source-generator__intro"
      color="primary"
      variant="tonal"
    >
      <v-card-text>
        <div class="source-generator__intro-content">
          <v-icon
            aria-hidden="true"
            icon="mdi-debian"
            size="48"
          />
          <div>
            <h1 id="source-generator-title">
              Debian sources generator
            </h1>
            <p>
              Build an official Debian repository configuration from the release catalog bundled with DebGen.
            </p>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <GeneratorControls
      v-model:release="release"
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
        Generate sources
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
          Copy
        </v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-download"
          @click="downloadGeneratedText(outputFilename, content)"
        >
          Download
        </v-btn>
      </template>
    </SourceOutput>

    <div
      v-else
      aria-label="Generated configuration actions"
      class="source-output__actions"
    >
      <v-btn
        disabled
        prepend-icon="mdi-content-copy"
        variant="tonal"
      >
        Copy
      </v-btn>
      <v-btn
        color="primary"
        disabled
        prepend-icon="mdi-download"
      >
        Download
      </v-btn>
    </div>

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
